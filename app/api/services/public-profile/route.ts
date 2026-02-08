import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET Public Profile - Comprehensive service provider profile
 * Shows all professional information for a service provider
 * This is the main endpoint for displaying provider profiles to customers
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('id');
    const includeUnverified = searchParams.get('includeUnverified') === 'true';

    if (!providerId) {
      return NextResponse.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Get complete provider profile
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            trustScore: true,
            createdAt: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
        documents: {
          where: includeUnverified ? {} : { isVerified: true },
          select: {
            id: true,
            type: true,
            name: true,
            isVerified: true,
            verifiedAt: true,
            expiresAt: true,
            isExpired: true,
            documentNumber: true,
            issuingAuthority: true,
            issueDate: true,
            // Don't expose fileUrl publicly for security
          },
          orderBy: { uploadedAt: 'desc' },
        },
        portfolio: {
          orderBy: [
            { featured: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        workExperience: {
          orderBy: [
            { isCurrent: 'desc' },
            { startDate: 'desc' },
          ],
        },
        professionalCerts: {
          where: includeUnverified ? {} : { isVerified: true },
          orderBy: [
            { isVerified: 'desc' },
            { issueDate: 'desc' },
          ],
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { message: 'Provider not found' },
        { status: 404 }
      );
    }

    // Only show active providers publicly
    if (!provider.isActive && !includeUnverified) {
      return NextResponse.json(
        { message: 'Provider profile is not available' },
        { status: 404 }
      );
    }

    // Calculate profile completeness score
    const completenessScore = calculateProfileCompleteness(provider);

    // Calculate years of experience from work history
    const totalYearsExperience = calculateTotalExperience(provider.workExperience);

    // Count verification badges
    const verificationBadges = {
      emailVerified: provider.user?.isEmailVerified || false,
      phoneVerified: provider.user?.isPhoneVerified || false,
      identityVerified: provider.isVerified,
      documentsVerified: provider.documents.filter(d => d.isVerified).length > 0,
      certificationsVerified: provider.professionalCerts.filter(c => c.isVerified).length > 0,
      insuranceVerified: !!provider.insuranceProvider && !!provider.insuranceExpiry,
    };

    const verificationLevel = Object.values(verificationBadges).filter(Boolean).length;

    // Format response
    const publicProfile = {
      ...provider,
      completenessScore,
      totalYearsExperience,
      verificationBadges,
      verificationLevel,
      statistics: {
        totalReviews: provider.ratingCount,
        averageRating: provider.ratingAvg,
        completedJobs: provider.completedJobs,
        responseRate: provider.responseRate,
        responseTime: provider.responseTimeHours,
        portfolioCount: provider.portfolio.length,
        certificationsCount: provider.professionalCerts.filter(c => c.isVerified).length,
        yearsInBusiness: provider.yearsInBusiness || 0,
        totalExperience: totalYearsExperience,
      },
    };

    return NextResponse.json({ profile: publicProfile });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return NextResponse.json(
      { message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(provider: any): number {
  const checks = [
    !!provider.businessName,
    !!provider.description,
    !!provider.phone,
    !!provider.email,
    !!provider.address,
    !!provider.city,
    !!provider.logoUrl || !!provider.profilePhotoUrl,
    !!provider.bio,
    !!provider.servicesOffered && provider.servicesOffered.length > 0,
    !!provider.priceRange || !!provider.hourlyRate,
    !!provider.workingHours,
    !!provider.serviceAreas && provider.serviceAreas.length > 0,
    !!provider.languages && provider.languages.length > 0,
    provider.documents.length > 0,
    provider.portfolio.length > 0,
    provider.workExperience.length > 0,
    provider.professionalCerts.length > 0,
    !!provider.licenseNumber,
    !!provider.nrcNumber,
    !!provider.insuranceProvider,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

/**
 * Calculate total years of experience from work history
 */
function calculateTotalExperience(workExperience: any[]): number {
  if (!workExperience || workExperience.length === 0) return 0;

  let totalMonths = 0;

  for (const exp of workExperience) {
    const startDate = new Date(exp.startDate);
    const endDate = exp.isCurrent ? new Date() : new Date(exp.endDate);
    
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                   (endDate.getMonth() - startDate.getMonth());
    
    totalMonths += months;
  }

  return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal
}
