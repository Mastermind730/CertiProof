import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

export async function POST(req: NextRequest) {
  try {
    const { address, userInfo } = await req.json();
    
    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Extract user information from userInfo object
    const email = userInfo?.email || null;
    const name = userInfo?.name || null;
    const wallet_address = address;

    // Find or create user
    const user = await prisma.user.upsert({
      where: { 
        wallet_address
      },
      update: {
        // Update these fields if they're provided and the user already exists
        ...(email && { email }),
        ...(name && { name }),
      },
      create: {
        email,
        name,
        wallet_address,
      },
    });

    // Create session token
    const sessionToken = crypto.randomUUID();
    
    // Create response
    const response = NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        wallet_address: user.wallet_address,
      },
    });

    // Set cookie on the response
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 1 week
    });

    return response;
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}