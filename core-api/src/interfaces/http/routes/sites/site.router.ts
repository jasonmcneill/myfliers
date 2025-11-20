import { Router } from 'express';
import { SiteController } from './site.controller.ts';
import { SiteService } from '../../../../core/sites/site.service';

import { InMemorySiteRepository } from '../../../../core/sites/repositories/in-memory.repository.ts'

// Dependercy Injection
const repo = new InMemorySiteRepository();
const service = new SiteService(repo);
const controller = new SiteController(service);

const siteRouter = Router();

siteRouter.post('/', controller.register);

export { siteRouter };
