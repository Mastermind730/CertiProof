"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/app/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
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
import { Award, Download, ExternalLink, Calendar, Building2, GraduationCap, FileText, Loader2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

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

export default function StudentCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCertificates();
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
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setIsLoading(false);
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
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Certificates</h1>
          </div>
          <p className="text-muted-foreground">
            View and manage all your blockchain-verified academic certificates
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
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
                Latest Issue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {certificates.length > 0
                  ? format(new Date(certificates[0].issueDate), "MMM yyyy")
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificates List */}
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
