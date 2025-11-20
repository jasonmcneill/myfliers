import { Request, Response, NextFunction } from "express";
import { SiteService } from "../../../../core/sites/site.service.ts";
import { CreateSiteInput } from "../../../../core/sites/site.types.ts";

export class SiteController {
  constructor(private readonly service: SiteService) {}

  // We need this closure (arrow function) to pass `this` context to express,
  // so that the code can register the site later
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: CreateSiteInput = req.body;

      const site = await this.service.registerSite(input);

      res.status(201).json({
        status: site.status,
        createdAt: site.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };
}
