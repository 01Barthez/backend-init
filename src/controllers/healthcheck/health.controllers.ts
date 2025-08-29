import { Request, Response } from "express";
import log from "../../services/logging/logger";

const healthControllers = {
    // Read
    health: async (_req: Request, res: Response): Promise<void> => {
        try {
            log.info("Health check endpoint called");

            res.status(200).json({
                message: "Server is running ✅",
            });
        } catch (error) {
            res.status(500).json({ error: "Error fetching items" });
        }
    },
};

export default healthControllers;