"use client"

import { useState } from "react"
import { useRef } from "react"
import { Navigation } from "@/app/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { Search, CheckCircle, XCircle, Shield, Calendar, User, Building, Award, Hash, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [emailPromptSent, setEmailPromptSent] = useState(false)
  const [waitingForApproval, setWaitingForApproval] = useState(false)
  const [approvalToken, setApprovalToken] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handles PDF upload and triggers email prompt
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFile(file)
    setError("")
    setVerificationResult(null)
    setIsLoading(true)
    setEmailPromptSent(false)
    setWaitingForApproval(false)
    setApprovalToken("")

    // Send PDF to backend to extract info and send email
    const formData = new FormData()
    formData.append("pdf", file)

    try {
      const response = await fetch("/api/verify/upload", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Failed to process PDF")
        setIsLoading(false)
        return
      }
      if (data.emailPromptSent && data.approvalToken) {
        setEmailPromptSent(true)
        setWaitingForApproval(true)
        setApprovalToken(data.approvalToken)
      } else {
        setError("Failed to send email prompt")
      }
    } catch (err) {
      setError("Network error. Please try again.")
      console.error("PDF upload error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Polls backend for approval status
  const pollForApproval = async () => {
    if (!approvalToken) return
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/verify/approval?token=${approvalToken}`)
      const data = await response.json()
      if (data.approved) {
        setWaitingForApproval(false)
        // Now verify certificate
        await handleVerify(data.certificateId)
      } else if (data.rejected) {
        setWaitingForApproval(false)
        setError("Verification was rejected by the certificate owner.")
      } else {
        setError("Waiting for user approval...")
      }
    } catch (err) {
      setError("Network error while polling approval.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handles certificate verification after approval
  const handleVerify = async (certId?: string) => {
    const idToVerify = certId || certificateId.trim()
    if (!idToVerify) {
      setError("Please enter a certificate ID")
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
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              <span>Blockchain Certificate Verification</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Verify Certificate Authenticity</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enter a certificate ID to instantly verify its authenticity using our blockchain-powered verification
              system
            </p>
          </div>

          {/* Verification Form with PDF upload */}
          <Card className="mb-8 border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Certificate Verification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="certificateId">Certificate ID</Label>
                <Input
                  id="certificateId"
                  placeholder="Enter certificate ID (e.g., CERT-2024-001234)"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="text-lg py-6"
                  onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                />
                <p className="text-sm text-muted-foreground">
                  The certificate ID can be found on your digital certificate document
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfUpload">Or upload your certificate PDF</Label>
                <Input
                  id="pdfUpload"
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handlePdfUpload}
                  className="text-lg py-6"
                />
                <p className="text-sm text-muted-foreground">
                  Upload the official PDF gradecard/certificate to verify and notify the owner
                </p>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive font-medium">{error}</p>
                </div>
              )}

              {!pdfFile && (
                <Button onClick={() => handleVerify()} disabled={isLoading} className="w-full text-lg py-6" size="lg">
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
              )}

              {pdfFile && waitingForApproval && (
                <Button onClick={pollForApproval} disabled={isLoading} className="w-full text-lg py-6" size="lg">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Waiting for owner approval...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Check Approval Status
                    </>
                  )}
                </Button>
              )}

              {pdfFile && emailPromptSent && !waitingForApproval && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-primary font-medium">Verification approved! Proceeding...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Result */}
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
                  <>
                    {/* Certificate Details */}
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
                            <p className="text-sm text-muted-foreground">
                              {new Date(verificationResult.verificationTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Blockchain Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span>Blockchain Verification Details</span>
                      </h3>

                      <div className="grid gap-4">
                        <div className="flex items-start space-x-3">
                          <Hash className="h-5 w-5 text-primary mt-1" />
                          <div className="flex-1">
                            <p className="font-medium">Certificate Hash</p>
                            <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                              {verificationResult.certificateHash}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Hash className="h-5 w-5 text-primary mt-1" />
                          <div className="flex-1">
                            <p className="font-medium">Blockchain Transaction ID</p>
                            <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                              {verificationResult.blockchainTxId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/10 p-4 rounded-lg">
                      <p className="text-sm text-primary font-medium">
                        ✓ This certificate has been cryptographically verified on the blockchain and is authentic.
                      </p>
                    </div>
                  </>
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

          {/* How Verification Works */}
          <Card className="mt-12 border-2">
            <CardHeader>
              <CardTitle>How Our Verification Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Enter Certificate ID</h4>
                  <p className="text-sm text-muted-foreground">
                    Input the unique certificate identifier found on your digital certificate
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Blockchain Lookup</h4>
                  <p className="text-sm text-muted-foreground">
                    Our system queries the blockchain to find the certificate record
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Instant Results</h4>
                  <p className="text-sm text-muted-foreground">
                    Get immediate verification results with full certificate details
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
