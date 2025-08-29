import express from "express";
import metricsRouter from "./services/metrics/metrics";
import items from "./routes/items/items.router";
import health from "./routes/healtcheck/health.router";



const app = express();

app.use(express.json());
app.use(metricsRouter);
app.use('/items', items);
app.use('/health', health);


export default app;