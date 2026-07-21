/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Generic validator function that safe parses and input schema and updates the request with 
a validated field that has transformed the variables to the required typs
*/


import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
/**
 * this is a generic validate middleware that takes in a schema and uses 
 * the zod library to coerce the various inputs to the correct type 
 * and stores them in a validate object which then used by downstream controllers
 * @param schema the zod schema to use to validate the incoming data
 * @returns 
 */
export const validate =
    (schema: z.ZodSchema) =>
    (req: Request, res: Response, next: NextFunction) => {

        const result = schema.safeParse({
            params: req.params,
            query: req.query,
            body: req.body
        });

        if (!result.success) {

            console.log(result.error);
            return res.status(400).json(result.error);
        }

        req.validated = result.data as Express.Request['validated'];

        next();
    };