import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { createToken, type JWTPayload } from "@/lib/jwt";

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
    const profile_image = userInfo.profile_image || "";

    // Find or create user
    const user = await prisma.user.upsert({
      where: {
        wallet_address,
      },
      update: {
        // Update these fields if they're provided and the user already exists
        ...(email && { email }),
        ...(name && { name }),
        ...(profile_image && {profile_image}),
      },
      create: {
        email,
        name,
        wallet_address,
        profile_image,
      },
    });

    // Create JWT payload
    const tokenPayload: JWTPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      wallet_address: user.wallet_address,
      profile_image: user.profile_image || "",
    };

    // Generate JWT token
    const token = await createToken(tokenPayload);

    // Create response
    const response = NextResponse.json({
      status: "success",
      user: tokenPayload,
    });

    // Set JWT token in cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 1 day (matching JWT expiration)
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
