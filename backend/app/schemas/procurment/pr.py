# backend/schemas/pr.py
from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class PRItem(BaseModel):
    name: str
    qty: int
    price: float

class PRCreate(BaseModel):
    dept: str
    items: List[PRItem]

class PRResponse(BaseModel):
    id: int
    pr_number: str
    user: str
    dept: str
    amount: float
    items: int
    status: str
    created_at: date

    class Config:
        from_attributes = True