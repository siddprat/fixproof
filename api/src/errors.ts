import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import type { ErrorCode } from './contract.js';

const status: Record<ErrorCode, number> = {
  BAD_REQUEST: 400, NOT_FOUND: 404, PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429, AI_UNAVAILABLE: 502, AI_INVALID_OUTPUT: 502,
};
export class ApiFailure extends Error {
  constructor(public code: ErrorCode, message: string) { super(message); }
}
export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) return next(error);
  let failure: ApiFailure;
  if (error instanceof ApiFailure) failure = error;
  else if (error instanceof ZodError) failure = new ApiFailure('BAD_REQUEST', 'Check the fields and try again.');
  else if (error instanceof multer.MulterError) {
    failure = error.code === 'LIMIT_FILE_SIZE'
      ? new ApiFailure('PAYLOAD_TOO_LARGE', 'Each photo must be 8 MB or smaller.')
      : new ApiFailure('BAD_REQUEST', 'Choose 1 to 3 photos and a note of at most 1000 characters.');
  } else if (error?.type === 'entity.too.large') failure = new ApiFailure('PAYLOAD_TOO_LARGE', 'That request is too large.');
  else if (error?.type === 'entity.parse.failed') failure = new ApiFailure('BAD_REQUEST', 'We could not read that request.');
  else {
    // The contract has no general service error. Use a generic 502 without leaking details.
    console.error('Request failed.');
    failure = new ApiFailure('AI_UNAVAILABLE', 'The service is unavailable. Please try again.');
  }
  response.status(status[failure.code]).json({ error: { code: failure.code, message: failure.message } });
};
