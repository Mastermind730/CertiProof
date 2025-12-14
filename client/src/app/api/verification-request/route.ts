import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prismadb";
import { sendVerificationRequestEmail } from "@/lib/email";

// POST - Create a new verification request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prn, verifierName, verifierEmail, verifierOrg, purpose } = body;

    if (!prn || !verifierName || !verifierEmail) {
      return NextResponse.json(
        { error: "PRN, verifier name, and email are required" },
        { status: 400 }
      );
    }

    // Find the certificate
    const certificate = await prisma.certificate.findUnique({
      where: { prn },
      include: {
        owner: true,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Check if there's already a pending request from this email
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        certificateId: certificate.id,
        verifierEmail,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { 
          error: "A verification request from this email is already pending",
          requestId: existingRequest.id,
          status: "PENDING"
        },
        { status: 409 }
      );
    }

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        certificateId: certificate.id,
        studentId: certificate.ownerId,
        verifierName,
        verifierEmail,
        verifierOrg,
        purpose,
        status: "PENDING",
      },
    });

    // Send email notification to student
    try {
      await sendVerificationRequestEmail(
        certificate.studentEmail,
        certificate.studentName,
        verifierName,
        verifierEmail,
        prn,
        verificationRequest.id
      );
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      requestId: verificationRequest.id,
      message: "Verification request submitted. Waiting for student approval.",
      status: "PENDING",
    });
  } catch (error) {
    console.error("Error creating verification request:", error);
    return NextResponse.json(
      { error: "Failed to create verification request" },
      { status: 500 }
    );
  }
}

// GET - Get verification requests (for student dashboard)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const requestId = searchParams.get("requestId");

    if (requestId) {
      // Get specific request
      const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        include: {
          certificate: true,
        },
      });

      return NextResponse.json({ request });
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get all requests for student
    const requests = await prisma.verificationRequest.findMany({
      where: { studentId },
      include: {
        certificate: {
          select: {
            prn: true,
            sno: true,
            courseName: true,
            degree: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    const pending = requests.filter((r) => r.status === "PENDING");
    const approved = requests.filter((r) => r.status === "APPROVED");
    const rejected = requests.filter((r) => r.status === "REJECTED");

    return NextResponse.json({
      requests,
      stats: {
        total: requests.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
      },
    });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification requests" },
      { status: 500 }
    );
  }
}
