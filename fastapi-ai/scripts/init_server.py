import asyncio
import hashlib

from sqlalchemy import select
from passlib.context import CryptContext

from core.db import AsyncSessionLocal
from models.user import User, UserRole



pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
  
    digest = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(digest)


ADMIN_USER_ID = "admin"
ADMIN_PASSWORD = "password 입력"   
ADMIN_NAME = "관리자"


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.role == UserRole.super_admin)
        )
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            print("이미 super_admin이 존재합니다.")
            return

        result = await db.execute(
            select(User).where(User.userId == ADMIN_USER_ID)
        )
        if result.scalar_one_or_none():
            raise RuntimeError("userId already exists")

        admin = User(
            userId=ADMIN_USER_ID,
            hashed_password=hash_password(ADMIN_PASSWORD),
            name=ADMIN_NAME,
            role=UserRole.super_admin,
            archery_range_id=None,
            kakao_id=None,
        )

        db.add(admin)
        await db.commit()

        print("super_admin 생성 완료")
        print(f"   userId: {ADMIN_USER_ID}")


if __name__ == "__main__":
    asyncio.run(main())
