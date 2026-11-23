import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

/**
 * Format d'erreur unique pour toute l'API :
 *   { "statusCode": 400, "message": "texte lisible" }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      let message = exception.message;

      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object' && 'message' in payload) {
        const raw = (payload as { message: unknown }).message;
        message = Array.isArray(raw) ? raw.join(' ') : String(raw);
      }

      response.status(status).json({ statusCode: status, message });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erreur interne du serveur.',
    });
  }
}
