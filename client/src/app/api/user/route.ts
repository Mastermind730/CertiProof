import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

// Helper function to authenticate requests using JWT
async function authenticateRequest(req?: NextRequest) {
  let token: string | undefined;

  // Try to get token from Authorization header first
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Fall back to cookie-based auth
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("auth_token")?.value;
  }

  if (!token) {
    throw new Error("No auth token provided");
  }

  try {
    const payload = (await verifyToken(token)) as { id: string };
    return payload;
  } catch (error) {
    throw new Error("Invalid auth token");
  }
}

export async function GET(req: NextRequest) {
  try {
    const tokenPayload = await authenticateRequest(req);

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: {
        id: tokenPayload.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        wallet_address: true,
        profile_image:true,
        cerificates: {
          select: {
            id: true,
            hash: true,
            offChainUrl: true,
            issuerName: true,
            courseName: true,
            issueDate: true,
            transactionHash: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);

    if (
      error instanceof Error &&
      (error.message === "No auth token provided" ||
        error.message === "Invalid auth token")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tokenPayload = await authenticateRequest();
    const { name, email } = await req.json();

    // Update user details
    const updatedUser = await prisma.user.update({
      where: {
        id: tokenPayload.id,
      },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        wallet_address: true,
        profile_image:true,
      },
    });

    return NextResponse.json({
      status: "success",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (
      error instanceof Error &&
      (error.message === "No auth token provided" ||
        error.message === "Invalid auth token")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
