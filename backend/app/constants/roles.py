# app/constants/roles.py
from enum import IntEnum
from typing import Self


class ROLES(IntEnum):
    """
    Role IDs – stored as INTEGER in DB.
    Human-readable names are shown in Swagger / responses.
    """
    SUPER_ADMIN = 1
    ADMIN = 2
    SALES_MANAGER = 10
    INVENTORY_MANAGER = 11
    CRM_MANAGER = 12
    HR_MANAGER = 13
    FINANCE_MANAGER = 14
    QUALITY_MANAGER = 15
    LOGISTICS_MANAGER = 16
    PRODUCTION_MANAGER = 17
    PROCUREMENT_MANAGER = 18
    PLANT_MANAGER = 19
    SALES_REP = 20
    USER = 99

    # ------------------------------------------------------------------
    # Optional: pretty name for Swagger / logs
    # ------------------------------------------------------------------
    @property
    def display_name(self) -> str:
        """Human-readable name (e.g. 'Super Admin')"""
        return self.name.replace("_", " ").title()

    # ------------------------------------------------------------------
    # Optional: Pydantic JSON encoder (auto-called)
    # ------------------------------------------------------------------
    def __json__(self) -> int:
        """Return the integer value in JSON"""
        return self.value

    # ------------------------------------------------------------------
    # Optional: from string (e.g. "SUPER_ADMIN" → ROLES.SUPER_ADMIN)
    # ------------------------------------------------------------------
    @classmethod
    def from_str(cls, value: str) -> Self:
        """Convert string (case-insensitive) to enum"""
        try:
            return cls[value.upper()]
        except KeyError:
            raise ValueError(f"Invalid role: {value}")