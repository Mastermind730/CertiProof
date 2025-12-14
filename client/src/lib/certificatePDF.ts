import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface CertificatePDFData {
  sno: string;
  prn: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  degree: string;
  specialization?: string;
  marks: Array<{ subject: string; marks: number }>;
  cgpa?: number;
  division?: string;
  issuerName: string;
  issueDate: string;
  completionDate?: string;
  verificationUrl?: string; // URL to verify the certificate (with PRN)
}

/**
 * Generate a professional certificate PDF with QR code
 */
export async function generateCertificatePDF(data: CertificatePDFData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background and border
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative border
  doc.setDrawColor(0, 102, 204); // Primary blue color
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Header - Certificate Title
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 204);
  doc.text('CERTIFICATE', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('OF ACHIEVEMENT', pageWidth / 2, 38, { align: 'center' });

  // Divider line
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.5);
  doc.line(60, 42, pageWidth - 60, 42);

  // Body - "This is to certify that"
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('This is to certify that', pageWidth / 2, 52, { align: 'center' });

  // Student Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(data.studentName.toUpperCase(), pageWidth / 2, 62, { align: 'center' });

  // PRN
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`PRN: ${data.prn}`, pageWidth / 2, 68, { align: 'center' });

  // Achievement text
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  const achievementText = `has successfully completed the requirements for`;
  doc.text(achievementText, pageWidth / 2, 76, { align: 'center' });

  // Degree
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 204);
  doc.text(data.degree, pageWidth / 2, 84, { align: 'center' });

  // Course/Major
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const courseText = data.specialization 
    ? `in ${data.courseName} (${data.specialization})`
    : `in ${data.courseName}`;
  doc.text(courseText, pageWidth / 2, 92, { align: 'center' });

  // Academic Performance
  let yPos = 102;
  
  // Division & CGPA
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  if (data.division || data.cgpa) {
    let perfText = '';
    if (data.division) perfText += `${data.division}`;
    if (data.cgpa) perfText += perfText ? ` | CGPA: ${data.cgpa}` : `CGPA: ${data.cgpa}`;
    doc.text(perfText, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }

  // Issue Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const issueText = data.completionDate
    ? `Completed on ${new Date(data.completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
    : '';
  if (issueText) {
    doc.text(issueText, pageWidth / 2, yPos + 4, { align: 'center' });
  }

  // Bottom section - Issuer and Certificate Number
  const bottomY = pageHeight - 35;
  
  // Left side - Issuer
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(data.issuerName, 40, bottomY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Issuing Institution', 40, bottomY + 5);
  
  // Issue date
  doc.text(
    `Issued: ${new Date(data.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    40,
    bottomY + 10
  );

  // Right side - QR Code
  const qrSize = 30;
  const qrX = pageWidth - 45;
  const qrY = bottomY - 5;
  
  // Generate QR code with embedded certificate data (JSON payload)
  const qrPayload = {
    prn: data.prn,
    sno: data.sno,
    email: data.studentEmail,
    name: data.studentName,
    course: data.courseName,
    verifyUrl: data.verificationUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?prn=${data.prn}`
  };
  const qrData = JSON.stringify(qrPayload);
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 1,
    color: {
      dark: '#0066CC',
      light: '#FFFFFF',
    },
  });
  
  doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  
  // QR Code label
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Scan to Verify', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });

  // Certificate Number (centered at bottom)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 204);
  doc.text(`Certificate No: ${data.sno}`, pageWidth / 2, pageHeight - 12, { align: 'center' });

  // Signature line
  doc.setLineWidth(0.3);
  doc.setDrawColor(150, 150, 150);
  const sigLineY = bottomY - 8;
  doc.line(40, sigLineY, 100, sigLineY);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Authorized Signature', 70, sigLineY + 4, { align: 'center' });

  // Generate blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Generate certificate PDF and return as File object
 */
export async function generateCertificatePDFFile(
  data: CertificatePDFData,
  filename?: string
): Promise<File> {
  const blob = await generateCertificatePDF(data);
  const fileName = filename || `Certificate_${data.sno}_${data.prn}.pdf`;
  return new File([blob], fileName, { type: 'application/pdf' });
}

/**
 * Calculate total marks and percentage
 */
export function calculateMarksStats(marks: Array<{ subject: string; marks: number }>) {
  const total = marks.reduce((sum, mark) => sum + mark.marks, 0);
  const maxMarks = marks.length * 100;
  const percentage = (total / maxMarks) * 100;
  
  return {
    total,
    maxMarks,
    percentage: percentage.toFixed(2),
  };
}
