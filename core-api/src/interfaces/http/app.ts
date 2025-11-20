import express from 'express'
import { siteRouter } from './routes/sites/site.router';
import { globalErrorHandler } from './middleware/error.middleware';

const app = express();

app.use(express.json());

app.use('/api/v1/sites', siteRouter);

app.use(globalErrorHandler);

export { app };
