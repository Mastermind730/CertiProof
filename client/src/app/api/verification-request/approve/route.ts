import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prismadb";
import { sendVerificationApprovedEmail } from "@/lib/email";

// PATCH - Approve or reject verification request
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, action } = body; // action: "APPROVED" or "REJECTED"

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Request ID and action are required" },
        { status: 400 }
      );
    }

    if (action !== "APPROVED" && action !== "REJECTED") {
      return NextResponse.json(
        { error: "Action must be either APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // Update verification request
    const verificationRequest = await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: action,
        respondedAt: new Date(),
      },
      include: {
        certificate: true,
        student: true,
      },
    });

    // If approved, send email to verifier
    if (action === "APPROVED") {
      try {
        await sendVerificationApprovedEmail(
          verificationRequest.verifierEmail,
          verificationRequest.verifierName,
          verificationRequest.student.name,
          verificationRequest.certificate.prn
        );
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verification request ${action.toLowerCase()}`,
      request: verificationRequest,
    });
  } catch (error) {
    console.error("Error updating verification request:", error);
    return NextResponse.json(
      { error: "Failed to update verification request" },
      { status: 500 }
    );
  }
}
