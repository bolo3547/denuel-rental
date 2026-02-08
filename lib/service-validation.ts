/**
 * Service Provider Security and Validation
 * 
 * Comprehensive security checks and validation for service provider operations
 */

// Document validation rules
export const DOCUMENT_VALIDATION = {
  // Allowed file types
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  
  // Maximum file size (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  
  // Minimum image dimensions
  MIN_IMAGE_WIDTH: 800,
  MIN_IMAGE_HEIGHT: 600,
  
  // Required documents for verification levels
  LEVEL_1_REQUIRED: ['NATIONAL_ID', 'NRC'],
  LEVEL_2_REQUIRED: ['NATIONAL_ID', 'NRC', 'BUSINESS_LICENSE', 'CERTIFICATE'],
  LEVEL_3_REQUIRED: ['NATIONAL_ID', 'NRC', 'BUSINESS_LICENSE', 'CERTIFICATE', 'INSURANCE', 'TAX_CLEARANCE'],
};

// Portfolio validation rules
export const PORTFOLIO_VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB for images
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MIN_IMAGES_FOR_VERIFICATION: 3,
  RECOMMENDED_IMAGES: 8,
  MAX_IMAGES_PER_PROJECT: 10,
  MIN_TITLE_LENGTH: 10,
  MIN_DESCRIPTION_LENGTH: 50,
  RECOMMENDED_DESCRIPTION_LENGTH: 200,
};

// Work experience validation
export const EXPERIENCE_VALIDATION = {
  MIN_JOB_TITLE_LENGTH: 3,
  MIN_COMPANY_NAME_LENGTH: 2,
  MIN_DESCRIPTION_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_YEARS_BACK: 50, // Don't allow experience more than 50 years old
  MIN_DURATION_DAYS: 1, // Minimum 1 day of work
};

// Certification validation
export const CERTIFICATION_VALIDATION = {
  MIN_NAME_LENGTH: 5,
  MIN_ORGANIZATION_LENGTH: 3,
  MAX_YEARS_VALIDITY: 10, // Certifications shouldn't be valid for more than 10 years typically
  EXPIRY_WARNING_DAYS: 30, // Warn 30 days before expiry
};

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: { size: number; type: string; name: string },
  context: 'document' | 'portfolio' = 'document'
): { valid: boolean; error?: string } {
  const rules = context === 'document' ? DOCUMENT_VALIDATION : PORTFOLIO_VALIDATION;
  
  // Check file size
  const maxSize = context === 'document' ? DOCUMENT_VALIDATION.MAX_FILE_SIZE : PORTFOLIO_VALIDATION.MAX_FILE_SIZE;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`,
    };
  }
  
  // Check MIME type
  const allowedTypes = context === 'document' 
    ? DOCUMENT_VALIDATION.ALLOWED_MIME_TYPES 
    : PORTFOLIO_VALIDATION.ALLOWED_IMAGE_TYPES;
    
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  
  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const typeExtensionMap: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/jpg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
  };
  
  const expectedExtensions = typeExtensionMap[file.type] || [];
  if (extension && !expectedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'File extension does not match file type',
    };
  }
  
  return { valid: true };
}

/**
 * Validate work experience dates
 */
export function validateExperienceDates(
  startDate: Date,
  endDate: Date | null,
  isCurrent: boolean
): { valid: boolean; error?: string } {
  const now = new Date();
  const maxYearsBack = EXPERIENCE_VALIDATION.MAX_YEARS_BACK;
  const oldestAllowed = new Date();
  oldestAllowed.setFullYear(oldestAllowed.getFullYear() - maxYearsBack);
  
  // Check if start date is too old
  if (startDate < oldestAllowed) {
    return {
      valid: false,
      error: `Start date cannot be more than ${maxYearsBack} years ago`,
    };
  }
  
  // Check if start date is in the future
  if (startDate > now) {
    return {
      valid: false,
      error: 'Start date cannot be in the future',
    };
  }
  
  // If not current, must have end date
  if (!isCurrent && !endDate) {
    return {
      valid: false,
      error: 'End date is required for past positions',
    };
  }
  
  // If has end date, check it's after start date
  if (endDate) {
    if (endDate < startDate) {
      return {
        valid: false,
        error: 'End date must be after start date',
      };
    }
    
    if (endDate > now) {
      return {
        valid: false,
        error: 'End date cannot be in the future',
      };
    }
    
    // Check minimum duration
    const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (durationDays < EXPERIENCE_VALIDATION.MIN_DURATION_DAYS) {
      return {
        valid: false,
        error: 'Duration must be at least 1 day',
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validate certification dates
 */
export function validateCertificationDates(
  issueDate: Date,
  expiryDate: Date | null,
  doesExpire: boolean
): { valid: boolean; error?: string; warning?: string } {
  const now = new Date();
  
  // Check issue date is not in future
  if (issueDate > now) {
    return {
      valid: false,
      error: 'Issue date cannot be in the future',
    };
  }
  
  // If expires, must have expiry date
  if (doesExpire && !expiryDate) {
    return {
      valid: false,
      error: 'Expiry date is required for expiring certifications',
    };
  }
  
  // If has expiry date, validate it
  if (expiryDate) {
    if (expiryDate < issueDate) {
      return {
        valid: false,
        error: 'Expiry date must be after issue date',
      };
    }
    
    // Check if already expired
    if (expiryDate < now) {
      return {
        valid: false,
        error: 'Certification has already expired. Please renew before adding.',
      };
    }
    
    // Check if expiring soon (warning only)
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= CERTIFICATION_VALIDATION.EXPIRY_WARNING_DAYS) {
      return {
        valid: true,
        warning: `Certification expires in ${daysUntilExpiry} days. Consider renewing soon.`,
      };
    }
    
    // Check if validity period is unreasonably long
    const yearsValid = (expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (yearsValid > CERTIFICATION_VALIDATION.MAX_YEARS_VALIDITY) {
      return {
        valid: true,
        warning: `Certification valid for ${Math.round(yearsValid)} years. Please verify this is correct.`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Calculate verification level based on documents
 */
export function calculateVerificationLevel(documents: Array<{
  type: string;
  isVerified: boolean;
  isExpired?: boolean;
}>): number {
  const verifiedDocs = documents.filter(d => d.isVerified && !d.isExpired);
  const docTypes = verifiedDocs.map(d => d.type);
  
  // Level 0: No verified documents
  if (verifiedDocs.length === 0) return 0;
  
  // Level 1: Has ID
  const hasId = docTypes.some(t => 
    t === 'NATIONAL_ID' || t === 'NRC' || t === 'PASSPORT'
  );
  if (!hasId) return 0;
  
  // Level 2: Has ID + business docs or certificates
  const hasBusinessDocs = docTypes.some(t => 
    t === 'BUSINESS_LICENSE' || t === 'TAX_CLEARANCE'
  );
  const hasCertificates = docTypes.some(t => 
    t === 'CERTIFICATE' || t === 'LICENSE' || t === 'QUALIFICATION'
  );
  
  if (hasBusinessDocs || hasCertificates) {
    // Level 3: Has ID + business docs + certificates + insurance
    const hasInsurance = docTypes.includes('INSURANCE');
    if (hasInsurance && hasBusinessDocs && hasCertificates) {
      return 3;
    }
    return 2;
  }
  
  return 1;
}

/**
 * Validate portfolio item
 */
export function validatePortfolioItem(data: {
  title: string;
  description?: string;
  imageUrl: string;
  projectCost?: number;
  duration?: string;
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Title validation
  if (!data.title || data.title.length < PORTFOLIO_VALIDATION.MIN_TITLE_LENGTH) {
    errors.push(`Title must be at least ${PORTFOLIO_VALIDATION.MIN_TITLE_LENGTH} characters`);
  }
  
  // Description validation
  if (data.description) {
    if (data.description.length < PORTFOLIO_VALIDATION.MIN_DESCRIPTION_LENGTH) {
      warnings.push(`Description is short. Recommended minimum: ${PORTFOLIO_VALIDATION.MIN_DESCRIPTION_LENGTH} characters`);
    }
    if (data.description.length < PORTFOLIO_VALIDATION.RECOMMENDED_DESCRIPTION_LENGTH) {
      warnings.push(`Consider adding more details. Recommended: ${PORTFOLIO_VALIDATION.RECOMMENDED_DESCRIPTION_LENGTH}+ characters`);
    }
  } else {
    warnings.push('Consider adding a description to showcase your work better');
  }
  
  // Image URL validation
  if (!data.imageUrl) {
    errors.push('At least one image is required');
  }
  
  // Cost validation
  if (data.projectCost !== undefined && data.projectCost < 0) {
    errors.push('Project cost cannot be negative');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if document is expiring soon
 */
export function checkDocumentExpiry(expiresAt: Date | null): {
  isExpiring: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  message?: string;
} {
  if (!expiresAt) {
    return {
      isExpiring: false,
      isExpired: false,
      daysUntilExpiry: null,
    };
  }
  
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    return {
      isExpiring: false,
      isExpired: true,
      daysUntilExpiry,
      message: 'Document has expired. Please upload a renewed version.',
    };
  }
  
  if (daysUntilExpiry <= CERTIFICATION_VALIDATION.EXPIRY_WARNING_DAYS) {
    return {
      isExpiring: true,
      isExpired: false,
      daysUntilExpiry,
      message: `Document expires in ${daysUntilExpiry} days. Please renew soon.`,
    };
  }
  
  return {
    isExpiring: false,
    isExpired: false,
    daysUntilExpiry,
  };
}

/**
 * Sanitize filename for secure storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = filename.split('/').pop() || filename;
  
  // Remove or replace dangerous characters
  let safe = basename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Prevent double extensions that could bypass security
  safe = safe.replace(/\.+/g, '.');
  
  // Ensure it doesn't start with a dot (hidden file)
  if (safe.startsWith('.')) {
    safe = 'file' + safe;
  }
  
  // Limit length
  if (safe.length > 100) {
    const ext = safe.split('.').pop();
    safe = safe.substring(0, 90) + '.' + ext;
  }
  
  return safe;
}

/**
 * Generate secure document path
 */
export function generateDocumentPath(
  providerId: string,
  documentType: string,
  filename: string
): string {
  const timestamp = Date.now();
  const safe = sanitizeFilename(filename);
  return `service-providers/${providerId}/documents/${documentType.toLowerCase()}_${timestamp}_${safe}`;
}

/**
 * Generate secure portfolio path
 */
export function generatePortfolioPath(
  providerId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const safe = sanitizeFilename(filename);
  return `service-providers/${providerId}/portfolio/${timestamp}_${safe}`;
}
