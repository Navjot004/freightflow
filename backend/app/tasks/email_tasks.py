from app.core.celery_app import celery_app

@celery_app.task
def send_invite_email(email: str, role_name: str, company_id: str):
    invite_token = "mock-invite-token-12345"
    print(f"--- [CELERY] MOCK EMAIL ---")
    print(f"To: {email}")
    print(f"Subject: You have been invited to FreightFlow")
    print(f"Link: http://localhost:5173/signup?token={invite_token}&company_id={company_id}&role={role_name}")
    print(f"---------------------------")
    return {"status": "success", "email": email}
