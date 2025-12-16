import jwt from 'jsonwebtoken';

export interface CertificateData {
  prn: string;
  sno: string;
  studentName: string;
  studentEmail: string;
  marks: Array<{ subject: string; marks: number }>;
  issuerId: string;
  issuerName: string;
  courseName: string;
  degree?: string;
  specialization?: string;
  cgpa?: number;
  division?: string;
  issueDate: string;
  completionDate?: string;
  certificateUrl: string;
  offChainUrl: string;
}

/**
 * Generate a JWT token containing all certificate details
 * This JWT serves as the certificate hash stored on the blockchain
 */
export function generateCertificateHash(certificateData: CertificateData): string {
  const secret = process.env.CERTIFICATE_JWT_SECRET || process.env.JWT_SECRET || 'default-secret-key';
  
  // Create JWT with all certificate data
  const token = jwt.sign(
    {
      prn: certificateData.prn,
      sno: certificateData.sno,
      studentName: certificateData.studentName,
      studentEmail: certificateData.studentEmail,
      marks: certificateData.marks,
      issuerId: certificateData.issuerId,
      issuerName: certificateData.issuerName,
      courseName: certificateData.courseName,
      degree: certificateData.degree,
      specialization: certificateData.specialization,
      cgpa: certificateData.cgpa,
      division: certificateData.division,
      issueDate: certificateData.issueDate,
      completionDate: certificateData.completionDate,
      certificateUrl: certificateData.certificateUrl,
      offChainUrl: certificateData.offChainUrl,
      issuedAt: new Date().toISOString(),
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: '100y', // Certificates should be long-lasting
      issuer: certificateData.issuerId,
      subject: certificateData.prn,
    }
  );

  return token;
}

/**
 * Verify and decode a certificate hash (JWT token)
 */
export function verifyCertificateHash(certificateHash: string): CertificateData | null {
  try {
    const secret = process.env.CERTIFICATE_JWT_SECRET || process.env.JWT_SECRET || 'default-secret-key';
    const decoded = jwt.verify(certificateHash, secret) as jwt.JwtPayload & CertificateData;
    
    return {
      prn: decoded.prn,
      sno: decoded.sno,
      studentName: decoded.studentName,
      studentEmail: decoded.studentEmail,
      marks: decoded.marks,
      issuerId: decoded.issuerId,
      issuerName: decoded.issuerName,
      courseName: decoded.courseName,
      degree: decoded.degree,
      specialization: decoded.specialization,
      cgpa: decoded.cgpa,
      division: decoded.division,
      issueDate: decoded.issueDate,
      completionDate: decoded.completionDate,
      certificateUrl: decoded.certificateUrl,
      offChainUrl: decoded.offChainUrl,
    };
  } catch (error) {
    console.error('Error verifying certificate hash:', error);
    return null;
  }
}

/**
 * Generate a unique certificate serial number (SNO)
 * Format: CERT-YYYY-XXXXXX (e.g., CERT-2025-000001)
 */
export function generateCertificateSNO(instituteId: string): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const institutePrefix = instituteId.substring(0, 3).toUpperCase();
  
  return `${institutePrefix}-${year}-${randomPart}`;
}
