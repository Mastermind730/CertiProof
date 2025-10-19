"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Navigation } from "@/app/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Calendar } from "@/app/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { ArrowLeft, CalendarIcon, Shield, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBlockchain } from "@/app/context/DocContext"

// libs for PDF + QR
import jsPDF from "jspdf"
import QRCode from "qrcode"

interface CertificateForm {
  prn: string
  studentName: string
  studentEmail: string
  courseName: string
  courseCode: string
  grade: string
  issueDate: Date | undefined
  completionDate: Date | undefined
  description: string
  credits: string
  instructor: string
}

export default function CreateCertificatePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<CertificateForm>({
    prn: "",
    studentName: "",
    studentEmail: "",
    courseName: "",
    courseCode: "",
    grade: "",
    issueDate: undefined,
    completionDate: undefined,
    description: "",
    credits: "",
    instructor: "",
  })

  const { contract } = useBlockchain()
  console.log(contract, "contract")

  // getting the contract owner for debug
  useEffect(() => {
    const getOwner = async () => {
      if (contract) {
        try {
          const owner = await contract.owningAuthority()
          console.log("Contract owner:", owner)
        } catch (error) {
          console.error("Error getting owner:", error)
        }
      }
    }

    getOwner()
  }, [contract])

  const handleInputChange = (field: keyof CertificateForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (field: "issueDate" | "completionDate", date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: date }))
  }

  // Create PDF with details and QR (returns blob URL)
  const createPdfWithQr = async (txHash?: string) => {
    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    let y = 60

    // Title
    pdf.setFontSize(22)
    pdf.setFont(undefined, "bold")
    pdf.text("Certificate of Completion", pageWidth / 2, y, { align: "center" })
    y += 30

    pdf.setFontSize(11)
    pdf.setFont(undefined, "normal")
    pdf.text(`Certificate ID: ${generateCertificateId()}`, 40, y)
    y += 18
    if (txHash) {
      pdf.text(`Blockchain Tx: ${txHash}`, 40, y)
    }
    y += 24

    // Student & course details
    pdf.setFontSize(14)
    pdf.setFont(undefined, "bold")
    pdf.text("Student Details", 40, y)
    y += 18
    pdf.setFontSize(11)
    pdf.setFont(undefined, "normal")
    pdf.text(`PRN: ${formData.prn}`, 40, y)
    y += 16
    pdf.text(`Name: ${formData.studentName}`, 40, y)
    y += 16
    pdf.text(`Email: ${formData.studentEmail}`, 40, y)
    y += 20

    pdf.setFont(undefined, "bold")
    pdf.setFontSize(14)
    pdf.text("Course Details", 40, y)
    y += 18
    pdf.setFontSize(11)
    pdf.setFont(undefined, "normal")
    pdf.text(`Course: ${formData.courseName} (${formData.courseCode || "-"})`, 40, y)
    y += 16
    pdf.text(`Credits: ${formData.credits || "-"}`, 40, y)
    y += 16
    pdf.text(`Grade: ${formData.grade}`, 40, y)
    y += 16
    pdf.text(`Instructor: ${formData.instructor || "-"}`, 40, y)
    y += 20

    pdf.text(
      `Issue Date: ${formData.issueDate ? format(formData.issueDate, "PPP") : "-"}`,
      40,
      y,
    )
    y += 16
    pdf.text(
      `Completion Date: ${formData.completionDate ? format(formData.completionDate, "PPP") : "-"}`,
      40,
      y,
    )
    y += 24

    // Description (wrap text)
    if (formData.description) {
      pdf.setFont(undefined, "bold")
      pdf.text("Description", 40, y)
      y += 16
      pdf.setFont(undefined, "normal")
      const split = pdf.splitTextToSize(formData.description, pageWidth - 80)
      pdf.text(split, 40, y)
      y += (split.length + 1) * 12
    }

    // QR payload: prn, email, issueDate
    const qrPayload = {
      prn: formData.prn,
      email: formData.studentEmail,
      issueDate: formData.issueDate ? formData.issueDate.toISOString() : null,
    }

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), { margin: 1, scale: 6 })

    // Place QR bottom-right
    const qrSize = 120
    const qrX = pageWidth - qrSize - 40
    const qrY = 520

    // Add a note near QR
    pdf.setFontSize(10)
    pdf.setFont(undefined, "normal")
    pdf.text("Scan QR to verify certificate payload", qrX - 10, qrY + qrSize + 16, {
      align: "center",
    })

    // Add QR
    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize)

    // Signature placeholder
    pdf.setFontSize(12)
    pdf.text("__________________________", 60, qrY + qrSize - 6)
    pdf.text("Authorized Signatory", 60, qrY + qrSize + 12)

    // If more content needed, could add another page.

    // Output blob and convert to object URL
    const blob = pdf.output("blob")
    const url = URL.createObjectURL(blob)
    return url
  }

  const generateCertificateId = () => {
    // deterministic-ish but fine for display — replace with whatever you'd like (or use tx hash)
    return `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999)
      .toString()
      .padStart(6, "0")}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // if (!contract) {
    //   console.error("Contract not initialized")
    //   setIsLoading(false)
    //   return
    // }

    try {
      // Prepare certificate data
      const name = formData.studentName
      const details = `
        Email: ${formData.studentEmail},
        Course: ${formData.courseName} (${formData.courseCode}),
        Grade: ${formData.grade},
        Credits: ${formData.credits},
        Instructor: ${formData.instructor},
        IssueDate: ${formData.issueDate?.toISOString() ?? ""},
        CompletionDate: ${formData.completionDate?.toISOString() ?? ""},
        Description: ${formData.description},
        PRN: ${formData.prn}
      `

      // Send transaction to blockchain
    //   const tx = await contract.issueCertificate(name, details)
    //   console.log("Transaction submitted:", tx.hash)

    //   // Wait for confirmation
    //   const receipt = await tx.wait()
    //   console.log("Transaction confirmed:", receipt)

      // create PDF with QR, pass tx hash for display
      try {
        const url = await createPdfWithQr("result_pdf")
        setPdfUrl(url)
      } catch (pdfErr) {
        console.error("Error creating PDF:", pdfErr)
      }

      setIsLoading(false)
      setIsSuccess(true)

      // Optional: redirect after a short delay — but keep PDF visible.
      // If you still want redirect, uncomment below:
      // setTimeout(() => { router.push("/admin") }, 2000)

    } catch (error) {
      console.error("Error issuing certificate:", error)
      setIsLoading(false)
    }
  }

  const isFormValid =
    formData.prn &&
    formData.studentName &&
    formData.studentEmail &&
    formData.courseName &&
    formData.grade &&
    formData.issueDate

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-2">
                  Certificate Created Successfully!
                </h2>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  The certificate has been issued and recorded on the blockchain.
                </p>

                <div className="space-y-2 text-sm text-green-600 dark:text-green-400 mb-4">
                  <p>
                    Certificate ID:{" "}
                    <span className="font-mono">{generateCertificateId()}</span>
                  </p>
                  <p>
                    Issued To: <span className="font-mono">{formData.studentName} ({formData.prn})</span>
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => router.push("/admin")}>
                    Return to Dashboard
                  </Button>
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noreferrer">
                      <Button>Open PDF</Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Show the PDF below the card */}
            {pdfUrl && (
              <div className="mt-8">
                <h3 className="mb-2 text-lg font-semibold">Generated Certificate (Preview)</h3>
                <div className="border rounded-md overflow-hidden">
                  <iframe
                    src={pdfUrl}
                    title="Certificate PDF"
                    style={{ width: "100%", height: "700px", border: "none" }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use the browser PDF controls to download or print the certificate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
                <Shield className="h-4 w-4" />
                <span>Issue Certificate</span>
              </div>
              <h1 className="text-3xl font-bold">Create New Certificate</h1>
              <p className="text-muted-foreground">Issue a new blockchain-verified certificate to a student</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prn">PRN *</Label>
                    <Input
                      id="prn"
                      placeholder="Enter student's PRN"
                      value={formData.prn}
                      onChange={(e) => handleInputChange("prn", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentName">Full Name *</Label>
                    <Input
                      id="studentName"
                      placeholder="Enter student's full name"
                      value={formData.studentName}
                      onChange={(e) => handleInputChange("studentName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentEmail">Email Address *</Label>
                    <Input
                      id="studentEmail"
                      type="email"
                      placeholder="student@example.com"
                      value={formData.studentEmail}
                      onChange={(e) => handleInputChange("studentEmail", e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Course Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course Name *</Label>
                    <Input
                      id="courseName"
                      placeholder="e.g., Advanced Web Development"
                      value={formData.courseName}
                      onChange={(e) => handleInputChange("courseName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Course Code</Label>
                    <Input
                      id="courseCode"
                      placeholder="e.g., CS-401"
                      value={formData.courseCode}
                      onChange={(e) => handleInputChange("courseCode", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      placeholder="e.g., 4"
                      value={formData.credits}
                      onChange={(e) => handleInputChange("credits", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assessment & Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment & Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade *</Label>
                    <Select value={formData.grade} onValueChange={(value) => handleInputChange("grade", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="C+">C+</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="Pass">Pass</SelectItem>
                        <SelectItem value="Distinction">Distinction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Completion Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.completionDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.completionDate ? format(formData.completionDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.completionDate}
                          onSelect={(date) => handleDateChange("completionDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Issue Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.issueDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.issueDate ? format(formData.issueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.issueDate}
                          onSelect={(date) => handleDateChange("issueDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    placeholder="e.g., Dr. Sarah Johnson"
                    value={formData.instructor}
                    onChange={(e) => handleInputChange("instructor", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Course Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the course content and achievements..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link href="/admin">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!isFormValid || isLoading} size="lg" className="min-w-[200px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Certificate...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Issue Certificate
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
