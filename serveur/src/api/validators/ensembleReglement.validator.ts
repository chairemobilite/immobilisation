/*

Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

This contains the expected types of the various inputs to the ensemble règlements queries
*/

import {string, z} from 'zod';

export const intCsv = z
  .string()
  .trim()
  .regex(/^\d+(,\s*\d+)*$/)
  .transform((value) => value.split(",").map(Number))
  .pipe(z.array(z.number().int()));

export const GetRegSetsQuerySchema=z.object({
    query:z.object({
        date_debut_er_avant:z.coerce.number().int().nullable().optional(), 
        date_debut_er_apres:z.coerce.number().int().nullable().optional(), 
        date_fin_er_avant:z.coerce.number().int().nullable().optional(), 
        date_fin_er_apres:z.coerce.number().int().nullable().optional(), 
        description_like:z.string().optional(), 
        id_er:intCsv.optional()
    })
})

export const DeleteItemsSchema=z.object({
    params:z.object({
        id:z.coerce.number().int()
    })
})

export const GetFullRegSetsSchema=z.object({
    params:z.object({id:intCsv})
})

export const PostRegSetHeaderSchema=z.object({
    body:z.object({
        description_er:z.string(),
        date_debut_er:z.coerce.number().int().nullable(),
        date_fin_er:z.coerce.number().int().nullable()
    })
})

export const ModifyRegSetHeaderSchema = PostRegSetHeaderSchema.extend({
    params:z.object({
        id:z.coerce.number().int()
    })
})

export const PostLandUseToRuleAssignSchema = z.object({
    body:z.object({
        id_er:z.coerce.number().int(), 
        cubf:z.coerce.number().int(), 
        id_reg_stat:z.coerce.number().int() 
    })
})

export const ModifyLandUseToRuleAssignSchema = PostLandUseToRuleAssignSchema.extend({
    params:z.object({
        id:z.coerce.number().int()
    })
})

export const stringCSV = z
  .string()
  .trim()
  .transform((value) => value.split(","))
  .pipe(z.array(z.string())); 

export const GetRegSetsByTaxIdSchema=z.object({
    params:z.object({ids:stringCSV})
})

export const GetInfoForChartsSchema=z.object({
    body:z.array(z.object({
        cubf:z.coerce.number().int(),
        id_er:z.array(z.coerce.number().int())
    }))
})