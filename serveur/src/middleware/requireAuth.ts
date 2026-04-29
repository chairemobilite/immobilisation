import { auth } from "../lib/auth";
import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            return res.status(401).json({ success: false, message: "Access to API currently unauthorized use website to login" });
        }

        (req as any).user = session.user;
        next();
    } catch (error: any) { 
        return res.status(401).json({success:false, message:"Unauthorized"})
    }

}