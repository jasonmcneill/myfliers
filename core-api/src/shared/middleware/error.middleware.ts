import { Request, Response, NextFunction } from 'express';
import { SiteError } from '../../features/sites/domain/site.error.ts'

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof SiteError) {
    return res.status(400).json({
      success: false,
      error: err.name,
      message: err.message,
    })
  }

  console.error('[System Error]', err);
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
