import { Router } from 'express';
import { SiteController } from './site.controller.ts';
import { SiteService } from '../../domain/site.service';

import { InMemorySiteRepository } from '../../adapters/in-memory.repository.ts'

// Dependercy Injection
const repo = new InMemorySiteRepository();
const service = new SiteService(repo);
const controller = new SiteController(service);

const siteRouter = Router();

siteRouter.post('/', controller.register);

export { siteRouter };
