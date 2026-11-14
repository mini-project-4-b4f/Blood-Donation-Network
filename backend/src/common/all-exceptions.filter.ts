import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ResolvedError {
  status: number;
  message: string;
}

/** Turns every HTTP or unexpected error into `{ "message": "..." }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, message } = this.resolve(exception);
    response.status(status).json({ message });
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      let message = exception.message;

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null && 'message' in body) {
        const raw = (body as { message: unknown }).message;
        message = Array.isArray(raw) ? String(raw[0]) : String(raw);
      }

      // Unknown routes: Nest says "Cannot GET /api/xyz".
      if (status === HttpStatus.NOT_FOUND && message.startsWith('Cannot ')) {
        message = 'Endpoint not found.';
      }
      return { status, message };
    }

    // Malformed JSON body (thrown by the body parser).
    if (
      typeof exception === 'object' &&
      exception !== null &&
      (exception as { type?: string }).type === 'entity.parse.failed'
    ) {
      return { status: HttpStatus.BAD_REQUEST, message: 'Invalid request body.' };
    }

    this.logger.error(
      exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
    );
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong. Please try again.',
    };
  }
}
