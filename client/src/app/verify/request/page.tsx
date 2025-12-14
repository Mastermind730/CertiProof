"use client";

import { useState } from "react";
import { Navigation } from "@/app/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { ShieldCheck, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/hooks/use-toast";

export default function VerificationRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"idle" | "pending" | "approved" | "rejected">("idle");
  const [requestId, setRequestId] = useState<string>("");

  const [formData, setFormData] = useState({
    prn: searchParams.get("prn") || "",
    verifierName: "",
    verifierEmail: "",
    verifierOrg: "",
    purpose: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/verification-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Existing pending request
          setRequestStatus("pending");
          setRequestId(data.requestId);
        } else {
          throw new Error(data.error || "Failed to submit request");
        }
      } else {
        setRequestStatus(data.status === "PENDING" ? "pending" : "approved");
        setRequestId(data.requestId);
        toast({
          title: "Request Submitted",
          description: "The certificate owner will be notified. You'll receive an email once they respond.",
        });
      }
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit verification request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkRequestStatus = async () => {
    if (!requestId) return;

    try {
      const response = await fetch(`/api/verification-request?requestId=${requestId}`);
      const data = await response.json();

      if (data.request) {
        setRequestStatus(data.request.status.toLowerCase());
      }
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">Request Certificate Verification</h1>
          </div>
          <p className="text-muted-foreground">
            Submit a request to verify a certificate. The certificate owner will be notified.
          </p>
        </div>

        {requestStatus === "idle" ? (
          <Card>
            <CardHeader>
              <CardTitle>Verification Request Form</CardTitle>
              <CardDescription>
                Fill in your details to request access to view a certificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prn">
                    Certificate PRN <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="prn"
                    placeholder="Enter certificate PRN"
                    value={formData.prn}
                    onChange={(e) => handleInputChange("prn", e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    The unique identifier of the certificate you want to verify
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verifierName">
                    Your Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="verifierName"
                    placeholder="John Doe"
                    value={formData.verifierName}
                    onChange={(e) => handleInputChange("verifierName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verifierEmail">
                    Your Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="verifierEmail"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.verifierEmail}
                    onChange={(e) => handleInputChange("verifierEmail", e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    You'll receive approval/rejection notifications at this email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verifierOrg">Organization (Optional)</Label>
                  <Input
                    id="verifierOrg"
                    placeholder="Company Name"
                    value={formData.verifierOrg}
                    onChange={(e) => handleInputChange("verifierOrg", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Verification (Optional)</Label>
                  <Textarea
                    id="purpose"
                    placeholder="e.g., Employment verification, background check..."
                    value={formData.purpose}
                    onChange={(e) => handleInputChange("purpose", e.target.value)}
                    rows={3}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Privacy Notice</AlertTitle>
                  <AlertDescription>
                    Your request will be sent to the certificate owner. They can approve or reject
                    your request. You'll be notified via email of their decision.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/verify")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : requestStatus === "pending" ? (
          <Card className="border-2 border-primary">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-16 w-16 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Request Pending</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Your verification request has been submitted successfully. The certificate owner has
                been notified via email and will review your request shortly.
              </p>
              <div className="space-y-3 w-full max-w-md">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>What happens next?</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>The certificate owner receives an email notification</li>
                      <li>They review your request details</li>
                      <li>You'll receive an email with their decision</li>
                      <li>If approved, you can view the certificate details</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={checkRequestStatus}
                    className="flex-1"
                  >
                    Check Status
                  </Button>
                  <Button
                    onClick={() => router.push("/verify")}
                    className="flex-1"
                  >
                    Back to Verify
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : requestStatus === "approved" ? (
          <Card className="border-2 border-secondary">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-secondary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Request Approved!</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                The certificate owner has approved your verification request. You can now view the
                certificate details.
              </p>
              <Button
                onClick={() => router.push(`/verify?prn=${formData.prn}&email=${formData.verifierEmail}`)}
                size="lg"
              >
                View Certificate
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
