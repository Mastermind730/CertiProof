import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { verifyToken } from '@/lib/jwt';

// GET /api/certificate/user - Get all certificates for the logged-in user
export async function GET(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { wallet_address: decoded.wallet_address },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all certificates for this user
    const certificates = await prisma.certificate.findMany({
      where: {
        ownerId: user.id,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      certificates,
      count: certificates.length,
    });

  } catch (error) {
    console.error('Error fetching user certificates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
