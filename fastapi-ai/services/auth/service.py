from sqlalchemy import select

from core.db import AsyncSessionLocal
from models.user import User
from services.auth.security import verify_password, create_access_token

async def authenticate_user(userId: str, password: str) -> str | None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.userId == userId))
        user = result.scalar_one_or_none()
        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None
        
        return create_access_token(data={"sub":user.userId, "role":user.role})