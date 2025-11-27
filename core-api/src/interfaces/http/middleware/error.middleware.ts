import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  SiteAlreadyExistsError,
  SiteError,
  SiteInputError,
} from "../../../core/sites/site.error.ts";

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    zodErrorHandler(err, res);
    return res;
  }
  if (err instanceof SiteError) {
    siteErrorHandler(err, res);
    return res;
  }

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

const zodErrorHandler = (err: ZodError, res: Response) => {
  const details = err.issues.map((issue) => {
    const message = issue.message;

    const entry: string | undefined = Object.entries(SiteInputError)
      .find((
        [_key, value],
      ) => value === message)
      ?.[0];

    const customCode = entry;

    return {
      field: issue.path.join("."),
      message: issue.message,
      code: customCode || issue.code,
    };
  });

  return res.status(400).json({
    message: "The request data is invalid.",
    details: details,
  });
};
