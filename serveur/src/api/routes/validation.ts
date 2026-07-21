import { condition_strate, 
    RequeteModifStrate, 
    strate, 
    strate_db, 
    condition_echantillonage, 
    RequeteResValide, 
    CorpsValide, 
    RequeteGraphiqueValidation,   
} from '@localTypes/validation.types';
import { dataHistogrammeVariabilite } from '@localTypes/analyseVariabilite.types';
import { Router, RequestHandler } from 'express';
import { Pool } from 'pg';
import { bin, Bin, HistogramGeneratorNumber } from 'd3-array';
export const creationRouteurValidation = (pool: Pool): Router => {
    const router = Router();
    const creationCondition = (ligne: strate_db): condition_strate | undefined => {
        if (ligne.condition_type === 'equals' && ligne.condition_valeur !== null) {
            return ({
                condition_type: 'equals',
                condition_valeur: ligne.condition_valeur
            })
        } else if (ligne.condition_type === 'range') {
            return (
                {
                    condition_type: 'range',
                    condition_max: ligne.condition_max,
                    condition_min: ligne.condition_min
                }
            )
        } else {
            return undefined;
        }
    }
    const creationStrateCorrecte = (tete: number[], toutes: strate_db[]): strate[] => {
        let out: strate[] = [];

        // Find all nodes at this level (whose ids are in tete)
        const rel_this_level = toutes.filter((row) => tete.includes(row.id_strate));

        for (let node of rel_this_level) {
            if (!node.ids_enfants || node.ids_enfants.length === 0) {
                // leaf node
                out.push(
                    {
                        ...node,
                        condition: creationCondition(node)
                    }
                );
            } else {
                // has children → recurse
                out.push({
                    ...node,
                    condition: creationCondition(node),
                    subStrata: creationStrateCorrecte(node.ids_enfants, toutes),
                });
            }
        }

        return out;
    };

    const applatissementStrate = (strate_entrante: strate): strate_db | Omit<strate_db, 'id_strate'> => {
        // À Completer
        let output: strate_db | Omit<strate_db, 'id_strate'>;
        if (strate_entrante.id_strate !== undefined) {
            output = {
                nom_colonne: strate_entrante.nom_colonne,
                nom_table: strate_entrante.nom_table,
                nom_strate: strate_entrante.nom_strate,
                n_sample: strate_entrante.n_sample,
                index_ordre: strate_entrante.index_ordre,
                est_racine: strate_entrante.est_racine,
                ids_enfants: strate_entrante.ids_enfants,
                logements_valides: strate_entrante.logements_valides,
                date_valide: strate_entrante.date_valide,
                superf_valide: strate_entrante.superf_valide,
                condition_type: strate_entrante.condition?.condition_type ?? 'equals',
                condition_min: strate_entrante.condition?.condition_type === 'equals' ? null : (strate_entrante.condition?.condition_min ?? null),
                condition_max: strate_entrante.condition?.condition_type === 'equals' ? null : (strate_entrante.condition?.condition_max ?? null),
                condition_valeur: strate_entrante.condition?.condition_type === 'equals' ? Number(strate_entrante.condition!.condition_valeur) : null,
            }
        } else {
            output = {
                id_strate: strate_entrante.id_strate,
                nom_colonne: strate_entrante.nom_colonne,
                nom_table: strate_entrante.nom_table,
                nom_strate: strate_entrante.nom_strate,
                n_sample: strate_entrante.n_sample,
                index_ordre: strate_entrante.index_ordre,
                est_racine: strate_entrante.est_racine,
                ids_enfants: strate_entrante.ids_enfants,
                logements_valides: strate_entrante.logements_valides,
                date_valide: strate_entrante.date_valide,
                superf_valide: strate_entrante.superf_valide,
                condition_type: strate_entrante.condition?.condition_type ?? 'equals',
                condition_min: strate_entrante.condition?.condition_type === 'equals' ? null : (strate_entrante.condition?.condition_min ?? null),
                condition_max: strate_entrante.condition?.condition_type === 'equals' ? null : (strate_entrante.condition?.condition_max ?? null),
                condition_valeur: strate_entrante.condition?.condition_type === 'equals' ? Number(strate_entrante.condition!.condition_valeur) : null,
            }
        }
        return output
    }

    const creeValeursPertinents = async (): Promise<boolean> => {
        console.log('creation données pertinentes')
        let client;
        try {
            client = await pool.connect();
            let query: string
            let result: any;
            let query_strates: string;
            let result_strates: any;
            /* creation des valeurs pour l'échantillonage */
            query =
                `DROP TABLE inputs_validation;

                CREATE TABLE inputs_validation (
                    g_no_lot                VARCHAR(255) PRIMARY KEY,
                    nb_entrees              BIGINT,
                    cubf_presents           INTEGER[],
                    n_cubf                  INTEGER,
                    toutes_surfaces_valides BOOLEAN,
                    toutes_dates_valides    BOOLEAN,
                    tous_logements_valides  BOOLEAN,
                    sup_planch_tot          DOUBLE PRECISION,
                    n_logements_tot         INTEGER,
                    premiere_constr         INTEGER,
                    valeur_totale           BIGINT,
                    cubf_principal          INTEGER,
                    valeur_maximale         INTEGER,
                    random_value            DOUBLE PRECISION
                );
                INSERT INTO inputs_validation (
                    g_no_lot,
                    nb_entrees,
                    cubf_presents,
                    n_cubf,
                    toutes_surfaces_valides,
                    toutes_dates_valides,
                    tous_logements_valides,
                    sup_planch_tot,
                    n_logements_tot,
                    premiere_constr,
                    valeur_totale,
                    cubf_principal,
                    valeur_maximale,
                    random_value
                )
                SELECT
                    g_no_lot,
                    nb_entrees,
                    cubf_presents,
                    n_cubf,
                    toutes_surfaces_valides,
                    toutes_dates_valides,
                    tous_logements_valides,
                    sup_planch_tot,
                    n_logements_tot,
                    premiere_constr,
                    valeur_totale,
                    cubf_principal,
                    valeur_maximale,
                    random_value
                FROM (
                    /* -------------------------------------------------
                    1 CTE – enrichissement des rôles
                    ------------------------------------------------- */
                    WITH role_augmente AS (
                        SELECT
                            id_provinc,
                            rl0105a::int                     AS cubf,
                            rl0308a                          AS sup_planch,
                            rl0311a                          AS n_logements,
                            rl0307a                          AS annee_constr,
                            rl0308a IS NOT NULL              AS sup_planch_valid,
                            rl0311a IS NOT NULL              AS n_logements_valid,
                            rl0307a IS NOT NULL              AS annee_const_valid,
                            rl0404a                          AS valeur_au_role
                        FROM role_foncier
                    ),

                    /* -------------------------------------------------
                    2 -  Jointure + rang pour choisir le CUBF « principal »
                    ------------------------------------------------- */
                    joined AS (
                        SELECT
                            acr.g_no_lot,
                            ra.id_provinc,
                            ra.cubf,
                            ra.valeur_au_role,
                            ra.sup_planch_valid,
                            ra.n_logements_valid,
                            ra.annee_const_valid,
                            ra.sup_planch,
                            ra.n_logements,
                            ra.annee_constr::int,
                            ROW_NUMBER() OVER (
                                PARTITION BY acr.g_no_lot
                                ORDER BY ra.valeur_au_role DESC NULLS LAST, ra.cubf
                            ) AS rn
                        FROM public.association_cadastre_role AS acr
                        LEFT JOIN role_augmente AS ra
                            ON ra.id_provinc = acr.id_provinc
                        where acr.g_no_lot is not null
                    ),

                    /* -------------------------------------------------
                    3 - Agrégation finale par lot
                    ------------------------------------------------- */
                    aggregated AS (
                        SELECT
                            g_no_lot,
                            COUNT(id_provinc)                                   AS nb_entrees,
                            ARRAY_AGG(DISTINCT cubf)                            AS cubf_presents,
                            CARDINALITY(ARRAY_AGG(DISTINCT cubf))               AS n_cubf,
                            BOOL_AND(sup_planch_valid)                         AS toutes_surfaces_valides,
                            BOOL_AND(annee_const_valid)                        AS toutes_dates_valides,
                            BOOL_AND(n_logements_valid)                         AS tous_logements_valides,
                            SUM(sup_planch)                                    AS sup_planch_tot,
                            SUM(n_logements)::int                               AS n_logements_tot,
                            MIN(annee_constr)                                   AS premiere_constr,
                            SUM(valeur_au_role)                                 AS valeur_totale,
                            MAX(CASE WHEN rn = 1 THEN cubf END)                AS cubf_principal,
                            MAX(CASE WHEN rn = 1 THEN valeur_au_role END)      AS valeur_maximale,

                            /* -------------------------------------------------
                            Valeur pseudo‑aléatoire déterministe (hash)
                            ------------------------------------------------- */
                            (('x' || substr(md5(g_no_lot::text),1,8))::bit(32)::bigint )::numeric
                                / (power(2,31) - 1)                             AS random_value
                        FROM joined
                        GROUP BY g_no_lot
                    )
                    SELECT * FROM aggregated
                ) AS src;
                `;
            result = await client.query(query)
            return true
        } catch (err: any) {
            return false
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const genereRequeteParEndPoint = (strates: strate[], condition?: string, description?: string, colonnes?: string[]): condition_echantillonage[] => {
        let conditions_init: string[] = [];
        let description_init: string[] = []
        let conditions_out: condition_echantillonage[] = [];
        let conditions_inter: string[] = [];
        let description_inter: string[] = []
        let colonnes_init: string[] = []
        let colonnes_inter: string[] = []
        if (condition) {
            conditions_init = [structuredClone(condition)];
        }
        if (description) {
            description_init = [structuredClone(description)]
        }
        if (colonnes) {
            colonnes_init = structuredClone(colonnes)
        }
        for (let strate of strates) {
            conditions_inter = structuredClone(conditions_init)
            description_inter = structuredClone(description_init)
            colonnes_inter = structuredClone(colonnes_init)
            const conditionStr = strate.condition
                ? (strate.condition.condition_type === 'equals'
                    ? strate.nom_colonne + ' = ' + strate.condition.condition_valeur
                    : strate.nom_colonne + ' >= ' + strate.condition.condition_min + ' AND ' + strate.nom_colonne + ' <= ' + strate.condition.condition_max)
                : '';
            conditions_inter.push(conditionStr);
            colonnes_inter.push(strate.nom_colonne)
            const descriptionStr = strate.nom_strate
            description_inter.push(descriptionStr)
            if (strate.logements_valides === true) {
                conditions_inter.push('tous_logements_valides = true')
            }
            if (strate.superf_valide === true) {
                conditions_inter.push('toutes_surfaces_valides = true')
            }
            if (strate.date_valide === true) {
                conditions_inter.push('toutes_dates_valides = true')
            }
            const condition_join = conditions_inter.join(' AND ')
            const description_join = description_inter.join(' - ')
            if (strate.subStrata) {
                const conditions_string: condition_echantillonage[] = genereRequeteParEndPoint(strate.subStrata, condition_join, description_join, colonnes_inter)
                conditions_string.map((row) => conditions_out.push({ ...row }))
            } else {
                const out: condition_echantillonage = {
                    id_strate: strate.id_strate,
                    condition: condition_join, desc_concat: description_join,
                    colonnes_pertinentes: colonnes_inter,
                    n_sample: strate.n_sample
                }
                conditions_out.push(out)
            }
        }
        return conditions_out
    }
    const assigneStratesAuCadastre = async (): Promise<boolean> => {
        let client;
        try {
            const query_strates = `SELECT 
                    id_strate,
                    nom_strate,
                    est_racine,
                    index_ordre,
                    nom_colonne,
                    logements_valides,
                    superf_valide,
                    date_valide,
                    condition_type,
                    condition_min::int,
                    condition_max::int,
                    condition_valeur::int,
                    ids_enfants,
                    n_sample
                FROM
                    public.strates_echantillonage`
            client = await pool.connect()
            const result_strates = await client.query(query_strates);
            const head: number[] = result_strates.rows.filter((row: strate_db) => row.est_racine === true).map((row: strate_db) => row.id_strate);
            const output: strate[] = creationStrateCorrecte(head, result_strates.rows)
            const conditions: condition_echantillonage[] = genereRequeteParEndPoint(output)
            const insertValue = conditions.map((rangee) => '(' + rangee.id_strate + ",'" + rangee.condition + "','" + rangee.desc_concat + `','{"` + rangee.colonnes_pertinentes.join(`","`) + `"}')`).join(',\n')
            const query_save_conditions = `
                DROP TABLE conditions_strates_a_echant;
                CREATE TABLE conditions_strates_a_echant(
                    id_strate bigint,
                    condition varchar(255),
                    desc_concat varchar(255),
                    colonnes_pertinentes varchar(255)[]
                );
                INSERT INTO conditions_strates_a_echant (id_strate, condition, desc_concat, colonnes_pertinentes)
                VALUES
                ${insertValue};
            `
            const final_insert_query = conditions.map(rangee => `
                INSERT INTO assignation_strates(g_no_lot, id_strate, rn)
                SELECT g_no_lot, id_strate, rn
                FROM (
                    SELECT iv.g_no_lot,
                        ${rangee.id_strate} AS id_strate,
                        ROW_NUMBER() OVER (ORDER BY iv.random_value) AS rn
                    FROM inputs_validation iv
                    WHERE ${rangee.condition}
                ) sub
                WHERE sub.rn <= ${rangee.n_sample};
            `).join('\n');
            const query_strate_assignation = `
            DROP TABLE assignation_strates;
            CREATE TABLE assignation_strates (
                g_no_lot character varying(255),
                id_strate bigint,
                rn bigint
            );\n
            ${final_insert_query}    
            `
            const all_assign_query = conditions.map(rangee => `
                INSERT INTO association_strates(g_no_lot, id_strate)
                SELECT g_no_lot, id_strate
                FROM (
                    SELECT iv.g_no_lot,
                        ${rangee.id_strate} AS id_strate
                    FROM inputs_validation iv
                    WHERE ${rangee.condition}
                ) sub;
            `).join('\n');
            const query_strate_assignation_all = `
            DROP TABLE association_strates;
            CREATE TABLE association_strates (
                g_no_lot character varying(255),
                id_strate bigint
            );\n
            ${all_assign_query}    
            `
            await Promise.all([client.query(query_save_conditions), client.query(query_strate_assignation),client.query(query_strate_assignation_all)])
            return true
        } catch (err: any) {
            return false
        } finally {
            if (client) {
                client.release()
            }
        }


    }

    const obtiensStrates: RequestHandler<void> = async (req, res): Promise<void> => {
        console.log('obtention strates')
        let client;
        try {
            const { id_strate, n_samples_ge, n_samples_se, colonne_sample } = req.query;
            client = await pool.connect();
            let query: string
            let result: any;
            let conditions: string[] = [];
            if (typeof id_strate !== 'undefined' && id_strate !== 'null') {
                conditions.push(`id_strate=${id_strate}`)
            }
            if (typeof n_samples_ge !== 'undefined' && n_samples_ge !== 'null') {
                conditions.push(`n_samples>=${n_samples_ge}`)
            }
            if (typeof n_samples_se !== 'undefined' && n_samples_se !== 'null') {
                conditions.push(`n_samples<=${n_samples_se}`)
            }
            if (typeof colonne_sample !== 'undefined' && colonne_sample !== 'null') {
                conditions.push(`to_tsvector('french', description) @@ plainto_tsquery('french', ${colonne_sample})`)
            }
            query = `SELECT 
                    id_strate,
                    nom_strate,
                    est_racine,
                    index_ordre,
                    nom_colonne,
                    logements_valides,
                    superf_valide,
                    date_valide,
                    condition_type,
                    condition_min::int,
                    condition_max::int,
                    condition_valeur::int,
                    ids_enfants,
                    n_sample
                FROM
                    public.strates_echantillonage`;
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ')
            }
            query += ' ORDER BY index_ordre ASC'
            result = await client.query(query)
            const head: number[] = result.rows.filter((row: strate_db) => row.est_racine === true).map((row: strate_db) => row.id_strate);
            const output = creationStrateCorrecte(head, result.rows)

            res.json({ success: true, data: output });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    };
    const nouvelleStrate: RequestHandler<void> = async (req, res): Promise<void> => {
        console.log('Création Strates')
        let client;
        try {
            const { princip, id_parent } = req.body;
            client = await pool.connect();
            let query: string;
            let query_parent: string;
            let query_update_parent: string;
            let query_all: string;
            let result: any;
            let result_parent: any;
            let result_update_parent: any;
            let result_all: any;
            const stratePlate = applatissementStrate(princip);
            const { nom_strate, nom_colonne, est_racine, index_ordre, logements_valides, superf_valide, date_valide, condition_type, condition_valeur, condition_min, condition_max, n_sample, ids_enfants } = stratePlate
            if (id_parent === undefined || id_parent === null) {
                query = `INSERT INTO public.strates_echantillonage (nom_strate,est_racine,index_ordre,nom_colonne,logements_valides,superf_valide,date_valide,condition_type,condition_min,condition_max,condition_valeur,ids_enfants,n_sample)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`
                result = await client.query(query, [nom_strate, est_racine, index_ordre, nom_colonne, logements_valides, superf_valide, date_valide, condition_type, condition_min, condition_max, condition_valeur, ids_enfants, n_sample])
            } else {
                query = `INSERT INTO public.strates_echantillonage (nom_strate,est_racine,index_ordre,nom_colonne,logements_valides,superf_valide,date_valide,condition_type,condition_min,condition_max,condition_valeur,ids_enfants,n_sample)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`
                result = await client.query(query, [nom_strate, est_racine, index_ordre, nom_colonne, logements_valides, superf_valide, date_valide, condition_type, condition_min, condition_max, condition_valeur, ids_enfants, n_sample])
                const id_nouveau = result.rows[0].id_strate;
                query_parent =
                    `SELECT
                        *
                    FROM
                        public.strates_echantillonage
                    WHERE 
                        id_strate = $1
                    `
                result_parent = await client.query(query_parent, [id_parent])
                let strate_parent = result_parent.rows[0]
                let new_strate_parent
                if (strate_parent.ids_enfants === null) {
                    new_strate_parent = { ...strate_parent, ids_enfants: [id_nouveau], n_sample: null }
                } else {
                    new_strate_parent = { ...strate_parent, n_sample: null }
                    new_strate_parent.ids_enfants.push(id_nouveau)
                }
                query_update_parent =
                    `UPDATE public.strates_echantillonage
                    SET 
                        ids_enfants = $1,
                        n_sample = $2
                    WHERE id_strate = $3
                    RETURNING *;
                `
                result_update_parent = await client.query(query_update_parent, [new_strate_parent.ids_enfants, new_strate_parent.n_sample, new_strate_parent.id_strate])
            }
            query_all = `SELECT 
                    id_strate,
                    nom_strate,
                    est_racine,
                    index_ordre,
                    nom_colonne,
                    logements_valides,
                    superf_valide,
                    date_valide,
                    condition_type,
                    condition_min::int,
                    condition_max::int,
                    condition_valeur::int,
                    ids_enfants,
                    n_sample
                FROM
                    public.strates_echantillonage
                ORDER BY index_ordre ASC`;

            result_all = await client.query(query_all)
            const head: number[] = result_all.rows.filter((row: strate_db) => row.est_racine === true).map((row: strate_db) => row.id_strate);
            const output = creationStrateCorrecte(head, result_all.rows)
            res.json({ success: true, data: output });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });

        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const modifieStrate: RequestHandler<RequeteModifStrate> = async (req, res): Promise<void> => {
        console.log('Modification Strates')
        let client;
        try {
            const { id_strate } = req.params;
            const princip = req.body;
            client = await pool.connect();
            let query: string;
            let query_all: string;
            let result: any;
            let result_all: any;
            const stratePlate = applatissementStrate(princip);
            const { nom_strate, nom_colonne, est_racine, index_ordre, logements_valides, date_valide, superf_valide, condition_type, condition_valeur, condition_min, condition_max, n_sample, ids_enfants } = stratePlate
            query =
                `UPDATE public.strates_echantillonage
                    SET 
                        nom_strate = $1,
                        nom_colonne = $2,
                        est_racine = $3,
                        index_ordre = $4,
                        ids_enfants = $5,
                        n_sample = $6,
                        logements_valides = $7,
                        date_valide = $8,
                        superf_valide = $9,
                        condition_type = $10,
                        condition_valeur = $11,
                        condition_min = $12,
                        condition_max = $13
                WHERE id_strate = $14
                RETURNING *;
            `
            result = await client.query(query, [nom_strate, nom_colonne, est_racine, index_ordre, ids_enfants, n_sample, logements_valides, date_valide, superf_valide, condition_type, condition_valeur, condition_min, condition_max, id_strate])
            query_all = `SELECT 
                    id_strate,
                    nom_strate,
                    est_racine,
                    index_ordre,
                    nom_colonne,
                    logements_valides,
                    superf_valide,
                    date_valide,
                    condition_type,
                    condition_min::int,
                    condition_max::int,
                    condition_valeur::int,
                    ids_enfants,
                    n_sample
                FROM
                    public.strates_echantillonage
                ORDER BY index_ordre ASC`;

            result_all = await client.query(query_all)
            const head: number[] = result_all.rows.filter((row: strate_db) => row.est_racine === true).map((row: strate_db) => row.id_strate);
            const output = creationStrateCorrecte(head, result_all.rows)
            res.json({ success: true, data: output });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const supprimeStrateEtEnfants: RequestHandler<RequeteModifStrate> = async (req, res): Promise<void> => {
        console.log('Suppression strate débutée')
        let client;
        try {
            const { id_strate } = req.params;
            client = await pool.connect();
            let query_child: string;
            let result_child: any;
            let query_all: string;
            let result_all: any
            let query_out: string;
            let result_out: any
            query_child =
                `SELECT 
                    id_strate,
                    ids_enfants
                FROM
                    public.strates_echantillonage
                WHERE id_strate = $1;
            `
            result_child = await client.query(query_child, [id_strate])
            const data = result_child.rows[0];
            let ids_to_delete: number[] = [Number(id_strate)];

            if (data.ids_enfants !== null) {
                for (let id of data.ids_enfants) {
                    ids_to_delete.push(Number(id))
                }
            }
            const placeholders = ids_to_delete.map((_, index) => `$${index + 1}`).join(',');
            query_all = `DELETE FROM public.strates_echantillonage
                WHERE id_strate IN (${placeholders});`;
            await client.query(query_all, ids_to_delete);
            query_out = `SELECT 
                    id_strate,
                    nom_strate,
                    est_racine,
                    index_ordre,
                    nom_colonne,
                    logements_valides,
                    superf_valide,
                    date_valide,
                    condition_type,
                    condition_min::int,
                    condition_max::int,
                    condition_valeur::int,
                    ids_enfants,
                    n_sample
                FROM
                    public.strates_echantillonage
                ORDER BY index_ordre ASC`
            result_out = await client.query(query_out)
            const head: number[] = result_out.rows.filter((row: strate_db) => row.est_racine === true).map((row: strate_db) => row.id_strate);
            const output = creationStrateCorrecte(head, result_out.rows)
            res.json({ success: true, data: output });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const creationDonneesEntree: RequestHandler<void> = async (_, res): Promise<void> => {
        try {
            const donnees_creees = await creeValeursPertinents()
            const strates_assignees = await assigneStratesAuCadastre()
            res.json({ success: donnees_creees && strates_assignees });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {

        }
    }

    const obtiensColonnesValides: RequestHandler<void> = async (_, res): Promise<void> => {
        console.log('Obtention colonnes valides')
        let client;
        try {
            client = await pool.connect();
            let query_columns: string;
            let result_columns: any
            query_columns =
                `SELECT 
                    column_name
                FROM 
                    INFORMATION_SCHEMA.COLUMNS
                WHERE 
                    TABLE_NAME = 'inputs_validation' 
                    AND data_type in('bigint','integer','double precision') 
                    AND column_name <> 'random_value';
            `
            let output: string[] = []
            result_columns = await client.query(query_columns)
            result_columns.rows.map((rangee: any) => output.push(rangee.column_name))
            res.json({ success: true, data: output });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }

    const obtiensFeuilles: RequestHandler<void> = async (_, res): Promise<void> => {
        console.log('obtention Feuilles')
        let client;
        try {

            client = await pool.connect();
            let query: string
            let result: any;
            query = `
                WITH pop_strate as(
                SELECT 
                        ass.id_strate,
                        count(*) as popu_strate
                    from inputs_validation iv
                    left join association_strates ass on ass.g_no_lot = iv.g_no_lot
                    group by ass.id_strate
                )
                SELECT 
                    cse.id_strate::int,
                    cse.desc_concat,
                    se.n_sample,
                    ps.popu_strate::int
                FROM
                    public.conditions_strates_a_echant cse
                LEFT JOIN public.strates_echantillonage se ON se.id_strate=cse.id_strate
                left join pop_strate ps on ps.id_strate = cse.id_strate
            `;
            result = await client.query(query)


            res.json({ success: true, data: result.rows });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }

    const obtiensResultats: RequestHandler<any, any, RequeteResValide> = async (req, res): Promise<void> => {
        console.log('obtention resultats')
        let client;
        try {
            const { id_strate, g_no_lot, fond_tuile, id_val } = req.query
            let conditions: string[] = []
            let replaceCount: number = 1;
            let values: any[] = [];
            if (id_strate !== undefined) {
                conditions.push(`rv.id_strate=$${replaceCount}`)
                values.push(Number(id_strate))
                replaceCount++
            }
            if (g_no_lot !== undefined) {
                conditions.push(`rv.g_no_lot=$${replaceCount}`)
                values.push(String(g_no_lot).replace('_', ' '))
                replaceCount++
            }
            if (fond_tuile !== undefined) {
                conditions.push(`rv.fond_tuile LIKE ${replaceCount}`)
                values.push(fond_tuile)
                replaceCount
            }
            if (id_val !== undefined) {
                conditions.push(`rv.id_val = ${replaceCount}`)
                values.push(Number(id_val))
                replaceCount
            }
            client = await pool.connect();
            let query: string
            let result: any;
            query = `SELECT 
                    rv.id_val::int,
                    rv.id_strate::int,
                    rv.g_no_lot,
                    rv.n_places::int,
                    rv.fond_tuile
                FROM
                    public.resultats_validation rv
            `;
            if (conditions.length > 0) {
                query += '\n WHERE ' + conditions.join(' AND ')
            }
            query += ';'
            result = await client.query(query, values)


            res.json({ success: true, data: result.rows });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const nouveauResultat: RequestHandler<any, any, RequeteResValide, any, CorpsValide> = async (req, res): Promise<void> => {
        console.log('obtention resultats')
        let client;
        try {
            const { id_strate, g_no_lot, n_places, fond_tuile } = req.body as CorpsValide
            client = await pool.connect();
            let query: string
            let result: any;
            query = `INSERT INTO resultats_validation(id_strate,g_no_lot,n_places,fond_tuile) 
                    VALUES($1,$2,$3,$4) RETURNING *`

            result = await client.query(query, [id_strate, g_no_lot, n_places, fond_tuile])


            res.json({ success: true, data: result.rows });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const modifieResultat: RequestHandler<any, any, RequeteResValide, any, CorpsValide> = async (req, res): Promise<void> => {
        console.log('obtention resultats')
        let client;
        try {
            const { id } = req.params;
            const { id_strate, g_no_lot, n_places, fond_tuile } = req.body as CorpsValide
            client = await pool.connect();
            let query: string
            let result: any;
            query = `UPDATE resultats_validation
                        SET id_strate=$1,g_no_lot=$2,n_places=$3,fond_tuile=$4
                    WHERE id_val = $5 RETURNING *`

            result = await client.query(query, [id_strate, g_no_lot, n_places, fond_tuile, id])


            res.json({ success: true, data: result.rows });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const supprimeResultat: RequestHandler<any, any, RequeteResValide, any, CorpsValide> = async (req, res): Promise<void> => {
        console.log('obtention resultats')
        let client;
        try {
            const { id } = req.params;
            client = await pool.connect();
            let query: string
            let result: any;
            query = `DELETE FROM resultats_validation
                    WHERE id_val = $1 RETURNING *`

            result = await client.query(query, [id])


            res.json({ success: true, data: result.rows });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const genereSortieGraphique = (
        type: string,
        resultat: any[],
        x_max?: number
    ): dataHistogrammeVariabilite => {

        let x_max_final: number;
        let formatted_output: dataHistogrammeVariabilite = {
            labels: [],
            datasets: []
        };
        const nEntrees = resultat.length;
        // Helper: bin values and add overflow bin
        const binWithOverflow = (values: number[], x_max_val: number) => {
            const binner = bin<number, number>()
                .domain([0, x_max_val])
                .thresholds(10);

            const bins = binner(values);

            const overflowValues = values.filter(v => v > x_max_val);
            if (overflowValues.length > 0) {
                const overflowBin: Bin<number, number> = [] as unknown as Bin<number, number>;
                overflowBin.push(...overflowValues);
                overflowBin.x0 = x_max_val;
                overflowBin.x1 = Math.max(...values);
                bins.push(overflowBin);
            }

            const labels = bins.map(b =>
                (b.x1 !== undefined ? (b.x1 <= x_max_val ? `${b.x0?.toFixed(2)} - ${b.x1.toFixed(2)}` : `${b.x0?.toFixed(2)}+`) : `${b.x0?.toFixed(2)}`)
            );

            const data = bins.map(b => b.length / values.length);

            return { bins, labels, data };
        };

        switch (type) {
            case 'stationnement': {
                const all_values_1 = resultat.flatMap(item => item.places_reelles);
                const all_values_2 = resultat.flatMap(item => item.places_predites);

                x_max_final = typeof x_max === 'number'
                    ? x_max
                    : Math.max(Math.max(...all_values_1), Math.max(...all_values_2));

                const res1 = binWithOverflow(all_values_1, x_max_final);
                const res2 = binWithOverflow(all_values_2, x_max_final);

                formatted_output = {
                    labels: res1.labels,
                    datasets: [
                        { label: `Places Réelles - n=${nEntrees}`, data: res1.data },
                        { label: `Places Prédites - n=${nEntrees}`, data: res2.data }
                    ]
                };
                break;
            }

            case 'stationnement_reel': {
                const all_values = resultat.flatMap(item => item.places_reelles);
                x_max_final = typeof x_max === 'number' ? x_max : Math.max(...all_values);

                const { labels, data } = binWithOverflow(all_values, x_max_final);

                formatted_output = {
                    labels,
                    datasets: [{ label: `Places Réelles - n=${nEntrees}`, data }]
                };
                break;
            }

            case 'stationnement_predit': {
                const all_values = resultat.flatMap(item => item.places_predites);
                x_max_final = typeof x_max === 'number' ? x_max : Math.max(...all_values);

                const { labels, data } = binWithOverflow(all_values, x_max_final);

                formatted_output = {
                    labels,
                    datasets: [{ label: `Places Prédites - n=${nEntrees}`, data }]
                };
                break;
            }

            case 'pred_par_reel': {
                const all_values = resultat.map(item => Number(item.valeur));
                x_max_final = typeof x_max === 'number' ? x_max : Math.max(...all_values);

                const { labels, data } = binWithOverflow(all_values, x_max_final);

                formatted_output = {
                    labels,
                    datasets: [{ label: `Places prédites par places réelles - n = ${nEntrees}`, data }]
                };
                break;
            }

            case 'reel_par_pred': {
                const all_values = resultat.map(item => Number(item.valeur));
                x_max_final = typeof x_max === 'number' ? x_max : Math.max(...all_values);

                const { labels, data } = binWithOverflow(all_values, x_max_final);

                formatted_output = {
                    labels,
                    datasets: [{ label: `Places réelles par places prédites - n = ${nEntrees}`, data }]
                };
                break;
            }

            case 'bland_altman':{
                formatted_output = {
                    labels: resultat.map((row)=> row.x),
                    datasets:[{label:`Différence vs moyenne - n= ${nEntrees}`,
                            data: resultat.map((row)=>row.y)}]
                }
                break;
            };
            case 'reel_vs_pred':{
                formatted_output = {
                    labels: resultat.map((row)=> row.places_predites),
                    datasets:[{label:`Réel vs prédit - n= ${nEntrees}`,
                            data: resultat.map((row)=>row.places_reelles)}]
                }
                break;
            }
            default:
                throw new Error('unknown type for graph');
        }

        return formatted_output;
    };

    const genereGraphiqueComparaison: RequestHandler<any, any, RequeteGraphiqueValidation> = async (req, res): Promise<void> => {
        console.log('obtention graphique validation')
        let client;
        try {
            const { id_strate, type, x_max } = req.query
            let type_out: string = ''
            let valeur_extraction: string = ''

            if (type !== undefined && typeof type === 'string') {
                type_out = String(type)
            }
            switch (type_out) {
                case 'stationnement':
                    valeur_extraction = 'places_reelles,places_predites'
                    break;
                case 'stationnement_reel':
                    valeur_extraction = 'places_reelles'
                    break;
                case 'stationnement_predit':
                    valeur_extraction = 'places_predites'
                    break;
                case "pred_par_reel":
                    valeur_extraction = 'COALESCE(places_predites/NULLIF(places_reelles, 0),0)::float as valeur,places_predites,places_reelles'
                    break;
                case "reel_par_pred":
                    valeur_extraction = 'COALESCE(places_reelles/NULLIF(places_predites, 0),0)::float as valeur,places_predites,places_reelles'
                    break;
                case "bland_altman":
                    valeur_extraction = '(places_reelles - CEIL(places_predites))::int as y, ((places_reelles + CEIL(places_predites)) /2)::float as x'
                    break;
                case "reel_vs_pred":
                    valeur_extraction = 'places_reelles::int,CEIL(places_predites)::int as places_predites'
                    break;
                default:
                    valeur_extraction = 'places_reelles,places_predites'
                    type_out = 'stationnement'
                    break;
            }
            client = await pool.connect();
            let query: string
            let result: any;
            query = `
                WITH donnees_entree AS(
                    SELECT
                        rv.id_val,
                        rv.id_strate,
                        rv.n_places::numeric as places_reelles,
                        rv.g_no_lot,
                        rv.fond_tuile,
                        i.n_places_min::numeric as places_predites
                    FROM 
                        public.resultats_validation rv
                    LEFT JOIN inventaire_stationnement i on i.g_no_lot=rv.g_no_lot
                    WHERE i.methode_estime=2 ${id_strate !== undefined ? 'AND rv.id_strate=' + Number(id_strate) : ''}
                )
                SELECT 
                    id_val,
                    id_strate,
                    g_no_lot,
                    fond_tuile,
                    ${valeur_extraction}
                FROM
                    donnees_entree
            `;

            result = await client.query(query)
            let out;
            if (x_max !== undefined) {
                out = genereSortieGraphique(type_out, result.rows, Number(x_max))
            } else {
                out = genereSortieGraphique(type_out, result.rows)
            }
            if (out.labels.length === 0) {
                throw new Error('Enjeu weird pendant conversion')
            }
            res.json({ success: true, data: out });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }

    const obtiensComptesStrates:RequestHandler<void>= async(req,res)=>{
        console.log('obtention comptes par strate')
        let client;
        try {
            const { id_strate} = req.query;
            client = await pool.connect();
            let query: string
            let result: any;
            let conditions: string[] = [];
            if (typeof id_strate !== 'undefined' && id_strate !== 'null') {
                conditions.push(`id_strate=${id_strate}`)
            }
            
            query = `
                    SELECT 
                        ass.id_strate::int,
                        csae.desc_concat,
                        count(*)::int as popu_strate
                    from inputs_validation iv
                    left join association_strates ass on ass.g_no_lot = iv.g_no_lot
                        left join conditions_strates_a_echant csae on csae.id_strate = ass.id_strate
                    group by ass.id_strate,csae.desc_concat
                    `
            result = await client.query(query)
            res.json({ success: true, data: result.rows });
        } catch (err: any) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    };

    // Routes
    router.get('/strate', obtiensStrates)
    router.post('/strate', nouvelleStrate)
    router.put('/strate/:id_strate', modifieStrate)
    router.delete('/strate/:id_strate', supprimeStrateEtEnfants)
    router.get('/strate/donnees_intrantes', creationDonneesEntree)
    router.get('/strate/colonnes_possibles', obtiensColonnesValides)
    router.get('/feuilles', obtiensFeuilles)
    router.get('/resultats', obtiensResultats)
    router.post('/resultats', nouveauResultat)
    router.put('/resultats/:id', modifieResultat)
    router.delete('/resultats/:id', supprimeResultat)
    router.get('/graphiques', genereGraphiqueComparaison)
    router.get('/popu-strate',obtiensComptesStrates)
    return router;
};