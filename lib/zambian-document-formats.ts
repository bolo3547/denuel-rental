/**
 * Zambian Document Format Validation
 * 
 * Specific validation rules for Zambian identity and business documents
 */

// Zambian District Codes (for NRC validation)
export const ZAMBIAN_DISTRICTS = {
  '01': 'Lusaka',
  '02': 'Kitwe',
  '03': 'Ndola',
  '04': 'Kabwe',
  '05': 'Chingola',
  '06': 'Mufulira',
  '07': 'Luanshya',
  '08': 'Livingstone',
  '09': 'Kasama',
  '10': 'Chipata',
  '11': 'Choma',
  '12': 'Mongu',
  '13': 'Solwezi',
  '14': 'Mansa',
  '15': 'Kapiri Mposhi',
  '16': 'Mazabuka',
  '17': 'Monze',
  '18': 'Kafue',
  '19': 'Chililabombwe',
  '20': 'Kalulushi',
  '21': 'Nchelenge',
  '22': 'Mpika',
  '23': 'Lundazi',
  '24': 'Samfya',
  '25': 'Mumbwa',
  '26': 'Sesheke',
  '27': 'Kalomo',
  '28': 'Petauke',
  '29': 'Nakonde',
  '30': 'Senanga',
  '31': 'Mwinilunga',
  '32': 'Kawambwa',
  '33': 'Mungwi',
  '34': 'Mbala',
  '35': 'Isoka',
  '36': 'Chavuma',
  '37': 'Zambezi',
  '38': 'Katete',
  '39': 'Chadiza',
  '40': 'Nyimba',
  '41': 'Namwala',
  '42': 'Itezhi-Tezhi',
  '43': 'Kabompo',
  '44': 'Kasempa',
  '45': 'Lukulu',
  '46': 'Kaoma',
  '47': 'Kalabo',
  '48': 'Shangombo',
  '49': 'Siavonga',
  '50': 'Gwembe',
  '51': 'Sinazongwe',
  '52': 'Serenje',
  '53': 'Mkushi',
  '54': 'Mpongwe',
  '55': 'Masaiti',
  '56': 'Lufwanyama',
  '57': 'Mpulungu',
  '58': 'Chilubi',
  '59': 'Kaputa',
  '60': 'Luwingu',
  '61': 'Mporokoso',
  '62': 'Chama',
  '63': 'Vubwi',
  '64': 'Chembe',
  '65': 'Milenge',
  '66': 'Mwense',
  '67': 'Nchelenge',
  '68': 'Chiengi',
  '69': 'Lunga',
  '70': 'Ikelenge',
  '71': 'Kalumbila',
  '72': 'Sioma',
};

// Driver's License Classes
export const LICENSE_CLASSES = {
  'A': 'Motorcycles',
  'A1': 'Light Motorcycles (up to 125cc)',
  'B': 'Light Motor Vehicles (under 3,500kg)',
  'C': 'Medium Motor Vehicles (3,500kg - 16,000kg)',
  'C1': 'Light Trucks (3,500kg - 7,500kg)',
  'D': 'Heavy Motor Vehicles (over 16,000kg)',
  'E': 'Bus/Passenger Vehicles',
  'F': 'Agricultural Tractors',
  'G': 'Road Rollers',
  'H': 'Track-laying Vehicles',
};

/**
 * Validate Zambian NRC (National Registration Card) format
 */
export function validateZambianNRC(nrc: string): {
  valid: boolean;
  error?: string;
  district?: string;
  districtCode?: string;
  checkDigit?: number;
} {
  // Remove spaces and forward slashes for validation
  const cleaned = nrc.replace(/[\/\s-]/g, '');
  
  // NRC format: NNNNNN/NN/N (6 digits / 2 digits / 1 digit)
  const nrcPattern = /^(\d{6})(\d{2})(\d{1})$/;
  const match = cleaned.match(nrcPattern);
  
  if (!match) {
    return {
      valid: false,
      error: 'Invalid NRC format. Should be NNNNNN/NN/N (e.g., 123456/12/1)',
    };
  }
  
  const [, idNumber, districtCode, checkDigitStr] = match;
  const checkDigit = parseInt(checkDigitStr);
  
  // Validate district code
  if (!ZAMBIAN_DISTRICTS[districtCode]) {
    return {
      valid: false,
      error: `Invalid district code: ${districtCode}`,
    };
  }
  
  // Calculate check digit (simple mod 10 algorithm)
  const digits = (idNumber + districtCode).split('').map(Number);
  const sum = digits.reduce((acc, digit, index) => {
    // Weighted sum
    const weight = index % 2 === 0 ? 1 : 3;
    return acc + (digit * weight);
  }, 0);
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  if (calculatedCheckDigit !== checkDigit) {
    return {
      valid: false,
      error: 'Invalid check digit - NRC may be fake or incorrectly entered',
      checkDigit: calculatedCheckDigit,
    };
  }
  
  return {
    valid: true,
    district: ZAMBIAN_DISTRICTS[districtCode],
    districtCode,
    checkDigit,
  };
}

/**
 * Validate Zambian Driver's License Number
 */
export function validateDriverLicense(licenseNumber: string): {
  valid: boolean;
  error?: string;
  format?: string;
} {
  const cleaned = licenseNumber.replace(/[\/\s-]/g, '').toUpperCase();
  
  // Common Zambian license formats
  const formats = [
    /^DL\d{7,10}$/,  // DL followed by 7-10 digits
    /^[A-Z]{2}\d{6,9}$/,  // Two letters followed by 6-9 digits
    /^\d{8,12}$/,  // 8-12 digits
  ];
  
  const matchedFormat = formats.find(format => format.test(cleaned));
  
  if (!matchedFormat) {
    return {
      valid: false,
      error: 'Invalid driver\'s license format',
    };
  }
  
  return {
    valid: true,
    format: matchedFormat.source,
  };
}

/**
 * Validate license class combination
 */
export function validateLicenseClasses(classes: string[]): {
  valid: boolean;
  error?: string;
  validClasses: string[];
  invalidClasses: string[];
} {
  const validClasses = classes.filter(c => LICENSE_CLASSES[c as keyof typeof LICENSE_CLASSES]);
  const invalidClasses = classes.filter(c => !LICENSE_CLASSES[c as keyof typeof LICENSE_CLASSES]);
  
  if (invalidClasses.length > 0) {
    return {
      valid: false,
      error: `Invalid license classes: ${invalidClasses.join(', ')}`,
      validClasses,
      invalidClasses,
    };
  }
  
  // Check for incompatible combinations (if any rules exist)
  // For now, all valid combinations are allowed
  
  return {
    valid: true,
    validClasses,
    invalidClasses: [],
  };
}

/**
 * Validate TPIN (Taxpayer Identification Number)
 */
export function validateTPIN(tpin: string): {
  valid: boolean;
  error?: string;
} {
  const cleaned = tpin.replace(/[\/\s-]/g, '');
  
  // TPIN is 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return {
      valid: false,
      error: 'TPIN must be 10 digits',
    };
  }
  
  // Simple checksum validation (ZRA uses a specific algorithm)
  // This is a simplified version
  const digits = cleaned.split('').map(Number);
  const sum = digits.slice(0, 9).reduce((acc, digit, index) => {
    return acc + digit * (10 - index);
  }, 0);
  
  const checkDigit = (11 - (sum % 11)) % 11;
  const lastDigit = digits[9];
  
  // Note: Real TPIN validation requires ZRA's specific algorithm
  // This is a basic check
  if (checkDigit === 10 || lastDigit !== checkDigit) {
    // Don't fail completely, just warn
    console.warn('TPIN checksum may be invalid, but format is correct');
  }
  
  return {
    valid: true,
  };
}

/**
 * Validate Business License Number
 */
export function validateBusinessLicense(licenseNumber: string): {
  valid: boolean;
  error?: string;
  type?: string;
} {
  const cleaned = licenseNumber.replace(/[\/\s-]/g, '').toUpperCase();
  
  // PACRA format: BN followed by numbers
  const pacraPattern = /^BN\d{6,10}$/;
  
  // Council license format: varies by council
  const councilPattern = /^[A-Z]{2,4}\d{4,8}$/;
  
  if (pacraPattern.test(cleaned)) {
    return {
      valid: true,
      type: 'PACRA Registration',
    };
  }
  
  if (councilPattern.test(cleaned)) {
    return {
      valid: true,
      type: 'Council License',
    };
  }
  
  // Allow flexible format for now
  if (cleaned.length >= 6) {
    return {
      valid: true,
      type: 'Other Business License',
    };
  }
  
  return {
    valid: false,
    error: 'Invalid business license format',
  };
}

/**
 * Extract age from NRC number
 * Note: NRC doesn't directly encode DOB, this is estimated
 */
export function estimateAgeFromNRC(nrc: string): {
  estimatedAge?: number;
  error?: string;
} {
  // NRCs are issued sequentially, so earlier numbers = older people
  // This is a very rough estimation
  const cleaned = nrc.replace(/[\/\s-]/g, '');
  const match = cleaned.match(/^(\d{6})/);
  
  if (!match) {
    return { error: 'Invalid NRC format' };
  }
  
  const idNumber = parseInt(match[1]);
  
  // Very rough estimation based on issue patterns
  // This would need actual data to be accurate
  // Lower numbers were issued earlier (1960s-1970s)
  if (idNumber < 100000) {
    return { estimatedAge: 60 }; // Likely 60+
  } else if (idNumber < 500000) {
    return { estimatedAge: 40 }; // Likely 40-60
  } else if (idNumber < 900000) {
    return { estimatedAge: 25 }; // Likely 25-40
  } else {
    return { estimatedAge: 20 }; // Likely 18-25
  }
}

/**
 * Validate document expiry date
 */
export function validateExpiryDate(
  expiryDate: Date | string,
  documentType: string
): {
  valid: boolean;
  expired: boolean;
  error?: string;
  daysUntilExpiry?: number;
} {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  
  if (isNaN(expiry.getTime())) {
    return {
      valid: false,
      expired: false,
      error: 'Invalid expiry date format',
    };
  }
  
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const expired = daysUntilExpiry < 0;
  
  // Check maximum validity periods
  const maxValidityYears: Record<string, number> = {
    'NRC': 100, // NRCs don't expire but can be replaced
    'LICENSE': 5, // Driver's licenses valid for 5 years
    'BUSINESS_LICENSE': 1, // Annual renewal
    'INSURANCE': 1, // Annual policy
    'CERTIFICATE': 10, // Professional certs
  };
  
  const issueDate = new Date(expiry);
  issueDate.setFullYear(issueDate.getFullYear() - (maxValidityYears[documentType] || 5));
  
  if (issueDate < new Date('1960-01-01')) {
    return {
      valid: false,
      expired,
      error: 'Document validity period is unreasonably long',
      daysUntilExpiry,
    };
  }
  
  return {
    valid: true,
    expired,
    daysUntilExpiry,
  };
}

/**
 * Format NRC for display
 */
export function formatNRC(nrc: string): string {
  const cleaned = nrc.replace(/[\/\s-]/g, '');
  const match = cleaned.match(/^(\d{6})(\d{2})(\d{1})$/);
  
  if (!match) {
    return nrc; // Return original if invalid
  }
  
  return `${match[1]}/${match[2]}/${match[3]}`;
}

/**
 * Format driver's license for display
 */
export function formatDriverLicense(license: string): string {
  const cleaned = license.replace(/[\/\s-]/g, '').toUpperCase();
  
  // Add dashes for readability
  if (/^DL\d{7,10}$/.test(cleaned)) {
    return `DL-${cleaned.substring(2)}`;
  }
  
  return cleaned;
}
