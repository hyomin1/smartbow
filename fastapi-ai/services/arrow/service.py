import datetime
import logging
import os
import time
from collections import deque

import cv2
import numpy as np
from config import BASE_DIR

from services.arrow.tracker import ArrowTracker

logger = logging.getLogger("smartbow.arrow")


class ArrowService:
    def __init__(self, buffer_size=50, idle_sec=2.0, cooldown_sec=8.0):
        self.tracking_buffer = deque(maxlen=buffer_size)
        self.tracker = ArrowTracker()

        self.idle_sec = idle_sec
        self.cooldown_sec = cooldown_sec
        self.last_event_time = None
        self.last_hit_time = 0.0

        self.target = None
        self.frame_size = None
        self.last_frame = None  # 화살 위치 디버그용 추후 서비스 안정화되면 제거

        self.current_arrow = None

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
        if len(self.tracking_buffer) < 2:
            return False
        cases = [data.get("case") for data in self.tracking_buffer]

        # 버퍼에 모두 직선만 검출된 경우
        if all(c == "C" for c in cases):
            return False

        return True

    def is_point_in_rect(self, point, rect):
        if point is None:
            return False
        x, y = point
        x1, y1, x2, y2 = rect
        return x1 <= x <= x2 and y1 <= y <= y2

    def add_event(self, event):
        if self.last_hit_time > 0:
            if time.time() - self.last_hit_time < self.cooldown_sec:
                logger.debug("판정중 버퍼 추가 스킵")
                return

        if event.get("target") is not None:
            self.target = np.array(event["target"], dtype=np.int32)
        if event.get("frame_size") is not None:
            self.frame_size = tuple(event["frame_size"])

        if event["type"] == "arrow":
            arrow_data = self.tracker.step(event.get("bbox"), event.get("motion_line"))
            if not arrow_data:
                return
            tip = arrow_data["tip"]
            tail = arrow_data["tail"]
            IGNORE_RECT = (640, 280, 700, 410)
            if self.is_point_in_rect(tip, IGNORE_RECT) or self.is_point_in_rect(
                tail, IGNORE_RECT
            ):
                return
            self.current_arrow = {"tip": arrow_data["tip"], "tail": arrow_data["tail"]}

            self.tracking_buffer.append(
                {
                    "tip": tip,
                    "tail": tail,
                    "timestamp": event["timestamp"],
                    "case": event["case"],
                }
            )

            self.last_event_time = time.time()

    def visualize_buffer(self, hit_point, reason, height):
        if not self.tracking_buffer or self.last_frame is None:
            return

        vis_frame = self.last_frame.copy()

        if reason and height:
            cv2.putText(
                vis_frame,
                f"HIT TYPE: {reason} HEIGHT: ({height})",
                (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),  # 아무 색이나
                2,
                cv2.LINE_AA,
            )

        for i, data in enumerate(self.tracking_buffer):
            tip = data["tip"]
            tail = data["tail"]
            case = data["case"]

            alpha = (i + 1) / len(self.tracking_buffer)
            color = (0, int(255 * alpha), int(255 * (1 - alpha)))

            cv2.line(
                vis_frame,
                (int(tail[0]), int(tail[1])),
                (int(tip[0]), int(tip[1])),
                color,
                2,
                cv2.LINE_AA,
            )
            cv2.circle(vis_frame, (int(tip[0]), int(tip[1])), 3, (0, 0, 255), -1)

            cv2.putText(
                vis_frame,
                f"{i} {case}",
                (int(tip[0]) + 6, int(tip[1]) - 6),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                color,
                1,
                cv2.LINE_AA,
            )

            if hit_point:
                hx, hy = int(hit_point[0]), int(hit_point[1])
                cv2.drawMarker(
                    vis_frame, (hx, hy), (0, 0, 255), cv2.MARKER_TILTED_CROSS, 25, 3
                )
                cv2.putText(
                    vis_frame,
                    f"HIT ({hx},{hy})",
                    (hx + 10, hy - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 0, 255),
                    2,
                )

            now = datetime.datetime.now()
            save_dir = os.path.join(BASE_DIR, now.strftime("%Y-%m-%d"))
            os.makedirs(save_dir, exist_ok=True)
            cv2.imwrite(
                os.path.join(save_dir, f"{now.strftime('%H-%M-%S')}.jpg"), vis_frame
            )

    def is_idle(self):
        if not self.tracking_buffer or self.last_event_time is None:
            return False
        now = time.time()
        if now - self.last_event_time > 0.5:
            self.current_arrow = None
        if now - self.last_hit_time < self.cooldown_sec:
            return False

        return time.time() - self.last_event_time > self.idle_sec

    def clear_buffer(self):
        self.tracking_buffer.clear()
        self.tracker.reset()

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

    def intersect_line_point(self, p1, p2, q1, q2):
        x1, y1 = p1
        x2, y2 = p2
        x3, y3 = q1
        x4, y4 = q2

        denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
        if abs(denom) < 1e-6:
            return None

        px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom
        py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom

        return [float(px), float(py)]

    def new_find_hit_point(self):
        if not self.check_buffer_validity():
            self.clear_buffer()
            return None

        y_coords = [data["tip"][1] for data in self.tracking_buffer]

        y_min, y_max = min(y_coords), max(y_coords)
        height = y_max - y_min
        if height < 50:
            self.clear_buffer()
            return None

        hit_idx = -1

        for i in range(len(y_coords) - 1):
            v_out = y_coords[i] - y_coords[i + 1]

            if v_out > 0:
                hit_idx = i
                break
        if hit_idx != -1 and len(self.tracking_buffer) < 5:
            hit_idx = -1

        if hit_idx != -1:
            hit_tip = self.tracking_buffer[hit_idx]["tip"]
            raw_hit = [float(hit_tip[0]), float(hit_tip[1])]

            if self.target is not None and self._is_inside_target(raw_hit):
                return {
                    "point": raw_hit,
                    "inside": True,
                    "type": "INFLECTION_HIT",
                    "h": height,
                }
            # 변곡점이 있지만 과녁 내부에서 검출 부족으로 찾지 못한경우
            # hit_idx tip이랑 hit_idx+1 tip y를 직선으로 쭉이어서 과녁 내부면 point찍고 아니면 기존 로직

            arrow1 = self.tracking_buffer[hit_idx]
            arrow2 = self.tracking_buffer[hit_idx + 1]

            p = self.intersect_line_point(
                arrow1["tip"], arrow1["tail"], arrow2["tip"], arrow2["tail"]
            )
            if p and self._is_inside_target(p):
                return {
                    "point": p,
                    "inside": True,
                    "type": "INTERSECTION_INSIDE_TARGET",
                    "h": height,
                }

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

    def find_hit_point(self):
        if not self.check_buffer_validity():
            self.clear_buffer()
            return None

        y_coords = [data["tip"][1] for data in self.tracking_buffer]

        # 오탐 정지 물체 필터링
        y_min, y_max = min(y_coords), max(y_coords)
        total_height = y_max - y_min

        if total_height < 25:
            self.clear_buffer()
            return None

        # 적중하면 변곡점이 나온다.
        for i in range(len(y_coords) - 1):
            if y_coords[i + 1] < y_coords[i]:
                hit_tip = self.tracking_buffer[i]["tip"]
                raw_hit = [float(hit_tip[0]), float(hit_tip[1])]

                if self.target is not None:
                    if self._is_inside_target(raw_hit):
                        return {"point": raw_hit, "inside": True}

                    for data in self.tracking_buffer:
                        if self._is_inside_target(data["tip"]):
                            return {"point": list(data["tip"]), "inside": True}

                        closest_point = self._closest_point_on_polygon(
                            raw_hit, self.target
                        )
                        if closest_point:
                            closest_x, closest_y = closest_point

                            M = cv2.moments(self.target)
                            if M["m00"] != 0:
                                cx, cy = M["m10"] / M["m00"], M["m01"] / M["m00"]
                                dx, dy = cx - closest_x, cy - closest_y
                                length = np.sqrt(dx**2 + dy**2)

                                if length > 0:
                                    dx, dy = dx / length, dy / length
                                    closest_x += dx * 35
                                    closest_y += dy * 35

                            return {"point": [closest_x, closest_y], "inside": True}
                        else:
                            return {"point": raw_hit, "inside": False}
                else:
                    return {"point": raw_hit, "inside": False}

        # 변곡점 없는 경우 적중 X or 적중했지만 변곡점 감지 안되는 경우가 있다
        last_tip = self.tracking_buffer[-1]["tip"]
        raw_hit = [float(last_tip[0]), float(last_tip[1])]

        if self.target is None:
            return {"point": raw_hit, "inside": False}

        if self._is_inside_target(raw_hit):
            return {"point": raw_hit, "inside": True}
        for data in self.tracking_buffer:
            if self._is_inside_target(data["tip"]):
                return {"point": list(data["tip"]), "inside": True}
        return {"point": raw_hit, "inside": False}
