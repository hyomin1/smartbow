import cv2
import numpy as np


class ArrowTracker:
    def __init__(self):
        self.kf = cv2.KalmanFilter(4, 2)
        self.kf.measurementMatrix = np.array([[1, 0, 0, 0], [0, 1, 0, 0]], np.float32)
        self.kf.transitionMatrix = np.array(
            [[1, 0, 1, 0], [0, 1, 0, 1], [0, 0, 1, 0], [0, 0, 0, 1]], np.float32
        )
        self.kf.processNoiseCov = np.eye(4, dtype=np.float32) * 0.05
        self.initialized = False
        self.last_slope = 0.0  # Case C에서 얻은 기울기 저장용

    def reset(self):
        self.initialized = False
        self.last_slope = 0.0

    def step(self, bbox, line):
        # 1. Case C 판별 (BBOX가 없는 경우)
        is_case_c = bbox is None and line is not None

        if is_case_c:
            # Case C: 기울기 정보만 업데이트하고 위치 보정은 건너뜀
            lx1, ly1, lx2, ly2 = map(float, line)
            if abs(ly2 - ly1) > 1e-6:
                self.last_slope = (lx2 - lx1) / (ly2 - ly1)

            if self.initialized:
                self.kf.predict()  # 관성만 유지
            return None  # 판정 버퍼에 쌓이지 않도록 None 반환

        # 2. Case A, B (BBOX가 있는 경우)
        if bbox is not None:
            bx1, by1, bx2, by2 = map(float, bbox)
            cx, cy = (bx1 + bx2) / 2, (by1 + by2) / 2

            if not self.initialized:
                self.kf.statePost = np.array([[cx], [cy], [0], [0]], np.float32)
                self.initialized = True

            self.kf.predict()
            self.kf.correct(np.array([[np.float32(cx)], [np.float32(cy)]], np.float32))

            # 기울기 결정
            if line is not None:
                lx1, ly1, lx2, ly2 = map(float, line)
                current_slope = (lx2 - lx1) / (ly2 - ly1 + 1e-6)
                self.last_slope = current_slope  # 최신 기울기 업데이트
            else:
                # 선이 없으면 칼만 필터 속도나 저장된 last_slope 사용
                vx, vy = self.kf.statePost[2][0], self.kf.statePost[3][0]
                if abs(vy) > 0.1:  # 유의미한 이동이 있을 때만 속도 기반 기울기 사용
                    current_slope = vx / vy
                else:
                    current_slope = self.last_slope

            # 3. 기존 스타일의 Tip/Tail 계산 (BBOX 내부 클리핑)
            rx = cx + (by2 - cy) * current_slope
            tx = cx - (cy - by1) * current_slope

            # 박스 가로 범위로 제한 (클리핑)
            rx = max(bx1, min(bx2, rx))
            tx = max(bx1, min(bx2, tx))

            return {
                "tip": (float(rx), float(by2)),
                "tail": (float(tx), float(by1)),
                "slope": current_slope,
            }

        return None
