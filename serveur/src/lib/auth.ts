import { betterAuth } from "better-auth";
import {pool} from "./poolCreate";
import { admin } from 'better-auth/plugins'
import { apiKey } from '@better-auth/api-key'


const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
    throw new Error("BETTER_AUTH_SECRET must be set");
}
export const auth = betterAuth({
    database: pool,
    baseURL: process.env.BACKEND_URL ? process.env.BACKEND_URL : "http://localhost:5000/",
    secret: secret,
    emailAndPassword:{
        enabled:true,
    },
    trustedOrigins:[process.env.TRUSTED_FRONTEND ? process.env.TRUSTED_FRONTEND : "http://localhost:3000"],
    plugins:[
        admin(),
        apiKey()
    ]
});
