"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Navigation } from "@/app/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Separator } from "@/app/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { ArrowLeft, CalendarIcon, Shield, CheckCircle, Loader2, Wallet, Award, GraduationCap, FileText, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBlockchain } from "@/app/context/DocContext";
import { generateCertificatePDFFile, CertificatePDFData } from "@/lib/certificatePDF";
import { uploadCertificatePDF } from "@/lib/cloudinary";

// Define the shape of the form data
interface CertificateForm {
  prn: string; // Student unique ID
  studentName: string;
  studentEmail: string;
  courseName: string;
  degree: string;
  specialization: string;
  marks: Array<{ subject: string; marks: number }>; // Marks array
  cgpa: string;
  division: string;
  issueDate: Date | undefined;
  completionDate: Date | undefined;
  description: string;
  // Certificate will be generated and uploaded to Cloudinary
}

export default function CreateCertificatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [formData, setFormData] = useState<CertificateForm>({
    prn: "",
    studentName: "",
    studentEmail: "",
    courseName: "",
    degree: "",
    specialization: "",
    marks: [{ subject: "", marks: 0 }],
    cgpa: "",
    division: "",
    issueDate: new Date(), // Default to today
    completionDate: undefined,
    description: "",
  });

  // Destructure what you need from the context
  const { contract, address, connectWallet, isConnecting } = useBlockchain();

  // This useEffect will run when the contract is successfully connected
  useEffect(() => {
    const getOwner = async () => {
      // Add a guard to ensure the contract exists
      if (contract) {
        try {
          // I'm assuming 'owningAuthority' from your original code
          const owner = await (contract as any).owningAuthority();
          console.log("Contract owner:", owner);
        } catch (error) {
          console.error("Error getting owner:", error);
        }
      }
    };
    
    getOwner();
  }, [contract]); // This dependency is correct

  const handleInputChange = (field: keyof CertificateForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: "issueDate" | "completionDate", date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  // Handle marks array changes
  const handleMarksChange = (index: number, field: 'subject' | 'marks', value: string | number) => {
    const newMarks = [...formData.marks];
    newMarks[index] = { ...newMarks[index], [field]: value };
    setFormData((prev) => ({ ...prev, marks: newMarks }));
  };

  const addMarksRow = () => {
    setFormData((prev) => ({
      ...prev,
      marks: [...prev.marks, { subject: "", marks: 0 }],
    }));
  };

  const removeMarksRow = (index: number) => {
    if (formData.marks.length > 1) {
      const newMarks = formData.marks.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, marks: newMarks }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) {
      console.error("Contract not initialized");
      alert("Please connect your wallet first");
      return;
    }
    setIsLoading(true);

    try {
      // Step 1: Generate certificate PDF with QR code
      setLoadingMessage("Generating certificate PDF...");
      
      const pdfData: CertificatePDFData = {
        sno: `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`, // Temporary SNO
        prn: formData.prn,
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        courseName: formData.courseName,
        degree: formData.degree,
        specialization: formData.specialization,
        marks: formData.marks,
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : undefined,
        division: formData.division,
        issuerName: "Your Institution", // TODO: Get from logged-in admin
        issueDate: formData.issueDate?.toISOString() || new Date().toISOString(),
        completionDate: formData.completionDate?.toISOString(),
        verificationUrl: `${window.location.origin}/verify?prn=${formData.prn}`,
      };

      const pdfFile = await generateCertificatePDFFile(pdfData);
      console.log("PDF generated successfully");

      // Step 2: Upload certificate to Cloudinary
      setLoadingMessage("Uploading certificate to cloud storage...");
      const certificateUrl = await uploadCertificatePDF(pdfFile, formData.prn);
      console.log("Certificate uploaded to:", certificateUrl);

      // Step 3: Create certificate in database and get JWT hash
      setLoadingMessage("Creating certificate record...");
      const token = localStorage.getItem('token');
      const response = await fetch('/api/certificate/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prn: formData.prn,
          studentName: formData.studentName,
          studentEmail: formData.studentEmail,
          marks: formData.marks,
          courseName: formData.courseName,
          degree: formData.degree,
          specialization: formData.specialization,
          cgpa: formData.cgpa ? parseFloat(formData.cgpa) : undefined,
          division: formData.division,
          issueDate: formData.issueDate?.toISOString(),
          completionDate: formData.completionDate?.toISOString(),
          certificateUrl,
          offChainUrl: certificateUrl,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create certificate');
      }

      // Step 4: Issue certificate on blockchain (PRN -> Certificate Hash mapping)
      setLoadingMessage("Recording on blockchain... Please confirm the transaction in your wallet and keep this tab active.");
      
      let tx;
      try {
        tx = await (contract as any).issueCertificate(
          formData.prn,
          data.certificate.certificateHash
        );
        console.log("Transaction submitted:", tx.hash);
        
        setLoadingMessage("Transaction submitted. Waiting for blockchain confirmation...");
        await tx.wait(); // Wait for confirmation
        console.log("Transaction confirmed");
      } catch (txError: any) {
        // Handle specific Web3 errors
        if (txError.code === -32002) {
          throw new Error("Transaction failed: Please keep this tab active and in focus while the transaction is being processed.");
        } else if (txError.code === 4001) {
          throw new Error("Transaction rejected: You rejected the transaction in your wallet.");
        } else if (txError.message?.includes("user rejected")) {
          throw new Error("Transaction rejected by user.");
        } else {
          throw new Error(`Blockchain error: ${txError.message || "Unknown error occurred"}`);
        }
      }
      
      // Step 5: Update certificate with transaction hash
      setLoadingMessage("Finalizing certificate...");
      await fetch('/api/certificate/create', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prn: formData.prn,
          transactionHash: tx.hash,
        }),
      });
      
      setIsSuccess(true);
      setTimeout(() => router.push("/admin"), 3000);

    } catch (error: any) {
      console.error("Error issuing certificate:", error);
      
      // Provide user-friendly error messages
      let errorMessage = "Failed to issue certificate";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const isFormValid =
    formData.prn && 
    formData.studentName && 
    formData.studentEmail && 
    formData.courseName && 
    formData.degree &&
    formData.marks.length > 0 &&
    formData.marks.every(m => m.subject && m.marks >= 0) &&
    formData.issueDate;

  // Render a loading/connect state if the wallet is not connected yet
  if (!address) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container flex items-center justify-center" style={{ minHeight: '80vh' }}>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to access the certificate creation page.
            </p>
            <Button onClick={connectWallet} disabled={isConnecting} size="lg">
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render success screen
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
                <p className="text-muted-foreground mb-6">
                  The certificate has been issued and recorded on the blockchain. You will be redirected shortly.
                </p>
                <Button onClick={() => router.push("/admin")}>
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the main form once connected
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Issue New Certificate</h1>
              <p className="text-muted-foreground">
                Create and issue a blockchain-verified academic certificate
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student & Degree Info - Side by Side */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Information */}
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Student Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prn" className="text-sm font-medium">
                    PRN (Student ID) <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="prn" 
                    placeholder="PRN2025001234" 
                    value={formData.prn} 
                    onChange={(e) => handleInputChange("prn", e.target.value)} 
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentName" className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="studentName" 
                    placeholder="John Doe" 
                    value={formData.studentName} 
                    onChange={(e) => handleInputChange("studentName", e.target.value)} 
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentEmail" className="text-sm font-medium">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="studentEmail" 
                    type="email" 
                    placeholder="john.doe@student.edu" 
                    value={formData.studentEmail} 
                    onChange={(e) => handleInputChange("studentEmail", e.target.value)} 
                    required
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Degree Information */}
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Degree Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="degree" className="text-sm font-medium">
                    Degree Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.degree} onValueChange={(value) => handleInputChange("degree", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select degree type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bachelor of Science">Bachelor of Science</SelectItem>
                      <SelectItem value="Bachelor of Arts">Bachelor of Arts</SelectItem>
                      <SelectItem value="Bachelor of Engineering">Bachelor of Engineering</SelectItem>
                      <SelectItem value="Bachelor of Technology">Bachelor of Technology</SelectItem>
                      <SelectItem value="Master of Science">Master of Science</SelectItem>
                      <SelectItem value="Master of Arts">Master of Arts</SelectItem>
                      <SelectItem value="Master of Technology">Master of Technology</SelectItem>
                      <SelectItem value="Doctor of Philosophy">Doctor of Philosophy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseName" className="text-sm font-medium">
                    Course/Major <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="courseName" 
                    placeholder="Computer Science" 
                    value={formData.courseName} 
                    onChange={(e) => handleInputChange("courseName", e.target.value)} 
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm font-medium">Specialization</Label>
                  <Input 
                    id="specialization" 
                    placeholder="Artificial Intelligence (optional)" 
                    value={formData.specialization} 
                    onChange={(e) => handleInputChange("specialization", e.target.value)}
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Academic Performance */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Academic Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Subject-wise Marks <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-3">
                  {formData.marks.map((mark, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Input 
                          placeholder="Subject name (e.g., Mathematics)" 
                          value={mark.subject}
                          onChange={(e) => handleMarksChange(index, 'subject', e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="w-32">
                        <Input 
                          type="number" 
                          placeholder="Marks" 
                          min="0"
                          max="100"
                          value={mark.marks || ''}
                          onChange={(e) => handleMarksChange(index, 'marks', parseFloat(e.target.value) || 0)}
                          required
                          className="h-11"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeMarksRow(index)}
                        disabled={formData.marks.length === 1}
                        className="h-11 w-11"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addMarksRow} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Subject
                </Button>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cgpa" className="text-sm font-medium">CGPA (out of 10)</Label>
                  <Input 
                    id="cgpa" 
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="8.5" 
                    value={formData.cgpa} 
                    onChange={(e) => handleInputChange("cgpa", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division" className="text-sm font-medium">Division/Class</Label>
                  <Select value={formData.division} onValueChange={(value) => handleInputChange("division", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Class with Distinction">First Class with Distinction</SelectItem>
                      <SelectItem value="First Class">First Class</SelectItem>
                      <SelectItem value="Second Class">Second Class</SelectItem>
                      <SelectItem value="Pass Class">Pass Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Additional Info */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Dates & Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Issue Date <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        type="button"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !formData.issueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.issueDate ? format(formData.issueDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar 
                        mode="single" 
                        selected={formData.issueDate} 
                        onSelect={(date) => handleDateChange("issueDate", date)} 
                        initialFocus
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Course Completion Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        type="button"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !formData.completionDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.completionDate ? format(formData.completionDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar 
                        mode="single" 
                        selected={formData.completionDate} 
                        onSelect={(date) => handleDateChange("completionDate", date)} 
                        initialFocus
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Course Description (Optional)
                </Label>
                <Textarea 
                  id="description" 
                  placeholder="Brief description of the course or program..." 
                  value={formData.description} 
                  onChange={(e) => handleInputChange("description", e.target.value)} 
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 pb-8">
            <Button asChild variant="outline" type="button" size="lg">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || isLoading} 
              size="lg" 
              className="min-w-[240px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {loadingMessage || "Processing..."}
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
  );
}