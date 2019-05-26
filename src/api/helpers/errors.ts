import * as express from "express";

interface anyParams {
  res: express.Response;
  status: number;
  message: string;
  details?: any;
}

function any({ res, status, message, details }: anyParams) {
  res.status(status).json({ error: true, message, details });
}

interface badRequestParams {
  res: express.Response;
  message?: string;
  details?: any;
}

export function badRequest({
  res,
  details,
  message = "Bad Request"
}: badRequestParams) {
  return any({
    res,
    status: 400,
    message,
    details
  });
}
