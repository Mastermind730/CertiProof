import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prismadb"
import { sendVerificationRequestEmail } from "@/lib/email"

// In-memory store for approval requests (use DB/Redis in production)
export const approvalRequests = new Map<string, {
  prn: string
  email: string
  verifierEmail: string
  verifierName?: string
  payload: Record<string, unknown>
  status: "pending" | "approved" | "rejected"
  certificateId?: string
  createdAt: Date
}>()

// POST /api/verify/upload - Create verification request from PDF payload
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("pdf") as File
    const payloadStr = formData.get("payload") as string
    
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid PDF file" }, { status: 400 })
    }

    if (!payloadStr) {
      return NextResponse.json({ error: "Payload is required" }, { status: 400 })
    }

    let payload
    try {
      payload = JSON.parse(payloadStr)
    } catch (e) {
      return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 })
    }

    const { prn, email, verifierEmail, verifierName } = payload

    if (!prn || !email) {
      return NextResponse.json({ 
        error: "PRN and email are required in the QR payload" 
      }, { status: 400 })
    }

    // Find the certificate
    const certificate = await prisma.certificate.findUnique({
      where: { prn },
      include: { owner: true },
    })

    if (!certificate) {
      return NextResponse.json({ 
        error: "Certificate not found" 
      }, { status: 404 })
    }

    const emailToCheck = verifierEmail || email

    // Check if there's already an approved request for this verifier
    const existingApproval = await prisma.verificationRequest.findFirst({
      where: {
        certificateId: certificate.id,
        verifierEmail: emailToCheck,
        status: "APPROVED",
      },
    })

    // If already approved, return success immediately
    if (existingApproval) {
      return NextResponse.json({ 
        success: true,
        requestId: existingApproval.id,
        message: "Already approved. You can view the certificate.",
        status: "APPROVED",
        alreadyApproved: true,
      })
    }

    // Check if there's already a pending request
    const existingPending = await prisma.verificationRequest.findFirst({
      where: {
        certificateId: certificate.id,
        verifierEmail: emailToCheck,
        status: "PENDING",
      },
    })

    // If already pending, return existing request
    if (existingPending) {
      // Update in-memory store
      approvalRequests.set(existingPending.id, {
        prn,
        email,
        verifierEmail: emailToCheck,
        verifierName,
        payload,
        status: "pending",
        certificateId: certificate.id,
        createdAt: new Date(),
      })

      return NextResponse.json({ 
        success: true,
        requestId: existingPending.id,
        message: "Verification request already pending. Awaiting approval.",
        status: "PENDING",
      })
    }

    // Create new verification request in database
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        certificateId: certificate.id,
        studentId: certificate.ownerId,
        verifierName: verifierName || "Anonymous Verifier",
        verifierEmail: emailToCheck,
        verifierOrg: payload.verifierOrg,
        purpose: "Certificate Verification via PDF Upload",
        status: "PENDING",
      },
    })

    // Store in memory for polling
    const requestId = verificationRequest.id
    approvalRequests.set(requestId, {
      prn,
      email,
      verifierEmail: verifierEmail || email,
      verifierName,
      payload,
      status: "pending",
      certificateId: certificate.id,
      createdAt: new Date(),
    })

    // Send email notification
    try {
      await sendVerificationRequestEmail(
        certificate.studentEmail,
        certificate.studentName,
        verifierName || "Anonymous Verifier",
        verifierEmail || email,
        prn,
        requestId
      )
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
    }

    return NextResponse.json({ 
      success: true,
      requestId,
      message: "Verification request created. Awaiting approval."
    })
    
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Failed to process verification request" 
    }, { status: 500 })
  }
}
