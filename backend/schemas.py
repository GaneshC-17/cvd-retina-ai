import re
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

# Common password strength validator
def validate_password_strength(password: str) -> str:
    if len(password) < 8:
        raise ValueError('Password must be at least 8 characters long')
    if not re.search(r'[A-Z]', password):
        raise ValueError('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', password):
        raise ValueError('Password must contain at least one lowercase letter')
    if not re.search(r'[0-9]', password):
        raise ValueError('Password must contain at least one number')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError('Password must contain at least one special character')
    return password

# User Schemas
class UserBase(BaseModel):
    full_name: str
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: Optional[str] = "user"
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    notes: Optional[str] = None

    @field_validator('password')
    @classmethod
    def check_password_strength(cls, v):
        return validate_password_strength(v)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    @classmethod
    def check_new_password_strength(cls, v):
        return validate_password_strength(v)

# Forgot/Reset Password Schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    @classmethod
    def check_reset_password_strength(cls, v):
        return validate_password_strength(v)

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Patient Schemas
class PatientBase(BaseModel):
    full_name: str
    age: int
    gender: str
    phone: str
    email: str
    height: float
    weight: float
    bmi: Optional[float] = None
    bmi_category: Optional[str] = None
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    patient_id: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    patient_id: str
    bmi: float
    bmi_category: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @field_validator('created_at', 'updated_at')
    @classmethod
    def make_patient_times_utc(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class UserResponse(UserBase):
    id: int
    role: str
    patient_id: Optional[int] = None
    created_at: datetime
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True

    @field_validator('created_at')
    @classmethod
    def make_created_at_utc(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

# Prediction Schemas
class PredictionResponse(BaseModel):
    id: int
    scan_id: Optional[str] = None
    patient_id: Optional[int] = None
    user_id: int
    image_name: str
    image_path: Optional[str] = None
    prediction: str
    predicted_class: Optional[str] = None
    risk_level: Optional[str] = None
    confidence: float
    status: Optional[str] = None
    gradcam_image: Optional[str] = None
    report_path: Optional[str] = None
    scan_date: Optional[datetime] = None
    timestamp: datetime
    created_at: Optional[datetime] = None
    
    # Nested patient details
    patient: Optional[PatientResponse] = None
    prediction_id: Optional[int] = None # compatibility alias

    class Config:
        from_attributes = True

    @field_validator('timestamp', 'scan_date', 'created_at')
    @classmethod
    def make_timestamp_utc(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

# Dashboard Analytics Schemas
class TrendItem(BaseModel):
    date: str
    confidence: float
    prediction: str

class DashboardStats(BaseModel):
    total_predictions: int
    healthy_predictions: int
    risk_predictions: int
    reports_generated: int
    total_patients: int
    total_scans: int
    average_patient_age: float
    average_confidence: float
    most_common_prediction: str
    latest_prediction: Optional[PredictionResponse] = None
    confidence_trend: List[TrendItem]
    recent_predictions: List[PredictionResponse]

# Admin Panel User Details
class AdminUserResponse(UserResponse):
    prediction_count: int

    class Config:
        from_attributes = True
