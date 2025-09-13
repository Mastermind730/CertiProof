import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { cookies } from "next/headers";


export async function POST(req: NextRequest) {
  try {
    const userData = await req.json();
    const { email, name, wallet_address } = userData;

    // Find or create user
    const user = await prisma.user.upsert({
      where: { 
        wallet_address
       },
     
      create: {
        email,
        name,
        wallet_address,
        
      },
    });

    // Create session
    const sessionToken = crypto.randomUUID();
    cookies().set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 1 week
    });

    return NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
