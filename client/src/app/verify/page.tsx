"use client"

import { useState, useRef, useEffect } from "react"
import { Navigation } from "@/app/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { Search, CheckCircle, XCircle, Shield, Calendar, User, Building, Award, Hash, Clock, Upload } from "lucide-react"
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
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<CertificateData | null>(null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Approval flow state
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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setPdfFile(file)
    setUploading(true)
    setError("")
    setVerificationResult(null)
    setExtractedPayload(null)
    setRequestId(null)
    setApprovalStatus(null)

    try {
      // Extract QR code data from PDF
      const payload = await extractQrPayloadFromPdf(file)
      console.log("Extracted QR payload:", payload)
      setExtractedPayload(payload)
      
      if (!payload.email) {
        setError("No 'email' field found in QR payload — cannot proceed")
        setUploading(false)
        return
      }

      // Send to server to create verification request
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
      setError(err?.message || "Failed to extract QR code from PDF. Please enter PRN manually.")
      console.error("PDF upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  // Start polling approval status
  const startPolling = (rid: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/verify/approval?requestId=${encodeURIComponent(rid)}`)
        const body = await res.json()
        if (body.status === "approved") {
          window.clearInterval(pollRef.current!)
          setApprovalStatus("approved")
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

  // Called when approved
  const proceedToVerifyAfterApproval = async (certId?: string) => {
    setIsLoading(true)
    setError("")
    setVerificationResult(null)

    try {
      const idToVerify = certId || extractedPayload?.prn || extractedPayload?.certificateId
      const verifierEmail = extractedPayload?.verifierEmail || extractedPayload?.email
      
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prn: idToVerify,
          verifierEmail,
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

  const handleVerify = async (prn?: string) => {
    const idToVerify = prn || certificateId.trim()
    if (!idToVerify) {
      setError("Please enter a certificate ID (PRN)")
      return
    }
    setIsLoading(true)
    setError("")
    setVerificationResult(null)
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ certificateId: idToVerify }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Failed to verify certificate")
        return
      }
      if (data.success && data.certificate) {
        setVerificationResult(data.certificate)
      } else {
        setError("Certificate verification failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("Verification error:", err)
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
              Enter a certificate ID to instantly verify its authenticity using our blockchain-powered verification system
            </p>
          </div>

          <Card className="mb-8 border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Certificate Verification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="certificateId">Certificate ID / PRN</Label>
                <Input
                  id="certificateId"
                  placeholder="Enter certificate PRN (e.g., ABC123)"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="text-lg py-6"
                  onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                />
                <p className="text-sm text-muted-foreground">
                  The PRN can be found on your certificate document
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfUpload">Upload Certificate PDF</Label>
                <Input
                  id="pdfUpload"
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handlePdfUpload}
                  className="text-lg py-6"
                />
                <p className="text-sm text-muted-foreground">
                  Upload the PDF to automatically extract the PRN from the QR code
                </p>
              </div>

              {uploading && <p className="text-sm">Extracting QR & creating approval request…</p>}

              {extractedPayload && (
                <div className="p-3 rounded bg-muted text-sm">
                  <p><strong>Extracted PRN:</strong> {String(extractedPayload.prn ?? "-")}</p>
                  <p><strong>Extracted Email:</strong> {String(extractedPayload.email ?? "-")}</p>
                </div>
              )}

              {requestId && <p className="text-sm">Approval request sent — Request ID: <code>{requestId}</code></p>}
              {approvalStatus === "pending" && <p className="text-sm text-muted-foreground">Waiting for recipient approval via email...</p>}
              {approvalStatus === "approved" && <p className="text-sm text-green-600">Approved — verifying now</p>}
              {approvalStatus === "rejected" && <p className="text-sm text-red-600">Rejected by recipient — verification stopped</p>}

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive font-medium">{error}</p>
                </div>
              )}

              <Button onClick={() => handleVerify()} disabled={isLoading || !certificateId.trim()} className="w-full text-lg py-6" size="lg">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Verifying on Blockchain...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Verify Certificate
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {verificationResult && (
            <Card
              className={cn(
                "border-2 transition-all duration-500 animate-fade-in",
                verificationResult.isValid
                  ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                  : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {verificationResult.isValid ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <span>{verificationResult.isValid ? "Certificate Verified" : "Invalid Certificate"}</span>
                  </CardTitle>
                  <Badge variant={verificationResult.isValid ? "default" : "destructive"} className="text-sm px-3 py-1">
                    {verificationResult.isValid ? "AUTHENTIC" : "INVALID"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {verificationResult.isValid ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-600 mb-2">Certificate Verified Successfully!</h3>
                    <p className="text-muted-foreground">
                      This certificate has been cryptographically verified on the blockchain and is authentic.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-red-600 mb-2">Certificate Invalid</h3>
                    <p className="text-muted-foreground">
                      This certificate could not be verified on the blockchain. It may be forged or tampered with.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
