
// shared/common/utils/validation.utils.ts

export class ValidationUtils {
  /**
   * Check if a string is a valid MongoDB ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Sanitize search query for MongoDB regex
   */
  static sanitizeSearchQuery(query: string): string {
    return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Build MongoDB search filter for multiple fields
   */
  static buildSearchFilter(
    search: string,
    fields: string[],
  ): { $or: Array<Record<string, { $regex: string; $options: string }>> } {
    const sanitizedSearch = this.sanitizeSearchQuery(search);
    return {
      $or: fields.map(field => ({
        [field]: { $regex: sanitizedSearch, $options: 'i' },
      })),
    };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
