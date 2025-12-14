import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { approvalRequests } from "../upload/route"
import { prisma } from "@/lib/prismadb"

// GET /api/verify/approval - Handle approval/rejection and status polling
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get("requestId")
  const action = searchParams.get("action")

  if (!requestId) {
    return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
  }

  // Check database first for the verification request
  let dbRequest;
  try {
    dbRequest = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: {
        certificate: true,
      },
    });
  } catch (error) {
    console.error("Database query error:", error);
  }

  const request = approvalRequests.get(requestId)
  
  if (!request && !dbRequest) {
    return NextResponse.json({ error: "Invalid or expired request" }, { status: 404 })
  }

  // Handle approve/reject actions
  if (action === "approve") {
    if (request) {
      request.status = "approved"
      approvalRequests.set(requestId, request)
    }
    
    // Also update database if exists
    if (dbRequest) {
      await prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          respondedAt: new Date(),
        },
      });
    }
    
    return new NextResponse(
      `
      <html>
        <head>
          <title>Verification Approved</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #4CAF50; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .icon { font-size: 60px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Verification Approved</h1>
            <p>You have successfully approved the certificate verification request.</p>
            <p>The requester can now proceed with viewing the certificate details.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    )
  }

  if (action === "reject") {
    if (request) {
      request.status = "rejected"
      approvalRequests.set(requestId, request)
    }
    
    // Also update database if exists
    if (dbRequest) {
      await prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          respondedAt: new Date(),
        },
      });
    }
    
    return new NextResponse(
      `
      <html>
        <head>
          <title>Verification Rejected</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #f44336; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .icon { font-size: 60px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Verification Rejected</h1>
            <p>You have rejected the certificate verification request.</p>
            <p>The requester will not be able to view the certificate details.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    )
  }

  // Status polling - return current status
  // Prioritize database status if available
  if (dbRequest) {
    const status = dbRequest.status === "APPROVED" ? "approved" : 
                   dbRequest.status === "REJECTED" ? "rejected" : "pending";
    
    return NextResponse.json({
      status,
      certificateId: dbRequest.certificateId,
      prn: dbRequest.certificate.prn,
      verifierEmail: dbRequest.verifierEmail,
      payload: status === "approved" ? request?.payload : null,
    });
  }
  
  // Fall back to in-memory status (should always exist at this point)
  if (request) {
    return NextResponse.json({
      status: request.status,
      certificateId: request.certificateId,
      payload: request.status === "approved" ? request.payload : null,
    });
  }
  
  // Shouldn't reach here, but handle gracefully
  return NextResponse.json({ error: "Request not found" }, { status: 404 });
}
