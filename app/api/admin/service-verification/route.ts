import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { calculateVerificationLevel } from '@/lib/service-validation';

/**
 * Admin Service Provider Verification Endpoints
 * 
 * Allows admins to verify documents, certifications, and service providers
 */

// POST - Verify a document
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, documentId, certificationId, providerId, notes, approved } = body;

    // Verify Document
    if (action === 'verify_document' && documentId) {
      const document = await prisma.serviceDocument.findUnique({
        where: { id: documentId },
        include: { provider: true },
      });

      if (!document) {
        return NextResponse.json({ message: 'Document not found' }, { status: 404 });
      }

      // Update document verification
      const updated = await prisma.serviceDocument.update({
        where: { id: documentId },
        data: {
          isVerified: approved,
          verifiedAt: approved ? new Date() : null,
          verifiedById: approved ? user.id : null,
          verificationNotes: notes,
        },
      });

      // Recalculate provider verification level
      const allDocuments = await prisma.serviceDocument.findMany({
        where: { providerId: document.providerId },
      });

      const verificationLevel = calculateVerificationLevel(allDocuments);

      await prisma.serviceProvider.update({
        where: { id: document.providerId },
        data: {
          verificationLevel,
          isVerified: verificationLevel >= 2, // Verified if level 2 or higher
        },
      });

      return NextResponse.json({
        message: approved ? 'Document verified successfully' : 'Document verification rejected',
        document: updated,
        verificationLevel,
      });
    }

    // Verify Certification
    if (action === 'verify_certification' && certificationId) {
      const certification = await prisma.serviceCertification.findUnique({
        where: { id: certificationId },
        include: { provider: true },
      });

      if (!certification) {
        return NextResponse.json({ message: 'Certification not found' }, { status: 404 });
      }

      const updated = await prisma.serviceCertification.update({
        where: { id: certificationId },
        data: {
          isVerified: approved,
          verifiedAt: approved ? new Date() : null,
        },
      });

      return NextResponse.json({
        message: approved ? 'Certification verified successfully' : 'Certification verification rejected',
        certification: updated,
      });
    }

    // Verify Provider (overall verification)
    if (action === 'verify_provider' && providerId) {
      const provider = await prisma.serviceProvider.findUnique({
        where: { id: providerId },
        include: {
          documents: true,
          professionalCerts: true,
        },
      });

      if (!provider) {
        return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
      }

      // Calculate verification level
      const verificationLevel = calculateVerificationLevel(provider.documents);

      const updated = await prisma.serviceProvider.update({
        where: { id: providerId },
        data: {
          isVerified: approved,
          verificationLevel,
          isActive: approved,
          rejectionReason: approved ? null : notes,
        },
      });

      return NextResponse.json({
        message: approved ? 'Provider verified and activated' : 'Provider verification rejected',
        provider: updated,
      });
    }

    return NextResponse.json(
      { message: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in verification:', error);
    return NextResponse.json(
      { message: 'Failed to process verification' },
      { status: 500 }
    );
  }
}

// GET - Get pending verifications
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';

    let pendingDocuments = [];
    let pendingCertifications = [];
    let pendingProviders = [];

    // Get pending documents
    if (type === 'all' || type === 'documents') {
      pendingDocuments = await prisma.serviceDocument.findMany({
        where: { isVerified: false },
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        take: 50,
      });
    }

    // Get pending certifications
    if (type === 'all' || type === 'certifications') {
      pendingCertifications = await prisma.serviceCertification.findMany({
        where: { isVerified: false },
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    // Get pending providers (new/unverified)
    if (type === 'all' || type === 'providers') {
      pendingProviders = await prisma.serviceProvider.findMany({
        where: { isVerified: false },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true,
            },
          },
          documents: {
            where: { isVerified: true },
          },
          professionalCerts: {
            where: { isVerified: true },
          },
          _count: {
            select: {
              documents: true,
              professionalCerts: true,
              portfolio: true,
              workExperience: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    return NextResponse.json({
      pending: {
        documents: pendingDocuments,
        certifications: pendingCertifications,
        providers: pendingProviders,
      },
      counts: {
        documents: pendingDocuments.length,
        certifications: pendingCertifications.length,
        providers: pendingProviders.length,
        total: pendingDocuments.length + pendingCertifications.length + pendingProviders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch pending verifications' },
      { status: 500 }
    );
  }
}

// PUT - Bulk verification
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { type, ids, approved, notes } = body;

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: 'Type and IDs array are required' },
        { status: 400 }
      );
    }

    let updated = 0;

    if (type === 'documents') {
      const result = await prisma.serviceDocument.updateMany({
        where: { id: { in: ids } },
        data: {
          isVerified: approved,
          verifiedAt: approved ? new Date() : null,
          verifiedById: approved ? user.id : null,
          verificationNotes: notes,
        },
      });
      updated = result.count;

      // Update verification levels for affected providers
      const documents = await prisma.serviceDocument.findMany({
        where: { id: { in: ids } },
        select: { providerId: true },
        distinct: ['providerId'],
      });

      for (const doc of documents) {
        const allDocs = await prisma.serviceDocument.findMany({
          where: { providerId: doc.providerId },
        });
        const level = calculateVerificationLevel(allDocs);
        await prisma.serviceProvider.update({
          where: { id: doc.providerId },
          data: {
            verificationLevel: level,
            isVerified: level >= 2,
          },
        });
      }
    } else if (type === 'certifications') {
      const result = await prisma.serviceCertification.updateMany({
        where: { id: { in: ids } },
        data: {
          isVerified: approved,
          verifiedAt: approved ? new Date() : null,
        },
      });
      updated = result.count;
    } else if (type === 'providers') {
      const result = await prisma.serviceProvider.updateMany({
        where: { id: { in: ids } },
        data: {
          isVerified: approved,
          isActive: approved,
          rejectionReason: approved ? null : notes,
        },
      });
      updated = result.count;
    }

    return NextResponse.json({
      message: `Successfully ${approved ? 'verified' : 'rejected'} ${updated} ${type}`,
      updated,
    });
  } catch (error) {
    console.error('Error in bulk verification:', error);
    return NextResponse.json(
      { message: 'Failed to process bulk verification' },
      { status: 500 }
    );
  }
}
