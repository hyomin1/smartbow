import threading

import zmq


def start_subscriber_thread(ipc_name, cam_id, callback):
    def run():
        ctx = zmq.Context()
        socket = ctx.socket(zmq.SUB)

        ipc_path = f"ipc:///tmp/{ipc_name}.ipc"

        try:
            socket.connect(ipc_path)
            socket.subscribe("")
            print(f"[SUB] Connected (IPC) → cam={cam_id}, path={ipc_path}")
        except Exception as e:
            print(f"[SUB] Connection Failed({cam_id}): {e}")
            return

        while True:
            try:
                event = socket.recv_json()
                callback(cam_id, event)
            except Exception as e:
                print(f"[SUB] Error({cam_id}):", e)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread
