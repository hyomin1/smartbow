from models.face_embedding import FaceEmbedding
from models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class UserService:
    def __init__(self):
        self.last_user_id: int | None = None
        self.last_user_name: str | None = None
        self.name_cache: dict[int, str | None] = {}

    async def get_user_name(self, user_id: int | None) -> str | None:
        if user_id is None:
            self.last_user_id = None
            self.last_user_name = None
            return None

        if user_id == self.last_user_id:
            return self.last_user_name

        if user_id in self.name_cache:
            name = self.name_cache[user_id]
        else:
            async with AsyncSession() as db:
                result = await db.execute(select(User.name).where(User.id == user_id))
                name = result.scalar_one_or_none()
                self.name_cache[user_id] = name

        self.last_user_id = user_id
        self.last_user_name = name
        return name


async def register_face(
    *,
    db: AsyncSession,
    user: User,
    embeddings: list[list[float]],
) -> None:
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
