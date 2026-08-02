import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 128;

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const header = request.headers[REQUEST_ID_HEADER];
  const suppliedRequestId = typeof header === 'string' ? header.trim() : '';
  const requestId =
    suppliedRequestId.length > 0 && suppliedRequestId.length <= MAX_REQUEST_ID_LENGTH
      ? suppliedRequestId
      : randomUUID();

  request.headers[REQUEST_ID_HEADER] = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
