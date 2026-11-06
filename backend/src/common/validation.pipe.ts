import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

/**
 * Returns ONE readable message: the first failing constraint of the first failing property
 * (properties are checked in DTO declaration order).
 */
function firstMessage(errors: ValidationError[]): string | null {
  for (const error of errors) {
    if (error.constraints) {
      if (error.constraints['whitelistValidation']) {
        return `Unknown field '${error.property}' is not allowed.`;
      }
      const first = Object.values(error.constraints)[0];
      if (first) return first;
    }
    if (error.children && error.children.length > 0) {
      const nested = firstMessage(error.children);
      if (nested) return nested;
    }
  }
  return null;
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException(firstMessage(errors) ?? 'Invalid request.'),
  });
}
