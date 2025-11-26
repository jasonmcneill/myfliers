import { NextFunction, Request, Response } from "express";
import {
  SiteAlreadyExistsError,
  SiteError,
} from "../../../core/sites/site.error.ts";
import { ZodError } from "zod";

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Bad Request",
    });
  }
  if (err instanceof SiteError) {
    siteErrorHandler(err, res);
  }

  console.error("[System Error]", err);
  return res.status(500).json({
    message: "Internal Server Error",
  });
};

const siteErrorHandler = (err: Error, res: Response) => {
  if (err instanceof SiteAlreadyExistsError) {
    return res.status(409).json({
      error: err.name,
      message: err.message,
    });
  }

  return res.status(400).json({
    error: err.name,
    message: err.message,
  });
};
