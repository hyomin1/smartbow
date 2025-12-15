import uuid

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship


from core.db import Base

import uuid, enum

class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    range_admin = "range_admin"
    user = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

    uuid = Column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True,
    )

    userId = Column(String(50), unique=True, nullable=True)
    hashed_password = Column(String(100), nullable=True)


    kakao_id = Column(String(50), unique=True, nullable=True)

    name = Column(String(50), nullable=False)

    role = Column(
        Enum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.user,
    )

    archery_range_id = Column(
        Integer,
        ForeignKey("archery_ranges.id"),
        nullable=True,
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    archery_range = relationship("ArcheryRange", back_populates="users")