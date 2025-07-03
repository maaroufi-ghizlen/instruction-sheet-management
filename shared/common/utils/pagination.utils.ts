// shared/common/utils/pagination.utils.ts

import { PaginationMetaDto } from '../dtos/pagination.dto';

export class PaginationUtils {
  /**
   * Calculate pagination metadata
   */
  static calculatePaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMetaDto {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }

  /**
   * Calculate skip value for pagination
   */
  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Build MongoDB sort object
   */
  static buildSortObject(sortBy: string, sortOrder: 'asc' | 'desc'): Record<string, 1 | -1> {
    return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  }
}