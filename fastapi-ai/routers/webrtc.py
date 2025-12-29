import asyncio
import logging

from aiortc import RTCPeerConnection, RTCSessionDescription
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from services.arrow.registry import arrow_registry
from services.frame.camera_shape import get_camera_shape
from services.person.registry import person_registry
from services.webrtc.video_track import CameraVideoTrack

logger = logging.getLogger("smartbow.webrtc")

router = APIRouter()
pcs = set()


@router.post("/offer/{cam_id}")
async def offer(cam_id: str, request: Request):
    try:
        arrow_service = arrow_registry.get(cam_id)
        person_service = person_registry.get(cam_id)

        if arrow_service is None or person_service is None:
            logger.warning(f"알 수 없는 카메라 ID 요청: {cam_id}")
            return JSONResponse(
                {"detail": f"Unknown camera id: {cam_id}"}, status_code=404
            )

        try:
            params = await request.json()
            offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
        except KeyError as e:
            logger.error(f"요청 필드 누락 - 카메라: {cam_id}, 필드: {e}")
            return JSONResponse(
                {"detail": f"Missing required field: {e}"}, status_code=400
            )
        except Exception as e:
            logger.error(f"요청 파싱 실패 - 카메라: {cam_id}, 오류: {e}")
            return JSONResponse({"detail": "Invalid request format"}, status_code=400)

        pc = RTCPeerConnection()
        pcs.add(pc)

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            state = pc.connectionState
            logger.info(f"연결 상태 변경 - 카메라: {cam_id}, 상태: {state}")

            if state in ("failed", "closed"):
                pcs.discard(pc)
                await pc.close()
                logger.info(
                    f"PeerConnection 제거 - 카메라: {cam_id} (남은 연결: {len(pcs)}개)"
                )

        @pc.on("iceconnectionstatechange")
        async def on_iceconnectionstatechange():
            logger.debug(
                f"ICE 연결 상태 - 카메라: {cam_id}, 상태: {pc.iceConnectionState}"
            )

        try:
            shape = get_camera_shape(cam_id)
            video_track = CameraVideoTrack(
                cam_id=cam_id,
                shape=shape,
                arrow_service=arrow_service,
                person_service=person_service,
            )
            pc.addTrack(video_track)
            logger.debug(f"비디오 트랙 추가 완료 - 카메라: {cam_id}")
        except Exception as e:
            logger.error(f"트랙 추가 실패 - 카메라: {cam_id}, 오류: {e}")
            pcs.discard(pc)
            raise

        try:
            await pc.setRemoteDescription(offer)
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            logger.info(f"WebRTC 협상 완료 - 카메라: {cam_id}")
        except Exception as e:
            logger.error(
                f"WebRTC 협상 실패 - 카메라: {cam_id}, 오류: {e}", exc_info=True
            )
            pcs.discard(pc)
            await pc.close()
            raise
        return {
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
        }

    except Exception as e:
        logger.error(f"예상치 못한 오류 - 카메라: {cam_id}, 오류: {e}", exc_info=True)
        return JSONResponse({"detail": "Internal server error"}, status_code=500)


@router.on_event("shutdown")
async def on_shutdown():
    logger.info("=" * 60)
    logger.info("WebRTC 서비스 종료 시작")
    logger.info("=" * 60)

    if pcs:
        logger.info(f"PeerConnection 종료 중... (총 {len(pcs)}개)")
        await asyncio.gather(*(pc.close() for pc in pcs), return_exceptions=True)
        pcs.clear()
        logger.info("  ✓ 모든 PeerConnection 종료 완료")
    else:
        logger.info("종료할 PeerConnection 없음")

    logger.info("=" * 60)
    logger.info("WebRTC 서비스 종료 완료")
    logger.info("=" * 60)
