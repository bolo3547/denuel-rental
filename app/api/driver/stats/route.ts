import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get driver profile
    const driver = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get trip counts
    const [
      totalTrips,
      todayTrips,
      weekTrips,
      completedTrips,
      cancelledTrips,
    ] = await Promise.all([
      prisma.transportRequest.count({
        where: { driverId: driver.id },
      }),
      prisma.transportRequest.count({
        where: {
          driverId: driver.id,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.transportRequest.count({
        where: {
          driverId: driver.id,
          createdAt: { gte: weekStart },
        },
      }),
      prisma.transportRequest.count({
        where: {
          driverId: driver.id,
          status: 'COMPLETED',
        },
      }),
      prisma.transportRequest.count({
        where: {
          driverId: driver.id,
          status: 'CANCELLED',
        },
      }),
    ]);

    // Get earnings
    const earnings = await prisma.transportRequest.aggregate({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
      },
      _sum: {
        fare: true,
      },
    });

    const todayEarnings = await prisma.transportRequest.aggregate({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
        completedAt: { gte: todayStart },
      },
      _sum: {
        fare: true,
      },
    });

    const weekEarnings = await prisma.transportRequest.aggregate({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
        completedAt: { gte: weekStart },
      },
      _sum: {
        fare: true,
      },
    });

    // Get average rating
    const ratings = await prisma.transportRating.aggregate({
      where: {
        transportRequest: {
          driverId: driver.id,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // Calculate acceptance rate (accepted / total assigned)
    const totalAssigned = await prisma.transportRequest.count({
      where: { driverId: driver.id },
    });
    const accepted = await prisma.transportRequest.count({
      where: {
        driverId: driver.id,
        status: { in: ['ACCEPTED', 'PICKED_UP', 'IN_PROGRESS', 'COMPLETED'] },
      },
    });
    const acceptanceRate = totalAssigned > 0 ? (accepted / totalAssigned) * 100 : 100;

    // Calculate completion rate
    const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 100;

    return NextResponse.json({
      driver: {
        id: driver.id,
        name: driver.user.name,
        email: driver.user.email,
        image: driver.user.image,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehiclePlate: driver.vehiclePlate,
        vehicleColor: driver.vehicleColor,
        isAvailable: driver.isAvailable,
        isVerified: driver.isVerified,
      },
      stats: {
        totalTrips,
        todayTrips,
        weekTrips,
        completedTrips,
        cancelledTrips,
        totalEarnings: earnings._sum.fare || 0,
        todayEarnings: todayEarnings._sum.fare || 0,
        weekEarnings: weekEarnings._sum.fare || 0,
        averageRating: ratings._avg.rating || 0,
        totalRatings: ratings._count.rating || 0,
        acceptanceRate: Math.round(acceptanceRate),
        completionRate: Math.round(completionRate),
      },
    });
  } catch (error) {
    console.error('Failed to fetch driver stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver stats' },
      { status: 500 }
    );
  }
}
