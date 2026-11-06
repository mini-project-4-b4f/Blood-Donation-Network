import { Injectable } from '@nestjs/common';

/**
 * The only source of the current date/time inside services.
 * Services must never call `new Date()` directly for business-rule comparisons.
 */
@Injectable()
export class ClockService {
  now(): Date {
    return new Date();
  }
}
