
// shared/common/utils/config.utils.ts

export class ConfigUtils {
  /**
   * Parse boolean environment variable
   */
  static parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Parse integer environment variable with default
   */
  static parseInt(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse array from comma-separated string
   */
  static parseArray(value: string | undefined, defaultValue: string[] = []): string[] {
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  /**
   * Get required environment variable or throw error
   */
  static getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }
}