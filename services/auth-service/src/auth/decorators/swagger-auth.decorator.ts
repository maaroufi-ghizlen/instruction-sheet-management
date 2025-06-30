
// services/auth-service/src/auth/decorators/swagger-auth.decorator.ts

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

interface SwaggerAuthOptions {
  summary: string;
  description?: string;
  tags?: string[];
  successDescription?: string;
  successStatus?: number;
}

export function SwaggerAuth(options: SwaggerAuthOptions) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiResponse({
      status: options.successStatus || 200,
      description: options.successDescription || 'Success',
    }),
    ApiBadRequestResponse({
      description: 'Bad Request - Invalid input data',
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
    }),
  ];

  if (options.tags && options.tags.length > 0) {
    decorators.push(ApiTags(...options.tags));
  }

  return applyDecorators(...decorators);
}