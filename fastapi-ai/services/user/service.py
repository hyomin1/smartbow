from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from models.face_embedding import FaceEmbedding




async def register_face(
    *,
    db: AsyncSession,
    user: User,
    embeddings: list[list[float]],
)-> None:
    for emb in embeddings:
        face = FaceEmbedding(
            user_id=user.id,
            embedding=emb,
        )
        db.add(face)
        print(f"[DEBUG] Face instance created: {face}")

    user.has_face = True
    db.add(user)
    await db.commit()