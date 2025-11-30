import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import crypto from "crypto"

// In-memory store for approval requests (use DB in production)
export const approvalRequests = new Map<string, {
  certificateId?: string
  email: string
  payload: any
  status: "pending" | "approved" | "rejected"
  createdAt: Date
}>()

// POST /api/verify/upload
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("pdf") as File
    
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid PDF file" }, { status: 400 })
    }

    // For now, we'll extract payload from frontend and send it in formData
    // The frontend already extracts QR payload, so we receive it here
    const payloadStr = formData.get("payload") as string
    
    if (!payloadStr) {
      return NextResponse.json({ 
        error: "No payload found. Please ensure the PDF contains a valid QR code with certificate data." 
      }, { status: 400 })
    }

    let payload: any
    try {
      payload = JSON.parse(payloadStr)
    } catch (e) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 })
    }

    if (!payload.email) {
      return NextResponse.json({ 
        error: "Email not found in certificate payload" 
      }, { status: 400 })
    }

    // Generate unique request ID
    const requestId = crypto.randomBytes(16).toString("hex")
    
    // Store approval request
    approvalRequests.set(requestId, {
      certificateId: payload.certificateId || payload.prn,
      email: payload.email,
      payload,
      status: "pending",
      createdAt: new Date()
    })

    // Send email notification
    try {
      await sendApprovalEmail(payload.email, requestId, payload)
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
      // Continue anyway - we can still manually approve
    }

    return NextResponse.json({ 
      success: true,
      requestId,
      message: "Approval request sent to certificate owner"
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Failed to process upload" 
    }, { status: 500 })
  }
}

async function sendApprovalEmail(email: string, requestId: string, payload: any) {
  // For production, use a proper email service
  // For now, we'll use nodemailer with environment variables
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not configured. Skipping email.")
    return
  }

  const nodemailer = require("nodemailer")
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const approveUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/verify/approval?requestId=${requestId}&action=approve`
  const rejectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/verify/approval?requestId=${requestId}&action=reject`

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Certificate Verification Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Certificate Verification Request</h2>
        <p>Someone is trying to verify your certificate/gradecard:</p>
        <ul>
          <li><strong>PRN:</strong> ${payload.prn || "N/A"}</li>
          <li><strong>Email:</strong> ${payload.email}</li>
          <li><strong>Issue Date:</strong> ${payload.issueDate ? new Date(payload.issueDate).toLocaleDateString() : "N/A"}</li>
        </ul>
        <p>If you approve this verification request, the requester will be able to see your certificate details.</p>
        <div style="margin: 30px 0;">
          <a href="${approveUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">Approve</a>
          <a href="${rejectUrl}" style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reject</a>
        </div>
        <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
