import httpx

from sqlalchemy import select

from core.db import AsyncSessionLocal
from models.user import User
from services.auth.security import verify_password, create_access_token
from models.user import UserRole


async def authenticate_user(userId: str, password: str) -> str | None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.userId == userId))
        user = result.scalar_one_or_none()
        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None
        
        return create_access_token(data={"sub":user.userId, "role":user.role})
    

async def authenticate_kakao_user(kakao_access_token:str) -> str | None:
    headers = {
        "Authorization": f"Bearer {kakao_access_token}"
    }
    async with httpx.AsyncClient() as client:
        res = await client.get("https://kapi.kakao.com/v2/user/me", headers=headers)

    if res.status_code != 200:
        return None
    
    data = res.json()
    kakao_id = str(data['id'])

    nickname = (
        data
        .get("properties", {})
        .get("nickname")
        or f"user_{kakao_id}"
    )

    internal_user_id = f"kakao_{kakao_id}"

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.userId == internal_user_id))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                userId=internal_user_id,
                name=nickname,
                role=UserRole.user,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        return create_access_token(data={"sub":user.userId, "role":user.role})