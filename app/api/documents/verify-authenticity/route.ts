/**
 * Document Authenticity Verification API
 * 
 * Endpoint for verifying document authenticity using multi-layer checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyDocumentAuthenticity, shouldFlagForManualReview, generateVerificationSummary, type VerificationRequest } from '@/lib/document-authenticity';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/documents/verify-authenticity
 * 
 * Verify a document's authenticity using multiple verification layers
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication required
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      documentId,
      documentType,
      imageUrl,
      documentNumber,
      holderName,
      dateOfBirth,
      expiryDate,
      useGovernmentApi = true,
      useOcr = true,
      checkFraudPatterns = true,
    } = body;

    // Validate required fields
    if (!imageUrl || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, documentType' },
        { status: 400 }
      );
    }

    console.log(`Starting verification for ${documentType} document...`);

    // Prepare verification request
    const verificationRequest: VerificationRequest = {
      documentType,
      imageUrl,
      documentNumber,
      holderName,
      dateOfBirth,
      expiryDate,
      useGovernmentApi,
      useOcr,
      checkFraudPatterns,
    };

    // Run verification
    const result = await verifyDocumentAuthenticity(verificationRequest);

    // Generate admin summary
    const summary = generateVerificationSummary(result);
    const flagForReview = shouldFlagForManualReview(result);

    // If documentId provided, update the database
    if (documentId) {
      try {
        await prisma.serviceDocument.update({
          where: { id: documentId },
          data: {
            authenticityScore: result.confidence,
            ocrConfidence: result.verificationResults.ocr?.confidence,
            governmentVerified: result.verificationResults.governmentApi?.verified || false,
            governmentApiResponse: result.verificationResults.governmentApi 
              ? JSON.parse(JSON.stringify(result.verificationResults.governmentApi))
              : undefined,
            fraudRiskScore: result.verificationResults.fraudDetection.riskScore,
            imageAnalysisResult: JSON.parse(JSON.stringify(result.verificationResults.imageAnalysis)),
            qrCodeData: result.verificationResults.qrCode?.decodedData
              ? JSON.parse(JSON.stringify(result.verificationResults.qrCode.decodedData))
              : undefined,
            suspiciousFlags: result.verificationResults.fraudDetection.suspiciousPatterns,
            lastVerificationDate: new Date(),
          },
        });

        console.log(`Updated document ${documentId} with verification results`);
      } catch (dbError) {
        console.error('Failed to update document in database:', dbError);
        // Don't fail the request, just log the error
      }
    }

    // Return results
    return NextResponse.json({
      success: true,
      result: {
        authentic: result.authentic,
        confidence: result.confidence,
        flagForManualReview,
        summary,
        verificationResults: result.verificationResults,
        warnings: result.warnings,
        recommendations: result.recommendations,
        timestamp: result.timestamp,
      },
    });

  } catch (error) {
    console.error('Document verification error:', error);
    return NextResponse.json(
      { 
        error: 'Verification failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/verify-authenticity?documentId=xxx
 * 
 * Get verification results for a previously verified document
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication required
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId query parameter required' },
        { status: 400 }
      );
    }

    // Fetch document with verification data
    const document = await prisma.serviceDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        authenticityScore: true,
        ocrConfidence: true,
        governmentVerified: true,
        governmentApiResponse: true,
        fraudRiskScore: true,
        imageAnalysisResult: true,
        qrCodeData: true,
        suspiciousFlags: true,
        lastVerificationDate: true,
        isVerified: true,
        verifiedAt: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check permissions - user must own the document or be admin
    if (user.role !== 'ADMIN') {
      if (document.provider.user.email !== user.email) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Return verification data
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        documentType: document.documentType,
        documentNumber: document.documentNumber,
        verification: {
          authenticityScore: document.authenticityScore,
          ocrConfidence: document.ocrConfidence,
          governmentVerified: document.governmentVerified,
          fraudRiskScore: document.fraudRiskScore,
          suspiciousFlags: document.suspiciousFlags,
          lastVerificationDate: document.lastVerificationDate,
          isVerified: document.isVerified,
          verifiedAt: document.verifiedAt,
          imageAnalysis: document.imageAnalysisResult,
          qrCodeData: document.qrCodeData,
          governmentApiResponse: document.governmentApiResponse,
        },
        provider: document.provider,
      },
    });

  } catch (error) {
    console.error('Get verification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve verification data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
