import os
from app.db.database import SessionLocal
import app.domain.freight.loads.models
import app.domain.marketplace.bids.models
import app.domain.marketplace.tenders.models
import app.domain.freight.shipments.models
import app.domain.notifications.models
import app.domain.identity.admin.models
import app.domain.freight.disputes.models
import app.domain.marketplace.ratings.models
import app.domain.organizations.partnerships.models
import app.domain.fleet.drivers.models
import app.domain.finance.models
import app.domain.compliance.models
import app.domain.integrations.models
import app.core.models
from app.domain.freight.shipments.models import Shipment
from app.tasks.document_tasks import generate_pod_pdf_task

def fix_all_pods():
    db = SessionLocal()
    try:
        shipments = db.query(Shipment).filter(Shipment.receiver_signature_url != None).all()
        print(f"Found {len(shipments)} shipments with signature URLs.")
        fixed = 0
        for s in shipments:
            if not s.pod_url or not s.pod_url.endswith('.pdf'):
                print(f"Generating official POD PDF for shipment {s.id}...")
                try:
                    generate_pod_pdf_task(
                        shipment_id=s.id,
                        user_id=s.driver_id or s.dispatcher_id or "system",
                        receiver_name=s.receiver_name or "Authorized Receiver",
                        delivery_notes=s.delivery_notes or "",
                        sig_path=s.receiver_signature_url,
                        sig_url=s.receiver_signature_url,
                        osd_reported=s.osd_reported or False,
                        osd_notes=s.osd_notes or ""
                    )
                    fixed += 1
                except Exception as e:
                    print(f"Failed to fix POD for {s.id}: {e}")
        print(f"Successfully generated official POD PDFs for {fixed} shipments.")
    finally:
        db.close()

if __name__ == "__main__":
    fix_all_pods()
