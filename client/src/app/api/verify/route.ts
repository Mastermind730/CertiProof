import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prismadb"

// POST /api/verify - Verify certificate (requires approval)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prn, verifierEmail } = body

    if (!prn || !verifierEmail) {
      return NextResponse.json({ 
        error: "PRN and verifier email are required" 
      }, { status: 400 })
    }

    // Find the certificate
    const certificate = await prisma.certificate.findUnique({
      where: { prn },
      include: {
        owner: true,
      },
    })

    if (!certificate) {
      return NextResponse.json({ 
        error: "Certificate not found" 
      }, { status: 404 })
    }

    // Check if there's an approved verification request
    const approvedRequest = await prisma.verificationRequest.findFirst({
      where: {
        certificateId: certificate.id,
        verifierEmail,
        status: "APPROVED",
      },
    })

    if (!approvedRequest) {
      return NextResponse.json({
        error: "Verification not authorized. Please request access first.",
        needsApproval: true,
        certificateExists: true,
      }, { status: 403 })
    }

    // Return certificate data
    return NextResponse.json({
      success: true,
      certificate: {
        prn: certificate.prn,
        sno: certificate.sno,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        degree: certificate.degree,
        specialization: certificate.specialization,
        cgpa: certificate.cgpa,
        division: certificate.division,
        issueDate: certificate.issueDate,
        completionDate: certificate.completionDate,
        certificateUrl: certificate.certificateUrl,
        transactionHash: certificate.transactionHash,
        isValid: true,
        verificationTime: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ 
      error: "Failed to verify certificate" 
    }, { status: 500 })
  }
}

// GET /api/verify - Check verification status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const prn = searchParams.get("prn")
    const verifierEmail = searchParams.get("verifierEmail")

    if (!prn || !verifierEmail) {
      return NextResponse.json({ 
        error: "PRN and verifier email are required" 
      }, { status: 400 })
    }

    // Find the certificate
    const certificate = await prisma.certificate.findUnique({
      where: { prn },
    })

    if (!certificate) {
      return NextResponse.json({ 
        error: "Certificate not found",
        exists: false,
      }, { status: 404 })
    }

    // Check verification request status
    const verificationRequest = await prisma.verificationRequest.findFirst({
      where: {
        certificateId: certificate.id,
        verifierEmail,
      },
      orderBy: {
        requestedAt: "desc",
      },
    })

    return NextResponse.json({
      exists: true,
      status: verificationRequest?.status || "NOT_REQUESTED",
      requestId: verificationRequest?.id,
      canView: verificationRequest?.status === "APPROVED",
    })
  } catch (error) {
    console.error("Error checking verification status:", error)
    return NextResponse.json({ 
      error: "Failed to check verification status" 
    }, { status: 500 })
  }
}
