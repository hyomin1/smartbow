import insightface

class FaceEncoder:
    def __init__(self):
        self.app = insightface.app.FaceAnalysis(providers=['CPUExecutionProvider'])
        self.app.prepare(ctx_id=0, det_size=(640, 640))

    def encode(self,image) -> list[float] | None:
        faces = self.app.get(image)
        if not faces:
            return None
        return faces[0].embedding.tolist()

face_encoder = FaceEncoder()