"use client"

import { useEffect, useRef, useState } from "react"
import { Navigation } from "@/app/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { Search, CheckCircle, XCircle, Shield, Calendar, User, Building, Award, Hash, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

// libraries for PDF rendering and QR decoding
import jsQR from "jsqr"
import * as pdfjsLib from "pdfjs-dist"

// Set worker src to CDN matching the installed version
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs`
}

interface CertificateData {
  certificateId: string
  studentName: string
  courseName: string
  institution: string
  issueDate: string
  grade: string
  certificateHash: string
  blockchainTxId: string
  isValid: boolean
  verificationTime: string
}

export default function VerifyPage() {
  const [certificateId, setCertificateId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<CertificateData | null>(null)
  const [error, setError] = useState("")

  // upload & approval flow state
  const [uploading, setUploading] = useState(false)
  const [extractedPayload, setExtractedPayload] = useState<any | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected" | null>(null)
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [])

  // extract QR payload from first page of PDF using pdfjs + jsqr
  async function extractQrPayloadFromPdf(file: File) {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 2 })

    const canvas = document.createElement("canvas")
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D not supported")

    const renderContext = {
      canvasContext: ctx,
      viewport,
      canvas: canvas
    }
    await page.render(renderContext).promise

    // grab image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (!code) throw new Error("No QR code found in the PDF (page 1)")

    // try parse JSON payload
    try {
      const payload = JSON.parse(code.data)
      return payload
    } catch (e) {
      return { raw: code.data }
    }
  }

  // upload the PDF, extract QR and create approval request
  const handleFileUpload = async (file?: File) => {
    if (!file) return
    setUploading(true)
    setError("")
    setExtractedPayload(null)
    setRequestId(null)
    setApprovalStatus(null)

    try {
      const payload = await extractQrPayloadFromPdf(file)
      setExtractedPayload(payload)

      if (!payload.email) {
        setError("No 'email' field found in QR payload — cannot proceed")
        setUploading(false)
        return
      }

      const form = new FormData()
      form.append("pdf", file)
      form.append("payload", JSON.stringify(payload))

      const res = await fetch("/api/verify/upload", {
        method: "POST",
        body: form,
      })

      const body = await res.json()
      if (!res.ok) {
        setError(body.error || "Failed to create approval request")
        setUploading(false)
        return
      }

      setRequestId(body.requestId)
      setApprovalStatus("pending")
      startPolling(body.requestId)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Failed to extract QR from PDF")
    } finally {
      setUploading(false)
    }
  }

  // start polling approval status endpoint
  const startPolling = (rid: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/verify/approval?requestId=${encodeURIComponent(rid)}`)
        const body = await res.json()
        if (body.status === "approved") {
          window.clearInterval(pollRef.current!)
          setApprovalStatus("approved")
          // proceed with verification now that it's approved
          proceedToVerifyAfterApproval(body.certificateId)
        } else if (body.status === "rejected") {
          window.clearInterval(pollRef.current!)
          setApprovalStatus("rejected")
        }
      } catch (err) {
        console.error("Polling error", err)
      }
    }, 3000)
  }

  // called when approved — call server to run verification logic (blockchain checks etc.)
  const proceedToVerifyAfterApproval = async (certId?: string) => {
    setIsLoading(true)
    setError("")
    setVerificationResult(null)

    try {
      // Use the certificateId from payload or passed parameter
      const idToVerify = certId || extractedPayload?.prn || extractedPayload?.certificateId
      
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          certificateId: idToVerify,
          payload: extractedPayload, 
          requestId 
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || "Verification failed")
        setIsLoading(false)
        return
      }
      if (body.success && body.certificate) {
        setVerificationResult(body.certificate)
      } else {
        setError("Verification failed")
      }
    } catch (err) {
      console.error(err)
      setError("Network / verification error")
    } finally {
      setIsLoading(false)
    }
  }

  // legacy: direct id verify (if user prefers manual ID entry)
  const handleVerifyById = async () => {
    if (!certificateId.trim()) return setError("Please enter a certificate ID")
    setIsLoading(true)
    setError("")
    setVerificationResult(null)
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateId: certificateId.trim() }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || "Failed to verify certificate")
      } else if (body.success && body.certificate) {
        setVerificationResult(body.certificate)
      } else setError("Certificate verification failed")
    } catch (err) {
      console.error(err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              <span>Blockchain Certificate Verification</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Verify Certificate Authenticity</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload a PDF gradecard: we'll notify the owner and only verify after they approve.
            </p>
          </div>

          {/* Upload card */}
          <Card className="mb-8 border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Upload Certificate / Gradecard (PDF)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Upload PDF (first page must contain QR)</Label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  className="mt-2"
                />
              </div>

              {uploading && <p className="text-sm">Extracting QR & creating approval request…</p>}

              {extractedPayload && (
                <div className="p-3 rounded bg-muted text-sm">
                  <p><strong>Extracted PRN:</strong> {String(extractedPayload.prn ?? "-")}</p>
                  <p><strong>Extracted Email:</strong> {String(extractedPayload.email ?? "-")}</p>
                  <p><strong>Issue Date:</strong> {String(extractedPayload.issueDate ?? "-")}</p>
                </div>
              )}

              {requestId && <p className="text-sm">Approval request sent — Request ID: <code>{requestId}</code></p>}
              {approvalStatus === "pending" && <p className="text-sm text-muted-foreground">Waiting for recipient approval via email...</p>}
              {approvalStatus === "approved" && <p className="text-sm text-green-600">Approved — verifying now</p>}
              {approvalStatus === "rejected" && <p className="text-sm text-red-600">Rejected by recipient — verification stopped</p>}

            </CardContent>
          </Card>

          {/* Manual ID verify card (existing flow) */}
          <Card className="mb-8 border-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Verify by Certificate ID</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificateId">Certificate ID</Label>
                <Input id="certificateId" placeholder="CERT-2024-001234" value={certificateId} onChange={(e) => setCertificateId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleVerifyById()} />
              </div>
              <Button onClick={handleVerifyById} disabled={isLoading} className="w-full">
                {isLoading ? 'Verifying...' : 'Verify Certificate'}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
              <p className="text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <Card className={cn("border-2 transition-all duration-500", verificationResult.isValid ? "border-green-500/50 bg-green-50/50" : "border-red-500/50 bg-red-50/50")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {verificationResult.isValid ? <CheckCircle className="h-6 w-6 text-green-600" /> : <XCircle className="h-6 w-6 text-red-600" />}
                    <span>{verificationResult.isValid ? "Certificate Verified" : "Invalid Certificate"}</span>
                  </CardTitle>
                  <Badge variant={verificationResult.isValid ? "default" : "destructive"} className="text-sm px-3 py-1">
                    {verificationResult.isValid ? "AUTHENTIC" : "INVALID"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* details (same layout as earlier) */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Student Name</p>
                        <p className="text-lg">{verificationResult.studentName}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Award className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Course/Program</p>
                        <p className="text-lg">{verificationResult.courseName}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Building className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Institution</p>
                        <p className="text-lg">{verificationResult.institution}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Issue Date</p>
                        <p className="text-lg">{new Date(verificationResult.issueDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Award className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Grade</p>
                        <p className="text-lg font-semibold text-primary">{verificationResult.grade}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Verified At</p>
                        <p className="text-sm text-muted-foreground">{new Date(verificationResult.verificationTime).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2"><Shield className="h-5 w-5 text-primary" /><span>Blockchain Verification Details</span></h3>

                  <div className="grid gap-4">
                    <div className="flex items-start space-x-3">
                      <Hash className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">Certificate Hash</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded break-all">{verificationResult.certificateHash}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Hash className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">Blockchain Transaction ID</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded break-all">{verificationResult.blockchainTxId}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-primary font-medium">✓ This certificate has been cryptographically verified on the blockchain and is authentic.</p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
