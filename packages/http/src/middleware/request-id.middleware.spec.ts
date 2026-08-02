import type { NextFunction, Request, Response } from 'express';
import { REQUEST_ID_HEADER, requestIdMiddleware } from './request-id.middleware';

describe('requestIdMiddleware', () => {
  it('keeps a valid incoming request id', () => {
    const request = { headers: { [REQUEST_ID_HEADER]: 'request-123' } } as unknown as Request;
    const setHeader = jest.fn();
    const response = { setHeader } as unknown as Response;
    const next = jest.fn() as NextFunction;

    requestIdMiddleware(request, response, next);

    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'request-123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a request id when none is supplied', () => {
    const request = { headers: {} } as Request;
    const response = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    requestIdMiddleware(request, response, next);

    expect(request.headers[REQUEST_ID_HEADER]).toEqual(expect.any(String));
    expect(next).toHaveBeenCalledTimes(1);
  });
});
