from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    username = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    patient = relationship("Patient")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    bmi = Column(Float, nullable=False)
    bmi_category = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    predictions = relationship("Prediction", back_populates="patient", cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String, unique=True, index=True, nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_name = Column(String, nullable=False)
    image_path = Column(String, nullable=True)
    prediction = Column(String, nullable=False)
    predicted_class = Column(String, nullable=True)
    risk_level = Column(String, nullable=True)
    confidence = Column(Float, nullable=False)
    status = Column(String, default="Pending", nullable=True)
    gradcam_image = Column(String, nullable=True)
    report_path = Column(String, nullable=True)
    scan_date = Column(DateTime, default=datetime.utcnow, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False) # Keep for compatibility
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)

    user = relationship("User", back_populates="predictions")
    patient = relationship("Patient", back_populates="predictions")

