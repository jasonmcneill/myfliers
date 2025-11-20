import express from 'express'
import { siteRouter } from './features/sites/adapters/http/site.router';
import { globalErrorHandler } from './shared/middleware/error.middleware';

const app = express();

app.use(express.json());

app.use('/api/v1/sites', siteRouter);

app.use(globalErrorHandler);

export { app };
