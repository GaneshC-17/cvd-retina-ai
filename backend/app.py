import os
import uuid
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
import models
import schemas
from database import engine, Base, get_db
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin,
    create_reset_token,
    verify_reset_token,
)
from predict import predict_image, get_or_create_model
from explainability import save_gradcam_result
from report_generator import generate_report

# Initialize FastAPI App
app = FastAPI(
    title="Cardiovascular Disease Prediction API",
    description="Backend API for predicting cardiovascular disease risk from retinal fundus images using MobileNetV2.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "originals"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "gradcam"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "reports"), exist_ok=True)

# Mount uploads static directory
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    print("Database initialization on startup...")
    Base.metadata.create_all(bind=engine)
    
    # Run SQLite migration to add new columns if they do not exist
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(predictions)"))
            columns = [row[1] for row in result.fetchall()]
            
            altered = False
            if "image_path" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN image_path VARCHAR"))
                print("Added column image_path to predictions table.")
                altered = True
            if "predicted_class" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN predicted_class VARCHAR"))
                print("Added column predicted_class to predictions table.")
                altered = True
            if "gradcam_image" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN gradcam_image VARCHAR"))
                print("Added column gradcam_image to predictions table.")
                altered = True
            if "report_path" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN report_path VARCHAR"))
                print("Added column report_path to predictions table.")
                altered = True
            if "scan_id" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN scan_id VARCHAR"))
                print("Added column scan_id to predictions table.")
                altered = True
            if "patient_id" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN patient_id INTEGER"))
                print("Added column patient_id to predictions table.")
                altered = True
            if "risk_level" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN risk_level VARCHAR"))
                print("Added column risk_level to predictions table.")
                altered = True
            if "status" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN status VARCHAR"))
                print("Added column status to predictions table.")
                altered = True
            if "scan_date" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN scan_date DATETIME"))
                print("Added column scan_date to predictions table.")
                altered = True
            if "created_at" not in columns:
                conn.execute(text("ALTER TABLE predictions ADD COLUMN created_at DATETIME"))
                print("Added column created_at to predictions table.")
                altered = True
            
            # Run migration for users table
            result_users = conn.execute(text("PRAGMA table_info(users)"))
            columns_users = [row[1] for row in result_users.fetchall()]
            if "patient_id" not in columns_users:
                conn.execute(text("ALTER TABLE users ADD COLUMN patient_id INTEGER"))
                print("Added column patient_id to users table.")
                altered = True
            
            if altered:
                conn.commit()
    except Exception as e:
        print(f"Error during schema migration: {e}")
        
    # Programmatically migrate predictions that have patient_id as NULL to default patient
    try:
        from database import SessionLocal
        with SessionLocal() as session:
            # Check if there are any predictions with patient_id as NULL
            null_preds_count = session.query(models.Prediction).filter(
                models.Prediction.patient_id == None
            ).count()
            
            if null_preds_count > 0:
                print(f"Found {null_preds_count} predictions with NULL patient_id. Initiating migration...")
                
                # Check if a default patient already exists
                default_pat = session.query(models.Patient).filter(
                    models.Patient.patient_id == "PAT-2026-0000"
                ).first()
                
                if not default_pat:
                    print("Creating default migration patient PAT-2026-0000...")
                    default_pat = models.Patient(
                        patient_id="PAT-2026-0000",
                        full_name="Default Screening Patient",
                        age=0,
                        gender="Other",
                        phone="000-0000",
                        email="default@example.com",
                        height=100.0,
                        weight=50.0,
                        bmi=50.0,
                        bmi_category="Obese",
                        notes="System default patient for migrating historical scan logs."
                    )
                    session.add(default_pat)
                    session.commit()
                    session.refresh(default_pat)
                
                # Update all predictions with null patient_id
                session.query(models.Prediction).filter(
                    models.Prediction.patient_id == None
                ).update({models.Prediction.patient_id: default_pat.id})
                session.commit()
                print("Successfully migrated all predictions to default patient.")
    except Exception as migration_err:
        print(f"Error during predictions patient migration: {migration_err}")

# ----------------- Public Routes -----------------
@app.get("/health")
def health_check():
    return {"status": "running"}

# ----------------- Auth Routes -----------------
@app.post("/auth/register", response_model=dict)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # First registered user is Admin promotion logic
    total_users = db.query(models.User).count()
    role = "admin" if total_users == 0 else user_data.role
    
    new_patient = None
    if role == "patient":
        if user_data.age is None or not user_data.gender or not user_data.phone or user_data.height is None or user_data.weight is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All patient demographics fields (age, gender, phone, height, weight) are required for patient registration."
            )
        
        # Calculate BMI
        height_m = user_data.height / 100.0
        bmi = round(user_data.weight / (height_m ** 2), 2)
        if bmi < 18.5:
            bmi_category = "Underweight"
        elif bmi < 25.0:
            bmi_category = "Normal"
        elif bmi < 30.0:
            bmi_category = "Overweight"
        else:
            bmi_category = "Obese"
            
        pat_code = generate_next_patient_id(db)
        new_patient = models.Patient(
            patient_id=pat_code,
            full_name=user_data.full_name,
            age=user_data.age,
            gender=user_data.gender,
            phone=user_data.phone,
            email=user_data.email,
            height=user_data.height,
            weight=user_data.weight,
            bmi=bmi,
            bmi_category=bmi_category,
            notes=user_data.notes
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
    # Create new user
    new_user = models.User(
        full_name=user_data.full_name,
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=role,
        patient_id=new_patient.id if new_patient else None
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/auth/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/auth/forgot-password", response_model=dict)
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        return {"message": "Password reset instructions have been sent to your email if it exists."}
    
    reset_token = create_reset_token(user.email)
    print(f"\n========================================\n[PASSWORD RESET TOKEN] Generated for: {user.email}\nToken: {reset_token}\n========================================\n")
    return {"message": "Password reset instructions have been sent to your email."}

@app.post("/auth/reset-password", response_model=dict)
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    email = verify_reset_token(req.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token"
        )
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password has been reset successfully. You can now login with your new password."}

# ----------------- Profile Update Routes -----------------
@app.put("/auth/profile", response_model=schemas.UserResponse)
def update_profile(
    update_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.username is not None:
        current_user.username = update_data.username
    if update_data.email is not None:
        if update_data.email != current_user.email:
            existing = db.query(models.User).filter(models.User.email == update_data.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already taken")
            current_user.email = update_data.email
            
    db.commit()
    db.refresh(current_user)
    return current_user

@app.put("/auth/change-password", response_model=dict)
def change_password(
    pwd_data: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(pwd_data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    current_user.password_hash = get_password_hash(pwd_data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

# ----------------- Sequence Generation Helpers -----------------
def generate_next_patient_id(db: Session) -> str:
    current_year = datetime.utcnow().year
    prefix = f"PAT-{current_year}-"
    latest_patient = db.query(models.Patient).filter(
        models.Patient.patient_id.like(f"{prefix}%")
    ).order_by(models.Patient.patient_id.desc()).first()
    
    if latest_patient:
        latest_id_str = latest_patient.patient_id
        try:
            seq_num_str = latest_id_str.split("-")[-1]
            seq_num = int(seq_num_str)
            next_seq = seq_num + 1
        except Exception:
            next_seq = 1
    else:
        next_seq = 1
        
    return f"{prefix}{next_seq:04d}"

def generate_next_scan_id(db: Session) -> str:
    current_year = datetime.utcnow().year
    prefix = f"SCAN-{current_year}-"
    latest_scan = db.query(models.Prediction).filter(
        models.Prediction.scan_id.like(f"{prefix}%")
    ).order_by(models.Prediction.scan_id.desc()).first()
    
    if latest_scan and latest_scan.scan_id:
        latest_id_str = latest_scan.scan_id
        try:
            seq_num_str = latest_id_str.split("-")[-1]
            seq_num = int(seq_num_str)
            next_seq = seq_num + 1
        except Exception:
            next_seq = 1
    else:
        next_seq = 1
        
    return f"{prefix}{next_seq:04d}"

# ----------------- Patient Routes -----------------
@app.get("/patients/search", response_model=List[schemas.PatientResponse])
def search_patients(
    query: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patients = db.query(models.Patient).filter(
        (models.Patient.patient_id.ilike(f"%{query}%")) |
        (models.Patient.full_name.ilike(f"%{query}%")) |
        (models.Patient.phone.ilike(f"%{query}%"))
    ).all()
    return patients

@app.post("/patients", response_model=schemas.PatientResponse)
def create_patient(
    patient_data: schemas.PatientCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check for duplicate patient record by email/phone or patient_id to prevent duplicates
    patient_id_val = getattr(patient_data, 'patient_id', None)
    filters = []
    if patient_id_val and str(patient_id_val).strip():
        filters.append(models.Patient.patient_id == str(patient_id_val).strip())
    if patient_data.email and str(patient_data.email).strip():
        filters.append(models.Patient.email == str(patient_data.email).strip())
    if patient_data.phone and str(patient_data.phone).strip():
        filters.append(models.Patient.phone == str(patient_data.phone).strip())
        
    existing = None
    if filters:
        from sqlalchemy import or_
        existing = db.query(models.Patient).filter(or_(*filters)).first()
        
    if existing:
        print(f"Patient duplicate detected. Reusing and updating existing patient: {existing.patient_id}")
        existing.full_name = patient_data.full_name
        existing.age = patient_data.age
        existing.gender = patient_data.gender
        existing.phone = patient_data.phone
        existing.email = patient_data.email
        existing.height = patient_data.height
        existing.weight = patient_data.weight
        existing.notes = patient_data.notes
        
        # Calculate/Recalculate BMI
        if patient_data.bmi is not None:
            bmi = patient_data.bmi
        else:
            height_m = patient_data.height / 100.0
            bmi = round(patient_data.weight / (height_m ** 2), 2)
            
        if patient_data.bmi_category is not None:
            bmi_category = patient_data.bmi_category
        else:
            if bmi < 18.5:
                bmi_category = "Underweight"
            elif bmi < 25.0:
                bmi_category = "Normal"
            elif bmi < 30.0:
                bmi_category = "Overweight"
            else:
                bmi_category = "Obese"
                
        existing.bmi = bmi
        existing.bmi_category = bmi_category
            
        try:
            db.commit()
            db.refresh(existing)
            print("Patient Updated")
            print("Database Commit Successful")
            return existing
        except Exception as e:
            db.rollback()
            print(f"Database Commit Failed: {e}")
            raise HTTPException(status_code=500, detail=f"Database error on patient update: {str(e)}")
        
    patient_id = generate_next_patient_id(db)
    
    # Calculate BMI
    if patient_data.bmi is not None:
        bmi = patient_data.bmi
    else:
        height_m = patient_data.height / 100.0
        bmi = round(patient_data.weight / (height_m ** 2), 2)
    
    # BMI Category
    if patient_data.bmi_category is not None:
        bmi_category = patient_data.bmi_category
    else:
        if bmi < 18.5:
            bmi_category = "Underweight"
        elif bmi < 25.0:
            bmi_category = "Normal"
        elif bmi < 30.0:
            bmi_category = "Overweight"
        else:
            bmi_category = "Obese"
        
    new_patient = models.Patient(
        patient_id=patient_id,
        full_name=patient_data.full_name,
        age=patient_data.age,
        gender=patient_data.gender,
        phone=patient_data.phone,
        email=patient_data.email,
        height=patient_data.height,
        weight=patient_data.weight,
        bmi=bmi,
        bmi_category=bmi_category,
        notes=patient_data.notes
    )
    try:
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        print("Patient Created")
        print("Database Commit Successful")
        return new_patient
    except Exception as e:
        db.rollback()
        print(f"Database Commit Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database error on patient creation: {str(e)}")

@app.get("/patients/{patient_id}")
def get_patient_profile(
    patient_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if patient_id.isdigit():
        patient = db.query(models.Patient).filter(models.Patient.id == int(patient_id)).first()
    else:
        patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
        
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    is_admin = current_user.role == "admin"
    scans_q = db.query(models.Prediction).filter(models.Prediction.patient_id == patient.id)
    if not is_admin:
        scans_q = scans_q.filter(models.Prediction.user_id == current_user.id)
        
    scans = scans_q.order_by(models.Prediction.timestamp.asc()).all()
    
    # Build timeline: Date -> Prediction -> Risk Level
    timeline = []
    for s in scans:
        timeline.append({
            "date": s.scan_date.strftime("%Y-%m-%d") if s.scan_date else s.timestamp.strftime("%Y-%m-%d"),
            "prediction": s.prediction,
            "risk_level": s.risk_level or "Healthy"
        })
        
    # Build confidence trend data
    trend_data = []
    for s in scans:
        trend_data.append({
            "date": s.scan_date.strftime("%Y-%m-%d") if s.scan_date else s.timestamp.strftime("%Y-%m-%d"),
            "confidence": s.confidence,
            "prediction": s.prediction
        })
        
    # Reports list
    reports = []
    for s in scans:
        if s.report_path:
            reports.append({
                "id": s.id,
                "report_id": s.report_path.split("/")[-1].replace(".pdf", ""),
                "scan_id": s.scan_id or f"SCAN-{s.id}",
                "date": (s.scan_date or s.timestamp).strftime("%Y-%m-%d"),
                "prediction": s.prediction,
                "risk_level": s.risk_level or "Healthy"
            })
            
    # Serialize scans list
    scans_serialized = []
    for s in scans:
        s.prediction_id = s.id
        scans_serialized.append(s)
        
    return {
        "patient": patient,
        "scans": scans_serialized,
        "timeline": timeline,
        "trend": trend_data,
        "reports": reports
    }

@app.get("/patients/{patient_id}/export")
def export_patient_history(
    patient_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if patient_id.isdigit():
        patient = db.query(models.Patient).filter(models.Patient.id == int(patient_id)).first()
    else:
        patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
        
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    is_admin = current_user.role == "admin"
    scans_q = db.query(models.Prediction).filter(models.Prediction.patient_id == patient.id)
    if not is_admin:
        scans_q = scans_q.filter(models.Prediction.user_id == current_user.id)
        
    scans = scans_q.order_by(models.Prediction.timestamp.asc()).all()
    
    from report_generator import generate_patient_history_report
    
    filename = f"HISTORY-{patient.patient_id}.pdf"
    pdf_path = os.path.join(UPLOAD_DIR, "reports", filename)
    
    generate_patient_history_report(
        pdf_path=pdf_path,
        patient=patient,
        scans=scans,
        uploaded_by_user=current_user.full_name
    )
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={filename}"
        }
    )

# ----------------- Scan Detail & History Routes -----------------
@app.get("/scan/{scan_id}", response_model=schemas.PredictionResponse)
def get_scan(
    scan_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if scan_id.isdigit():
        pred = db.query(models.Prediction).filter(models.Prediction.id == int(scan_id)).first()
    else:
        pred = db.query(models.Prediction).filter(models.Prediction.scan_id == scan_id).first()
        
    if not pred:
        raise HTTPException(status_code=404, detail="Scan record not found")
        
    if current_user.role != "admin" and pred.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this scan")
        
    pred.prediction_id = pred.id
    return pred

@app.post("/predict", response_model=schemas.PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    # Demographics for new patient if not selected
    full_name: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    gender: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    height: Optional[float] = Form(None),
    weight: Optional[float] = Form(None),
    notes: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Step 3: FastAPI Endpoint Verification
    print("\n========================================")
    print("PATIENT REQUEST RECEIVED")
    print(f"Timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Authenticated User: {current_user.email} (Role: {current_user.role})")
    print(f"Payload - patient_id: {patient_id}, full_name: {full_name}, age: {age}, gender: {gender}, phone: {phone}, email: {email}, height: {height}, weight: {weight}")
    print("========================================\n")

    # File type validation
    allowed_extensions = {".jpg", ".jpeg", ".png"}
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload JPG, JPEG, or PNG."
        )

    # Read and check size
    contents = await file.read()
    max_size = 10 * 1024 * 1024  # 10 MB
    if len(contents) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10 MB limit."
        )

    # Resolve or create Patient
    if patient_id is not None and str(patient_id).strip() != "" and str(patient_id).strip() != "null" and str(patient_id).strip() != "undefined":
        patient_id_str = str(patient_id).strip()
        if patient_id_str.isdigit():
            patient = db.query(models.Patient).filter(models.Patient.id == int(patient_id_str)).first()
        else:
            patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id_str).first()
            
        if not patient:
            raise HTTPException(status_code=404, detail="Selected patient not found")
    else:
        # Validate that all required demographics fields are present
        if not full_name or age is None or not gender or not phone or not email or height is None or weight is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All patient fields are required to register a new patient."
            )
            
        # Prevent duplicates
        filters = []
        if email and email.strip():
            filters.append(models.Patient.email == email.strip())
        if phone and phone.strip():
            filters.append(models.Patient.phone == phone.strip())
            
        existing = None
        if filters:
            from sqlalchemy import or_
            existing = db.query(models.Patient).filter(or_(*filters)).first()
        
        if existing:
            patient = existing
            patient.full_name = full_name
            patient.age = age
            patient.gender = gender
            patient.phone = phone
            patient.email = email
            patient.height = height
            patient.weight = weight
            patient.notes = notes
            
            # Recalculate BMI
            height_m = height / 100.0
            bmi = weight / (height_m ** 2)
            patient.bmi = round(bmi, 2)
            if bmi < 18.5:
                patient.bmi_category = "Underweight"
            elif bmi < 25.0:
                patient.bmi_category = "Normal"
            elif bmi < 30.0:
                patient.bmi_category = "Overweight"
            else:
                patient.bmi_category = "Obese"
            try:
                db.commit()
                db.refresh(patient)
                print("Patient Updated")
                print("Database Commit Successful")
            except Exception as e:
                db.rollback()
                print(f"Database Commit Failed: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to update patient: {str(e)}")
        else:
            pat_code = generate_next_patient_id(db)
            
            # Calculate BMI
            height_m = height / 100.0
            bmi = weight / (height_m ** 2)
            bmi = round(bmi, 2)
            
            if bmi < 18.5:
                bmi_category = "Underweight"
            elif bmi < 25.0:
                bmi_category = "Normal"
            elif bmi < 30.0:
                bmi_category = "Overweight"
            else:
                bmi_category = "Obese"
                
            patient = models.Patient(
                patient_id=pat_code,
                full_name=full_name,
                age=age,
                gender=gender,
                phone=phone,
                email=email,
                height=height,
                weight=weight,
                bmi=bmi,
                bmi_category=bmi_category,
                notes=notes
            )
            try:
                db.add(patient)
                db.commit()
                db.refresh(patient)
                print("Patient Created")
                print("Database Commit Successful")
            except Exception as e:
                db.rollback()
                print(f"Database Commit Failed: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to create patient: {str(e)}")

    # Generate unique Scan ID
    scan_id = generate_next_scan_id(db)
    
    # Save to SQLite Database (initial insert as "Pending" or "Processing" to track status)
    prediction_record = models.Prediction(
        scan_id=scan_id,
        patient_id=patient.id,
        user_id=current_user.id,
        image_name=filename,
        prediction="Pending",
        predicted_class="Pending",
        risk_level="Healthy",
        confidence=0.0,
        status="Processing",
        scan_date=datetime.utcnow()
    )
    try:
        db.add(prediction_record)
        db.commit()
        db.refresh(prediction_record)
        print("Prediction Linked")
        print("Database Commit Successful")
    except Exception as e:
        db.rollback()
        print(f"Database Commit Failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error on prediction initialization: {str(e)}"
        )

    # Save file to a temporary location first
    temp_filename = f"temp_{uuid.uuid4()}{ext}"
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)
    with open(temp_path, "wb") as f:
        f.write(contents)

    # Run ML Prediction
    try:
        result = predict_image(contents)
    except Exception as e:
        # Mark scan status as failed
        prediction_record.status = "Failed"
        db.commit()
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference engine failure: {str(e)}"
        )

    prediction_id = prediction_record.id
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    # Target path for original image
    new_orig_filename = f"image_{prediction_id}_{timestamp}{ext}"
    orig_relative_path = f"uploads/originals/{new_orig_filename}"
    new_orig_path = os.path.join(UPLOAD_DIR, "originals", new_orig_filename)

    try:
        shutil.move(temp_path, new_orig_path)

        # Generate Grad-CAM heatmap
        model = get_or_create_model()
        pred_index = 0 if result["prediction"] == "Healthy" else 1
        gradcam_relative_path = save_gradcam_result(
            original_img_path=new_orig_path,
            model=model,
            prediction_id=prediction_id,
            timestamp=timestamp,
            pred_index=pred_index
        )

        # Risk Classification mapping
        conf_val = result["confidence"]
        if result["prediction"] == "Healthy":
            risk_level = "Healthy"
        elif conf_val < 70.0:
            risk_level = "Low Risk"
        elif conf_val < 85.0:
            risk_level = "Moderate Risk"
        else:
            risk_level = "High Risk"

        # Generate PDF report matching report format REPORT-YYYY-NNNN.pdf
        suffix = scan_id.split("SCAN-")[-1]
        report_filename = f"REPORT-{suffix}.pdf"
        report_relative_path = f"uploads/reports/{report_filename}"
        report_absolute_path = os.path.join(UPLOAD_DIR, "reports", report_filename)

        prediction_date_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        generate_report(
            pdf_path=report_absolute_path,
            original_image_path=orig_relative_path,
            gradcam_image_path=gradcam_relative_path,
            patient=patient,
            scan_id=scan_id,
            predicted_class=result["prediction"],
            risk_level=risk_level,
            confidence=conf_val,
            uploaded_by_user=current_user.full_name,
            scan_date_str=prediction_date_str
        )

        # Update prediction record
        prediction_record.status = "Completed"
        prediction_record.prediction = result["prediction"]
        prediction_record.predicted_class = result["prediction"]
        prediction_record.confidence = conf_val
        prediction_record.risk_level = risk_level
        prediction_record.image_path = orig_relative_path
        prediction_record.gradcam_image = gradcam_relative_path
        prediction_record.report_path = report_relative_path
        try:
            db.commit()
            db.refresh(prediction_record)
            print("Report Generated")
            print("Database Commit Successful")
        except Exception as commit_err:
            db.rollback()
            print(f"Database Commit Failed: {commit_err}")
            raise commit_err
    except Exception as e:
        prediction_record.status = "Failed"
        try:
            db.commit()
            print("Database Commit Successful")
        except Exception as commit_err:
            db.rollback()
            print(f"Database Commit Failed: {commit_err}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(new_orig_path):
            os.remove(new_orig_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Post-processing pipeline failure: {str(e)}"
        )

    prediction_record.prediction_id = prediction_record.id
    return prediction_record

@app.get("/report/{prediction_id}")
def get_report(prediction_id: str, db: Session = Depends(get_db)):
    if prediction_id.isdigit():
        pred = db.query(models.Prediction).filter(models.Prediction.id == int(prediction_id)).first()
    else:
        pred = db.query(models.Prediction).filter(models.Prediction.scan_id == prediction_id).first()
        
    if not pred or not pred.report_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    abs_report_path = os.path.join(backend_dir, pred.report_path)
    if not os.path.exists(abs_report_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF report file not found on disk"
        )
        
    return FileResponse(
        abs_report_path,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={os.path.basename(abs_report_path)}"
        }
    )

@app.get("/history", response_model=List[schemas.PredictionResponse])
def get_history(
    scan_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    patient_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    risk_level: Optional[str] = None,
    prediction: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_admin = current_user.role == "admin"
    query = db.query(models.Prediction).join(models.Patient)
    
    if not is_admin:
        query = query.filter(models.Prediction.user_id == current_user.id)
        
    if scan_id:
        query = query.filter(models.Prediction.scan_id.ilike(f"%{scan_id}%"))
    if patient_id:
        query = query.filter(models.Patient.patient_id.ilike(f"%{patient_id}%"))
    if patient_name:
        query = query.filter(models.Patient.full_name.ilike(f"%{patient_name}%"))
    if risk_level:
        query = query.filter(models.Prediction.risk_level == risk_level)
    if prediction:
        query = query.filter(models.Prediction.prediction == prediction)
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(models.Prediction.timestamp >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            query = query.filter(models.Prediction.timestamp <= end_dt)
        except ValueError:
            pass
            
    predictions = query.order_by(models.Prediction.timestamp.desc()).all()
    for p in predictions:
        p.prediction_id = p.id
    return predictions

@app.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_admin = current_user.role == "admin"
    
    query = db.query(models.Prediction)
    patients_query = db.query(models.Patient)
    
    if not is_admin:
        query = query.filter(models.Prediction.user_id == current_user.id)
        patients_query = patients_query.join(models.Prediction).filter(models.Prediction.user_id == current_user.id).distinct()
        
    predictions = query.order_by(models.Prediction.timestamp.desc()).all()
    patients = patients_query.all()
    
    total = len(predictions)
    healthy = sum(1 for p in predictions if p.prediction == "Healthy")
    risk = sum(1 for p in predictions if p.prediction == "Cardiovascular Disease Risk")
    avg_conf = sum(p.confidence for p in predictions) / total if total > 0 else 0.0
    
    # Reports count
    reports_count = sum(1 for p in predictions if p.report_path is not None)
    
    # Total distinct patients
    total_patients = len(patients)
    
    # Average patient age
    avg_age = sum(p.age for p in patients) / total_patients if total_patients > 0 else 0.0
    
    # Most common prediction
    from collections import Counter
    if predictions:
        counts = Counter([p.prediction for p in predictions])
        most_common_pred = counts.most_common(1)[0][0]
    else:
        most_common_pred = "Healthy"
        
    latest = predictions[0] if total > 0 else None
    
    # Calculate trend: sorted chronologically
    trend_data = []
    chronological_predictions = sorted(predictions, key=lambda x: x.timestamp)[-10:]
    for p in chronological_predictions:
        trend_data.append(
            schemas.TrendItem(
                date=p.timestamp.isoformat() + "Z",
                confidence=p.confidence,
                prediction=p.prediction
            )
        )
        
    recent = predictions[:10]  # Take 10 latest for recent list
    
    for p in recent:
        p.prediction_id = p.id
    if latest:
        latest.prediction_id = latest.id
    
    return schemas.DashboardStats(
        total_predictions=total,
        healthy_predictions=healthy,
        risk_predictions=risk,
        reports_generated=reports_count,
        total_patients=total_patients,
        total_scans=total,
        average_patient_age=round(avg_age, 1),
        average_confidence=round(avg_conf, 1),
        most_common_prediction=most_common_pred,
        latest_prediction=latest,
        confidence_trend=trend_data,
        recent_predictions=recent
    )

# ----------------- Debug Routes -----------------
@app.get("/debug/database")
def debug_database(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        patient_count = db.query(models.Patient).count()
        prediction_count = db.query(models.Prediction).count()
        
        latest_patient = db.query(models.Patient).order_by(models.Patient.created_at.desc()).first()
        latest_prediction = db.query(models.Prediction).order_by(models.Prediction.created_at.desc()).first()
        
        db_status = "Connected"
    except Exception as e:
        tables = []
        patient_count = 0
        prediction_count = 0
        latest_patient = None
        latest_prediction = None
        db_status = f"Error: {str(e)}"
        
    return {
        "database_status": db_status,
        "table_names": tables,
        "patient_count": patient_count,
        "prediction_count": prediction_count,
        "latest_patient": latest_patient,
        "latest_prediction": latest_prediction
    }

@app.get("/debug/patients")
def debug_patients(db: Session = Depends(get_db)):
    try:
        patients = db.query(models.Patient).all()
    except Exception as e:
        patients = []
    return patients

@app.get("/debug/predictions")
def debug_predictions(db: Session = Depends(get_db)):
    try:
        predictions = db.query(models.Prediction).all()
        for p in predictions:
            p.prediction_id = p.id
    except Exception as e:
        predictions = []
    return predictions

# ----------------- Admin Routes -----------------
@app.get("/admin/users", response_model=List[schemas.AdminUserResponse])
def admin_get_users(
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(models.User).all()
    result = []
    for u in users:
        pred_count = db.query(models.Prediction).filter(models.Prediction.user_id == u.id).count()
        result.append(
            schemas.AdminUserResponse(
                id=u.id,
                full_name=u.full_name,
                username=u.username,
                email=u.email,
                role=u.role,
                created_at=u.created_at,
                prediction_count=pred_count
            )
        )
    return result

@app.delete("/admin/users/{user_id}", response_model=dict)
def admin_delete_user(
    user_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete their own account"
        )
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    db.delete(user)
    db.commit()
    return {"message": "User and associated predictions deleted successfully"}

@app.get("/admin/predictions", response_model=List[schemas.PredictionResponse])
def admin_get_predictions(
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    predictions = db.query(models.Prediction).order_by(models.Prediction.timestamp.desc()).all()
    for p in predictions:
        p.prediction_id = p.id
    return predictions

@app.delete("/admin/predictions/{pred_id}", response_model=dict)
def admin_delete_prediction(
    pred_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    pred = db.query(models.Prediction).filter(models.Prediction.id == pred_id).first()
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
        
    db.delete(pred)
    db.commit()
    return {"message": "Prediction record deleted successfully"}
