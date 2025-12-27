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

    def reset(self):
        self.initialized = False

    def step(self, bbox, line=None):
        bx1, by1, bx2, by2 = map(float, bbox)
        cx, cy = (bx1 + bx2) / 2, (by1 + by2) / 2

        if not self.initialized:
            self.kf.statePost = np.array([[cx], [cy], [0], [0]], np.float32)
            self.initialized = True

        self.kf.predict()
        measurement = np.array([[np.float32(cx)], [np.float32(cy)]], np.float32)
        self.kf.correct(measurement)

        if line is not None:
            lx1, ly1, lx2, ly2 = map(float, line)
            vx, vy = lx2 - lx1, ly2 - ly1
        else:
            vx, vy = self.kf.statePost[2][0], self.kf.statePost[3][0]

        if abs(vy) < 1e-6:
            rx, ry = cx, by2
            tx, ty = cx, by1
        else:
            slope = vx / vy
            rx = cx + (by2 - cy) * slope
            tx = cx - (cy - by1) * slope

            rx = max(bx1, min(bx2, rx))
            tx = max(bx1, min(bx2, tx))
            ry, ty = by2, by1

        return {"tip": (float(rx), float(ry)), "tail": (float(tx), float(ty))}
