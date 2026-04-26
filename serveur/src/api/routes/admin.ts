import { Router, Application, Request, Response } from "express";
import { extractRoutes } from "../../lib/routes-introspection";
import { auth } from "../../lib/auth";

export default function adminRoutes(app: Application) {
    const router = Router();
    
    router.get("/", async (req: Request, res: Response) => {
        if ((await auth.api.getUser()).role !== 'admin') {
            return res.status(401).json({ success: false, message: "Admin only" })
        }
        res.json(extractRoutes(app));
    });

    return router;
}