import { Request, Response } from "express";
import { sendResponse } from "./response";


export const response = {
    ok: <T>(req: Request, res: Response, data: T, message = 'Success') =>
        sendResponse(req, res, 200, message, data),

    paginated: (
        req: Request,
        res: Response,
        items: any[],
        totalItems: number,
        totalPages: number,
        currentPage: number,
        message = 'Success'
    ) =>
        sendResponse(req, res, 200, message, null, {}, {
            items,
            totalItems,
            totalPages,
            currentPage,
        }),

    created: <T>(req: Request, res: Response, data: T, message = 'Resource created') =>
        sendResponse(req, res, 201, message, data),

    success: <T>(req: Request, res: Response, data: T, message = 'No Content') =>
        sendResponse(req, res, 204, message, data),

    badRequest: (req: Request, res: Response, message = 'Bad request') =>
        sendResponse(req, res, 400, message),

    unauthorized: (req: Request, res: Response, message = 'Unauthorized') =>
        sendResponse(req, res, 401, message),

    forbidden: (req: Request, res: Response, message = 'Forbidden') =>
        sendResponse(req, res, 403, message),

    notFound: (req: Request, res: Response, message = 'Not found') =>
        sendResponse(req, res, 404, message),

    conflict: (req: Request, res: Response, message = 'Conflict') =>
        sendResponse(req, res, 409, message),

    unprocessable: (req: Request, res: Response, message = 'Unprocessable entity') =>
        sendResponse(req, res, 422, message),

    serverError: (req: Request, res: Response, message = 'Internal server error') =>
        sendResponse(req, res, 500, message),

    serviceUnavailable: (req: Request, res: Response, message = 'Service unavailable') =>
        sendResponse(req, res, 503, message),
};
