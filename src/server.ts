import express from "express";
import metricsRouter from "./services/metrics/metrics";
import items from "./router/items/items.router";
import health from "./router/healtcheck/health.router";
import morgan from "morgan";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(cors());

app.use(metricsRouter);
app.use('/items', items);
app.use('/health', health);


// Error handling middleware
app.use(errorHandler);

export default app;