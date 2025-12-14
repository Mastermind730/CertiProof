import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { verifyToken } from '@/lib/jwt';

// GET /api/certificate/all - Get all certificates (admin only)
export async function GET(req: NextRequest) {
  try {
    // Verify the user is authenticated and is an admin
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'verified', 'pending', 'all'
    const search = searchParams.get('search'); // Search by name, prn, course

    // Build where clause
    const where: any = {};
    
    // Filter by status
    if (status === 'verified') {
      where.transactionHash = { not: null };
    } else if (status === 'pending') {
      where.transactionHash = null;
    }
    
    // Search filter
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { prn: { contains: search, mode: 'insensitive' } },
        { courseName: { contains: search, mode: 'insensitive' } },
        { sno: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get all certificates with owner info
    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image: true,
          },
        },
      },
    });

    // Calculate stats
    const stats = {
      total: await prisma.certificate.count(),
      verified: await prisma.certificate.count({
        where: { transactionHash: { not: null } },
      }),
      pending: await prisma.certificate.count({
        where: { transactionHash: null },
      }),
    };

    return NextResponse.json({
      success: true,
      certificates,
      stats,
      count: certificates.length,
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
