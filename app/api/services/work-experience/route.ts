import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get work experience for a provider
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      // Get current user's work experience
      const user = await requireAuth(req);
      if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const provider = await prisma.serviceProvider.findUnique({
        where: { userId: user.id },
        include: {
          workExperience: {
            orderBy: [
              { isCurrent: 'desc' }, // Current positions first
              { startDate: 'desc' }, // Then by most recent
            ],
          },
        },
      });

      if (!provider) {
        return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
      }

      return NextResponse.json({ workExperience: provider.workExperience });
    }

    // Get specific provider's work experience (public)
    const workExperience = await prisma.serviceWorkExperience.findMany({
      where: { providerId },
      orderBy: [
        { isCurrent: 'desc' },
        { startDate: 'desc' },
      ],
    });

    return NextResponse.json({ workExperience });
  } catch (error) {
    console.error('Error fetching work experience:', error);
    return NextResponse.json(
      { message: 'Failed to fetch work experience' },
      { status: 500 }
    );
  }
}

// POST - Add work experience
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      jobTitle,
      companyName,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
      projectsCompleted,
      skills,
    } = body;

    // Validation
    if (!jobTitle || !companyName || !startDate) {
      return NextResponse.json(
        { message: 'Job title, company name, and start date are required' },
        { status: 400 }
      );
    }

    // If current position, clear any other current positions
    if (isCurrent) {
      await prisma.serviceWorkExperience.updateMany({
        where: { providerId: provider.id, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const experience = await prisma.serviceWorkExperience.create({
      data: {
        providerId: provider.id,
        jobTitle,
        companyName,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent || false,
        description,
        projectsCompleted,
        skills: skills || [],
      },
    });

    return NextResponse.json({
      message: 'Work experience added successfully',
      experience,
    });
  } catch (error) {
    console.error('Error adding work experience:', error);
    return NextResponse.json(
      { message: 'Failed to add work experience' },
      { status: 500 }
    );
  }
}

// PUT - Update work experience
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const expId = searchParams.get('id');

    if (!expId) {
      return NextResponse.json({ message: 'Experience ID required' }, { status: 400 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    // Verify ownership
    const experience = await prisma.serviceWorkExperience.findFirst({
      where: { id: expId, providerId: provider.id },
    });

    if (!experience) {
      return NextResponse.json({ message: 'Experience not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      jobTitle,
      companyName,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
      projectsCompleted,
      skills,
    } = body;

    // If marking as current, clear any other current positions
    if (isCurrent && !experience.isCurrent) {
      await prisma.serviceWorkExperience.updateMany({
        where: { providerId: provider.id, isCurrent: true, id: { not: expId } },
        data: { isCurrent: false },
      });
    }

    const updated = await prisma.serviceWorkExperience.update({
      where: { id: expId },
      data: {
        jobTitle,
        companyName,
        location,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent !== undefined ? isCurrent : undefined,
        description,
        projectsCompleted,
        skills,
      },
    });

    return NextResponse.json({
      message: 'Work experience updated',
      experience: updated,
    });
  } catch (error) {
    console.error('Error updating work experience:', error);
    return NextResponse.json(
      { message: 'Failed to update work experience' },
      { status: 500 }
    );
  }
}

// DELETE - Remove work experience
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const expId = searchParams.get('id');

    if (!expId) {
      return NextResponse.json({ message: 'Experience ID required' }, { status: 400 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    // Verify ownership
    const experience = await prisma.serviceWorkExperience.findFirst({
      where: { id: expId, providerId: provider.id },
    });

    if (!experience) {
      return NextResponse.json({ message: 'Experience not found' }, { status: 404 });
    }

    await prisma.serviceWorkExperience.delete({
      where: { id: expId },
    });

    return NextResponse.json({ message: 'Work experience deleted' });
  } catch (error) {
    console.error('Error deleting work experience:', error);
    return NextResponse.json(
      { message: 'Failed to delete work experience' },
      { status: 500 }
    );
  }
}
