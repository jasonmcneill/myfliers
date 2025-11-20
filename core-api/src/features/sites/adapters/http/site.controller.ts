import { Request, Response, NextFunction } from 'express'
import { SiteService } from '../../domain/site.service.ts'
import { CreateSiteInput } from '../../domain/site.types.ts';

export class SiteController {
  constructor(private readonly service: SiteService) { }

  // We need this closure (arrow function) to pass `this` context to express,
  // so that the code can register the site later
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: CreateSiteInput = req.body;

      const site = await this.service.registerSite(input);

      res.status(201).json({
        success: true,
        data: site,
      });

    } catch (error) {
      next(error);
    }
  };
}
