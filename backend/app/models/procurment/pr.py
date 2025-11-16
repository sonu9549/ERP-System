from sqlalchemy import Column, Integer, String, Float, Date, Enum
from sqlalchemy.sql import func
from database import Base
import enum

class PRStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class PurchaseRequisition(Base):
    __tablename__ = "purchase_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    pr_number = Column(String, unique=True, index=True)
    user = Column(String, index=True)
    dept = Column(String)
    amount = Column(Float)
    items = Column(Integer)  # number of items
    status = Column(Enum(PRStatus), default=PRStatus.pending)
    created_at = Column(Date, server_default=func.now())