# backend/crud/pr.py
from sqlalchemy.orm import Session
from app.models.procurment.pr import PurchaseRequisition, PRStatus
from app.schemas.procurment.pr import PRCreate
import datetime

def generate_pr_number(db: Session):
    today = datetime.date.today()
    count = db.query(PurchaseRequisition).filter(
        PurchaseRequisition.created_at == today
    ).count() + 1
    return f"PR-{today.year}-{str(count).zfill(4)}"

def create_pr(db: Session, pr: PRCreate, user: str):
    pr_number = generate_pr_number(db)
    total_amount = sum(item.qty * item.price for item in pr.items)
    
    db_pr = PurchaseRequisition(
        pr_number=pr_number,
        user=user,
        dept=pr.dept,
        amount=total_amount,
        items=len(pr.items),
        status=PRStatus.pending
    )
    db.add(db_pr)
    db.commit()
    db.refresh(db_pr)
    return db_pr

def get_prs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(PurchaseRequisition).offset(skip).limit(limit).all()

def get_pr_by_id(db: Session, pr_id: int):
    return db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()

def update_pr_status(db: Session, pr_id: int, status: str):
    pr = get_pr_by_id(db, pr_id)
    if not pr:
        return None
    pr.status = PRStatus(status)
    db.commit()
    db.refresh(pr)
    return pr