import asyncio
import hashlib


from sqlalchemy import select
from passlib.context import CryptContext

from core.db import AsyncSessionLocal
from models.user import User, UserRole
from models.archery_range import ArcheryRange



pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
  
    digest = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(digest)


ADMIN_USER_ID = "admin"
ADMIN_PASSWORD = "관리자 비번 입력"   
ADMIN_NAME = "관리자"

RANGE_CODE='GW_GWANDEOK'
RANGE_REGION='광주'
RANGE_NAME='관덕정'

async def get_or_create_archery_range(db):
    result = await db.execute(select(ArcheryRange).where(ArcheryRange.code == RANGE_CODE))
    archery_range = result.scalar_one_or_none()

    if archery_range:
        return archery_range

    archery_range = ArcheryRange(
        code=RANGE_CODE,
        region=RANGE_REGION,
        name=RANGE_NAME
    )

    db.add(archery_range)
    await db.commit()
    await db.refresh(archery_range)

    return archery_range




async def main():
    async with AsyncSessionLocal() as db:

        archery_range = await get_or_create_archery_range(db)
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
        )

        db.add(admin)
        await db.commit()

        print("super_admin 생성 완료")
        print(f"   userId: {ADMIN_USER_ID}")


if __name__ == "__main__":
    asyncio.run(main())
