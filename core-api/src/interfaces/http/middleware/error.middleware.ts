import { Request, Response, NextFunction } from 'express';
import { SiteAlreadyExistsError, SiteError } from '../../../core/sites/site.error.ts'

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof SiteError) {
    siteErrorHandler(err, res);
  }

  console.error('[System Error]', err);
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}

const siteErrorHandler = (
  err: Error,
  res: Response
) => {
  if (err instanceof SiteAlreadyExistsError) {
    return res.status(409).json({
      success: false,
      error: err.name,
      message: err.message,
    })
  }

  return res.status(400).json({
    success: false,
    error: err.name,
    message: err.message,
  })
}
