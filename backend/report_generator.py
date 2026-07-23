import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def generate_report(
    pdf_path,
    original_image_path,
    gradcam_image_path,
    patient,
    scan_id,
    predicted_class,
    risk_level,
    confidence,
    uploaded_by_user,
    scan_date_str
):
    """
    Generates a professional PDF medical report for a single scan using ReportLab.
    """
    # Ensure parent directory of pdf_path exists
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    
    # Setup Document (Margin: 0.75 inch / 54 points)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        name='ReportTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#065f46'),  # Emerald-800
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        name='ReportSubtitle',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#10b981'),  # Emerald-500
        alignment=TA_CENTER,
        spaceAfter=15
    )
    
    section_heading = ParagraphStyle(
        name='SectionHeading',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f766e'),  # Teal-700
        spaceBefore=12,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        name='ReportBody',
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#374151'),  # Gray-700
        spaceAfter=6
    )
    
    disclaimer_style = ParagraphStyle(
        name='ReportDisclaimer',
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#9ca3af'),  # Gray-400
        alignment=TA_CENTER,
        spaceBefore=20
    )
    
    story = []
    
    # Headers
    story.append(Paragraph("Cardiovascular Disease Risk Assessment Report", title_style))
    story.append(Spacer(1, 0.02 * inch))
    story.append(Paragraph("Generated Using Deep Learning and Retinal Image Analysis", subtitle_style))
    
    # Horizontal line
    line_table = Table([[""]], colWidths=[504])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor('#10b981')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 0.15 * inch))
    
    # Patient & Scan Information Side-by-Side
    patient_info_html = f"""
    <b>Patient ID:</b> {patient.patient_id}<br/>
    <b>Patient Name:</b> {patient.full_name}<br/>
    <b>Age / Gender:</b> {patient.age} / {patient.gender}<br/>
    <b>Height / Weight:</b> {patient.height} cm / {patient.weight} kg<br/>
    <b>BMI:</b> {patient.bmi} ({patient.bmi_category})
    """
    
    scan_info_html = f"""
    <b>Scan ID:</b> {scan_id}<br/>
    <b>Scan Date:</b> {scan_date_str}<br/>
    <b>Uploaded By:</b> {uploaded_by_user}<br/>
    <b>Phone:</b> {patient.phone}<br/>
    <b>Email:</b> {patient.email}
    """
    
    info_table_data = [
        [
            Paragraph("<b>PATIENT INFORMATION</b>", section_heading),
            Paragraph("<b>SCAN INFORMATION</b>", section_heading)
        ],
        [
            Paragraph(patient_info_html, body_style),
            Paragraph(scan_info_html, body_style)
        ]
    ]
    
    info_table = Table(info_table_data, colWidths=[252, 252])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.05 * inch))
    
    # Prediction Results Box
    status_color = '#047857' if predicted_class == "Healthy" else '#b91c1c'
    risk_color = '#047857' if risk_level == "Healthy" else ('#b91c1c' if risk_level == "High Risk" else '#d97706') # Green, Red, or Orange/Yellow
    
    results_html = f"""
    <b>Classification Result:</b> <font color="{status_color}"><b>{predicted_class}</b></font><br/>
    <b>Risk Level Category:</b> <font color="{risk_color}"><b>{risk_level}</b></font><br/>
    <b>Classifier Confidence:</b> <b>{confidence}%</b>
    """
    
    model_info_html = f"""
    <b>Model Architecture:</b> MobileNetV2 Transfer Learning<br/>
    <b>Input Resolution:</b> 224 × 224 pixels<br/>
    <b>Classification Type:</b> Binary Softmax Classification
    """
    
    results_table_data = [
        [
            Paragraph("<b>PREDICTION RESULTS</b>", section_heading),
            Paragraph("<b>MODEL INFORMATION</b>", section_heading)
        ],
        [
            Paragraph(results_html, ParagraphStyle(name='res_box', parent=body_style, leading=16)),
            Paragraph(model_info_html, ParagraphStyle(name='model_box', parent=body_style, leading=16))
        ]
    ]
    
    results_table = Table(results_table_data, colWidths=[252, 252])
    results_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(results_table)
    story.append(Spacer(1, 0.05 * inch))
    
    # Clinical Notes if any
    if patient.notes:
        story.append(Paragraph("<b>CLINICAL REMARKS / NOTES</b>", section_heading))
        story.append(Paragraph(patient.notes, body_style))
        story.append(Spacer(1, 0.05 * inch))
        
    # Visual Scan Comparison
    story.append(Paragraph("<b>GRAD-CAM VISUAL HEATMAP ANALYSIS</b>", section_heading))
    
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    
    abs_orig_path = original_image_path
    if not os.path.isabs(abs_orig_path):
        abs_orig_path = os.path.join(backend_dir, original_image_path)
        
    abs_gradcam_path = gradcam_image_path
    if not os.path.isabs(abs_gradcam_path):
        abs_gradcam_path = os.path.join(backend_dir, gradcam_image_path)
        
    img_width = 220
    img_height = 220
    
    try:
        orig_img_flow = Image(abs_orig_path, width=img_width, height=img_height)
    except Exception as e:
        orig_img_flow = Paragraph(f"Error loading original image: {e}", body_style)
        
    try:
        gradcam_img_flow = Image(abs_gradcam_path, width=img_width, height=img_height)
    except Exception as e:
        gradcam_img_flow = Paragraph(f"Error loading Grad-CAM heatmap: {e}", body_style)
        
    images_table_data = [
        [
            Paragraph("<b>Original Retinal Scan</b>", ParagraphStyle(name='img_l', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#4b5563'), alignment=TA_CENTER)),
            Paragraph("<b>AI Attention Heatmap (Grad-CAM)</b>", ParagraphStyle(name='img_r', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#4b5563'), alignment=TA_CENTER))
        ],
        [orig_img_flow, gradcam_img_flow]
    ]
    
    images_table = Table(images_table_data, colWidths=[252, 252])
    images_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f3f4f6')),
        ('BOX', (0,1), (-1,-1), 1, colors.HexColor('#e5e7eb')),
    ]))
    story.append(images_table)
    story.append(Spacer(1, 0.15 * inch))
    
    # Interpretation Section
    story.append(Paragraph("<b>CLINICAL INTERPRETATION</b>", section_heading))
    if predicted_class == "Healthy":
        interpretation_text = "The model detected retinal patterns that were classified into the healthy category according to the trained dataset labels."
    else:
        interpretation_text = "The model detected retinal patterns that were classified into the cardiovascular disease risk category according to the trained dataset labels."
        
    story.append(Paragraph(interpretation_text, body_style))
    story.append(Spacer(1, 0.05 * inch))
    
    # Disclaimer
    disclaimer_text = "This report is generated for educational and research purposes only. It must not be used as a medical diagnosis or clinical decision-making tool."
    story.append(Paragraph(disclaimer_text, disclaimer_style))
    
    doc.build(story)
    return pdf_path


def generate_patient_history_report(
    pdf_path,
    patient,
    scans,
    uploaded_by_user
):
    """
    Generates a professional PDF containing a patient's complete screening history.
    """
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        name='HistTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f766e'),  # Teal-700
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        name='HistSubtitle',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0d9488'),  # Teal-600
        alignment=TA_CENTER,
        spaceAfter=15
    )
    
    section_heading = ParagraphStyle(
        name='HistSection',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1f2937'),  # Gray-800
        spaceBefore=12,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        name='HistBody',
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6
    )
    
    story = []
    
    # Headers
    story.append(Paragraph("Cardiovascular Disease Risk Assessment - Patient History", title_style))
    story.append(Spacer(1, 0.02 * inch))
    story.append(Paragraph("Longitudinal Retinal Scan & Prediction Records Summary", subtitle_style))
    
    # Horizontal line
    line_table = Table([[""]], colWidths=[504])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor('#0d9488')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 0.15 * inch))
    
    # Patient Demographics block
    patient_info_html = f"""
    <b>Patient ID:</b> {patient.patient_id}<br/>
    <b>Patient Name:</b> {patient.full_name}<br/>
    <b>Age / Gender:</b> {patient.age} / {patient.gender}<br/>
    <b>Height / Weight:</b> {patient.height} cm / {patient.weight} kg<br/>
    <b>BMI / Category:</b> {patient.bmi} ({patient.bmi_category})
    """
    
    contact_info_html = f"""
    <b>Phone Number:</b> {patient.phone}<br/>
    <b>Email Address:</b> {patient.email}<br/>
    <b>Total Scans Run:</b> {len(scans)}<br/>
    <b>Export Date:</b> {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}<br/>
    <b>Generated By:</b> {uploaded_by_user}
    """
    
    info_table_data = [
        [
            Paragraph("<b>PATIENT INFORMATION</b>", section_heading),
            Paragraph("<b>SCREENING OVERVIEW</b>", section_heading)
        ],
        [
            Paragraph(patient_info_html, body_style),
            Paragraph(contact_info_html, body_style)
        ]
    ]
    
    info_table = Table(info_table_data, colWidths=[252, 252])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.1 * inch))
    
    if patient.notes:
        story.append(Paragraph("<b>PATIENT PROFILE REMARKS</b>", section_heading))
        story.append(Paragraph(patient.notes, body_style))
        story.append(Spacer(1, 0.1 * inch))
        
    # Scans History Table
    story.append(Paragraph("<b>HISTORICAL RETINAL SCANS TIMELINE</b>", section_heading))
    
    table_header = [
        Paragraph("<b>Scan Date</b>", ParagraphStyle(name='th1', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white)),
        Paragraph("<b>Scan ID</b>", ParagraphStyle(name='th2', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white)),
        Paragraph("<b>Model Prediction</b>", ParagraphStyle(name='th3', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white)),
        Paragraph("<b>Risk Level Category</b>", ParagraphStyle(name='th4', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white)),
        Paragraph("<b>Confidence</b>", ParagraphStyle(name='th5', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white))
    ]
    
    table_rows = [table_header]
    for s in scans:
        date_str = s.scan_date.strftime("%Y-%m-%d") if s.scan_date else s.timestamp.strftime("%Y-%m-%d")
        scan_code = s.scan_id or f"SCAN-{s.id}"
        table_rows.append([
            Paragraph(date_str, body_style),
            Paragraph(scan_code, body_style),
            Paragraph(s.prediction, body_style),
            Paragraph(s.risk_level or "Healthy", body_style),
            Paragraph(f"{s.confidence}%", body_style)
        ])
        
    history_table = Table(table_rows, colWidths=[90, 110, 134, 110, 60])
    history_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(history_table)
    story.append(Spacer(1, 0.2 * inch))
    
    # Interpretation Summary
    story.append(Paragraph("<b>LONGITUDINAL CLINICAL SUMMARY</b>", section_heading))
    if scans:
        latest = scans[-1]
        risk_summary = f"The patient has undergone {len(scans)} screening scan(s). The latest scan on {latest.scan_date.strftime('%Y-%m-%d') if latest.scan_date else latest.timestamp.strftime('%Y-%m-%d')} indicates a result of '{latest.prediction}' with a classification risk category of '{latest.risk_level or 'Healthy'}' (Confidence: {latest.confidence}%)."
    else:
        risk_summary = "No retinal scans have been completed for this patient record yet."
        
    story.append(Paragraph(risk_summary, body_style))
    story.append(Spacer(1, 0.1 * inch))
    
    # Disclaimer
    disclaimer_text = "This history export report is generated for educational and research reference purposes only. It must not be used as a medical diagnosis or clinical decision-making tool."
    story.append(Paragraph(disclaimer_text, ParagraphStyle(name='HistDisc', parent=body_style, fontName='Helvetica-Oblique', fontSize=8, textColor=colors.HexColor('#9ca3af'), alignment=TA_CENTER, spaceBefore=30)))
    
    doc.build(story)
    return pdf_path
