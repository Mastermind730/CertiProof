"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/app/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/components/ui/alert";
import { Award, Download, ExternalLink, Calendar, Building2, GraduationCap, FileText, Loader2, ShieldCheck, Bell, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/hooks/use-toast";

interface Certificate {
  id: string;
  prn: string;
  sno: string;
  hash: string;
  studentName: string;
  studentEmail: string;
  marks: Array<{ subject: string; marks: number }>;
  issuerId: string;
  issuerName: string;
  courseName: string;
  degree?: string;
  specialization?: string;
  cgpa?: number;
  division?: string;
  issueDate: string;
  completionDate?: string;
  certificateUrl: string;
  offChainUrl: string;
  transactionHash?: string;
  createdAt: string;
}

interface VerificationRequest {
  id: string;
  certificateId: string;
  verifierName: string;
  verifierEmail: string;
  verifierOrg?: string;
  purpose?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  respondedAt?: string;
  certificate: {
    prn: string;
    sno: string;
    courseName: string;
    degree?: string;
  };
}

export default function StudentCertificatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string>("");

  useEffect(() => {
    fetchCertificates();
    fetchVerificationRequests();
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchVerificationRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/certificate/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch certificates");
      }

      const data = await response.json();
      setCertificates(data.certificates || []);
      
      // Get student ID from first certificate
      if (data.certificates && data.certificates.length > 0) {
        const certResponse = await fetch(`/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (certResponse.ok) {
          const userData = await certResponse.json();
          setStudentId(userData.id);
        }
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVerificationRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get user info to get student ID
      const userResponse = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) return;

      const userData = await userResponse.json();
      const sid = userData.id;
      setStudentId(sid);

      const response = await fetch(`/api/verification-request?studentId=${sid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching verification requests:", error);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/verification-request/approve", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          action: "APPROVED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve request");
      }

      toast({
        title: "Request Approved",
        description: "The verifier has been notified and can now view the certificate.",
      });

      fetchVerificationRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        title: "Error",
        description: "Failed to approve the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/verification-request/approve", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          action: "REJECTED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject request");
      }

      toast({
        title: "Request Rejected",
        description: "The verification request has been denied.",
      });

      fetchVerificationRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Failed to reject the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleViewDetails = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsDialogOpen(true);
  };

  const handleDownload = (certificateUrl: string) => {
    window.open(certificateUrl, "_blank");
  };

  const calculateTotalMarks = (marks: Array<{ subject: string; marks: number }>) => {
    return marks.reduce((sum, mark) => sum + mark.marks, 0);
  };

  const calculatePercentage = (marks: Array<{ subject: string; marks: number }>) => {
    const total = calculateTotalMarks(marks);
    const maxMarks = marks.length * 100;
    return ((total / maxMarks) * 100).toFixed(2);
  };

  const pendingRequests = verificationRequests.filter(r => r.status === "PENDING");
  const approvedRequests = verificationRequests.filter(r => r.status === "APPROVED");
  const rejectedRequests = verificationRequests.filter(r => r.status === "REJECTED");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container flex items-center justify-center" style={{ minHeight: "80vh" }}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your certificates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">My Dashboard</h1>
              </div>
              <p className="text-muted-foreground">
                Manage your certificates and verification requests
              </p>
            </div>
            {pendingRequests.length > 0 && (
              <Alert className="w-auto border-2 border-primary">
                <Bell className="h-4 w-4" />
                <AlertTitle>New Requests!</AlertTitle>
                <AlertDescription>
                  You have {pendingRequests.length} pending verification request{pendingRequests.length > 1 ? 's' : ''}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{certificates.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {pendingRequests.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified On-Chain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {certificates.filter(c => c.transactionHash).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {approvedRequests.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Certificates and Verification Requests */}
        <Tabs defaultValue="certificates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="certificates">
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Bell className="h-4 w-4 mr-2" />
              Verification Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            {certificates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Award className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You don't have any certificates issued yet. Once your institution issues a certificate,
                    it will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Certificates</CardTitle>
                  <CardDescription>
                    Click on any certificate to view full details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate</TableHead>
                        <TableHead>Degree</TableHead>
                        <TableHead>Issuer</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates.map((certificate) => (
                        <TableRow
                          key={certificate.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewDetails(certificate)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{certificate.courseName}</div>
                              <div className="text-sm text-muted-foreground">
                                {certificate.sno}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{certificate.degree || "N/A"}</div>
                              {certificate.specialization && (
                                <div className="text-sm text-muted-foreground">
                                  {certificate.specialization}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {certificate.issuerName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(certificate.issueDate), "MMM dd, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {certificate.transactionHash ? (
                              <Badge variant="default" className="gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(certificate.certificateUrl);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Verification Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Pending Approval ({pendingRequests.length})
                  </CardTitle>
                  <CardDescription>
                    Review and approve or reject verification requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{request.certificate.prn}</Badge>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm font-medium">{request.certificate.courseName}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Requester:</span>
                              <p className="font-medium">{request.verifierName}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>
                              <p className="font-medium">{request.verifierEmail}</p>
                            </div>
                            {request.verifierOrg && (
                              <div>
                                <span className="text-muted-foreground">Organization:</span>
                                <p className="font-medium">{request.verifierOrg}</p>
                              </div>
                            )}
                            {request.purpose && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Purpose:</span>
                                <p className="font-medium">{request.purpose}</p>
                              </div>
                            )}
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Requested:</span>
                              <p className="font-medium">{format(new Date(request.requestedAt), "PPpp")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="flex-1"
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="flex-1"
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Approved Requests */}
            {approvedRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary" />
                    Approved ({approvedRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requester</TableHead>
                        <TableHead>Certificate</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Approved On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.verifierName}</div>
                              <div className="text-sm text-muted-foreground">{request.verifierEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.certificate.courseName}</div>
                              <div className="text-sm text-muted-foreground">{request.certificate.prn}</div>
                            </div>
                          </TableCell>
                          <TableCell>{request.verifierOrg || "—"}</TableCell>
                          <TableCell>{request.respondedAt ? format(new Date(request.respondedAt), "PPp") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Rejected Requests */}
            {rejectedRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    Rejected ({rejectedRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requester</TableHead>
                        <TableHead>Certificate</TableHead>
                        <TableHead>Rejected On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.verifierName}</div>
                              <div className="text-sm text-muted-foreground">{request.verifierEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.certificate.courseName}</div>
                              <div className="text-sm text-muted-foreground">{request.certificate.prn}</div>
                            </div>
                          </TableCell>
                          <TableCell>{request.respondedAt ? format(new Date(request.respondedAt), "PPp") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {verificationRequests.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Verification Requests</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You haven't received any verification requests yet. When someone attempts to verify
                    your certificate, you'll see it here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Certificate Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCertificate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Certificate Details
                </DialogTitle>
                <DialogDescription>
                  {selectedCertificate.sno}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Student Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Student Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedCertificate.studentName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PRN:</span>
                      <p className="font-medium font-mono">{selectedCertificate.prn}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedCertificate.studentEmail}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Degree Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Degree Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Degree:</span>
                      <p className="font-medium">{selectedCertificate.degree || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Course/Major:</span>
                      <p className="font-medium">{selectedCertificate.courseName}</p>
                    </div>
                    {selectedCertificate.specialization && (
                      <div>
                        <span className="text-muted-foreground">Specialization:</span>
                        <p className="font-medium">{selectedCertificate.specialization}</p>
                      </div>
                    )}
                    {selectedCertificate.division && (
                      <div>
                        <span className="text-muted-foreground">Division:</span>
                        <p className="font-medium">{selectedCertificate.division}</p>
                      </div>
                    )}
                    {selectedCertificate.cgpa && (
                      <div>
                        <span className="text-muted-foreground">CGPA:</span>
                        <p className="font-medium">{selectedCertificate.cgpa}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Marks */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Academic Performance</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-right">Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCertificate.marks.map((mark, index) => (
                          <TableRow key={index}>
                            <TableCell>{mark.subject}</TableCell>
                            <TableCell className="text-right font-medium">
                              {mark.marks}/100
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-semibold">Total</TableCell>
                          <TableCell className="text-right font-semibold">
                            {calculateTotalMarks(selectedCertificate.marks)}/{selectedCertificate.marks.length * 100}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-semibold">Percentage</TableCell>
                          <TableCell className="text-right font-semibold">
                            {calculatePercentage(selectedCertificate.marks)}%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                {/* Issuer Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Issuer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Issued By:</span>
                      <p className="font-medium">{selectedCertificate.issuerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Issue Date:</span>
                      <p className="font-medium">
                        {format(new Date(selectedCertificate.issueDate), "MMMM dd, yyyy")}
                      </p>
                    </div>
                    {selectedCertificate.completionDate && (
                      <div>
                        <span className="text-muted-foreground">Completion Date:</span>
                        <p className="font-medium">
                          {format(new Date(selectedCertificate.completionDate), "MMMM dd, yyyy")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Blockchain Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Blockchain Verification
                  </h3>
                  <div className="space-y-3 text-sm">
                    {selectedCertificate.transactionHash ? (
                      <>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="default" className="ml-2">Verified On-Chain</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Transaction Hash:</span>
                          <p className="font-mono text-xs mt-1 p-2 bg-muted rounded break-all">
                            {selectedCertificate.transactionHash}
                          </p>
                        </div>
                      </>
                    ) : (
                      <Badge variant="secondary">Pending Blockchain Confirmation</Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleDownload(selectedCertificate.certificateUrl)}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Certificate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedCertificate.certificateUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
