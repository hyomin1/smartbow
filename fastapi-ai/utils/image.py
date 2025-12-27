import cv2, numpy as np

def decode_bytes_image(data: bytes):
    np_arr = np.frombuffer(data, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)