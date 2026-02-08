import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get certifications for a provider
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      // Get current user's certifications
      const user = await requireAuth(req);
      if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const provider = await prisma.serviceProvider.findUnique({
        where: { userId: user.id },
        include: {
          professionalCerts: {
            orderBy: [
              { isVerified: 'desc' }, // Verified first
              { issueDate: 'desc' }, // Then by most recent
            ],
          },
        },
      });

      if (!provider) {
        return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
      }

      return NextResponse.json({ certifications: provider.professionalCerts });
    }

    // Get specific provider's certifications (public - only verified)
    const certifications = await prisma.serviceCertification.findMany({
      where: { 
        providerId,
        isVerified: true, // Only show verified certifications publicly
      },
      orderBy: [
        { issueDate: 'desc' },
      ],
    });

    return NextResponse.json({ certifications });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}

// POST - Add certification
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
      certificationName,
      issuingOrganization,
      certificationNumber,
      issueDate,
      expiryDate,
      doesExpire,
      credentialUrl,
      documentUrl,
      description,
      skills,
    } = body;

    // Validation
    if (!certificationName || !issuingOrganization || !issueDate) {
      return NextResponse.json(
        { message: 'Certification name, issuing organization, and issue date are required' },
        { status: 400 }
      );
    }

    const certification = await prisma.serviceCertification.create({
      data: {
        providerId: provider.id,
        certificationName,
        issuingOrganization,
        certificationNumber,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        doesExpire: doesExpire || false,
        credentialUrl,
        documentUrl,
        description,
        skills: skills || [],
        isVerified: false, // Admin must verify
      },
    });

    return NextResponse.json({
      message: 'Certification added successfully. It will be reviewed for verification.',
      certification,
    });
  } catch (error) {
    console.error('Error adding certification:', error);
    return NextResponse.json(
      { message: 'Failed to add certification' },
      { status: 500 }
    );
  }
}

// PUT - Update certification
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const certId = searchParams.get('id');

    if (!certId) {
      return NextResponse.json({ message: 'Certification ID required' }, { status: 400 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    // Verify ownership
    const certification = await prisma.serviceCertification.findFirst({
      where: { id: certId, providerId: provider.id },
    });

    if (!certification) {
      return NextResponse.json({ message: 'Certification not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      certificationName,
      issuingOrganization,
      certificationNumber,
      issueDate,
      expiryDate,
      doesExpire,
      credentialUrl,
      documentUrl,
      description,
      skills,
    } = body;

    const updated = await prisma.serviceCertification.update({
      where: { id: certId },
      data: {
        certificationName,
        issuingOrganization,
        certificationNumber,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        doesExpire,
        credentialUrl,
        documentUrl,
        description,
        skills,
        // Reset verification if updated
        isVerified: false,
        verifiedAt: null,
      },
    });

    return NextResponse.json({
      message: 'Certification updated. It will be re-verified by admin.',
      certification: updated,
    });
  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json(
      { message: 'Failed to update certification' },
      { status: 500 }
    );
  }
}

// DELETE - Remove certification
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const certId = searchParams.get('id');

    if (!certId) {
      return NextResponse.json({ message: 'Certification ID required' }, { status: 400 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    // Verify ownership
    const certification = await prisma.serviceCertification.findFirst({
      where: { id: certId, providerId: provider.id },
    });

    if (!certification) {
      return NextResponse.json({ message: 'Certification not found' }, { status: 404 });
    }

    await prisma.serviceCertification.delete({
      where: { id: certId },
    });

    return NextResponse.json({ message: 'Certification deleted' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json(
      { message: 'Failed to delete certification' },
      { status: 500 }
    );
  }
}
