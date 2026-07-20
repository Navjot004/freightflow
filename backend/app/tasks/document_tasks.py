import os
import json
import uuid
import datetime as dt
from app.core.celery_app import celery_app
from app.db.database import SessionLocal
from app.domain.freight.shipments.models import Shipment, ShipmentDocument, DocumentStatus
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

UPLOAD_DIR = "uploads"

@celery_app.task
def generate_bol_task(shipment_id: str):
    db = SessionLocal()
    try:
        shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
        if not shipment:
            return
            
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
            
        filename = f"{shipment_id}_bol_generated.pdf"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        pdf_doc = SimpleDocTemplate(file_path, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        styles = getSampleStyleSheet()
        
        if 'CenterTitle' not in styles:
            styles.add(ParagraphStyle(name='CenterTitle', parent=styles['Heading1'], alignment=1, spaceAfter=20))
        if 'SectionHeader' not in styles:
            styles.add(ParagraphStyle(name='SectionHeader', parent=styles['Heading2'], spaceBefore=15, spaceAfter=10, textColor=colors.HexColor('#1f2937')))
        
        elements = []
        
        # Header
        elements.append(Paragraph("BILL OF LADING", styles['CenterTitle']))
        elements.append(Paragraph("FreightFlow Logistics Platform", styles['Normal']))
        elements.append(Spacer(1, 0.25 * inch))
        
        # General Info Table
        elements.append(Paragraph("Shipment Details", styles['SectionHeader']))
        
        data = [
            ["Shipment ID:", str(shipment.id)[:18] + "..."],
            ["Load ID:", str(shipment.load_id)[:18] + "..."],
            ["Carrier ID:", str(shipment.carrier_id)[:18] + "..."],
            ["Driver:", shipment.driver_name or "N/A"],
            ["Truck Number:", shipment.truck_number or "N/A"],
            ["Generated At:", dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')],
        ]
        
        t = Table(data, colWidths=[2 * inch, 4 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Build the PDF
        pdf_doc.build(elements)
        
        url_path = f"/api/v1/uploads/{filename}"
        
        doc = ShipmentDocument(
            shipment_id=shipment.id,
            document_type='BOL',
            file_path=url_path,
            uploaded_by=shipment.carrier_id,
            status=DocumentStatus.VERIFIED
        )
        db.add(doc)
        shipment.bol_url = url_path
        db.commit()
    except Exception as e:
        print("Failed to generate BOL PDF asynchronously:", e)
        db.rollback()
    finally:
        db.close()

@celery_app.task
def generate_pod_pdf_task(
    shipment_id: str, 
    user_id: str, 
    receiver_name: str, 
    delivery_notes: str, 
    sig_path: str,
    sig_url: str,
    osd_reported: bool,
    osd_notes: str
):
    db = SessionLocal()
    try:
        shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
        if not shipment:
            return
            
        pod_filename = f"{shipment_id}_pod_{uuid.uuid4().hex[:8]}.pdf"
        pod_path = os.path.join(UPLOAD_DIR, pod_filename)
        
        pdf_doc = SimpleDocTemplate(pod_path, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        styles = getSampleStyleSheet()
        
        # Add custom styles
        styles.add(ParagraphStyle(name='CenterTitle', parent=styles['Heading1'], alignment=1, spaceAfter=20))
        styles.add(ParagraphStyle(name='SectionHeader', parent=styles['Heading2'], spaceBefore=15, spaceAfter=10, textColor=colors.HexColor('#1f2937')))
        
        elements = []
        
        # Header
        elements.append(Paragraph("PROOF OF DELIVERY", styles['CenterTitle']))
        elements.append(Paragraph("FreightFlow Logistics Platform", styles['Normal']))
        elements.append(Spacer(1, 0.25 * inch))
        
        # General Info Table
        elements.append(Paragraph("Shipment Details", styles['SectionHeader']))
        
        data = [
            ["Shipment ID:", str(shipment.id)[:18] + "..."],
            ["Load ID:", str(shipment.load_id)[:18] + "..."],
            ["Carrier ID:", str(shipment.carrier_id)[:18] + "..."],
            ["Submitted At:", dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')],
        ]
        
        t = Table(data, colWidths=[2 * inch, 4 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.2 * inch))
        
        # Delivery Info Table
        elements.append(Paragraph("Delivery Information", styles['SectionHeader']))
        delivery_data = [
            ["Receiver Name:", receiver_name],
            ["Delivery Notes:", delivery_notes or "N/A"],
            ["OS&D Reported:", "YES" if osd_reported else "NO"],
        ]
        if osd_reported:
            delivery_data.append(["OS&D Notes:", osd_notes or "N/A"])
            
        t2 = Table(delivery_data, colWidths=[2 * inch, 4 * inch])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        elements.append(t2)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Signature
        elements.append(Paragraph("Receiver Signature", styles['SectionHeader']))
        
        try:
            from PIL import Image
            img = Image.open(sig_path).convert("RGBA")
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img)
            temp_sig = sig_path + "_white.jpg"
            bg.save(temp_sig, "JPEG")
            elements.append(RLImage(temp_sig, width=3*inch, height=1.5*inch, kind='proportional'))
        except Exception as img_err:
            print("Image processing failed:", img_err)
            try:
                elements.append(RLImage(sig_path, width=3*inch, height=1.5*inch, kind='proportional'))
            except:
                pass
            
        # Build the PDF
        pdf_doc.build(elements)
        
        pod_url = f"/api/v1/uploads/{pod_filename}"
        
        # We find the pending POD document and update its url if it exists, or create new
        doc = db.query(ShipmentDocument).filter(
            ShipmentDocument.shipment_id == shipment.id,
            ShipmentDocument.document_type == 'POD',
            ShipmentDocument.status == DocumentStatus.PENDING_REVIEW
        ).order_by(ShipmentDocument.created_at.desc()).first()
        
        if doc:
            doc.file_path = pod_url
        else:
            doc = ShipmentDocument(
                shipment_id=shipment.id,
                document_type='POD',
                file_path=pod_url,
                uploaded_by=user_id,
                status=DocumentStatus.PENDING_REVIEW
            )
            db.add(doc)
            
        shipment.pod_url = pod_url
        db.commit()
    except Exception as e:
        print("Failed to generate POD PDF asynchronously:", e)
        db.rollback()
    finally:
        db.close()
