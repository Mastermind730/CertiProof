"use client"

import { useState } from "react"
import { Navigation } from "@/app/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Award, Download, Share2, Eye, Calendar, Building, User, Shield, ExternalLink, Copy, Check } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Separator } from "@/app/components/ui/separator"
import { toast } from "@/app/hooks/use-toast"

interface StudentCertificate {
  id: string
  certificateId: string
  courseName: string
  courseCode: string
  institution: string
  grade: string
  issueDate: string
  completionDate: string
  status: "active" | "pending" | "revoked"
  blockchainTxId: string
  certificateHash: string
  credits: number
  instructor: string
  description: string
}

interface StudentProfile {
  id: string
  fullName: string
  email: string
  phone: string
  address: string
  institution: string
  studentId: string
  enrollmentDate: string
  avatar: string
}

const mockProfile: StudentProfile = {
  id: "1",
  fullName: "John Doe",
  email: "john.doe@student.edu",
  phone: "+1 (555) 123-4567",
  address: "123 Student Ave, University City, CA 90210",
  institution: "Tech University",
  studentId: "STU-2024-001",
  enrollmentDate: "2022-09-01",
  avatar: "/student-avatar.png",
}

const mockCertificates: StudentCertificate[] = [
  {
    id: "1",
    certificateId: "CERT-2024-001234",
    courseName: "Advanced Web Development",
    courseCode: "CS-401",
    institution: "Tech University",
    grade: "A+",
    issueDate: "2024-03-15",
    completionDate: "2024-03-10",
    status: "active",
    blockchainTxId: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    certificateHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
    credits: 4,
    instructor: "Dr. Sarah Johnson",
    description:
      "Comprehensive course covering modern web development technologies including React, Node.js, and blockchain integration.",
  },
  {
    id: "2",
    certificateId: "CERT-2024-001235",
    courseName: "Data Structures and Algorithms",
    courseCode: "CS-301",
    institution: "Tech University",
    grade: "A",
    issueDate: "2024-02-20",
    completionDate: "2024-02-15",
    status: "active",
    blockchainTxId: "0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567891",
    certificateHash: "0x2b3c4d5e6f7890ab1cdef234567890abcdef123",
    credits: 3,
    instructor: "Prof. Michael Chen",
    description: "Fundamental algorithms and data structures with practical implementation exercises.",
  },
  {
    id: "3",
    certificateId: "CERT-2024-001236",
    courseName: "Machine Learning Basics",
    courseCode: "CS-501",
    institution: "Tech University",
    grade: "B+",
    issueDate: "2024-01-30",
    completionDate: "2024-01-25",
    status: "pending",
    blockchainTxId: "",
    certificateHash: "",
    credits: 4,
    instructor: "Dr. Emily Rodriguez",
    description: "Introduction to machine learning concepts, algorithms, and practical applications.",
  },
]

export default function StudentPage() {
  const [profile, setProfile] = useState<StudentProfile>(mockProfile)
  const [certificates, setCertificates] = useState<StudentCertificate[]>(mockCertificates)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeCertificates = certificates.filter((cert) => cert.status === "active")
  const pendingCertificates = certificates.filter((cert) => cert.status === "pending")
  const totalCredits = activeCertificates.reduce((sum, cert) => sum + cert.credits, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast({
        title: "Copied to clipboard",
        description: "Certificate ID has been copied to your clipboard.",
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const shareProfile = async () => {
    const profileUrl = `${window.location.origin}/student/profile/${profile.id}`
    try {
      await navigator.clipboard.writeText(profileUrl)
      toast({
        title: "Profile link copied",
        description: "Your profile link has been copied to clipboard.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy profile link. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    // <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.fullName} />
                <AvatarFallback className="text-lg">
                  {profile.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
                  <Shield className="h-4 w-4" />
                  <span>Student Portal</span>
                </div>
                <h1 className="text-3xl font-bold">Welcome back, {profile.fullName.split(" ")[0]}!</h1>
                <p className="text-muted-foreground">
                  {profile.institution} • Student ID: {profile.studentId}
                </p>
              </div>
            </div>
            <Button onClick={shareProfile} variant="outline" className="mt-4 md:mt-0 bg-transparent">
              <Share2 className="mr-2 h-4 w-4" />
              Share Profile
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{certificates.length}</p>
                    <p className="text-sm text-muted-foreground">Total Certificates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeCertificates.length}</p>
                    <p className="text-sm text-muted-foreground">Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingCertificates.length}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Building className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{totalCredits}</p>
                    <p className="text-sm text-muted-foreground">Total Credits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="certificates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="certificates">My Certificates</TabsTrigger>
              <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="certificates" className="space-y-6">
              {/* Certificates Grid */}
              <div className="grid gap-6">
                {certificates.map((certificate) => (
                  <Card key={certificate.id} className="border-2 hover:border-primary/50 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-xl">{certificate.courseName}</CardTitle>
                            {getStatusBadge(certificate.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>{certificate.institution}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
                            </span>
                            <Badge variant="outline" className="font-semibold">
                              {certificate.grade}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{certificate.description}</p>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Instructor:</span>
                            <span className="text-sm">{certificate.instructor}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Credits:</span>
                            <span className="text-sm">{certificate.credits}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Completed:</span>
                            <span className="text-sm">{new Date(certificate.completionDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {certificate.status === "active" && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Certificate ID:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1 text-xs font-mono"
                                onClick={() => copyToClipboard(certificate.certificateId, certificate.id)}
                              >
                                {certificate.certificateId}
                                {copiedId === certificate.id ? (
                                  <Check className="ml-1 h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="ml-1 h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ExternalLink className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Blockchain:</span>
                              <span className="text-xs font-mono text-muted-foreground">
                                {certificate.blockchainTxId.substring(0, 16)}...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {certificate.status === "active" && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Shield className="h-4 w-4" />
                              <span>Blockchain Verified</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <Share2 className="mr-2 h-4 w-4" />
                              Share Certificate
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={profile.fullName} readOnly />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={profile.email} readOnly />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={profile.phone} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={profile.address} />
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="institution">Institution</Label>
                      <Input id="institution" value={profile.institution} readOnly />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input id="studentId" value={profile.studentId} readOnly />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enrollmentDate">Enrollment Date</Label>
                      <Input
                        id="enrollmentDate"
                        value={new Date(profile.enrollmentDate).toLocaleDateString()}
                        readOnly
                      />
                    </div>

                    <div className="pt-4">
                      <Button>Update Profile</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Account Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Password</h4>
                        <p className="text-sm text-muted-foreground">Last updated 30 days ago</p>
                      </div>
                      <Button variant="outline">Change Password</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    // </ProtectedRoute>
  )
}
