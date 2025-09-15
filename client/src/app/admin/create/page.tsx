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




interface CertificateForm {
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
  const [formData, setFormData] = useState<CertificateForm>({
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

  const {contract} = useBlockchain();
  console.log(contract,"contract");

  
  //getting the contract and account from the context 
useEffect(() => {
    const getOwner = async () => {
      if (contract) {
        try {
          const owner = await contract.owningAuthority();
          console.log("Contract owner:", owner);
        } catch (error) {
          console.error("Error getting owner:", error);
        }
      }
    };
    
    getOwner();
  }, [contract]);

  

  const handleInputChange = (field: keyof CertificateForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (field: "issueDate" | "completionDate", date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: date }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  if (!contract) {
    console.error("Contract not initialized");
    setIsLoading(false);
    return;
  }

  try {
    // Prepare certificate data
    const name = formData.studentName;
    const details = `
      Email: ${formData.studentEmail},
      Course: ${formData.courseName} (${formData.courseCode}),
      Grade: ${formData.grade},
      Credits: ${formData.credits},
      Instructor: ${formData.instructor},
      IssueDate: ${formData.issueDate?.toISOString() ?? ""},
      CompletionDate: ${formData.completionDate?.toISOString() ?? ""},
      Description: ${formData.description}
    `;

    // Send transaction to blockchain
    const tx = await contract.issueCertificate(name, details);
    console.log("Transaction submitted:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    setIsLoading(false);
    setIsSuccess(true);

    // Redirect after success
    setTimeout(() => {
      router.push("/admin");
    }, 2000);
  } catch (error) {
    console.error("Error issuing certificate:", error);
    setIsLoading(false);
  }
};


  const isFormValid =
    formData.studentName && formData.studentEmail && formData.courseName && formData.grade && formData.issueDate

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-4">
                  Certificate Created Successfully!
                </h2>
                <p className="text-green-700 dark:text-green-300 mb-6">
                  The certificate has been issued and recorded on the blockchain. The student will receive an email
                  notification.
                </p>
                <div className="space-y-2 text-sm text-green-600 dark:text-green-400">
                  <p>
                    Certificate ID:{" "}
                    <span className="font-mono">
                      CERT-2024-
                      {Math.floor(Math.random() * 999999)
                        .toString()
                        .padStart(6, "0")}
                    </span>
                  </p>
                  <p>
                    Blockchain Transaction:{" "}
                    <span className="font-mono">0x{Math.random().toString(16).substr(2, 16)}...</span>
                  </p>
                </div>
                <Button className="mt-6" onClick={() => router.push("/admin")}>
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
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
