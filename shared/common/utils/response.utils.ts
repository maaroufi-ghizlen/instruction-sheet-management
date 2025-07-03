
// shared/common/utils/response.utils.ts

import { BaseResponseDto, ErrorResponseDto } from '../dtos/base-response.dto';

export class ResponseUtils {
  /**
   * Create a standardized success response
   */
  static success<T>(
    data: T,
    message?: string,
    path?: string,
  ): BaseResponseDto & { data: T } {
    return {
      success: true,
      data,
      message: message || 'Operation completed successfully',
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Create a standardized error response
   */
  static error(
    errors: string[],
    code: string,
    message?: string,
    path?: string,
  ): ErrorResponseDto {
    return {
      success: false,
      errors,
      code,
      message: message || 'Operation failed',
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Extract error messages from various error types
   */
  static extractErrorMessages(error: any): string[] {
    if (typeof error === 'string') {
      return [error];
    }

    if (error.message) {
      return [error.message];
    }

    if (Array.isArray(error)) {
      return error.map(e => (typeof e === 'string' ? e : e.message || 'Unknown error'));
    }

    return ['Unknown error occurred'];
  }
}