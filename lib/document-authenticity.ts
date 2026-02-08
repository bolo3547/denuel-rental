/**
 * Document Authenticity Verification System
 * 
 * Multi-layer verification to detect fake documents:
 * 1. Image Analysis (metadata, manipulation detection)
 * 2. OCR Text Extraction
 * 3. Format Validation
 * 4. Government API Integration
 * 5. QR/Barcode Scanning
 * 6. Fraud Pattern Detection
 */

import {
  validateZambianNRC,
  validateDriverLicense,
  validateTPIN,
  validateBusinessLicense,
  validateExpiryDate,
} from './zambian-document-formats';

// Types
export type DocumentType = 'NRC' | 'LICENSE' | 'PASSPORT' | 'BUSINESS_LICENSE' | 'INSURANCE' | 'CERTIFICATE' | 'TAX_CLEARANCE';

export interface VerificationRequest {
  documentType: DocumentType;
  imageUrl: string;
  imageBuffer?: Buffer;
  documentNumber?: string;
  holderName?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  useGovernmentApi?: boolean;
  useOcr?: boolean;
  checkFraudPatterns?: boolean;
}

export interface VerificationResult {
  authentic: boolean;
  confidence: number; // 0-100
  verificationResults: {
    imageAnalysis: ImageAnalysisResult;
    ocr?: OCRResult;
    formatValidation?: FormatValidationResult;
    governmentApi?: GovernmentApiResult;
    qrCode?: QRCodeResult;
    fraudDetection: FraudDetectionResult;
  };
  warnings: string[];
  recommendations: string;
  timestamp: Date;
}

export interface ImageAnalysisResult {
  passed: boolean;
  score: number; // 0-100
  resolution?: { width: number; height: number };
  quality?: {
    blur: number; // 0-100
    brightness: number; // 0-100
    contrast: number; // 0-100
  };
  metadata?: {
    camera?: string;
    software?: string;
    gpsLocation?: { lat: number; lng: number };
    timestamp?: Date;
    editHistory?: string[];
  };
  manipulationDetected?: boolean;
  manipulationScore?: number; // 0-100, higher = more likely manipulated
}

export interface OCRResult {
  passed: boolean;
  extractedText: string;
  confidence: number; // 0-100
  structuredData?: {
    documentNumber?: string;
    name?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    issueDate?: string;
    address?: string;
  };
  matchesProvided?: boolean;
}

export interface FormatValidationResult {
  passed: boolean;
  validFormat: boolean;
  documentType?: string;
  errors?: string[];
}

export interface GovernmentApiResult {
  passed: boolean;
  verified: boolean;
  apiUsed?: string;
  responseData?: any;
  error?: string;
}

export interface QRCodeResult {
  passed: boolean;
  dataFound: boolean;
  decodedData?: any;
  dataValid?: boolean;
  matchesDocument?: boolean;
}

export interface FraudDetectionResult {
  passed: boolean;
  riskScore: number; // 0-100, higher = more suspicious
  suspiciousPatterns: string[];
  recommendations: string[];
}

/**
 * Main verification function - coordinates all checks
 */
export async function verifyDocumentAuthenticity(
  request: VerificationRequest
): Promise<VerificationResult> {
  const warnings: string[] = [];
  const timestamp = new Date();
  
  try {
    // Layer 1: Image Analysis
    console.log('Running image analysis...');
    const imageAnalysis = await analyzeImage(request.imageUrl, request.imageBuffer);
    if (!imageAnalysis.passed) {
      warnings.push('Image quality or authenticity concerns detected');
    }
    
    // Layer 2: OCR (if enabled)
    let ocrResult: OCRResult | undefined;
    if (request.useOcr !== false) {
      console.log('Running OCR extraction...');
      ocrResult = await performOCR(request.imageUrl, request.imageBuffer, request);
      if (ocrResult && !ocrResult.passed) {
        warnings.push('OCR text extraction issues detected');
      }
    }
    
    // Layer 3: Format Validation
    let formatValidation: FormatValidationResult | undefined;
    if (request.documentNumber) {
      console.log('Validating document format...');
      formatValidation = validateDocumentFormat(request.documentType, request.documentNumber);
      if (!formatValidation.passed) {
        warnings.push('Document format validation failed');
      }
    }
    
    // Layer 4: Government API (if enabled)
    let governmentApi: GovernmentApiResult | undefined;
    if (request.useGovernmentApi && request.documentNumber) {
      console.log('Checking government API...');
      governmentApi = await verifyWithGovernmentApi(request.documentType, request.documentNumber, {
        name: request.holderName,
        dob: request.dateOfBirth,
      });
      if (governmentApi && !governmentApi.passed) {
        warnings.push('Government verification failed or unavailable');
      }
    }
    
    // Layer 5: QR Code (if present in image)
    let qrCode: QRCodeResult | undefined;
    console.log('Scanning for QR/barcode...');
    qrCode = await scanQRCode(request.imageUrl, request.imageBuffer);
    if (qrCode && qrCode.dataFound && !qrCode.dataValid) {
      warnings.push('QR code data validation failed');
    }
    
    // Layer 6: Fraud Detection
    console.log('Running fraud detection...');
    const fraudDetection = detectFraudPatterns(request, {
      imageAnalysis,
      ocr: ocrResult,
      format: formatValidation,
      governmentApi,
      qrCode,
    });
    if (!fraudDetection.passed) {
      warnings.push(...fraudDetection.suspiciousPatterns);
    }
    
    // Calculate overall confidence score
    const confidence = calculateConfidenceScore({
      imageAnalysis,
      ocr: ocrResult,
      format: formatValidation,
      governmentApi,
      qrCode,
      fraudDetection,
    });
    
    // Determine if authentic (confidence > 70% and no critical failures)
    const authentic = confidence >= 70 && fraudDetection.riskScore < 50;
    
    // Generate recommendations
    const recommendations = generateRecommendations({
      authentic,
      confidence,
      warnings,
      fraudDetection,
    });
    
    return {
      authentic,
      confidence,
      verificationResults: {
        imageAnalysis,
        ocr: ocrResult,
        formatValidation,
        governmentApi,
        qrCode,
        fraudDetection,
      },
      warnings,
      recommendations,
      timestamp,
    };
    
  } catch (error) {
    console.error('Verification error:', error);
    
    // Return failed verification on error
    return {
      authentic: false,
      confidence: 0,
      verificationResults: {
        imageAnalysis: {
          passed: false,
          score: 0,
          manipulationDetected: true,
        },
        fraudDetection: {
          passed: false,
          riskScore: 100,
          suspiciousPatterns: ['Verification process failed'],
          recommendations: ['Manual review required'],
        },
      },
      warnings: [`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: 'Manual review required due to verification error',
      timestamp,
    };
  }
}

/**
 * Layer 1: Image Analysis
 */
async function analyzeImage(
  imageUrl: string,
  imageBuffer?: Buffer
): Promise<ImageAnalysisResult> {
  try {
    // In a real implementation, you would:
    // 1. Download/load the image
    // 2. Extract EXIF metadata
    // 3. Analyze for manipulation
    // 4. Check quality metrics
    
    // For now, return a mock result (implement with sharp, exif-reader)
    const mockResult: ImageAnalysisResult = {
      passed: true,
      score: 85,
      resolution: { width: 1200, height: 900 },
      quality: {
        blur: 20, // Lower is better
        brightness: 60,
        contrast: 70,
      },
      manipulationDetected: false,
      manipulationScore: 15,
    };
    
    // Check minimum resolution
    if (mockResult.resolution && (mockResult.resolution.width < 800 || mockResult.resolution.height < 600)) {
      mockResult.passed = false;
      mockResult.score = 40;
    }
    
    // Check for high manipulation score
    if (mockResult.manipulationScore && mockResult.manipulationScore > 60) {
      mockResult.passed = false;
      mockResult.manipulationDetected = true;
    }
    
    return mockResult;
    
  } catch (error) {
    console.error('Image analysis error:', error);
    return {
      passed: false,
      score: 0,
      manipulationDetected: true,
    };
  }
}

/**
 * Layer 2: OCR Text Extraction
 */
async function performOCR(
  imageUrl: string,
  imageBuffer?: Buffer,
  request?: VerificationRequest
): Promise<OCRResult> {
  try {
    // In a real implementation:
    // 1. Use Tesseract.js or cloud OCR (Google Vision, AWS Textract)
    // 2. Extract all text from document
    // 3. Parse structured data
    // 4. Match with provided data
    
    // Mock OCR result
    const mockExtractedText = `
      REPUBLIC OF ZAMBIA
      NATIONAL REGISTRATION CARD
      ${request?.documentNumber || '123456/12/1'}
      NAME: ${request?.holderName?.toUpperCase() || 'JOHN MWAMBA'}
      DATE OF BIRTH: ${request?.dateOfBirth || '15/01/1990'}
    `;
    
    const result: OCRResult = {
      passed: true,
      extractedText: mockExtractedText,
      confidence: 88,
      structuredData: {
        documentNumber: request?.documentNumber,
        name: request?.holderName,
        dateOfBirth: request?.dateOfBirth,
      },
      matchesProvided: true,
    };
    
    // Check if extracted data matches provided data
    if (request?.documentNumber && !mockExtractedText.includes(request.documentNumber)) {
      result.matchesProvided = false;
      result.passed = false;
    }
    
    return result;
    
  } catch (error) {
    console.error('OCR error:', error);
    return {
      passed: false,
      extractedText: '',
      confidence: 0,
      matchesProvided: false,
    };
  }
}

/**
 * Layer 3: Format Validation
 */
function validateDocumentFormat(
  documentType: DocumentType,
  documentNumber: string
): FormatValidationResult {
  try {
    switch (documentType) {
      case 'NRC':
        const nrcResult = validateZambianNRC(documentNumber);
        return {
          passed: nrcResult.valid,
          validFormat: nrcResult.valid,
          documentType: 'Zambian NRC',
          errors: nrcResult.error ? [nrcResult.error] : [],
        };
      
      case 'LICENSE':
        const licenseResult = validateDriverLicense(documentNumber);
        return {
          passed: licenseResult.valid,
          validFormat: licenseResult.valid,
          documentType: 'Zambian Driver\'s License',
          errors: licenseResult.error ? [licenseResult.error] : [],
        };
      
      case 'BUSINESS_LICENSE':
        const businessResult = validateBusinessLicense(documentNumber);
        return {
          passed: businessResult.valid,
          validFormat: businessResult.valid,
          documentType: businessResult.type || 'Business License',
          errors: businessResult.error ? [businessResult.error] : [],
        };
      
      case 'TAX_CLEARANCE':
        const tpinResult = validateTPIN(documentNumber);
        return {
          passed: tpinResult.valid,
          validFormat: tpinResult.valid,
          documentType: 'TPIN',
          errors: tpinResult.error ? [tpinResult.error] : [],
        };
      
      default:
        return {
          passed: true,
          validFormat: true,
          documentType: documentType,
        };
    }
  } catch (error) {
    return {
      passed: false,
      validFormat: false,
      errors: [`Format validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Layer 4: Government API Verification
 */
async function verifyWithGovernmentApi(
  documentType: DocumentType,
  documentNumber: string,
  additionalData?: { name?: string; dob?: string }
): Promise<GovernmentApiResult> {
  try {
    // In a real implementation, call actual government APIs:
    // - RTSA API for driver's licenses
    // - DNR API for NRCs
    // - PACRA API for business licenses
    // - ZRA API for TPIN
    
    // Mock API responses
    const mockApiAvailable = Math.random() > 0.3; // 70% availability
    
    if (!mockApiAvailable) {
      return {
        passed: false,
        verified: false,
        error: 'Government API temporarily unavailable',
      };
    }
    
    // Mock successful verification
    const mockVerified = Math.random() > 0.1; // 90% verification rate for valid docs
    
    return {
      passed: mockVerified,
      verified: mockVerified,
      apiUsed: getApiName(documentType),
      responseData: {
        status: mockVerified ? 'VERIFIED' : 'NOT_FOUND',
        documentNumber,
        holderName: additionalData?.name,
        verified: mockVerified,
      },
    };
    
  } catch (error) {
    console.error('Government API error:', error);
    return {
      passed: false,
      verified: false,
      error: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function getApiName(documentType: DocumentType): string {
  const apiMap: Record<DocumentType, string> = {
    'NRC': 'DNR (Department of National Registration)',
    'LICENSE': 'RTSA (Road Transport and Safety Agency)',
    'PASSPORT': 'Department of Immigration',
    'BUSINESS_LICENSE': 'PACRA (Patents and Companies Registration Agency)',
    'TAX_CLEARANCE': 'ZRA (Zambia Revenue Authority)',
    'INSURANCE': 'Pensions and Insurance Authority',
    'CERTIFICATE': 'Relevant Professional Body',
  };
  
  return apiMap[documentType] || 'Government Verification System';
}

/**
 * Layer 5: QR/Barcode Scanning
 */
async function scanQRCode(
  imageUrl: string,
  imageBuffer?: Buffer
): Promise<QRCodeResult> {
  try {
    // In a real implementation:
    // 1. Use jsQR or similar to scan QR codes
    // 2. Decode barcode data
    // 3. Validate decoded data format
    // 4. Cross-reference with document
    
    // Mock QR code detection
    const qrCodePresent = Math.random() > 0.4; // 60% of modern docs have QR
    
    if (!qrCodePresent) {
      return {
        passed: true,
        dataFound: false,
      };
    }
    
    // Mock QR data
    const mockQRData = {
      documentType: 'NRC',
      documentNumber: '123456/12/1',
      name: 'JOHN MWAMBA',
      dob: '1990-01-15',
      signature: 'mock_digital_signature',
    };
    
    return {
      passed: true,
      dataFound: true,
      decodedData: mockQRData,
      dataValid: true,
      matchesDocument: true,
    };
    
  } catch (error) {
    console.error('QR scanning error:', error);
    return {
      passed: true, // Don't fail if QR not present
      dataFound: false,
    };
  }
}

/**
 * Layer 6: Fraud Pattern Detection
 */
function detectFraudPatterns(
  request: VerificationRequest,
  results: {
    imageAnalysis: ImageAnalysisResult;
    ocr?: OCRResult;
    format?: FormatValidationResult;
    governmentApi?: GovernmentApiResult;
    qrCode?: QRCodeResult;
  }
): FraudDetectionResult {
  const suspiciousPatterns: string[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;
  
  // Check 1: Image manipulation
  if (results.imageAnalysis.manipulationDetected) {
    suspiciousPatterns.push('Image shows signs of digital manipulation');
    riskScore += 40;
    recommendations.push('Request original document or in-person verification');
  }
  
  // Check 2: Low image quality
  if (results.imageAnalysis.score < 60) {
    suspiciousPatterns.push('Poor image quality may hide document defects');
    riskScore += 15;
    recommendations.push('Request higher quality image');
  }
  
  // Check 3: OCR mismatch
  if (results.ocr && !results.ocr.matchesProvided) {
    suspiciousPatterns.push('Extracted text does not match provided information');
    riskScore += 35;
    recommendations.push('Verify provided information matches document');
  }
  
  // Check 4: Invalid format
  if (results.format && !results.format.validFormat) {
    suspiciousPatterns.push('Document number format is invalid');
    riskScore += 30;
    recommendations.push('Document may be fake or incorrectly entered');
  }
  
  // Check 5: Government API failed
  if (results.governmentApi && !results.governmentApi.verified) {
    if (results.governmentApi.error) {
      // API unavailable, don't penalize heavily
      riskScore += 10;
    } else {
      // API says document not found
      suspiciousPatterns.push('Document not found in government database');
      riskScore += 45;
      recommendations.push('Document may be fake or data entry error');
    }
  }
  
  // Check 6: QR code mismatch
  if (results.qrCode?.dataFound && !results.qrCode.matchesDocument) {
    suspiciousPatterns.push('QR code data does not match printed information');
    riskScore += 35;
    recommendations.push('Possible tampering detected');
  }
  
  // Check 7: No metadata
  if (!results.imageAnalysis.metadata || !results.imageAnalysis.metadata.timestamp) {
    suspiciousPatterns.push('Image lacks expected metadata (may be screenshot)');
    riskScore += 20;
    recommendations.push('Request photo taken directly with camera');
  }
  
  const passed = riskScore < 50;
  
  return {
    passed,
    riskScore: Math.min(riskScore, 100),
    suspiciousPatterns,
    recommendations,
  };
}

/**
 * Calculate overall confidence score
 */
function calculateConfidenceScore(results: {
  imageAnalysis: ImageAnalysisResult;
  ocr?: OCRResult;
  format?: FormatValidationResult;
  governmentApi?: GovernmentApiResult;
  qrCode?: QRCodeResult;
  fraudDetection: FraudDetectionResult;
}): number {
  let totalScore = 0;
  let maxScore = 0;
  
  // Image analysis (weight: 20)
  totalScore += (results.imageAnalysis.score / 100) * 20;
  maxScore += 20;
  
  // OCR (weight: 15)
  if (results.ocr) {
    totalScore += (results.ocr.confidence / 100) * 15;
    maxScore += 15;
  }
  
  // Format validation (weight: 15)
  if (results.format) {
    totalScore += (results.format.passed ? 15 : 0);
    maxScore += 15;
  }
  
  // Government API (weight: 30 - highest weight)
  if (results.governmentApi) {
    totalScore += (results.governmentApi.verified ? 30 : 0);
    maxScore += 30;
  }
  
  // QR code (weight: 10)
  if (results.qrCode?.dataFound) {
    totalScore += (results.qrCode.dataValid ? 10 : 0);
    maxScore += 10;
  }
  
  // Fraud detection (weight: 20) - inverse of risk score
  totalScore += ((100 - results.fraudDetection.riskScore) / 100) * 20;
  maxScore += 20;
  
  // Normalize to 0-100
  const confidence = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  
  return Math.round(confidence);
}

/**
 * Generate recommendations based on verification results
 */
function generateRecommendations(data: {
  authentic: boolean;
  confidence: number;
  warnings: string[];
  fraudDetection: FraudDetectionResult;
}): string {
  if (data.authentic && data.confidence >= 90) {
    return 'Document appears highly authentic. Proceed with approval.';
  }
  
  if (data.authentic && data.confidence >= 70) {
    return 'Document appears authentic but with some minor concerns. Consider additional verification if high-risk transaction.';
  }
  
  if (data.confidence >= 50 && data.confidence < 70) {
    return 'Document authenticity uncertain. Manual review recommended. ' + 
           (data.fraudDetection.recommendations[0] || 'Request additional documents.');
  }
  
  return 'Document authenticity highly questionable. Reject or request in-person verification. ' +
         data.fraudDetection.recommendations.join(' ');
}

/**
 * Helper: Check if document should be flagged for manual review
 */
export function shouldFlagForManualReview(result: VerificationResult): boolean {
  return (
    !result.authentic ||
    result.confidence < 70 ||
    result.verificationResults.fraudDetection.riskScore >= 50 ||
    result.warnings.length >= 3
  );
}

/**
 * Helper: Generate verification summary for admins
 */
export function generateVerificationSummary(result: VerificationResult): string {
  const lines: string[] = [];
  
  lines.push(`Authenticity: ${result.authentic ? 'VERIFIED ✓' : 'SUSPICIOUS ✗'}`);
  lines.push(`Confidence: ${result.confidence}%`);
  lines.push(`Risk Score: ${result.verificationResults.fraudDetection.riskScore}/100`);
  lines.push('');
  lines.push('Checks Performed:');
  lines.push(`- Image Analysis: ${result.verificationResults.imageAnalysis.passed ? '✓ PASS' : '✗ FAIL'} (${result.verificationResults.imageAnalysis.score}%)`);
  
  if (result.verificationResults.ocr) {
    lines.push(`- OCR Extraction: ${result.verificationResults.ocr.passed ? '✓ PASS' : '✗ FAIL'} (${result.verificationResults.ocr.confidence}%)`);
  }
  
  if (result.verificationResults.formatValidation) {
    lines.push(`- Format Validation: ${result.verificationResults.formatValidation.passed ? '✓ PASS' : '✗ FAIL'}`);
  }
  
  if (result.verificationResults.governmentApi) {
    lines.push(`- Government API: ${result.verificationResults.governmentApi.verified ? '✓ VERIFIED' : '✗ NOT VERIFIED'}`);
  }
  
  if (result.verificationResults.qrCode?.dataFound) {
    lines.push(`- QR Code: ${result.verificationResults.qrCode.dataValid ? '✓ VALID' : '✗ INVALID'}`);
  }
  
  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    result.warnings.forEach(w => lines.push(`- ${w}`));
  }
  
  if (result.verificationResults.fraudDetection.suspiciousPatterns.length > 0) {
    lines.push('');
    lines.push('Suspicious Patterns:');
    result.verificationResults.fraudDetection.suspiciousPatterns.forEach(p => lines.push(`- ${p}`));
  }
  
  lines.push('');
  lines.push(`Recommendation: ${result.recommendations}`);
  
  return lines.join('\n');
}
