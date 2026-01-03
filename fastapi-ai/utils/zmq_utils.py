import zmq


def get_req_socket(ipc_name: str, timeout_ms=3000):
    ctx = zmq.Context.instance()
    socket = ctx.socket(zmq.REQ)

    socket.setsockopt(zmq.LINGER, 0)
    socket.setsockopt(zmq.RCVTIMEO, timeout_ms)
    socket.setsockopt(zmq.SNDTIMEO, timeout_ms)

    socket.connect(f"ipc:///tmp/{ipc_name}.ipc")

    return socket
