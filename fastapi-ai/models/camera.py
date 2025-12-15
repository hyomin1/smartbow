import uuid
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship


from core.db import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True)

    uuid = Column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True,
    )

    archery_range_id = Column(
        Integer,
        ForeignKey("archery_ranges.id", ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    name = Column(String(50), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    archery_range = relationship("ArcheryRange", back_populates="cameras")
