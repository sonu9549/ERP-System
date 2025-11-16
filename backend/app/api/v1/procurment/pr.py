from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import app.crud.procurment.pr as crud
from app.schemas.procurment.pr import PRCreate, PRResponse
from app.db.session import get_db

router = APIRouter(prefix="/api/pr", tags=["Purchase Requisition"])

@router.post("/", response_model=PRResponse, status_code=status.HTTP_201_CREATED)
def raise_pr(
    pr: PRCreate,
    db: Session = Depends(get_db),
    current_user: str = "Rahul"  # Replace with auth later
):
    return crud.create_pr(db=db, pr=pr, user=current_user)

@router.get("/", response_model=List[PRResponse])
def get_all_prs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    prs = crud.get_prs(db, skip=skip, limit=limit)
    return prs

@router.get("/{pr_id}", response_model=PRResponse)
def get_pr(pr_id: int, db: Session = Depends(get_db)):
    pr = crud.get_pr_by_id(db, pr_id)
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    return pr

@router.patch("/{pr_id}/approve")
def approve_pr(pr_id: int, db: Session = Depends(get_db)):
    pr = crud.update_pr_status(db, pr_id, "approved")
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    return {"message": "PR approved", "pr": pr}

@router.patch("/{pr_id}/reject")
def reject_pr(pr_id: int, db: Session = Depends(get_db)):
    pr = crud.update_pr_status(db, pr_id, "rejected")
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    return {"message": "PR rejected", "pr": pr}