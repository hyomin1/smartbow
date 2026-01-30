import datetime
import logging
import os
import time
from collections import deque

import cv2
import numpy as np
from config import BASE_DIR

logger = logging.getLogger("smartbow.arrow")


class ArrowService:
    def __init__(self, buffer_size=50, idle_sec=2.0, cooldown_sec=8.0):
        self.tracking_buffer = deque(maxlen=buffer_size)  # 화살 데이터
        self.splash_buffer = deque(maxlen=10)  # 모래 튀기는 데이터

        self.idle_sec = idle_sec
        self.cooldown_sec = cooldown_sec
        self.last_event_time = None
        self.last_hit_time = 0.0

        self.target = None
        self.frame_size = None
        self.last_frame = None  # 화살 위치 디버그용 추후 서비스 안정화되면 제거

        self.current_arrow = None
        self.current_splash = None

    def set_target(self, target, frame_size):
        self.target = np.array(target, dtype=np.int32)
        self.frame_size = tuple(frame_size)
        logger.info(f"[ArrowService] target set | frame_size={self.frame_size}")

    def to_render_coords(self, x, y, video_size):
        if video_size is None or self.frame_size is None:
            return None

        render_w, render_h = video_size
        frame_w, frame_h = self.frame_size
        scale = min(render_w / frame_w, render_h / frame_h)
        pad_x = (render_w - frame_w * scale) / 2
        pad_y = (render_h - frame_h * scale) / 2

        return [float(x * scale + pad_x), float(y * scale + pad_y)]

    def polygon_to_render(self, video_size):
        if self.target is None or self.frame_size is None:
            return None

        render_poly = []
        for x, y in self.target:
            p = self.to_render_coords(x, y, video_size)
            if p:
                render_poly.append(p)

        return render_poly

    def _is_inside_target(self, point):
        if self.target is None or point is None:
            return False
        return cv2.pointPolygonTest(self.target, point, False) >= 0

    def check_buffer_validity(self):
        return len(self.tracking_buffer) >= 2

    def is_point_in_rect(self, point, rect):
        if point is None:
            return False
        x, y = point
        x1, y1, x2, y2 = rect
        return x1 <= x <= x2 and y1 <= y <= y2

    def add_event(self, event):
        if event["type"] != "arrow":
            return

        if self.last_hit_time > 0:
            if time.time() - self.last_hit_time < self.cooldown_sec:
                logger.debug("판정중 버퍼 추가 스킵")
                return

        tip = event.get("tip")
        tail = event.get("tail")
        conf = event.get("bbox_conf")

        self.current_arrow = {"tip": tip, "tail": tail}

        self.tracking_buffer.append(
            {
                "tip": tip,
                "tail": tail,
                "conf": conf,
                "timestamp": event["timestamp"],
            }
        )

        self.last_event_time = time.time()

    def add_splash_event(self, event):
        if event["type"] != "splash":
            return

        if self.last_hit_time > 0:
            if time.time() - self.last_hit_time < self.cooldown_sec:
                logger.debug("판정중 버퍼 추가 스킵")
                return
        self.current_splash = event["splash_bbox"]

        self.splash_buffer.append(event["splash_bbox"])
        self.last_event_time = time.time()

    def visualize_buffer(self, hit_point, reason, height):
        if self.last_frame is None:
            return

        if not self.tracking_buffer and not self.splash_buffer:
            return

        vis_frame = self.last_frame.copy()
        num_points = len(self.tracking_buffer)
        if num_points > 0:
            overlay = vis_frame.copy()
            cv2.rectangle(overlay, (10, 10), (450, 60), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.6, vis_frame, 0.4, 0, vis_frame)
            cv2.putText(
                vis_frame,
                f"HIT: {reason} | H: {height:.2f} | Pts: {num_points}",
                (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2,
            )

            for i, data in enumerate(self.tracking_buffer):
                tip = (int(data["tip"][0]), int(data["tip"][1]))
                tail = (int(data["tail"][0]), int(data["tail"][1]))

                conf = data.get("conf", "?")

                # 1. 그라데이션 색상 (진한 파랑 -> 진한 빨강)
                alpha = (i + 1) / num_points
                color = (int(255 * (1 - alpha)), 0, int(255 * alpha))

                # 2. 화살 궤적 선 (얇게 하여 겹쳐도 보이게 함)
                cv2.line(vis_frame, tail, tip, color, 1, cv2.LINE_AA)
                cv2.circle(vis_frame, tip, 2, color, -1)

                # 3. [핵심] 텍스트 분산 배치 (박힌 지점에서 번호가 펴지도록)
                # 인덱스 번호에 따라 텍스트를 나선형 또는 계단형으로 배치
                angle = (i / num_points) * 2 * np.pi  # 360도 분산
                radius = 30 + (i * 2)  # 뒤로 갈수록 멀어지게 하여 겹침 방지

                tx = int(tip[0] + radius * np.cos(angle))
                ty = int(tip[1] + radius * np.sin(angle))

                # 팁에서 번호까지 얇은 지시선 연결
                cv2.line(vis_frame, tip, (tx, ty), (200, 200, 200), 1, cv2.LINE_4)

                # label = f"{i}:{case}"
                label = f"{i} conf:{conf}"
                cv2.putText(
                    vis_frame,
                    label,
                    (tx, ty),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.4,
                    color,
                    1,
                    cv2.LINE_AA,
                )

        # 4. 최종 적중 지점 강조
        if hit_point:
            hx, hy = int(hit_point[0]), int(hit_point[1])
            cv2.drawMarker(
                vis_frame, (hx, hy), (0, 255, 0), cv2.MARKER_TILTED_CROSS, 20, 2
            )

            now = datetime.datetime.now()
            save_dir = os.path.join(BASE_DIR, now.strftime("%Y-%m-%d"))
            os.makedirs(save_dir, exist_ok=True)
            cv2.imwrite(
                os.path.join(save_dir, f"{now.strftime('%H-%M-%S')}.jpg"), vis_frame
            )

    def is_idle(self):
        if not self.tracking_buffer and not self.splash_buffer:
            return False

        if self.last_event_time is None:
            return False
        now = time.time()
        if now - self.last_event_time > 0.5:
            self.current_arrow = None
            self.current_splash = None
        if now - self.last_hit_time < self.cooldown_sec:
            return False

        return now - self.last_event_time > self.idle_sec

    def clear_buffer(self):
        self.tracking_buffer.clear()
        self.splash_buffer.clear()

    def _closest_point_on_polygon(self, point, polygon):
        px, py = point
        min_dist = float("inf")
        closest_point = None

        for i in range(len(polygon)):
            p1, p2 = polygon[i], polygon[(i + 1) % len(polygon)]
            x1, y1 = float(p1[0]), float(p1[1])
            x2, y2 = float(p2[0]), float(p2[1])

            dx, dy = x2 - x1, y2 - y1

            if dx == 0 and dy == 0:
                continue

            t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))

            closest_x, closest_y = x1 + t * dx, y1 + t * dy

            # 거리 계산
            dist = np.sqrt((px - closest_x) ** 2 + (py - closest_y) ** 2)

            if dist < min_dist:
                min_dist = dist
                closest_point = (closest_x, closest_y)

        return closest_point

    def find_hit_point(self):
        if not self.check_buffer_validity():
            # 화살 데이터 없는데 모래 튀는게 많은 경우 불관중
            if len(self.splash_buffer) >= 5:
                first_bbox = self.splash_buffer[0]
                splash_x = (first_bbox[0] + first_bbox[2]) / 2
                splash_y = first_bbox[3]

                res = {
                    "point": [float(splash_x), float(splash_y)],
                    "inside": False,
                    "type": "SPLASH_ONLY_MISS",
                    "h": 0,
                }
                self.clear_buffer()
                return res

            self.clear_buffer()
            return None

        y_coords = [data["tip"][1] for data in self.tracking_buffer]

        y_min, y_max = min(y_coords), max(y_coords)
        height = y_max - y_min
        if height < 35:
            self.clear_buffer()
            return None

        hit_idx = -1

        for i in range(len(y_coords) - 1):
            if y_coords[i] - y_coords[i + 1] > 0:
                hit_idx = i
                break

        if hit_idx != -1:
            hit_tip = self.tracking_buffer[hit_idx]["tip"]
            raw_hit = [float(hit_tip[0]), float(hit_tip[1])]

            if len(self.splash_buffer) >= 5:
                first_bbox = self.splash_buffer[0]
                splash_x = (first_bbox[0] + first_bbox[2]) / 2
                splash_y = first_bbox[3]
                return {
                    "point": [float(splash_x), float(splash_y)],
                    "inside": False,
                    "type": "HIT_WITH_SPLASH_MISS",
                    "h": height,
                }

            # 변곡점 존재하는데, 과녁 아래 부분에서 발견된경우는 불관중
            if self.target is not None:
                target_bottom_y = max(p[1] for p in self.target)
                if raw_hit[1] > target_bottom_y:
                    return {
                        "point": raw_hit,
                        "inside": False,
                        "type": "INFLECTION_TARGET_BELOW",
                        "h": height,
                    }
            # 일반적인 적중 판정
            if self.target is not None and self._is_inside_target(raw_hit):
                return {
                    "point": raw_hit,
                    "inside": True,
                    "type": "INFLECTION_HIT",
                    "h": height,
                }
            # 판정 데이터 약해서 역추적해서 과녁가까운 곳으로 임의의 점 찍기
            if self.target is not None:
                closest_points = self._closest_point_on_polygon(raw_hit, self.target)
                if closest_points:
                    closest_x, closest_y = closest_points
                    M = cv2.moments(self.target)
                    if M["m00"] != 0:
                        cx, cy = M["m10"] / M["m00"], M["m01"] / M["m00"]
                        dx, dy = cx - closest_x, cy - closest_y
                        length = np.sqrt(dx**2 + dy**2)

                        if length > 0:
                            dx, dy = dx / length, dy / length
                            closest_x += dx * 35
                            closest_y += dy * 35

                    return {
                        "point": [closest_x, closest_y],
                        "inside": True,
                        "type": "PROJECTED_TO_TARGET",
                        "h": height,
                    }
                else:
                    return {
                        "point": raw_hit,
                        "inside": False,
                        "type": "NO_CLOSET_POINT",
                        "h": height,
                    }
            else:
                return {
                    "point": raw_hit,
                    "inside": False,
                    "type": "NO_TARGET_INFO",
                    "h": height,
                }

        else:  # 불관중
            last_tip = self.tracking_buffer[-1]["tip"]
            raw_hit = [float(last_tip[0]), float(last_tip[1])]
            # 불관중인데 검출 부족으로 과녁 내부에 찍힌경우
            if self.target is not None and self._is_inside_target(raw_hit):
                target_bottom_y = max(p[1] for p in self.target)
                raw_hit = [raw_hit[0], float(target_bottom_y + 10)]
                return {
                    "point": raw_hit,
                    "inside": False,
                    "type": "MISS_INSIDE_TARGET",
                    "h": height,
                }
            if self.target is not None:
                xs = [p[0] for p in self.target]
                ys = [p[1] for p in self.target]

                min_x, max_x = min(xs), max(xs)
                min_y, max_y = min(ys), max(ys)

                MARGIN = 50
                min_x -= MARGIN
                max_x += MARGIN
                min_y -= MARGIN
                max_y += MARGIN

                clamped_x = min(max(raw_hit[0], min_x), max_x)
                clamped_y = min(max(raw_hit[1], min_y), max_y)
                clamped_hit = [clamped_x, clamped_y]
                return {
                    "point": clamped_hit,
                    "inside": False,
                    "type": "MISS_GENERAL",
                    "h": height,
                }

            return {
                "point": raw_hit,
                "inside": False,
                "type": "MISS_NO_TARGET",
                "h": height,
            }
