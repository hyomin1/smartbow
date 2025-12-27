import uuid

from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship


from core.db import Base

class ArcheryRange(Base):
    __tablename__ = "archery_ranges"

    __table_args__ = (
        UniqueConstraint("region", "name", name="uq_archery_range_region_name"),
    )

    id = Column(Integer,primary_key=True)

    uuid = Column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True,
    )

    code = Column(String(50), unique=True, nullable=False, index=True)

    region = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    cameras = relationship("Camera", back_populates="archery_range", cascade="all, delete-orphan")
    users = relationship("User", back_populates="archery_range")

    


