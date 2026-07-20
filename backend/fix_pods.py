import os
import uuid
import datetime as dt
from app.db.database import SessionLocal
from app.domain.freight.shipments.models import Shipment, ShipmentDocument, DocumentStatus
from app.domain.freight.loads.models import Load
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

UPLOAD_DIR = "uploads"

def fix_pods():
    db = SessionLocal()
    try:
        # Find shipments where pod_url is an image
        shipments = db.query(Shipment).filter(Shipment.pod_url != None).all()
        fixed = 0
        for shipment in shipments:
            if True:
                print(f"Fixing POD for shipment {shipment.id}...")
                
                # The sig_path is derived from receiver_signature_url
                if not shipment.receiver_signature_url:
                    continue
                sig_filename = shipment.receiver_signature_url.split('/')[-1]
                sig_path = os.path.join(UPLOAD_DIR, sig_filename)
                
                if not os.path.exists(sig_path):
                    print(f"Signature file {sig_path} not found, skipping.")
                    continue
                
                pod_filename = f"{shipment.id}_pod_{uuid.uuid4().hex[:8]}.pdf"
                pod_path = os.path.join(UPLOAD_DIR, pod_filename)
                
                try:
                    c = canvas.Canvas(pod_path, pagesize=letter)
                    c.drawString(100, 750, "PROOF OF DELIVERY - FreightFlow")
                    c.drawString(100, 730, f"Shipment ID: {shipment.id}")
                    c.drawString(100, 710, f"Load ID: {shipment.load_id}")
                    c.drawString(100, 690, f"Receiver Name: {shipment.receiver_name or 'Unknown'}")
                    
                    y_pos = 670
                    if shipment.delivery_notes:
                        c.drawString(100, y_pos, f"Delivery Notes: {shipment.delivery_notes}")
                        y_pos -= 20
                        
                    if shipment.osd_reported:
                        c.drawString(100, y_pos, f"OS&D Reported: YES")
                        y_pos -= 20
                        if shipment.osd_notes:
                            c.drawString(100, y_pos, f"OS&D Notes: {shipment.osd_notes}")
                            y_pos -= 20
                            
                    c.drawString(100, y_pos, f"Submitted At: {dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
                    y_pos -= 40
                    
                    c.drawString(100, y_pos, "Receiver Signature:")
                    y_pos -= 120
                    
                    try:
                        from PIL import Image
                        img = Image.open(sig_path).convert("RGBA")
                        bg = Image.new("RGB", img.size, (255, 255, 255))
                        bg.paste(img, mask=img)
                        temp_sig = sig_path + "_white.jpg"
                        bg.save(temp_sig, "JPEG")
                        c.drawImage(temp_sig, 100, y_pos, width=200, height=100)
                    except Exception as img_err:
                        print("Image processing failed:", img_err)
                        c.drawImage(sig_path, 100, y_pos, width=200, height=100)
                    
                    c.save()
                    pod_url = f"/api/v1/uploads/{pod_filename}"
                    
                    # Update shipment
                    shipment.pod_url = pod_url
                    
                    # Also update or create document
                    doc = db.query(ShipmentDocument).filter(
                        ShipmentDocument.shipment_id == shipment.id,
                        ShipmentDocument.document_type == 'POD'
                    ).first()
                    
                    if doc:
                        doc.file_path = pod_url
                    else:
                        doc = ShipmentDocument(
                            shipment_id=shipment.id,
                            document_type='POD',
                            file_path=pod_url,
                            uploaded_by=shipment.carrier_id,
                            status=DocumentStatus.PENDING_REVIEW
                        )
                        db.add(doc)
                    
                    db.commit()
                    fixed += 1
                    print(f"Successfully fixed POD for {shipment.id}")
                except Exception as e:
                    print(f"Failed to generate POD for {shipment.id}: {e}")
                    db.rollback()
        
        print(f"Fixed {fixed} PODs.")
    finally:
        db.close()

if __name__ == "__main__":
    fix_pods()
