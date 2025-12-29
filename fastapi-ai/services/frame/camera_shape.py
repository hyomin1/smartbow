from config import ARROW_INFER_CONFIG, PERSON_INFER_CONFIG


def get_camera_shape(cam_id: str):
    for config in ARROW_INFER_CONFIG.values():
        if config["id"] == cam_id:
            return tuple(config["shape"])

    for config in PERSON_INFER_CONFIG.values():
        if config["id"] == cam_id:
            return tuple(config["shape"])

    raise KeyError(f"frame_shape not found for cam_id={cam_id}")
