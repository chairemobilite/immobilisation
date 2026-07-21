import { Router, Request, Response, RequestHandler } from 'express';
import { Pool } from 'pg';
// Types pour les requêtes
import { Polygon, MultiPolygon } from 'geojson';
import { ParamsTerritoire } from '@localTypes/historique.types';
import { variableInfo, XYVariableInfo } from '../../types/graphiquesAnalyse.types'
interface GeometryBody {
    geometry: Polygon | MultiPolygon;
}

export const creationRouteurAnalyseParQuartiers = (pool: Pool): Router => {
    const router = Router();
    const variableMap: Record<string, XYVariableInfo> = {
        'stat-tot': {
            expression: () => `stpag.val_ag::float`,
            aggregateExpression: (ordre) => `SUM(stpag.val_ag::float)`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            joins: ['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            description: 'Stationnement Total [-]',
            groupbys:[],
            requiresOrdre: true
        },
        'stat-res':{
            ctes:(ordre)=>[`stat_pre_agg AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 1)`],
            expression:()=>`stpag.val_ag::int`,
            aggregateExpression:()=>`SUM(stpag.val_ag)`,
            joins:['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            description: 'Stationnement Résidentiel [-]',
            groupbys:[],
            requiresOrdre:true
        }, 
        'stat-ind':{
            ctes:(ordre)=>[`stat_pre_agg AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 2)`],
            expression:()=>`stpag.val_ag::int`,
            aggregateExpression:()=>`SUM(stpag.val_ag)`,
            joins:['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            description: 'Stationnement Industriel [-]',
            groupbys:[],
            requiresOrdre:true
        }, 
        'stat-inf':{
            ctes:(ordre)=>[`stat_pre_agg AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 4)`],
            expression:()=>`stpag.val_ag::int`,
            aggregateExpression:()=>`SUM(stpag.val_ag)`,
            joins:['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            description: 'Stationnement Infrastructure [-]',
            groupbys:[],
            requiresOrdre:true
        }, 
        'stat-com':{
            ctes:(ordre)=>[`stat_pre_agg AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 5)`],
            expression:()=>`stpag.val_ag::int`,
            aggregateExpression:()=>`SUM(stpag.val_ag)`,
            joins:['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            description: 'Stationnement Commercial [-]',
            groupbys:[],
            requiresOrdre:true
        }, 
        'stat-ser':{
            ctes:(ordre)=>[`stat_pre_agg AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 6)`],
            expression:()=>`stpag.val_ag::int`,
            aggregateExpression:()=>`SUM(stpag.val_ag)`,
            joins:['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            description: 'Stationnement Services [-]',
            groupbys:[],
            requiresOrdre:true
        }, 
        'stat-rec':{
            ctes:(ordre)=>[`stat_pre_agg AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 7)`],
            expression:()=>`stpag.val_ag::int`,
            aggregateExpression:()=>`SUM(stpag.val_ag)`,
            joins:['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            description: 'Stationnement Récréatif [-]',
            groupbys:[],
            requiresOrdre:true
        }, 
        'stat-agr':{
            ctes:(ordre)=>[`stat_pre_agg AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 8)`],
            expression:()=>`stpag.val_ag::int`,
            aggregateExpression:()=>`SUM(stpag.val_ag)`,
            joins:['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            description: 'Stationnement Agricole [-]',
            groupbys:[],
            requiresOrdre:true
        }, 
        'stat-inex':{
            ctes:(ordre)=>[`stat_pre_agg AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 5)`],
            expression:()=>`stpag.val_ag::int`,
            aggregateExpression:()=>`SUM(stpag.val_ag)`,
            joins:['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            description: 'Stationnement Non-exploité [-]',
            groupbys:[],
            requiresOrdre:true
        }, 
        'stat-sup': {
            expression: () => `(stpag.val_ag::float/ NULLIF(sa.superf_quartier/10000, 0))::float`,
            aggregateExpression: (ordre) => `((SUM(stpag.val_ag::float))/ SUM(NULLIF(sa.superf_quartier/10000, 0)))`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            joins: ['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            groupbys:[],
            description: 'Densité Stationnement [1/Ha]',
            requiresOrdre: true
        },
        'stat-popu-2021': {
            expression: () => `(stpag.val_ag::float / NULLIF(pq.pop_tot_2021, 0))::float`,
            aggregateExpression: () => `(SUM(stpag.val_ag::float) / SUM(NULLIF(pq.pop_tot_2021, 0)))`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            joins: ['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int', 'population_par_quartier pq on sa.id_quartier::int=pq.id_quartier::int'],
            groupbys:[],
            description: 'Stationnement par personne [-]',
            requiresOrdre: true
        },
        'stat-popu-2016': {
            expression: () => `(stpag.val_ag::float / NULLIF(pq.pop_tot_2016, 0))::float`,
            aggregateExpression: (ordre) => `(SUM(stag.inv_${getValidatedOrdre(ordre)}) / SUM(NULLIF(pq.pop_tot_2016, 0)))::float`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            joins: ['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int', 'population_par_quartier pq on sa.id_quartier::int=pq.id_quartier::int'],
            groupbys:[],
            description: 'Stationnement par personne [-]',
            requiresOrdre: true
        },
        'stat-perm': {
            expression: () => `(stpag.val_ag::float  / NULLIF(mq.nb_permis, 0))::float`,
            aggregateExpression: (ordre) => `(SUM(stag.inv_${getValidatedOrdre(ordre)}) / SUM(NULLIF(mq.nb_permis, 0)))::float`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            joins: ['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int', 'motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Stationnement par permis [-]',
            requiresOrdre: true
        },
        'stat-voit': {
            expression: () => `(stpag.val_ag::float  / NULLIF(mq.nb_voitures, 0))::float`,
            aggregateExpression: (ordre) => `(SUM(stpag.val_ag::float) / SUM(NULLIF(mq.nb_voitures, 0)))`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            joins: ['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int', 'motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Stationnement par voiture résident [-]',
            requiresOrdre: true
        },
        'stat-res-voit':{
            expression: () => `(stpagr.val_ag::float  / NULLIF(mq.nb_voitures, 0))::float`,
            aggregateExpression: (ordre) => `(SUM(stpagr.val_ag::float) / SUM(NULLIF(mq.nb_voitures, 0)))`,
            ctes:(ordre)=>[`stat_pre_agg_res AS(
                SELECT 
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag 
                where cubf_principal_n1=1)`],
            joins: ['stat_pre_agg_res stpagr ON sa.id_quartier::int=stpagr.id_quartier::int', 'motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Stationnement par voiture résident [-]',
            requiresOrdre: true
        },
        'stat-perc': {
            expression: (ordre) => `(stpag.val_ag::float*14.3*100 / NULLIF(sa.superf_quartier, 0))::float`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            aggregateExpression: (ordre) => `(SUM(stpag.val_ag::float)*14.3 / SUM(NULLIF(sa.superf_quartier, 0)))`,
            joins: ['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            groupbys:[],
            description: 'Territoire dédié au stationnement [%]',
            requiresOrdre: true
        },
        'superf': {
            expression: () => `sa.superf_quartier/10000::float`,
            aggregateExpression: () => `SUM(sa.superf_quartier)/10000`,
            ctes:(ordre)=>[],
            joins: [],
            groupbys:[],
            description: 'Superficie Quartier [Ha]',
            requiresOrdre: false
        },
        'perm': {
            expression: () => `mq.nb_permis::float`,
            aggregateExpression: () => `SUM(mq.nb_permis)`,
            ctes:(ordre)=>[],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Nombre de permis de conduire [-]',
            requiresOrdre: false
        },
        'popu-2021': {
            expression: () => `pq.pop_tot_2021::float`,
            aggregateExpression: () => `SUM(pq.pop_tot_2021)`,
            ctes:()=>[],
            joins: ['population_par_quartier pq on sa.id_quartier::int=pq.id_quartier::int'],
            groupbys:[],
            description: 'Population [-]',
            requiresOrdre: false
        },

        'popu-2016': {
            expression: () => `pq.pop_tot_2016::float`,
            aggregateExpression: () => `SUM(pq.pop_tot_2016)`,
            ctes:(ordre)=>[],
            joins: ['population_par_quartier pq on sa.id_quartier::int=pq.id_quartier::int',],
            groupbys:[],
            description: 'Population [-]',
            requiresOrdre: false
        },
        'voit-par-pers-2021': {
            expression: () => `(1000*mq.nb_voitures/pq.pop_tot_2021)::float`,
            aggregateExpression: () => `1000*SUM(mq.nb_voitures)/SUM(pq.pop_tot_2021)::float`,
            ctes:()=>[],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int', 'population_par_quartier pq on sa.id_quartier::int=pq.id_quartier::int'],
            groupbys:[],
            description: 'Nombre de voiture (OD) par 1000 personne(Recensement) [-]',
            requiresOrdre: false
        },

        'voit-par-pers-2016': {
            expression: () => `(1000*mq.nb_voitures/pq.pop_tot_2016)::float`,
            aggregateExpression: () => `1000*SUM(mq.nb_voitures)/SUM(pq.pop_tot_2016)::float`,
            ctes:(ordre)=>[],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int', 'population_par_quartier pq on sa.id_quartier::int=pq.id_quartier::int'],
            groupbys:[],
            description: 'Nombre de voiture (OD) par 1000 personne(Recensement) [-]',
            requiresOrdre: false
        },
        'voit-par-perm': {
            expression: () => `(1000*mq.nb_voitures/mq.nb_permis)::float`,
            aggregateExpression: () => `1000 * SUM(mq.nb_voitures)/SUM(mq.nb_permis)::float`,
            ctes:()=>[],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Nombre de voiture (OD) par 1000 permis de conduire(OD) [-]',
            requiresOrdre: false
        },
        'dens-pop-2021': {
            expression: () => `(pq.pop_tot_2021 / NULLIF(sa.superf_quartier/1000000, 0))::float`,
            aggregateExpression: () => `(SUM(pq.pop_tot_2021) /SUM( NULLIF(sa.superf_quartier/1000000, 0)))::float`,
            ctes:()=>[],
            joins: ['population_par_quartier pq on sa.id_quartier::int=pq.id_quartier::int'],
            groupbys:[],
            description: 'Densité Population [1/km2]',
            requiresOrdre: false
        },
        'dens-pop-2016': {
            expression: () => `(pq.pop_tot_2016 / NULLIF(sa.superf_quartier/1000000, 0))::float`,
            aggregateExpression: () => `(SUM(pq.pop_tot_2016) /SUM( NULLIF(sa.superf_quartier/1000000, 0)))::float`,
            ctes:()=>[],
            joins: ['population_par_quartier pq on sa.id_quartier::int=pq.id_quartier::int'],
            groupbys:[],
            description: 'Densité Population [1/km2]',
            requiresOrdre: false
        },
        'val-log-moy': {
            expression: () => `dfa.valeur_moyenne_logement::float`,
            aggregateExpression: () => `SUM(dfa.valeur_moyenne_logement)/SUM(dfa.n_logements)::float`,
            ctes:()=>[],
            joins: ['donnees_foncieres_agregees dfa on sa.id_quartier::int=dfa.id_quartier::int'],
            groupbys:[],
            description: 'Valeur moyenne des logements [$]',
            requiresOrdre: false
        },
        'sup-log-moy': {
            expression: () => `dfa.superf_moyenne_logement::float`,
            aggregateExpression: () => `SUM(dfa.superf_moyenne_logement)/SUM(dfa.n_logements)::float`,
            ctes:()=>[],
            joins: ['donnees_foncieres_agregees dfa on sa.id_quartier::int=dfa.id_quartier::int'],
            groupbys:[],
            description: 'Superficie moyenne des logements [m2]',
            requiresOrdre: false
        },
        'val-tot-quart': {
            expression: () => `dfa.valeur_fonciere_totale::float`,
            aggregateExpression: () => `SUM(dfa.valeur_fonciere_totale)::float`,
            ctes:()=>[],
            joins: ['donnees_foncieres_agregees dfa on sa.id_quartier::int=dfa.id_quartier::int'],
            groupbys:[],
            description: 'Valeur Foncière totale [$]',
            requiresOrdre: false
        },
        'val-tot-log-quart': {
            expression: () => `dfa.valeur_fonciere_logement_totale::float`,
            aggregateExpression: () => `SUM(dfa.valeur_fonciere_logement_totale)::float`,
            ctes:()=>[],
            joins: ['donnees_foncieres_agregees dfa on sa.id_quartier::int=dfa.id_quartier::int'],
            groupbys:[],
            description: 'Valeur Foncière logements [$]',
            requiresOrdre: false
        },
        'val-tot-sup': {
            expression: () => `(dfa.valeur_fonciere_totale / NULLIF(sa.superf_quartier/10000, 0))::float`,
            aggregateExpression: () => `(SUM(dfa.valeur_fonciere_totale) / SUM(NULLIF(sa.superf_quartier/10000, 0)))::float`,
            ctes:()=>[],
            joins: ['donnees_foncieres_agregees dfa on sa.id_quartier::int=dfa.id_quartier::int'],
            groupbys:[],
            description: 'Valeur Foncière [$/Ha]',
            requiresOrdre: false
        },
        'val-tot-log-sup': {
            expression: () => `(dfa.valeur_fonciere_logement_totale::float / NULLIF(sa.superf_quartier/10000, 0))::float`,
            aggregateExpression: () => `(SUM(dfa.valeur_fonciere_logement_totale::float) / SUM(NULLIF(sa.superf_quartier/10000, 0)))::float`,
            ctes:(ordre)=>[],
            joins: ['donnees_foncieres_agregees dfa on sa.id_quartier::int=dfa.id_quartier::int'],
            groupbys:[],
            description: 'Valeur Foncière Résidentielle[$/Ha]',
            requiresOrdre: false
        },
        'nb-voit': {
            expression: () => `(mq.nb_voitures)::float`,
            aggregateExpression: () => `SUM(mq.nb_voitures)::float`,
            ctes:()=>[],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Nombre de voitures [-]',
            requiresOrdre: false
        },
        'nb-voit-delta': {
            expression: () => `(mq.diff_max_signee)`,
            aggregateExpression: () => `SUM(mq.diff_max_signee)::float`,
            ctes:()=>[],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Delta Voitures Max [-]',
            requiresOrdre: false
        },
        'nb-voit-max': {
            expression: () => `(mq.nb_voitures_max_pav)`,
            aggregateExpression: () => `SUM(mq.nb_voitures_max_pav)::float`,
            ctes:()=>[],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Voitures Max Journees[-]',
            requiresOrdre: false
        },
        'nb-voit-min': {
            expression: () => `(mq.nb_voitures_min_pav)`,
            aggregateExpression: () => `SUM(mq.nb_voitures_min_pav)::float`,
            ctes:()=>[],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Voitures Min Journees[-]',
            requiresOrdre: false
        },
        'stat-voit-max': {
            expression: () => `(stpag.val_ag/ NULLIF(mq.nb_voitures_max_pav, 0))::float`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            joins: ['stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int', 'motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int'],
            groupbys:[],
            description: 'Stationnement par voiture max[-]',
            requiresOrdre: false
        },
        'pm-ac-res': {
            expression: () => `(pm.ac_res)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Auto-conducteur résidents [%]',
            requiresOrdre: false
        },
        'pm-ap-res': {
            expression: () => `(pm.ap_res)`,
            aggregateExpression: () => `0::float`,
            ctes:()=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Auto-passager résidents [%]',
            requiresOrdre: false
        },
        'pm-tc-res': {
            expression: () => `(pm.tc_res)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Transport collectif résidents [%]',
            requiresOrdre: false
        },
        'pm-mv-res': {
            expression: () => `(pm.mv_res)`,
            aggregateExpression: () => `0::float`,
            ctes:()=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Marche Vélo résidents [%]',
            requiresOrdre: false
        },
        'pm-bs-res': {
            expression: () => `(pm.bs_res)`,
            aggregateExpression: () => `0::float`,
            ctes:()=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Marche Vélo résidents [%]',
            requiresOrdre: false
        },
        'pm-ac-int': {
            expression: () => `(pm.ac_int)`,
            aggregateExpression: () => `0::float`,
            ctes:()=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Auto-conducteur Interne [%]',
            requiresOrdre: false
        },
        'pm-ap-int': {
            expression: () => `(pm.ap_int)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Auto-passager Interne [%]',
            requiresOrdre: false
        },
        'pm-tc-int': {
            expression: () => `(pm.tc_res)`,
            aggregateExpression: () => `0::float`,
            ctes:()=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Transport collectif interne [%]',
            requiresOrdre: false
        },
        'pm-mv-int': {
            expression: () => `(pm.mv_int)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Marche Vélo interne [%]',
            requiresOrdre: false
        },
        'pm-bs-int': {
            expression: () => `(pm.bs_int)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Marche Vélo interne [%]',
            requiresOrdre: false
        },
        'pm-ac-ori': {
            expression: () => `(pm.ac_ori)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Auto-conducteur originant du secteur [%]',
            requiresOrdre: false
        },
        'pm-ap-ori': {
            expression: () => `(pm.ap_ori)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Auto-passager originant du secteur [%]',
            requiresOrdre: false
        },
        'pm-tc-ori': {
            expression: () => `(pm.tc_ori)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Transport collectif originant du secteur [%]',
            requiresOrdre: false
        },
        'pm-mv-ori': {
            expression: () => `(pm.mv_ori)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Marche Vélo originant du secteur [%]',
            requiresOrdre: false
        },
        'pm-bs-ori': {
            expression: () => `(pm.bs_ori)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Marche Vélo originant du secteur [%]',
            requiresOrdre: false
        },
        'pm-ac-des': {
            expression: () => `(pm.ac_des)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Auto-conducteur à destination du secteur [%]',
            requiresOrdre: false
        },
        'pm-ap-des': {
            expression: () => `(pm.ap_des)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Auto-passager à destination du secteur [%]',
            requiresOrdre: false
        },
        'pm-tc-des': {
            expression: () => `(pm.tc_des)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Transport collectif à destination du secteur [%]',
            requiresOrdre: false
        },
        'pm-mv-des': {
            expression: () => `(pm.mv_des)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Marche Vélo à destination du secteur [%]',
            requiresOrdre: false
        },
        'pm-bs-des': {
            expression: () => `(pm.bs_des)`,
            aggregateExpression: () => `0::float`,
            ctes:(ordre)=>[],
            joins: ['parts_modales pm on pm.id_quartier::int=sa.id_quartier::int'],
            groupbys:[],
            description: 'Part Modale Marche Vélo à destination du secteur [%]',
            requiresOrdre: false
        },
        'stat-inu': {
            expression: (ordre) => `(stpag.val_ag-mq.nb_voitures_max_pav)`,
            aggregateExpression: (ordre) => `(SUM(stpag.val_ag)::float-SUM(mq.nb_voitures_max_pav)::float)`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int', 'stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            groupbys:[],
            description: 'Places inutilisées en tout temps[-]',
            requiresOrdre: false
        },
        'stat-inu-sup': {
            expression: (ordre) => `(stpag.val_ag-mq.nb_voitures_max_pav)*14.3`,
            aggregateExpression: (ordre) => `(SUM(stpag.val_ag)-SUM(mq.nb_voitures_max_pav))*14.3::float`,
            ctes:(ordre)=>[`stat_pre_agg AS(
                SELECT 
                    id_quartier,
                    SUM(stag.inv_${getValidatedOrdre(ordre)}) as val_ag
                FROM stat_agrege stag 
                GROUP BY stag.id_quartier)`],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int', 'stat_pre_agg stpag ON sa.id_quartier::int=stpag.id_quartier::int'],
            groupbys:[],
            description: 'Superficie inutilisées en tout temps[-]',
            requiresOrdre: false
        },
        'n-logements': {
            expression: () => `(dfa.n_logements )::float`,
            aggregateExpression: () => `(SUM(dfa.n_logements))::float`,
            ctes:(ordre)=>[],
            joins: ['donnees_foncieres_agregees dfa on sa.id_quartier::int=dfa.id_quartier::int'],
            groupbys:[],
            description: 'Nombre de logements au rôle[-]',
            requiresOrdre: false
        },
        'stat-res-log': {
            expression: () => `(stpagr.val_ag::float / dfa.n_logements::float)::float`,
            aggregateExpression: () => `(SUM(stpagr.val_ag) / SUM(dfa.n_logements))::float`,
            ctes:(ordre)=>[`stat_pre_agg_res AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 1)`],
            joins: ['donnees_foncieres_agregees dfa on sa.id_quartier::int=dfa.id_quartier::int', 'stat_pre_agg_res stpagr ON sa.id_quartier::int=stpagr.id_quartier::int'],
            groupbys:[],
            description: 'Stationnement résidentiel par logement[-]',
            requiresOrdre: true
        },
        'stat-res-perm': {
            expression: () => `(stpagr.val_ag::float / mq.nb_permis::float)::float`,
            aggregateExpression: () => `(SUM(stpagr.val_ag) / SUM(nq.nb_permis))::float`,
            ctes:(ordre)=>[`stat_pre_agg_res AS (
                SELECT
                    id_quartier,
                    stag.inv_${getValidatedOrdre(ordre)} as val_ag
                FROM stat_agrege stag
                WHERE cubf_principal_n1 = 1)`],
            joins: ['motorisation_par_quartier mq on sa.id_quartier::int=mq.id_quartier::int', 'stat_pre_agg_res stpagr ON sa.id_quartier::int=stpagr.id_quartier::int'],
            groupbys:[],
            description: 'Stationnement résidentiel par permis[-]',
            requiresOrdre: true
        },
    };

    const validOrdres = ['123', '132', '213', '231', '312', '321','1','2','3'];

    const getValidatedOrdre = (ordre: string | undefined): string => {
        const ordreValue = ordre ?? '132';
        const cleaned = ordreValue.replace(/[^0-9]/g, ''); // remove anything sketchy

        if (validOrdres.includes(cleaned)) {
            return cleaned;
        }
        return ordreValue;
    };

    const obtientInfoParQuartierCarto: RequestHandler<ParamsTerritoire> = async (req, res): Promise<void> => {
        let client;
        try {
            const { ordre, variable } = req.query;
            if (typeof variable === 'string') {
                // Get the query fragments based on X and Y
                let varQueryFragment;
                if (typeof ordre === 'string') {
                    varQueryFragment = getQueryForXY(variable, ordre)
                } else {
                    varQueryFragment = getQueryForXY(variable)
                }
                // Query for detailed data, including the necessary joins for both X and Y
                const query = `
            ${varQueryFragment.ctes.length>0?'WITH '+ varQueryFragment.ctes.join(',\n '):''}
            SELECT 
              sa.id_quartier::int,
              sa.nom_quartier,
              '${varQueryFragment.description}' as description,
              ${varQueryFragment.expression} AS valeur,
              sa.superf_quartier,
              ST_AsGeoJSON(sa.geometry) AS geojson_geometry
            FROM public.sec_analyse sa
            ${varQueryFragment.joins.map((join: string) => `LEFT JOIN  ${join}`).join('\n')}
            ${varQueryFragment.groupbys.length>0?'GROUP BY ' + varQueryFragment.groupbys.join(','):''}
            ORDER BY sa.id_quartier;
          `;
                console.log('Executing query for', variable);
                // Database connection
                client = await pool.connect();
                // Execute queries
                const result = await client.query(query);
                res.json({ success: true, data: result.rows });
            }
        } catch (err:any) {
            // Error handling
            res.status(500).json({ success: false, error: 'Database error',message: err.message });
            console.log('Error in data retrieval for percentage calculation:', err);
        } finally {
            // Ensure client release in case of error or success
            if (client) {
                client.release();
            }
        }
    };

    const obtientInfoParQuartierHisto: RequestHandler<ParamsTerritoire> = async (req, res): Promise<void> => {
        let client;
        try {
            const { ordre, variable } = req.query;
            if (typeof variable === 'string') {
                // Get the query fragments based on X and Y
                let varQueryFragment;
                if (typeof ordre === 'string') {
                    varQueryFragment = getQueryForXY(variable, ordre)
                } else {
                    varQueryFragment = getQueryForXY(variable)
                }
                // Query for detailed data, including the necessary joins for both X and Y
                const query = `
            ${varQueryFragment.ctes.length>0?'WITH '+ varQueryFragment.ctes.join(',\n '):''}
            SELECT 
              sa.id_quartier::int,
              sa.nom_quartier,
              ${varQueryFragment.expression}::float AS valeurs
            FROM public.sec_analyse sa
            ${varQueryFragment.joins.map((join: string) => `LEFT JOIN  ${join}`).join('\n')}
            ORDER BY sa.id_quartier;
          `;
                const query2 = `
            ${varQueryFragment.ctes.length>0?'WITH '+ varQueryFragment.ctes.join(',\n '):''}
            SELECT 
              ${varQueryFragment.aggregateExpression}::float as valeurVille
            FROM
              public.sec_analyse sa
            ${varQueryFragment.joins.map((join) => `LEFT JOIN  ${join}`).join('\n')}  
          `
                console.log('Executing query for', variable);
                // Database connection
                client = await pool.connect();
                // Execute queries
                const result = await client.query(query);
                const result2 = await client.query(query2);
                const output = { valeurVille: result2.rows[0].valeurville, description: varQueryFragment.description, donnees: result.rows }
                res.json({ success: true, data: output });
            }
        } catch (err) {
            // Error handling
            res.status(500).json({ success: false, error: 'Database error' });
            console.log('Error in data retrieval for percentage calculation:', err);
        } finally {
            // Ensure client release in case of error or success
            if (client) {
                client.release();
            }
        }
    };

    const recalculeStationnementAgrege: RequestHandler<void> = async (_req, res): Promise<void> => {

        let client
        try {
            console.log('Recalcul du stationnement en cours');
            client = await pool.connect();
            const query = `
            DELETE FROM stat_agrege;
            WITH LotNeighborhood AS (
                SELECT 
                    c.g_no_lot, 
                    s.id_quartier,
                    s.superf_quartier,
                    s.geometry,
                    s.nom_quartier
                FROM public.cadastre c
                JOIN public.sec_analyse s 
                    ON ST_Area(ST_Intersection(s.geometry, c.geometry)) / ST_Area(c.geometry) > 0.9
            ),

            role_augmente AS (
                SELECT
                    id_provinc,
                    rl0105a::int AS cubf,
                    rl0404a AS valeur_au_role
                FROM role_foncier
            ),

            joined AS (
                SELECT
                    acr.g_no_lot,
                    ra.cubf,
                    ra.valeur_au_role,
                    ROW_NUMBER() OVER (
                        PARTITION BY acr.g_no_lot
                        ORDER BY ra.valeur_au_role DESC NULLS LAST, ra.cubf
                    ) AS rn
                FROM public.association_cadastre_role acr
                LEFT JOIN role_augmente ra
                    ON ra.id_provinc = acr.id_provinc
                WHERE acr.g_no_lot IS NOT NULL
            ),

            aggregated AS (
                SELECT
                    g_no_lot,
                    MAX(CASE WHEN rn = 1 THEN cubf END) AS cubf_principal,
                    CASE 
                        WHEN CARDINALITY(ARRAY_AGG(DISTINCT LEFT(cubf::text,1)::int)) = 1 
                        THEN case WHEN LEFT(MAX(CASE WHEN rn = 1 THEN cubf END)::text,1)::int!=3 then LEFT(MAX(CASE WHEN rn = 1 THEN cubf END)::text,1)::int ELSE 2 END -- mettre toutes les propriétés industrielles dans un bucket CUBF galore
                        ELSE -1
                    END AS cubf_principal_first_digit
                FROM joined
                GROUP BY g_no_lot
            ),

            rpd AS (
                SELECT
                    g_no_lot,
                    COALESCE(
                        CASE 
                            WHEN methode_estime = 1 THEN n_places_mesure
                            ELSE n_places_min
                        END, 0
                    ) AS n_places,
                    methode_estime,
                    id_inv
                FROM inventaire_stationnement
            ),
            invent_count AS(
                SELECT 
                    g_no_lot,
                    COUNT(g_no_lot) as n_inv
                from
                    inventaire_stationnement
                group by g_no_lot
            ),

            lot_park_data AS (
                SELECT
                    ln.g_no_lot,
                    ln.id_quartier,
                    ln.superf_quartier,
                    ln.nom_quartier,
                    ic.n_inv,
                    ag.cubf_principal,
                    ag.cubf_principal_first_digit,
                    ln.geometry
                FROM LotNeighborhood ln
                LEFT JOIN aggregated ag
                    ON ag.g_no_lot = ln.g_no_lot
                left join invent_count ic
                    on ag.g_no_lot=ic.g_no_lot
            ),
            inv_123_per_lot AS (
                SELECT DISTINCT ON (g_no_lot) g_no_lot, n_places
                FROM rpd
                ORDER BY g_no_lot,
                    CASE methode_estime WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 ELSE 4 END
            ),

            inv_132_per_lot AS (
                SELECT DISTINCT ON (g_no_lot) g_no_lot, n_places
                FROM rpd
                ORDER BY g_no_lot,
                    CASE methode_estime WHEN 1 THEN 1 WHEN 3 THEN 2 WHEN 2 THEN 3 ELSE 4 END
            ),

            inv_213_per_lot AS (
                SELECT DISTINCT ON (g_no_lot) g_no_lot, n_places
                FROM rpd
                ORDER BY g_no_lot,
                    CASE methode_estime WHEN 2 THEN 1 WHEN 1 THEN 2 WHEN 3 THEN 3 ELSE 4 END
            ),

            inv_231_per_lot AS (
                SELECT DISTINCT ON (g_no_lot) g_no_lot, n_places
                FROM rpd
                ORDER BY g_no_lot,
                    CASE methode_estime WHEN 2 THEN 1 WHEN 3 THEN 2 WHEN 1 THEN 3 ELSE 4 END
            ),

            inv_312_per_lot AS (
                SELECT DISTINCT ON (g_no_lot) g_no_lot, n_places
                FROM rpd
                ORDER BY g_no_lot,
                    CASE methode_estime WHEN 3 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 3 ELSE 4 END
            ),

            inv_321_per_lot AS (
                SELECT DISTINCT ON (g_no_lot) g_no_lot, n_places
                FROM rpd
                ORDER BY g_no_lot,
                    CASE methode_estime WHEN 3 THEN 1 WHEN 2 THEN 2 WHEN 1 THEN 3 ELSE 4 END
            ),
            inv_1_per_lot as (
                SELECT g_no_lot, n_places,id_inv
                FROM rpd
                WHERE methode_estime = 1
            ),
            inv_2_per_lot AS (
                SELECT g_no_lot, n_places,id_inv
                FROM rpd
                WHERE methode_estime = 2
            ),
            inv_3_per_lot AS (
                SELECT g_no_lot, n_places,id_inv
                FROM rpd
                WHERE methode_estime = 3
            ),
            desc_cubf AS (
                SELECT *
                from (values (-1,'Usage mixte'),(1,'Résidentielle'),(2,'Industrielle'),(4,'Infrastructure'),(5,'Commerciale'),(6,'Services'),(7,'Récréation'),(8,'Ressources naturelles'),(9,'Inexploité'),(NULL,'Sans Rôle'))as sub(cubf_principal_first_digit,desc_usage)
            )

            INSERT INTO stat_agrege (id_quartier,cubf_principal_n1,inv_123,inv_132,inv_213,inv_231,inv_312,inv_321,inv_1,inv_2,inv_3,n_lots)
            SELECT 
                lpd.id_quartier,
                lpd.cubf_principal_first_digit as cubf_principal_n1,
                sum(CEIL(i123.n_places)) as inv_123,
                sum(CEIL(i132.n_places)) as inv_132,
                sum(CEIL(i213.n_places)) as inv_213,
                sum(CEIL(i231.n_places)) as inv_231,
                sum(CEIL(i312.n_places)) as inv_312,
                sum(CEIL(i321.n_places)) as inv_321,
                sum(CEIL(i1.n_places)) as inv_1,
                sum(CEIL(i2.n_places)) as inv_2,
                sum(CEIL(i3.n_places)) as inv_3,
                count(*) as n_lots--
            from lot_park_data lpd
            left join 
                inv_123_per_lot i123 on i123.g_no_lot = lpd.g_no_lot
            left join
                inv_132_per_lot i132 on i132.g_no_lot=lpd.g_no_lot
            left join
                inv_213_per_lot i213 on i213.g_no_lot=lpd.g_no_lot
            left join 
                inv_231_per_lot i231 on i231.g_no_lot=lpd.g_no_lot
            left join 
                inv_312_per_lot i312 on i312.g_no_lot=lpd.g_no_lot
            left join
                inv_321_per_lot i321 on i321.g_no_lot=lpd.g_no_lot
            left join
                inv_1_per_lot i1 on i1.g_no_lot=lpd.g_no_lot
            left join
                inv_2_per_lot i2 on i2.g_no_lot=lpd.g_no_lot
            left join
                inv_3_per_lot i3 on i3.g_no_lot=lpd.g_no_lot
            left join 
                desc_cubf dc on dc.cubf_principal_first_digit=lpd.cubf_principal_first_digit or (dc.cubf_principal_first_digit IS NULL AND lpd.cubf_principal_first_digit IS NULL)
            group by lpd.id_quartier,lpd.cubf_principal_first_digit
            order by lpd.id_quartier,lpd.cubf_principal_first_digit
            `;
            const result = await client.query(query);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
            console.log('Enjeux dans l agregation du stationnement')
        } finally {
            if (client) {
                client.release()
            }
        }
    };

    const getQueryForXY = (
        variableKey: string,
        ordre?: string
    ): { expression: string, ctes:string[],aggregateExpression: string, joins: string[], groupbys:string[],description: string, requiresOrdre: boolean } => {
        const config = variableMap[variableKey];
        if (!config) throw new Error(`Variable ${variableKey} not found`);

        const ordreValue = ordre ?? ''; // Provide a fallback if ordre is undefined
        if (config.requiresOrdre && !ordreValue) {
            throw new Error(`Variable ${variableKey} requires ordre`);
        }

        const expr = config.expression(ordreValue);
        const agexpr = config.aggregateExpression(ordreValue)
        const gbexpr = config.groupbys
        const cteexpr = config.ctes(ordreValue)
        return { expression: expr, ctes:cteexpr,aggregateExpression: agexpr, joins: config.joins, groupbys:gbexpr, description: config.description, requiresOrdre: config.requiresOrdre };
    };

    const obtiensDonneesGraphiqueXY: RequestHandler<ParamsTerritoire> = async (req, res): Promise<void> => {
        let client;
        try {
            const { ordre, X, Y } = req.query;
            if (typeof X === 'string' && typeof Y === 'string') {
                // Get the query fragments based on X and Y
                let xQueryFragment;
                let yQueryFragment;
                if (typeof ordre === 'string') {
                    xQueryFragment = getQueryForXY(X, ordre);
                    yQueryFragment = getQueryForXY(Y, ordre);
                } else {
                    xQueryFragment = getQueryForXY(X);
                    yQueryFragment = getQueryForXY(Y);
                }
                // Get the join fragments for X and Y
                const Xjoins = xQueryFragment.joins
                const Yjoins = yQueryFragment.joins

                const allJoins = Xjoins.concat(Yjoins)
                const uniqueJoins = [...new Set(allJoins)];
                
                const Xctes = xQueryFragment.ctes
                const Yctes = yQueryFragment.ctes

                const allctes = Xctes.concat(Yctes)
                const uniquectes = [...new Set(allctes)]

                const Xgbs = xQueryFragment.groupbys
                const Ygbs = yQueryFragment.groupbys

                const allGBs = Xgbs.concat(Ygbs)
                const uniqueGBs = [...new Set(allGBs)]
                // Query for detailed data, including the necessary joins for both X and Y
                const query = `
            ${uniquectes.length>0?'WITH '+ uniquectes.join(',\n '):''}
            SELECT 
              sa.id_quartier::int,
              sa.nom_quartier,
              ${xQueryFragment.expression}::float AS X,
              ${yQueryFragment.expression}::float AS Y
            FROM public.sec_analyse sa
            ${uniqueJoins.map((join) => `LEFT JOIN  ${join}`).join('\n')}
            ${uniqueGBs.length>0?'GROUP BY ' + uniqueGBs.join(','):''}
            ORDER BY sa.id_quartier;
          `;

                console.log('Executing query for', X, Y);


                // Database connection
                client = await pool.connect();

                // Queries

                // Execute queries
                const result = await client.query(query);
                const output = { descriptionX: `${xQueryFragment.description}`, descriptionY: `${yQueryFragment.description}`, donnees: result.rows }

                res.json({ success: true, data: output });
            }
        } catch (err) {
            // Error handling
            res.status(500).json({ success: false, error: 'Database error' });
            console.log('Error in data retrieval for percentage calculation:', err);
        } finally {
            // Ensure client release in case of error or success
            if (client) {
                client.release();
            }
        }
    };

    const recalculeVariablesAncilaires: RequestHandler<void> = async (_req, res): Promise<void> => {
        let client;
        try {
            console.log('Recalcul de variables anciliaires ');
            client = await pool.connect();
            const query = `
        BEGIN;
        DELETE FROM motorisation_par_quartier;
        -- calcul du nombre de voitures min max et nombres de permis
        INSERT INTO motorisation_par_quartier (id_quartier, nb_voitures,nb_permis,nb_voitures_max_pav,nb_voitures_min_pav,diff_max_signee)
        WITH aggregated_data AS (
          SELECT
              z.id_quartier::int,
              CEIL(SUM(c.nbveh * c.facmen)) AS nb_voitures
          FROM
              sec_analyse z
          JOIN
              od_data c
              ON ST_Within(c.geom_logis, z.geometry)
          WHERE
              c.tlog = 1
          GROUP BY
              z.id_quartier
        ),
        aggregated_person_data AS (
          SELECT 
            z.id_quartier::int,
            CEIL(SUM(c.facper)) as nb_permis
          FROM
            sec_analyse z
          JOIN
            od_data c
            ON ST_Within(c.geom_logis,z.geometry)
          WHERE
            c.tper = 1 AND c.percond=1
          GROUP BY 
            z.id_quartier
        )
        SELECT
            ad.id_quartier,
            ad.nb_voitures,
            apd.nb_permis,
            MAX(pav.voitures) AS nb_voitures_max_pav,
            MIN(pav.voitures) AS nb_voitures_min_pav,
            CASE
                WHEN ABS(ad.nb_voitures - MAX(pav.voitures)) > ABS(ad.nb_voitures - MIN(pav.voitures))
                THEN MAX(pav.voitures)-ad.nb_voitures
                ELSE MIN(pav.voitures) - ad.nb_voitures
            END AS diff_max_signee
        FROM
            aggregated_data ad
        LEFT JOIN
            profile_accumulation_vehicule pav
            ON pav.id_quartier::int = ad.id_quartier::int
        LEFT JOIN
            aggregated_person_data apd
            on apd.id_quartier::int = ad.id_quartier::int
        GROUP BY
            ad.id_quartier,
            ad.nb_voitures,
            apd.nb_permis;
        -- calcul des populations a partir du recensement
        DELETE FROM population_par_quartier;
        INSERT INTO population_par_quartier (id_quartier,pop_tot_2016,pop_tot_2021)
        WITH pop_2016_ag AS(
          SELECT 
            z.id_quartier,
            sum(c2016.pop_2016) as pop_tot_2016
          FROM
            sec_analyse z
          JOIN 
            census_population_2016 c2016
          ON 
            ST_Intersects(z.geometry,c2016.geometry)
          WHERE
            ST_Area(ST_Intersection(z.geometry,c2016.geometry))/ ST_Area(c2016.geometry) >= 0.9
          GROUP BY
          z.id_quartier
        ), pop_2021_ag as(
          SELECT
            z.id_quartier,
            SUM(c2021.pop_2021) AS pop_tot_2021
          FROM
            sec_analyse z
          JOIN
            census_population c2021
          ON
            ST_Intersects(z.geometry, c2021.geometry)
          WHERE
            ST_Area(ST_Intersection(z.geometry, c2021.geometry)) / ST_Area(c2021.geometry) >= 0.9
          GROUP BY
            z.id_quartier
        )
        SELECT
          c2016.id_quartier,
          c2016.pop_tot_2016,
          c2021.pop_tot_2021
        FROM
          pop_2016_ag c2016
        JOIN
          pop_2021_ag c2021
        ON
          c2016.id_quartier=c2021.id_quartier;
        -- calcul des valeurs moyennes foncieres
        delete from donnees_foncieres_agregees;
        INSERT INTO donnees_foncieres_agregees (id_quartier,valeur_moyenne_logement,superf_moyenne_logement,valeur_fonciere_logement_totale,valeur_fonciere_totale,n_logements)
        WITH role_quartier_log AS(
          SELECT 
            sa.id_quartier::int,
            ceil(SUM(rf.rl0404a)/sum(rf.rl0311a)) as val_moy_log,
            ceil(SUM(rf.rl0308a)/sum(rf.rl0311a)) as sup_moy_log,
            ceil(SUM(rf.rl0404a)) as val_tot_log,
            ceil(SUM(rf.rl0311a)) as n_logements
          FROM
            role_foncier rf
          LEFT JOIN
            sec_analyse sa on ST_Within(rf.geometry,sa.geometry)
          where
            rf.rl0105a::int = 1000 
            and rf.rl0404a IS not null 
            and rf.rl0308a IS not null 
            and rf.rl0311a IS not null
          group by sa.id_quartier
          
        ), role_quartier_tout AS(
          SELECT 
            sa.id_quartier::int,
            ceil(SUM(rf.rl0404a)) as val_tot_tout
          FROM
            role_foncier rf
          LEFT JOIN
            sec_analyse sa on ST_Within(rf.geometry,sa.geometry)
          where
            rf.rl0404a is not null 
          group by sa.id_quartier
        )
        SELECT 
          sa.id_quartier::int,
          rql.val_moy_log,
          rql.sup_moy_log,
          rql.val_tot_log,
          rqt.val_tot_tout,
          rql.n_logements
        from
          sec_analyse sa
        left join 
          role_quartier_log rql on rql.id_quartier = sa.id_quartier
        left join
          role_quartier_tout rqt on rqt.id_quartier = sa.id_quartier;
        -- calcul des parts modales
        DELETE FROM parts_modales;
        INSERT INTO parts_modales(id_quartier,ac_res,ap_res,tc_res,mv_res,bs_res,ac_ori,ap_ori,tc_ori,mv_ori,bs_ori,ac_des,ap_des,tc_des,mv_des,bs_des,ac_int,ap_int,tc_int,mv_int,bs_int)
        WITH trips AS (
            SELECT
                od.clepersonne,
                od.nolog,
                od.tlog,
                od.facmen,
                od.tper,
                od.mobil,
                od.facper,
                od.mode1,
                od.geom_logis,
                od.geom_ori,
                od.geom_des,
                sa_logis.id_quartier AS quartier_logis,
                sa_ori.id_quartier AS quartier_ori,
                sa_des.id_quartier AS quartier_des,
                CASE 
                    WHEN sa_ori.id_quartier = sa_des.id_quartier AND sa_ori.id_quartier IS NOT NULL 
                    THEN true ELSE false 
                END AS internal_trip
            FROM od_data AS od
            LEFT JOIN sec_analyse sa_logis ON ST_Within(od.geom_logis, sa_logis.geometry)
            LEFT JOIN sec_analyse sa_ori   ON ST_Within(od.geom_ori, sa_ori.geometry)
            LEFT JOIN sec_analyse sa_des   ON ST_Within(od.geom_des, sa_des.geometry)
            WHERE od.geom_ori IS NOT NULL AND sa_logis.id_quartier IS NOT NULL
        )
        SELECT
            sa.id_quartier,

            -- Resident trips
            SUM(CASE WHEN trips.quartier_logis = sa.id_quartier AND trips.mode1 = 1 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_logis = sa.id_quartier THEN trips.facper END) * 100 AS AC_res,
            SUM(CASE WHEN trips.quartier_logis = sa.id_quartier AND trips.mode1 = 2 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_logis = sa.id_quartier THEN trips.facper END) * 100 AS AP_res,
            SUM(CASE WHEN trips.quartier_logis = sa.id_quartier AND trips.mode1 = 6 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_logis = sa.id_quartier THEN trips.facper END) * 100 AS TC_res,
            SUM(CASE WHEN trips.quartier_logis = sa.id_quartier AND trips.mode1 IN (5, 13) THEN trips.facper END) / SUM(CASE WHEN trips.quartier_logis = sa.id_quartier THEN trips.facper END) * 100 AS MV_res,
            SUM(CASE WHEN trips.quartier_logis = sa.id_quartier AND trips.mode1 = 7 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_logis = sa.id_quartier THEN trips.facper END) * 100 AS BS_res,

            -- Origin trips (external)
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 = 1 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS AC_ori,
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 = 2 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS AP_ori,
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 = 6 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS TC_ori,
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 IN (5, 13) THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS MV_ori,
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 = 7 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS BS_ori,

            -- Destination trips (external)
            SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 = 1 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS AC_des,
            SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 = 2 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS AP_des,
            SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 = 6 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS TC_des,
            SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 IN (5, 13) THEN trips.facper END) / SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS MV_des,
            SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false AND trips.mode1 = 7 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_des = sa.id_quartier AND trips.internal_trip = false THEN trips.facper END) * 100 AS pBS_des,

            -- Internal trips
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true AND trips.mode1 = 1 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true THEN trips.facper END) * 100 AS AC_int,
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true AND trips.mode1 = 2 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true THEN trips.facper END) * 100 AS AP_int,
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true AND trips.mode1 = 6 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true THEN trips.facper END) * 100 AS TC_int,
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true AND trips.mode1 IN (5, 13) THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true THEN trips.facper END) * 100 AS MV_int,
            SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true AND trips.mode1 = 7 THEN trips.facper END) / SUM(CASE WHEN trips.quartier_ori = sa.id_quartier AND trips.internal_trip = true THEN trips.facper END) * 100 AS BS_int
        FROM sec_analyse sa
        LEFT JOIN trips ON 
            trips.quartier_logis = sa.id_quartier OR 
            trips.quartier_ori = sa.id_quartier OR 
            trips.quartier_des = sa.id_quartier
        GROUP BY sa.id_quartier, sa.geometry;
        COMMIT;
      `;
            const result = await client.query(query);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
            console.log('Enjeux dans l agregation du stationnement')
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    // Routes
    router.get('/carto', obtientInfoParQuartierCarto)
    router.get('/histo', obtientInfoParQuartierHisto)
    router.get('/XY', obtiensDonneesGraphiqueXY)
    router.get('/recalcule-stat-agreg', recalculeStationnementAgrege)
    router.get('/recalcule-val-autres', recalculeVariablesAncilaires)
    return router;
};