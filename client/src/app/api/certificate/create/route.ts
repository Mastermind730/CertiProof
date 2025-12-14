import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { generateCertificateHash, generateCertificateSNO, CertificateData } from '@/lib/certificateHash';
import { verifyToken } from '@/lib/jwt';

// POST /api/certificate/create - Create and issue a new certificate
export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated and is an admin
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      prn,
      studentName,
      studentEmail,
      marks, // Array of {subject: string, marks: number}
      courseName,
      degree,
      specialization,
      cgpa,
      division,
      issueDate,
      completionDate,
      certificateUrl, // Cloudinary URL (must be uploaded before this API call)
      offChainUrl, // IPFS or other storage URL
    } = body;

    // Validate required fields
    if (!prn || !studentName || !studentEmail || !marks || !courseName || !certificateUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: prn, studentName, studentEmail, marks, courseName, certificateUrl' },
        { status: 400 }
      );
    }

    // Validate marks array
    if (!Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json(
        { error: 'Marks must be a non-empty array of {subject: string, marks: number}' },
        { status: 400 }
      );
    }

    // Check if certificate already exists for this PRN
    const existingCertificate = await prisma.certificate.findUnique({
      where: { prn },
    });

    if (existingCertificate) {
      return NextResponse.json(
        { error: 'Certificate already exists for this PRN' },
        { status: 409 }
      );
    }

    // Find the student user by email
    const student = await prisma.user.findUnique({
      where: { email: studentEmail },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found with the provided email' },
        { status: 404 }
      );
    }

    // Get admin/institute details
    const admin = await prisma.user.findUnique({
      where: { wallet_address: decoded.wallet_address },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Generate unique certificate serial number
    const sno = generateCertificateSNO(admin.id);

    // Prepare certificate data
    const certificateData: CertificateData = {
      prn,
      sno,
      studentName,
      studentEmail,
      marks,
      issuerId: admin.id,
      issuerName: admin.name,
      courseName,
      degree,
      specialization,
      cgpa,
      division,
      issueDate: issueDate || new Date().toISOString(),
      completionDate,
      certificateUrl,
      offChainUrl: offChainUrl || certificateUrl,
    };

    // Generate JWT certificate hash
    const certificateHash = generateCertificateHash(certificateData);

    // Save certificate to database
    const certificate = await prisma.certificate.create({
      data: {
        prn,
        sno,
        hash: certificateHash,
        studentName,
        studentEmail,
        marks: marks as any, // Prisma will handle Json type
        issuerId: admin.id,
        issuerName: admin.name,
        courseName,
        degree,
        specialization,
        cgpa,
        division,
        issueDate: new Date(issueDate || Date.now()),
        completionDate: completionDate ? new Date(completionDate) : null,
        certificateUrl,
        offChainUrl: offChainUrl || certificateUrl,
        ownerId: student.id,
      },
    });

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        prn: certificate.prn,
        sno: certificate.sno,
        certificateHash,
        certificateUrl: certificate.certificateUrl,
        studentName: certificate.studentName,
        issuerName: certificate.issuerName,
      },
      message: 'Certificate created successfully. Ready to be issued on blockchain.',
    });

  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/certificate/create?prn=xxx - Get certificate by PRN
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const prn = searchParams.get('prn');

    if (!prn) {
      return NextResponse.json({ error: 'PRN is required' }, { status: 400 });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { prn },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      certificate,
    });

  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/certificate/create - Update certificate with transaction hash
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { prn, transactionHash } = body;

    if (!prn || !transactionHash) {
      return NextResponse.json(
        { error: 'PRN and transactionHash are required' },
        { status: 400 }
      );
    }

    const certificate = await prisma.certificate.update({
      where: { prn },
      data: { transactionHash },
    });

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        prn: certificate.prn,
        transactionHash: certificate.transactionHash,
      },
    });

  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
