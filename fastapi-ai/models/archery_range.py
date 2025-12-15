import uuid

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship


from core.db import Base

class ArcheryRange(Base):
    __tablename__ = "archery_ranges"

    id = Column(Integer,primary_key=True)

    uuid = Column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True,
    )

    region = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    cameras = relationship("Camera", back_populates="archery_range")
    users = relationship("User", back_populates="archery_range")

    


