import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import formidable from "formidable"
import fs from "fs/promises"
import path from "path"
import pdfParse from "pdf-parse"
import nodemailer from "nodemailer"

// In-memory approval store (replace with DB in production)
const approvals: Record<string, { approved: boolean; rejected: boolean; certificateId: string }> = {}

// Helper to extract certificateId and email from PDF text
function extractInfoFromPdfText(text: string): { certificateId: string; email: string } | null {
  // Example: look for CERT-xxxx and email pattern
  const certMatch = text.match(/CERT-\d{4}-\d{6}/)
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (certMatch && emailMatch) {
    return { certificateId: certMatch[0], email: emailMatch[0] }
  }
  return null
}

// POST /api/verify/upload
export async function POST(req: NextRequest) {
  // Parse PDF from multipart form
  const form = new formidable.IncomingForm()
  const buffers: Buffer[] = []
  let pdfBuffer: Buffer | null = null

  await new Promise((resolve, reject) => {
    form.parse(req as any, (err, fields, files) => {
      if (err) return reject(err)
      const file = files.pdf
      if (!file) return reject("No PDF uploaded")
      fs.readFile(file.filepath)
        .then((data) => {
          pdfBuffer = data
          resolve(null)
        })
        .catch(reject)
    })
  })

  if (!pdfBuffer) {
    return NextResponse.json({ error: "PDF not found" }, { status: 400 })
  }

  // Extract text from PDF
  let pdfText = ""
  try {
    const pdfData = await pdfParse(pdfBuffer)
    pdfText = pdfData.text
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 400 })
  }

  // Extract info
  const info = extractInfoFromPdfText(pdfText)
  if (!info) {
    return NextResponse.json({ error: "Could not extract certificate ID or email from PDF" }, { status: 400 })
  }

  // Generate approval token
  const approvalToken = Math.random().toString(36).substring(2, 15)
  approvals[approvalToken] = { approved: false, rejected: false, certificateId: info.certificateId }

  // Send email to user
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
    const approvalUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify/approval?token=${approvalToken}&action=approve`
    const rejectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify/approval?token=${approvalToken}&action=reject`
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: info.email,
      subject: "Certificate Access Request",
      html: `<p>Someone is trying to access your gradecard (Certificate ID: ${info.certificateId}).</p>
        <p>If you allow, click <a href="${approvalUrl}">Approve</a>. If not, click <a href="${rejectUrl}">Reject</a>.</p>`
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }

  return NextResponse.json({ emailPromptSent: true, approvalToken })
}

// GET /api/verify/approval
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  const action = searchParams.get("action")
  if (!token || !approvals[token]) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }
  if (action === "approve") {
    approvals[token].approved = true
    return NextResponse.json({ approved: true, certificateId: approvals[token].certificateId })
  }
  if (action === "reject") {
    approvals[token].rejected = true
    return NextResponse.json({ rejected: true })
  }
  // Polling: return status
  return NextResponse.json({
    approved: approvals[token].approved,
    rejected: approvals[token].rejected,
    certificateId: approvals[token].certificateId,
  })
}
