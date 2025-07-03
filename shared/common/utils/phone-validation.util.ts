// shared/common/utils/phone-validation.util.ts
// Alternative phone validation without libphonenumber-js dependency

import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Custom phone number validation decorator
 * Supports basic international phone number formats
 */
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && isValidPhoneNumber(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid phone number`;
        },
      },
    });
  };
}

/**
 * Basic phone number validation
 * Supports formats: +1234567890, +33 1 23 45 67 89, +44 20 7946 0958, etc.
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove all spaces, dashes, dots, and parentheses
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  
  // Check if it starts with + and contains only digits after that
  const internationalPattern = /^\+[1-9]\d{1,14}$/;
  
  // Check for US/Canada format without country code (10 digits)
  const northAmericaPattern = /^[2-9]\d{2}[2-9]\d{2}\d{4}$/;
  
  // Check for basic local formats (7-15 digits)
  const localPattern = /^\d{7,15}$/;

  return (
    internationalPattern.test(cleaned) ||
    northAmericaPattern.test(cleaned) ||
    localPattern.test(cleaned)
  );
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string, format: 'international' | 'national' = 'international'): string {
  if (!phone) return '';
  
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  
  if (format === 'international' && cleaned.startsWith('+')) {
    return cleaned;
  }
  
  if (format === 'national' && cleaned.length === 10) {
    // Format as (XXX) XXX-XXXX for US numbers
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Extract country code from international phone number
 */
export function extractCountryCode(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  
  if (!cleaned.startsWith('+')) {
    return null;
  }
  
  // Basic country code extraction (1-3 digits after +)
  const match = cleaned.match(/^\+(\d{1,3})/);
  return match ? match[1] : null;
}

/**
 * Common country codes for validation
 */
export const COMMON_COUNTRY_CODES = {
  US: '1',
  CA: '1',
  UK: '44',
  FR: '33',
  DE: '49',
  IT: '39',
  ES: '34',
  AU: '61',
  JP: '81',
  CN: '86',
  IN: '91',
  BR: '55',
  MX: '52',
  TN: '216', // Tunisia
} as const;

/**
 * Validate phone number with specific country code
 */
export function isValidPhoneNumberForCountry(phone: string, countryCode: string): boolean {
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  
  if (cleaned.startsWith(`+${countryCode}`)) {
    return isValidPhoneNumber(phone);
  }
  
  return false;
}