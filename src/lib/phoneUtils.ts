/**
 * Utility functions for handling Brazilian phone numbers
 * 
 * Brazilian phone number formats:
 * - International: +55 (DDD) XXXXX-XXXX or 55DDDXXXXXXXXX
 * - National: (DDD) XXXXX-XXXX or DDDXXXXXXXXX
 * - Mobile: 9 digits (starts with 9)
 * - Landline: 8 digits
 */

/**
 * Remove all non-digit characters from a phone number
 */
export function cleanPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Normalize a Brazilian phone number to international format (55DDDNNNNNNNNN)
 * Handles various input formats and ensures the country code is present
 */
export function normalizePhoneForWhatsApp(phone: string | null | undefined): string {
  const cleaned = cleanPhoneNumber(phone);
  
  if (!cleaned) return '';
  
  // Already has country code 55
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    return cleaned;
  }
  
  // Has DDD + number (10 or 11 digits)
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`;
  }
  
  // Just the number without DDD (8 or 9 digits) - can't process without DDD
  if (cleaned.length === 8 || cleaned.length === 9) {
    console.warn('Phone number missing DDD (area code):', cleaned);
    return cleaned;
  }
  
  // Already in correct format or unknown format
  return cleaned;
}

/**
 * Format a phone number for display with Brazilian mask
 * Input: any format
 * Output: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  const cleaned = cleanPhoneNumber(phone);
  
  if (!cleaned) return '';
  
  // Remove country code if present
  let national = cleaned;
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    national = cleaned.substring(2);
  }
  
  // Format based on length
  if (national.length === 11) {
    // Mobile: (XX) XXXXX-XXXX
    return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  } else if (national.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  } else if (national.length === 9) {
    // Mobile without DDD: XXXXX-XXXX
    return `${national.slice(0, 5)}-${national.slice(5)}`;
  } else if (national.length === 8) {
    // Landline without DDD: XXXX-XXXX
    return `${national.slice(0, 4)}-${national.slice(4)}`;
  }
  
  // Return as-is if unknown format
  return phone || '';
}

/**
 * Apply phone mask as user types
 * Returns the masked value for controlled inputs
 */
export function applyPhoneMask(value: string): string {
  const cleaned = cleanPhoneNumber(value);
  
  if (!cleaned) return '';
  
  // Limit to max 11 digits (DDD + mobile)
  const limited = cleaned.slice(0, 11);
  
  if (limited.length <= 2) {
    return `(${limited}`;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  } else {
    // 11 digits - mobile
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
}

/**
 * Validate if a phone number is valid for WhatsApp (Brazilian)
 * Must have DDD (2 digits) + number (8 or 9 digits)
 */
export function isValidWhatsAppNumber(phone: string | null | undefined): boolean {
  const cleaned = cleanPhoneNumber(phone);
  
  if (!cleaned) return false;
  
  // Remove country code if present
  let national = cleaned;
  if (cleaned.startsWith('55')) {
    national = cleaned.substring(2);
  }
  
  // Valid: 10 digits (landline) or 11 digits (mobile)
  return national.length === 10 || national.length === 11;
}

/**
 * Get validation error message for phone number
 */
export function getPhoneValidationError(phone: string | null | undefined): string | null {
  const cleaned = cleanPhoneNumber(phone);
  
  if (!cleaned) return 'Número de telefone obrigatório';
  
  // Remove country code
  let national = cleaned;
  if (cleaned.startsWith('55')) {
    national = cleaned.substring(2);
  }
  
  if (national.length < 10) {
    return 'Número muito curto. Digite DDD + número';
  }
  
  if (national.length > 11) {
    return 'Número muito longo';
  }
  
  return null;
}
