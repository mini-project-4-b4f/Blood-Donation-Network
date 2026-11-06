import { Injectable, Logger } from '@nestjs/common';

/**
 * Domain-event logger. Logs only meaningful events (never every HTTP request)
 * and never logs passwords or tokens.
 */
@Injectable()
export class AppLogger {
  private readonly logger = new Logger('BloodDonationNetwork');

  logRequestCreated(
    requestId: string,
    bloodType: string,
    unitsRequired: number,
    areaName: string,
    urgency: string,
  ): void {
    this.logger.log(
      `REQUEST_CREATED id=${requestId} bloodType=${bloodType} units=${unitsRequired} area=${areaName} urgency=${urgency}`,
    );
  }

  logRequestCancelled(requestId: string, reason: string): void {
    this.logger.log(`REQUEST_CANCELLED id=${requestId} reason="${reason}"`);
  }

  logRequestFulfilled(requestId: string): void {
    this.logger.log(`REQUEST_FULFILLED id=${requestId}`);
  }

  logDonationRecorded(donationId: string, requestId: string, donorId: string): void {
    this.logger.log(
      `DONATION_RECORDED id=${donationId} requestId=${requestId} donorId=${donorId}`,
    );
  }

  warnDonationRejected(requestId: string, donorId: string, reason: string): void {
    this.logger.warn(
      `DONATION_REJECTED requestId=${requestId} donorId=${donorId} reason="${reason}"`,
    );
  }
}
