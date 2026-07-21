import 'express';

declare global {
    namespace Express {
        interface Request {
            validated?: {
                params?: unknown;
                query?: unknown;
                body?: unknown;
            }| undefined;
        }
    }
}