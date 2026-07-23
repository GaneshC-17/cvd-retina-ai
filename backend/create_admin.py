import os
import sys
import re
import argparse
from email_validator import validate_email, EmailNotValidError

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
import models
from auth import get_password_hash
from schemas import validate_password_strength

def get_input(prompt: str, validator=None, secure=False) -> str:
    """Helper to prompt for user input with optional validation."""
    import getpass
    while True:
        try:
            if secure:
                val = getpass.getpass(prompt).strip()
            else:
                val = input(prompt).strip()
            
            if validator:
                val = validator(val)
            return val
        except ValueError as e:
            print(f"Error: {e}")
        except KeyboardInterrupt:
            print("\nOperation cancelled.")
            sys.exit(1)

def validate_name(name: str) -> str:
    if not name:
        raise ValueError("Name cannot be empty")
    return name

def validate_email_address(email: str) -> str:
    try:
        valid = validate_email(email)
        return valid.email
    except EmailNotValidError as e:
        raise ValueError(f"Invalid email: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description="Create an admin user for CVD Retina AI.")
    parser.add_argument("--name", help="Full name of the admin")
    parser.add_argument("--email", help="Email address of the admin")
    parser.add_argument("--password", help="Password (will prompt securely if not provided)")
    
    args = parser.parse_args()
    
    print("=== CVD Retina AI - Admin Creation Tool ===")
    
    # Initialize DB tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. Get Name
        if args.name:
            try:
                name = validate_name(args.name)
            except ValueError as e:
                print(f"CLI Argument --name is invalid: {e}")
                name = get_input("Enter Full Name: ", validate_name)
        else:
            name = get_input("Enter Full Name: ", validate_name)
            
        # 2. Get Email
        if args.email:
            try:
                email = validate_email_address(args.email)
            except ValueError as e:
                print(f"CLI Argument --email is invalid: {e}")
                email = get_input("Enter Email Address: ", validate_email_address)
        else:
            email = get_input("Enter Email Address: ", validate_email_address)
            
        # Check if email is already taken
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"Error: User with email {email} already exists!")
            sys.exit(1)
            
        # 3. Get Password
        if args.password:
            try:
                password = validate_password_strength(args.password)
            except ValueError as e:
                print(f"CLI Argument --password is invalid: {e}")
                password = get_input("Enter password: ", validate_password_strength, secure=True)
                confirm = get_input("Confirm password: ", secure=True)
                if password != confirm:
                    print("Passwords do not match!")
                    sys.exit(1)
        else:
            password = get_input("Enter password: ", validate_password_strength, secure=True)
            confirm = get_input("Confirm password: ", secure=True)
            if password != confirm:
                print("Passwords do not match!")
                sys.exit(1)
                
        # Generate username from email/name
        username = email.split('@')[0]
        
        # Create Admin user
        admin_user = models.User(
            full_name=name,
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            role="admin"
        )
        
        db.add(admin_user)
        db.commit()
        print(f"\nSuccess! Admin user {name} ({email}) created successfully.")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
