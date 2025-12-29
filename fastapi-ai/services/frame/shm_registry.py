from utils.frame_shm import FrameBuffer

_shm_map = {}


def get_frame_buffer(cam_id: str, shape):
    if cam_id not in _shm_map:
        _shm_map[cam_id] = FrameBuffer(name=f"shm_{cam_id}", shape=shape, create=False)

    return _shm_map[cam_id]
