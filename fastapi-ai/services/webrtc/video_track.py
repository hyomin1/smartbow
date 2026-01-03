import asyncio
import time

import cv2
import numpy as np
from aiortc import VideoStreamTrack
from av import VideoFrame

from services.frame.shm_registry import get_frame_buffer


class CameraVideoTrack(VideoStreamTrack):
    def __init__(self, cam_id: str, shape, arrow_service, person_service, fps_limit=30):
        super().__init__()
        self.cam_id = cam_id
        self.shape = shape
        self.arrow_service = arrow_service
        self.person_service = person_service

        self.last_frame_time = 0
        self.fps_limit = fps_limit

        self.shm = get_frame_buffer(cam_id, shape)

    async def recv(self):
        now = time.time()
        elapsed = now - self.last_frame_time
        target_delay = 1.0 / self.fps_limit

        if elapsed < target_delay:
            await asyncio.sleep(target_delay - elapsed)

        self.last_frame_time = time.time()

        frame = self.shm.read()
        if frame is None:
            raise asyncio.TimeoutError

        processed_frame = frame.copy()

        # 화살 위치 디버그용 추후 서비스 안정화되면 제거
        self.arrow_service.last_frame = processed_frame
        curr = self.arrow_service.current_arrow
        if curr:
            t1 = tuple(map(int, curr["tail"]))
            t2 = tuple(map(int, curr["tip"]))

            cv2.line(processed_frame, t1, t2, (0, 255, 0), 2, cv2.LINE_AA)

        person = self.person_service.get_detection()

        target = self.arrow_service.target

        if target is not None:
            # target: np.ndarray shape (4, 2) or list[[x,y],...]
            pts = np.array(target, dtype=np.int32).reshape((-1, 1, 2))

            # 외곽선
            cv2.polylines(
                processed_frame,
                [pts],
                isClosed=True,
                color=(0, 255, 255),  # 노란색
                thickness=2,
                lineType=cv2.LINE_AA,
            )

        if person:
            x1, y1, x2, y2 = map(int, person["bbox"])

            cv2.rectangle(
                processed_frame, (x1, y1), (x2, y2), (255, 0, 0), 2, cv2.LINE_AA
            )
            cv2.putText(
                processed_frame,
                f"{person['conf']}",
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (255, 0, 0),
                2,
                cv2.LINE_AA,
            )

        # 오탐영역 확인
        # cv2.rectangle(processed_frame, (640, 280), (700, 410), (0, 0, 255), 2)

        av_frame = VideoFrame.from_ndarray(processed_frame, format="bgr24")
        av_frame.pts, av_frame.time_base = await self.next_timestamp()
        return av_frame
