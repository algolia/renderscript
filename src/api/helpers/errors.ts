import type express from 'express';

interface AnyParams {
  res: express.Response;
  status: number;
  message: string;
  details?: any;
}

function any({ res, status, message, details }: AnyParams): void {
  res.status(status).json({ error: true, message, details });
}

interface BadRequestParams {
  res: express.Response;
  message?: string;
  details?: any;
}

export function badRequest({
  res,
  details,
  message = 'Bad Request',
}: BadRequestParams): void {
  return any({
    res,
    status: 400,
    message,
    details,
  });
}
