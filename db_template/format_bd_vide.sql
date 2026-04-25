--
-- PostgreSQL database dump
--

\restrict qvCh0bXbDO4P4zsBquFpNdGtNoigIT4MM3Cu5EdWm8Pijcsn0oMf9PGrjF4AxqH

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: update_eval_inventaire_reg(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_eval_inventaire_reg() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete old entries for the lot (in case of UPDATE)
    DELETE FROM eval_inventaire_reg
    WHERE g_no_lot = NEW.g_no_lot;

    -- Insert new computed values
    INSERT INTO eval_inventaire_reg (
        g_no_lot,
        compte_role,
        compte_donnee_manquant,
        compte_date_manquant,
        n_places_min_nul
    )
    SELECT
        cad.g_no_lot,
        COUNT(rf.id_provinc) AS compte_role,
        COUNT(
            CASE 
                WHEN (rf.rl0308a IS NULL AND rf.rl0105a::int <= 1999)
                     OR (rf.rl0311a IS NULL AND rf.rl0105a::int >= 2000)
                THEN 1 
            END
        ) AS compte_donnee_manquant,
        COUNT(CASE WHEN rf.rl0307a IS NULL THEN 1 END) AS compte_date_manquant,
        (CASE WHEN inv.n_places_min = 0 THEN TRUE ELSE FALSE END) AS n_places_min_nul
    FROM role_foncier rf
    JOIN association_cadastre_role acr ON acr.id_provinc = rf.id_provinc
    JOIN cadastre cad ON acr.g_no_lot = cad.g_no_lot
    JOIN inventaire_stationnement inv ON cad.g_no_lot = inv.g_no_lot
    WHERE inv.methode_estime = 2
      AND cad.g_no_lot = NEW.g_no_lot
    GROUP BY cad.g_no_lot, inv.n_places_min;

    RETURN NULL; -- Since this is an AFTER trigger
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: assignation_strates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignation_strates (
    g_no_lot character varying(255),
    id_strate bigint,
    rn bigint
);


--
-- Name: association_cadastre_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.association_cadastre_role (
    g_no_lot character varying(255),
    id_provinc character varying(255),
    id_assoc_cad_role bigint NOT NULL
);


--
-- Name: association_cadastre_role_id_assoc_cad_role_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.association_cadastre_role_id_assoc_cad_role_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: association_cadastre_role_id_assoc_cad_role_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.association_cadastre_role_id_assoc_cad_role_seq OWNED BY public.association_cadastre_role.id_assoc_cad_role;


--
-- Name: association_er_reg_stat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.association_er_reg_stat (
    id_er integer,
    cubf integer,
    id_reg_stat integer,
    id_assoc_er_reg integer NOT NULL
);


--
-- Name: cubf; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cubf (
    cubf bigint NOT NULL,
    description text
);


--
-- Name: ensembles_reglements_stat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ensembles_reglements_stat (
    id_er integer NOT NULL,
    date_debut_er integer,
    date_fin_er integer,
    description_er character varying(255)
);


--
-- Name: entete_reg_stationnement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entete_reg_stationnement (
    id_reg_stat integer NOT NULL,
    description character varying(255),
    annee_debut_reg integer,
    annee_fin_reg integer,
    texte_loi character varying(255),
    article_loi character varying(255),
    paragraphe_loi character varying(255),
    ville character varying(255)
);


--
-- Name: association_er_reg_stat_etendu; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.association_er_reg_stat_etendu AS
 WITH ranked AS (
         SELECT aers.id_er,
            aers.id_reg_stat,
            c.cubf,
            c.description AS cubf_description,
            aers.cubf AS cubf_prefix,
            row_number() OVER (PARTITION BY aers.id_er, c.cubf ORDER BY (length((aers.cubf)::text)) DESC) AS rank
           FROM (public.association_er_reg_stat aers
             JOIN public.cubf c ON (("left"((c.cubf)::text, length((aers.cubf)::text)) = (aers.cubf)::text)))
        ), wide AS (
         SELECT ranked.id_er,
            ranked.cubf,
            ranked.cubf_description,
            max(ranked.cubf_prefix) FILTER (WHERE (ranked.rank = 1)) AS rank_1_prefix,
            max(ranked.id_reg_stat) FILTER (WHERE (ranked.rank = 1)) AS rank_1_id_reg_stat,
            max(ranked.cubf_prefix) FILTER (WHERE (ranked.rank = 2)) AS rank_2_prefix,
            max(ranked.id_reg_stat) FILTER (WHERE (ranked.rank = 2)) AS rank_2_id_reg_stat,
            max(ranked.cubf_prefix) FILTER (WHERE (ranked.rank = 3)) AS rank_3_prefix,
            max(ranked.id_reg_stat) FILTER (WHERE (ranked.rank = 3)) AS rank_3_id_reg_stat,
            max(ranked.cubf_prefix) FILTER (WHERE (ranked.rank = 4)) AS rank_4_prefix,
            max(ranked.id_reg_stat) FILTER (WHERE (ranked.rank = 4)) AS rank_4_id_reg_stat,
            max(ranked.cubf_prefix) FILTER (WHERE (ranked.rank = 1)) AS final_prefix,
            max(ranked.id_reg_stat) FILTER (WHERE (ranked.rank = 1)) AS id_reg_stat
           FROM ranked
          GROUP BY ranked.id_er, ranked.cubf, ranked.cubf_description
        )
 SELECT wide.id_er,
    prs.description_er,
    prs.date_debut_er,
    prs.date_fin_er,
    wide.cubf,
    wide.cubf_description,
    wide.rank_1_prefix,
    wide.rank_1_id_reg_stat,
    wide.rank_2_prefix,
    wide.rank_2_id_reg_stat,
    wide.rank_3_prefix,
    wide.rank_3_id_reg_stat,
    wide.rank_4_prefix,
    wide.rank_4_id_reg_stat,
    wide.final_prefix,
    wide.id_reg_stat,
    ers.description,
    ers.annee_debut_reg,
    ers.annee_fin_reg,
    ers.texte_loi,
    ers.article_loi,
    ers.paragraphe_loi,
    ers.ville
   FROM ((wide
     LEFT JOIN public.entete_reg_stationnement ers ON ((ers.id_reg_stat = wide.id_reg_stat)))
     LEFT JOIN public.ensembles_reglements_stat prs ON ((prs.id_er = wide.id_er)))
  ORDER BY wide.id_er, wide.cubf;


--
-- Name: association_er_reg_stat_id_assoc_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.association_er_reg_stat_id_assoc_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: association_er_reg_stat_id_assoc_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.association_er_reg_stat_id_assoc_seq OWNED BY public.association_er_reg_stat.id_assoc_er_reg;


--
-- Name: association_er_territoire; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.association_er_territoire (
    id_asso_er_ter integer NOT NULL,
    id_er integer,
    id_periode_geo integer
);


--
-- Name: association_er_territoire_id_association_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.association_er_territoire_id_association_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: association_er_territoire_id_association_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.association_er_territoire_id_association_seq OWNED BY public.association_er_territoire.id_asso_er_ter;


--
-- Name: association_strates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.association_strates (
    g_no_lot character varying(255),
    id_strate bigint
);


--
-- Name: cadastre; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cadastre (
    level_0 integer,
    level_1 integer,
    g_objectid integer,
    g_no_lot character varying(255),
    g_co_type_ character varying(255),
    g_co_typ_1 character varying(255),
    g_co_echel character varying(255),
    g_co_ech_1 character varying(255),
    g_co_ech_2 character varying(255),
    g_nb_coord double precision,
    g_nb_coo_1 double precision,
    g_nb_angle double precision,
    g_co_indic character varying(255),
    g_va_suprf double precision,
    g_va_sup_1 double precision,
    g_co_typ_2 character varying(255),
    g_no_plan_ character varying(255),
    g_co_circm character varying(255),
    g_nm_circn character varying(255),
    g_da_depot character varying(255),
    g_no_feuil character varying(255),
    g_da_mise_ character varying(255),
    g_dh_dernr character varying(255),
    g_shape_le double precision,
    g_shape_ar double precision,
    g_dat_acqu character varying(255),
    g_dat_char character varying(255),
    g_oid integer,
    geometry public.geometry(Geometry,4326)
);


--
-- Name: cartographie_secteurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cartographie_secteurs (
    id_periode_geo integer NOT NULL,
    ville character varying(255),
    secteur character varying(255),
    ville_sec character varying(255),
    id_periode integer,
    geometry public.geometry(Geometry,4326)
);


--
-- Name: cartographie_secteurs_id_periode_geo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cartographie_secteurs_id_periode_geo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cartographie_secteurs_id_periode_geo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cartographie_secteurs_id_periode_geo_seq OWNED BY public.cartographie_secteurs.id_periode_geo;


--
-- Name: census_population; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.census_population (
    "ADIDU" text,
    "IDUGD" text,
    "SUPTERRE" double precision,
    "PRIDU" text,
    geometry public.geometry(MultiPolygon,4326),
    "GEO UID" text,
    pop_2021 bigint,
    pop_2016 double precision,
    habitats_2021 bigint,
    habitats_occup_2021 bigint,
    dens_pop_par_km_2 double precision,
    superf double precision
);


--
-- Name: census_population_2016; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.census_population_2016 (
    "ADIDU" text,
    "PRIDU" text,
    "PRNOM" text,
    "DRIDU" text,
    "DRNOM" text,
    "DRGENRE" text,
    "SRUIDU" text,
    "SRUNOM" text,
    "SDRIDU" text,
    "SDRNOM" text,
    "SDRGENRE" text,
    "RÉIDU" text,
    "RÉNOM" text,
    "CSSCODE" text,
    "CSSGENRE" text,
    "RMRIDU" text,
    "RMRPIDU" text,
    "RMRNOM" text,
    "RMRGENRE" text,
    "SRIDU" text,
    "SRNOM" text,
    "ADAIDU" text,
    geometry public.geometry(MultiPolygon,4326),
    "GEO UID" text,
    pop_2016 bigint,
    habitats_2016 bigint,
    habitats_occup_2016 bigint,
    dens_pop_par_km_2_2016 double precision,
    superf_2016 double precision
);


--
-- Name: conditions_strates_a_echant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conditions_strates_a_echant (
    id_strate bigint,
    condition character varying(255),
    desc_concat character varying(255),
    colonnes_pertinentes character varying(255)[]
);


--
-- Name: population_par_quartier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.population_par_quartier (
    id_quartier bigint,
    pop_tot_2021 numeric,
    pop_tot_2016 numeric
);


--
-- Name: sec_analyse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sec_analyse (
    id_quartier bigint NOT NULL,
    nom_quartier text,
    superf_quartier double precision,
    peri_quartier double precision,
    geometry public.geometry(Geometry,4326),
    acro text
);


--
-- Name: dens_pop_quartier; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.dens_pop_quartier AS
 SELECT sa.id_quartier,
    (((pq.pop_tot_2021)::double precision / sa.superf_quartier) * (1000000)::double precision) AS dens_pop_2021
   FROM (public.sec_analyse sa
     LEFT JOIN public.population_par_quartier pq ON ((pq.id_quartier = sa.id_quartier)));


--
-- Name: dens_stat_reg_quartier; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.dens_stat_reg_quartier AS
SELECT
    NULL::bigint AS id_quartier,
    NULL::double precision AS dens_stat;


--
-- Name: donnees_brutes_ana_var; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donnees_brutes_ana_var (
    index bigint,
    g_no_lot text,
    lot_condition boolean,
    cubf_list text,
    n_cubf bigint,
    single_cubf double precision,
    cubf_lvl1 double precision,
    cubf_lvl2 double precision,
    cubf_lvl3 double precision,
    inv_reg_min double precision,
    inv_er_32_min double precision,
    inv_er_31_min double precision,
    inv_er_30_min double precision,
    inv_er_29_min double precision,
    inv_er_39_min double precision,
    inv_er_38_min double precision,
    inv_er_37_min double precision,
    inv_er_36_min double precision,
    inv_er_35_min double precision,
    inv_er_34_min double precision,
    inv_er_33_min double precision,
    inv_er_1_min double precision,
    inv_er_2_min double precision,
    inv_er_3_min double precision,
    inv_er_4_min double precision,
    inv_er_61_min double precision,
    inv_er_53_min double precision,
    inv_er_57_min double precision,
    inv_er_55_min double precision,
    inv_er_47_min double precision,
    inv_er_51_min double precision,
    inv_er_65_min double precision,
    inv_er_13_min double precision,
    inv_er_16_min double precision,
    inv_er_17_min double precision,
    inv_er_15_min double precision,
    inv_er_14_min double precision,
    inv_er_64_min double precision,
    inv_er_67_min double precision,
    inv_er_40_min double precision,
    inv_er_41_min double precision,
    inv_er_42_min double precision,
    inv_er_46_min double precision,
    inv_er_48_min double precision,
    inv_er_50_min double precision,
    inv_er_52_min double precision,
    inv_er_54_min double precision,
    inv_er_56_min double precision,
    inv_er_58_min double precision,
    inv_er_60_min double precision,
    inv_er_62_min double precision,
    inv_er_43_min double precision,
    inv_er_44_min double precision,
    inv_er_5_min double precision,
    inv_er_6_min double precision,
    inv_er_7_min double precision,
    inv_er_8_min double precision,
    inv_er_18_min double precision,
    inv_er_19_min double precision,
    inv_er_20_min double precision,
    inv_er_21_min double precision,
    inv_er_25_min double precision,
    inv_er_26_min double precision,
    inv_er_27_min double precision,
    inv_er_28_min double precision,
    inv_er_49_min double precision,
    inv_er_63_min double precision,
    inv_er_59_min double precision
);


--
-- Name: donnees_foncieres_agregees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donnees_foncieres_agregees (
    id_quartier integer,
    valeur_moyenne_logement integer,
    superf_moyenne_logement integer,
    valeur_fonciere_totale bigint,
    valeur_fonciere_logement_totale bigint,
    n_logements bigint
);


--
-- Name: ensembles_reglements_stat_id_er_stat_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ensembles_reglements_stat_id_er_stat_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ensembles_reglements_stat_id_er_stat_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ensembles_reglements_stat_id_er_stat_seq OWNED BY public.ensembles_reglements_stat.id_er;


--
-- Name: entete_reg_stationnement_id_reg_stat_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entete_reg_stationnement_id_reg_stat_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entete_reg_stationnement_id_reg_stat_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entete_reg_stationnement_id_reg_stat_seq OWNED BY public.entete_reg_stationnement.id_reg_stat;


--
-- Name: historique_geopol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historique_geopol (
    id_periode integer NOT NULL,
    nom_periode character varying(255),
    date_debut_periode integer,
    date_fin_periode integer
);


--
-- Name: historique_geopol_id_periode_geo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historique_geopol_id_periode_geo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historique_geopol_id_periode_geo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historique_geopol_id_periode_geo_seq OWNED BY public.historique_geopol.id_periode;


--
-- Name: inputs_validation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inputs_validation (
    g_no_lot character varying(255) NOT NULL,
    nb_entrees bigint,
    cubf_presents integer[],
    n_cubf integer,
    toutes_surfaces_valides boolean,
    toutes_dates_valides boolean,
    tous_logements_valides boolean,
    sup_planch_tot double precision,
    n_logements_tot integer,
    premiere_constr integer,
    valeur_totale bigint,
    cubf_principal integer,
    valeur_maximale integer,
    random_value double precision
);


--
-- Name: inv_reg_aggreg_cubf_n1; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inv_reg_aggreg_cubf_n1 (
    index bigint,
    land_use double precision,
    n_lots bigint,
    n_places_min double precision
);


--
-- Name: inventaire_stationnement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventaire_stationnement (
    g_no_lot text,
    n_places_min double precision,
    n_places_max double precision,
    id_er text,
    id_reg_stat text,
    commentaire text,
    methode_estime integer,
    cubf text,
    id_inv integer NOT NULL,
    n_places_mesure numeric,
    n_places_estime numeric
);


--
-- Name: inventaire_stationnement_id_inv_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventaire_stationnement_id_inv_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventaire_stationnement_id_inv_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventaire_stationnement_id_inv_seq OWNED BY public.inventaire_stationnement.id_inv;


--
-- Name: liste_operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.liste_operations (
    id_operation integer NOT NULL,
    desc_operation character varying(255)
);


--
-- Name: profile_accumulation_vehicule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_accumulation_vehicule (
    id_ent_pav integer NOT NULL,
    id_quartier bigint,
    heure integer,
    voitures integer,
    personnes integer,
    permis integer,
    voitures_res integer,
    voitures_pub integer,
    voit_entrantes_tot integer,
    voit_entrantes_res integer,
    voit_entrantes_pub integer,
    voit_sortantes_tot integer,
    voit_sortantes_res integer,
    voit_sortantes_pub integer,
    voit_transfer_res_a_pub integer,
    voit_transfer_pub_a_res integer,
    pers_entrantes_tot integer,
    pers_sortantes_tot integer,
    perm_entrants_tot integer,
    perm_sortants_tot integer
);


--
-- Name: max_pav_all_data; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.max_pav_all_data AS
 SELECT id_quartier,
    max(voitures) AS max_voit_tot,
    max(voitures_pub) AS max_voit_pub,
    max(voitures_res) AS max_voit_res,
    max(personnes) AS max_pers,
    max(permis) AS max_permies
   FROM public.profile_accumulation_vehicule
  GROUP BY id_quartier;


--
-- Name: motorisation_par_quartier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.motorisation_par_quartier (
    id_quartier bigint,
    nb_voitures double precision,
    nb_voitures_max_pav double precision,
    nb_voitures_min_pav double precision,
    diff_max_signee double precision,
    nb_permis double precision
);


--
-- Name: multiplicateur_facteurs_colonnes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.multiplicateur_facteurs_colonnes (
    id_unite integer NOT NULL,
    colonne_role_foncier character varying(255),
    facteur_correction real,
    cubf integer,
    desc_unite character varying(255),
    abscisse_correction real
);


--
-- Name: multiplicateur_facteurs_colonnes_id_unite_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.multiplicateur_facteurs_colonnes_id_unite_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: multiplicateur_facteurs_colonnes_id_unite_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.multiplicateur_facteurs_colonnes_id_unite_seq OWNED BY public.multiplicateur_facteurs_colonnes.id_unite;


--
-- Name: od_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.od_data (
    nolog bigint,
    tlog bigint,
    nbper bigint,
    nbveh bigint,
    xlonlog double precision,
    ylatlog double precision,
    sdrlog bigint,
    smlog bigint,
    srlog double precision,
    gslog text,
    facmen double precision,
    clepersonne bigint,
    tper bigint,
    sexe bigint,
    age bigint,
    grpage bigint,
    percond bigint,
    occper bigint,
    xlonocc double precision,
    ylatocc double precision,
    mobil bigint,
    facper double precision,
    facpermc double precision,
    facdep double precision,
    cledeplacement double precision,
    nodep double precision,
    hredep double precision,
    hredepimp double precision,
    heure double precision,
    hrearv double precision,
    motif double precision,
    motif_gr double precision,
    mode1 double precision,
    mode2 double precision,
    mode3 double precision,
    mode4 double precision,
    stat double precision,
    coutstat double precision,
    termstat double precision,
    lieuori double precision,
    xlonori double precision,
    ylatori double precision,
    smori double precision,
    xlondes double precision,
    ylatdes double precision,
    smdes double precision,
    geom_logis public.geometry(Point,4326),
    geom_ori public.geometry(Point,4326),
    geom_des public.geometry(Point,4326),
    trip_line public.geometry(LineString,4326)
);


--
-- Name: parts_modales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_modales (
    id_quartier integer,
    ac_res double precision,
    ap_res double precision,
    tc_res double precision,
    mv_res double precision,
    bs_res double precision,
    ac_ori double precision,
    ap_ori double precision,
    tc_ori double precision,
    mv_ori double precision,
    bs_ori double precision,
    ac_des double precision,
    ap_des double precision,
    tc_des double precision,
    mv_des double precision,
    bs_des double precision,
    ac_int double precision,
    ap_int double precision,
    tc_int double precision,
    mv_int double precision,
    bs_int double precision
);


--
-- Name: stat_agrege; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stat_agrege (
    inv_123 integer,
    inv_132 integer,
    inv_213 integer,
    inv_231 integer,
    inv_312 integer,
    inv_321 integer,
    id_quartier bigint NOT NULL,
    inv_1 integer,
    inv_2 integer,
    inv_3 integer,
    cubf_principal_n1 integer,
    n_lots integer
);


--
-- Name: pourcent_territoire; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.pourcent_territoire AS
 SELECT sa.id_quartier,
    ((((14.3 * (sum(stag.inv_132))::numeric))::double precision / sa.superf_quartier) * (100)::double precision) AS pourcent_territoire
   FROM (public.sec_analyse sa
     LEFT JOIN public.stat_agrege stag ON ((stag.id_quartier = sa.id_quartier)))
  GROUP BY sa.id_quartier, sa.superf_quartier
  ORDER BY sa.id_quartier;


--
-- Name: profile_accumulation_vehicule_id_ent_PAV_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."profile_accumulation_vehicule_id_ent_PAV_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profile_accumulation_vehicule_id_ent_PAV_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."profile_accumulation_vehicule_id_ent_PAV_seq" OWNED BY public.profile_accumulation_vehicule.id_ent_pav;


--
-- Name: reg_stationnement_empile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reg_stationnement_empile (
    id_reg_stat_emp integer NOT NULL,
    id_reg_stat integer,
    ss_ensemble integer,
    seuil integer,
    oper integer,
    cases_fix_min double precision,
    cases_fix_max double precision,
    pente_min double precision,
    pente_max double precision,
    unite integer
);


--
-- Name: reg_stationnement_empile_id_reg_stat_emp_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reg_stationnement_empile_id_reg_stat_emp_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reg_stationnement_empile_id_reg_stat_emp_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reg_stationnement_empile_id_reg_stat_emp_seq OWNED BY public.reg_stationnement_empile.id_reg_stat_emp;


--
-- Name: resultats_validation_id_val_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resultats_validation_id_val_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resultats_validation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resultats_validation (
    id_strate bigint,
    g_no_lot character varying(255),
    n_places bigint,
    fond_tuile character varying(255),
    id_val bigint DEFAULT nextval('public.resultats_validation_id_val_seq'::regclass) NOT NULL
);


--
-- Name: role_foncier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_foncier (
    id_provinc character varying(255) NOT NULL,
    code_mun character varying(255),
    arrond character varying(255),
    rejet integer,
    date_entree character varying(255),
    mat18 character varying(255),
    anrole character varying(255),
    no_seq_adr character varying(255),
    rl0101a character varying(255),
    rl0101b character varying(255),
    rl0101c character varying(255),
    rl0101d character varying(255),
    rl0101e character varying(255),
    rl0101f character varying(255),
    rl0101g character varying(255),
    rl0101h character varying(255),
    rl0101i character varying(255),
    rl0101j character varying(255),
    rl0104g character varying(255),
    rl0104h character varying(255),
    rl0105a character varying(255),
    rl0106a character varying(255),
    rl0107a character varying(255),
    rl0301a double precision,
    rl0302a double precision,
    rl0303a character varying(255),
    rl0304a double precision,
    rl0305a double precision,
    rl0306a double precision,
    rl0307a character varying(255),
    rl0307b character varying(255),
    rl0308a double precision,
    rl0309a character varying(255),
    rl0311a double precision,
    rl0312a double precision,
    rl0313a double precision,
    rl0402a double precision,
    rl0403a double precision,
    rl0404a integer,
    rl0405a double precision,
    rl0501a character varying(255),
    rl0502a character varying(255),
    rl0503a character varying(255),
    rl0505a character varying(255),
    ind_nouv_ctrid character varying(255),
    dat_cond_mrche timestamp without time zone,
    rl0310a character varying(255),
    rl0314a double precision,
    rl0315a double precision,
    rl0316a double precision,
    geometry public.geometry(Point,4326)
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    id text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL
);


--
-- Name: stat_corr_pub_res; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.stat_corr_pub_res AS
 WITH stat_pub AS (
         SELECT stag.id_quartier,
            sum(stag.inv_132) AS stat_pub_132
           FROM public.stat_agrege stag
          WHERE (stag.cubf_principal_n1 <> 1)
          GROUP BY stag.id_quartier
        ), stat_res AS (
         SELECT stag.id_quartier,
            sum(stag.inv_132) AS stat_res_132
           FROM public.stat_agrege stag
          WHERE (stag.cubf_principal_n1 = 1)
          GROUP BY stag.id_quartier
        )
 SELECT sr.id_quartier,
    sp.stat_pub_132,
    sr.stat_res_132,
    sa.nom_quartier,
    sa.acro,
    sa.geometry
   FROM ((public.sec_analyse sa
     LEFT JOIN stat_res sr ON ((sa.id_quartier = sr.id_quartier)))
     LEFT JOIN stat_pub sp ON ((sp.id_quartier = sa.id_quartier)));


--
-- Name: stat_reg_tot_par_quartier; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.stat_reg_tot_par_quartier AS
 SELECT id_quartier,
    sum(inv_2) AS stat_reg_tot
   FROM public.stat_agrege
  GROUP BY id_quartier;


--
-- Name: strates_echantillonage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strates_echantillonage (
    id_strate integer NOT NULL,
    nom_strate text,
    est_racine boolean DEFAULT false,
    index_ordre integer,
    nom_colonne text NOT NULL,
    condition_type text,
    condition_min numeric,
    condition_max numeric,
    condition_valeur numeric,
    ids_enfants integer[],
    n_sample integer,
    logements_valides boolean,
    superf_valide boolean,
    date_valide boolean,
    CONSTRAINT strates_echantillonage_condition_type_check CHECK ((condition_type = ANY (ARRAY['equals'::text, 'range'::text])))
);


--
-- Name: strates_echantillonage_id_strate_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.strates_echantillonage_id_strate_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: strates_echantillonage_id_strate_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.strates_echantillonage_id_strate_seq OWNED BY public.strates_echantillonage.id_strate;


--
-- Name: taux_occupation_max; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.taux_occupation_max AS
 SELECT sa.id_quartier,
    sa.acro,
    ((mq.nb_voitures_max_pav / (sum(stag.inv_132))::double precision) * (100)::double precision) AS taux_occupation_max
   FROM ((public.sec_analyse sa
     LEFT JOIN public.motorisation_par_quartier mq ON ((mq.id_quartier = sa.id_quartier)))
     LEFT JOIN public.stat_agrege stag ON ((stag.id_quartier = sa.id_quartier)))
  GROUP BY sa.id_quartier, sa.acro, mq.nb_voitures_max_pav;


--
-- Name: taux_occupation_public; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.taux_occupation_public AS
 WITH max_pav_pub AS (
         SELECT pav.id_quartier,
            (max(pav.voitures_pub))::numeric AS voit_max_pub
           FROM public.profile_accumulation_vehicule pav
          GROUP BY pav.id_quartier
        ), stationnement_public AS (
         SELECT stag.id_quartier,
            (sum(stag.inv_132))::numeric AS stat_pub
           FROM public.stat_agrege stag
          WHERE (stag.cubf_principal_n1 <> 1)
          GROUP BY stag.id_quartier
        )
 SELECT sa.id_quartier,
    sa.acro,
    ((100)::numeric * (mpp.voit_max_pub / stpu.stat_pub)) AS taux_occupation_pub,
    mpp.voit_max_pub,
    stpu.stat_pub
   FROM ((public.sec_analyse sa
     LEFT JOIN max_pav_pub mpp ON ((mpp.id_quartier = sa.id_quartier)))
     LEFT JOIN stationnement_public stpu ON ((stpu.id_quartier = sa.id_quartier)));


--
-- Name: taux_occupation_res_max; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.taux_occupation_res_max AS
 WITH max_pav_res AS (
         SELECT pav.id_quartier,
            (max(pav.voitures_res))::numeric AS voit_max_res
           FROM public.profile_accumulation_vehicule pav
          GROUP BY pav.id_quartier
        ), stationnement_public AS (
         SELECT stag.id_quartier,
            (sum(stag.inv_132))::numeric AS stat_res
           FROM public.stat_agrege stag
          WHERE (stag.cubf_principal_n1 = 1)
          GROUP BY stag.id_quartier
        )
 SELECT sa.id_quartier,
    sa.acro,
    ((100)::numeric * (mpr.voit_max_res / stpu.stat_res)) AS taux_occupation_res,
    mpr.voit_max_res,
    stpu.stat_res
   FROM ((public.sec_analyse sa
     LEFT JOIN max_pav_res mpr ON ((mpr.id_quartier = sa.id_quartier)))
     LEFT JOIN stationnement_public stpu ON ((stpu.id_quartier = sa.id_quartier)));


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: variabilite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.variabilite (
    index bigint,
    land_use double precision,
    n_lots bigint,
    n_places_min double precision,
    id_er bigint,
    facteur_echelle double precision
);


--
-- Name: visu_reg_tete_a_reg_empile_2; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.visu_reg_tete_a_reg_empile_2 AS
 SELECT head.id_reg_stat,
    head.description,
    head.annee_debut_reg,
    head.annee_fin_reg,
    head.texte_loi,
    head.article_loi,
    head.paragraphe_loi,
    head.ville,
    emp.ss_ensemble,
    emp.seuil,
    emp.oper,
    emp.cases_fix_min,
    emp.cases_fix_max,
    emp.pente_min,
    emp.pente_max,
    emp.unite,
    mult.desc_unite
   FROM public.reg_stationnement_empile emp,
    public.entete_reg_stationnement head,
    public.multiplicateur_facteurs_colonnes mult
  WHERE ((emp.id_reg_stat = head.id_reg_stat) AND (mult.id_unite = emp.unite));


--
-- Name: visu_ens_a_reg; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.visu_ens_a_reg AS
 SELECT ens.id_er AS ensemble,
    ens.description_er,
    ass.cubf,
    cubf.description AS desc_cubf,
    head.id_reg_stat,
    head.description,
    head.ss_ensemble,
    head.seuil,
    head.oper,
    head.cases_fix_min,
    head.cases_fix_max,
    head.pente_min,
    head.pente_max,
    head.unite,
    head.desc_unite
   FROM public.association_er_reg_stat ass,
    public.ensembles_reglements_stat ens,
    public.visu_reg_tete_a_reg_empile_2 head,
    public.cubf
  WHERE ((ass.id_er = ens.id_er) AND (head.id_reg_stat = ass.id_reg_stat) AND (cubf.cubf = ass.cubf));


--
-- Name: vue_parametres_reglements; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vue_parametres_reglements AS
 SELECT ers.id_reg_stat,
    ers.description,
    ers.annee_debut_reg,
    ers.annee_fin_reg,
    ers.texte_loi,
    ers.article_loi,
    ers.paragraphe_loi,
    ers.ville,
    array_agg(DISTINCT rse.unite) AS unites_utilisees,
    count(DISTINCT rse.unite) AS n_unites,
    array_agg(DISTINCT rse.oper) FILTER (WHERE (rse.oper IS NOT NULL)) AS oper_utilises,
    count(DISTINCT rse.oper) AS n_oper,
    count(DISTINCT rse.ss_ensemble) AS n_ss_ensemble,
    count(rse.id_reg_stat_emp) AS n_lignes
   FROM (public.entete_reg_stationnement ers
     LEFT JOIN public.reg_stationnement_empile rse ON ((rse.id_reg_stat = ers.id_reg_stat)))
  GROUP BY ers.id_reg_stat, ers.description, ers.annee_debut_reg, ers.annee_fin_reg, ers.texte_loi, ers.article_loi, ers.paragraphe_loi, ers.ville;


--
-- Name: vue_periode_terr_er; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vue_periode_terr_er AS
 SELECT cs.id_periode_geo,
    cs.id_periode,
    cs.ville_sec,
    hg.nom_periode,
    hg.date_debut_periode,
    hg.date_fin_periode,
    rst.id_er,
    ers.description_er,
    ers.date_debut_er,
    ers.date_fin_er
   FROM (((public.cartographie_secteurs cs
     LEFT JOIN public.historique_geopol hg ON ((hg.id_periode = cs.id_periode)))
     LEFT JOIN public.association_er_territoire rst ON ((rst.id_periode_geo = cs.id_periode_geo)))
     LEFT JOIN public.ensembles_reglements_stat ers ON ((ers.id_er = rst.id_er)));


--
-- Name: association_cadastre_role id_assoc_cad_role; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_cadastre_role ALTER COLUMN id_assoc_cad_role SET DEFAULT nextval('public.association_cadastre_role_id_assoc_cad_role_seq'::regclass);


--
-- Name: association_er_reg_stat id_assoc_er_reg; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_er_reg_stat ALTER COLUMN id_assoc_er_reg SET DEFAULT nextval('public.association_er_reg_stat_id_assoc_seq'::regclass);


--
-- Name: association_er_territoire id_asso_er_ter; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_er_territoire ALTER COLUMN id_asso_er_ter SET DEFAULT nextval('public.association_er_territoire_id_association_seq'::regclass);


--
-- Name: cartographie_secteurs id_periode_geo; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartographie_secteurs ALTER COLUMN id_periode_geo SET DEFAULT nextval('public.cartographie_secteurs_id_periode_geo_seq'::regclass);


--
-- Name: ensembles_reglements_stat id_er; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ensembles_reglements_stat ALTER COLUMN id_er SET DEFAULT nextval('public.ensembles_reglements_stat_id_er_stat_seq'::regclass);


--
-- Name: entete_reg_stationnement id_reg_stat; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entete_reg_stationnement ALTER COLUMN id_reg_stat SET DEFAULT nextval('public.entete_reg_stationnement_id_reg_stat_seq'::regclass);


--
-- Name: historique_geopol id_periode; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_geopol ALTER COLUMN id_periode SET DEFAULT nextval('public.historique_geopol_id_periode_geo_seq'::regclass);


--
-- Name: inventaire_stationnement id_inv; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventaire_stationnement ALTER COLUMN id_inv SET DEFAULT nextval('public.inventaire_stationnement_id_inv_seq'::regclass);


--
-- Name: multiplicateur_facteurs_colonnes id_unite; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multiplicateur_facteurs_colonnes ALTER COLUMN id_unite SET DEFAULT nextval('public.multiplicateur_facteurs_colonnes_id_unite_seq'::regclass);


--
-- Name: profile_accumulation_vehicule id_ent_pav; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_accumulation_vehicule ALTER COLUMN id_ent_pav SET DEFAULT nextval('public."profile_accumulation_vehicule_id_ent_PAV_seq"'::regclass);


--
-- Name: reg_stationnement_empile id_reg_stat_emp; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reg_stationnement_empile ALTER COLUMN id_reg_stat_emp SET DEFAULT nextval('public.reg_stationnement_empile_id_reg_stat_emp_seq'::regclass);


--
-- Name: strates_echantillonage id_strate; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strates_echantillonage ALTER COLUMN id_strate SET DEFAULT nextval('public.strates_echantillonage_id_strate_seq'::regclass);


--

-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: association_cadastre_role association_cadastre_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_cadastre_role
    ADD CONSTRAINT association_cadastre_role_pkey PRIMARY KEY (id_assoc_cad_role);


--
-- Name: association_er_reg_stat association_er_reg_stat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_er_reg_stat
    ADD CONSTRAINT association_er_reg_stat_pkey PRIMARY KEY (id_assoc_er_reg);


--
-- Name: association_er_territoire association_er_territoire_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_er_territoire
    ADD CONSTRAINT association_er_territoire_pkey PRIMARY KEY (id_asso_er_ter);


--
-- Name: cartographie_secteurs cartographie_secteurs_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartographie_secteurs
    ADD CONSTRAINT cartographie_secteurs_pkey1 PRIMARY KEY (id_periode_geo);


--
-- Name: cubf cubf_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cubf
    ADD CONSTRAINT cubf_pkey PRIMARY KEY (cubf);


--
-- Name: ensembles_reglements_stat ensembles_reglements_stat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ensembles_reglements_stat
    ADD CONSTRAINT ensembles_reglements_stat_pkey PRIMARY KEY (id_er);


--
-- Name: entete_reg_stationnement entete_reg_stationnement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entete_reg_stationnement
    ADD CONSTRAINT entete_reg_stationnement_pkey PRIMARY KEY (id_reg_stat);


--
-- Name: historique_geopol historique_geopol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_geopol
    ADD CONSTRAINT historique_geopol_pkey PRIMARY KEY (id_periode);


--
-- Name: inputs_validation inputs_validation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inputs_validation
    ADD CONSTRAINT inputs_validation_pkey PRIMARY KEY (g_no_lot);


--
-- Name: inventaire_stationnement inventaire_stationnement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventaire_stationnement
    ADD CONSTRAINT inventaire_stationnement_pkey PRIMARY KEY (id_inv);


--
-- Name: liste_operations liste_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liste_operations
    ADD CONSTRAINT liste_operations_pkey PRIMARY KEY (id_operation);


--
-- Name: multiplicateur_facteurs_colonnes multiplicateur_facteurs_colonnes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multiplicateur_facteurs_colonnes
    ADD CONSTRAINT multiplicateur_facteurs_colonnes_pkey PRIMARY KEY (id_unite);


--
-- Name: profile_accumulation_vehicule profile_accumulation_vehicule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_accumulation_vehicule
    ADD CONSTRAINT profile_accumulation_vehicule_pkey PRIMARY KEY (id_ent_pav);


--
-- Name: profile_accumulation_vehicule quartier_heure; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_accumulation_vehicule
    ADD CONSTRAINT quartier_heure UNIQUE (id_quartier, heure);


--
-- Name: reg_stationnement_empile reg_stationnement_empile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reg_stationnement_empile
    ADD CONSTRAINT reg_stationnement_empile_pkey PRIMARY KEY (id_reg_stat_emp);


--
-- Name: resultats_validation resultats_validation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultats_validation
    ADD CONSTRAINT resultats_validation_pkey PRIMARY KEY (id_val);


--
-- Name: role_foncier role_foncier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_foncier
    ADD CONSTRAINT role_foncier_pkey PRIMARY KEY (id_provinc);


--
-- Name: sec_analyse sec_analyse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sec_analyse
    ADD CONSTRAINT sec_analyse_pkey PRIMARY KEY (id_quartier);


--
-- Name: strates_echantillonage strates_echantillonage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strates_echantillonage
    ADD CONSTRAINT strates_echantillonage_pkey PRIMARY KEY (id_strate);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_userId_idx" ON public.account USING btree ("userId");


--
-- Name: idx_cadastre_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cadastre_geom ON public.cadastre USING gist (geometry);


--
-- Name: idx_census_population_2016_geometry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_census_population_2016_geometry ON public.census_population_2016 USING gist (geometry);


--
-- Name: idx_census_population_geometry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_census_population_geometry ON public.census_population USING gist (geometry);


--
-- Name: idx_inv_gno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_gno ON public.inventaire_stationnement USING btree (g_no_lot);


--
-- Name: idx_inv_method_notnull; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_method_notnull ON public.inventaire_stationnement USING btree (g_no_lot) WHERE (methode_estime IS NOT NULL);


--
-- Name: idx_od_data_geom_logis; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_od_data_geom_logis ON public.od_data USING gist (geom_logis);


--
-- Name: idx_sec_analyse_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sec_analyse_geom ON public.sec_analyse USING gist (geometry);


--
-- Name: idx_sec_analyse_geometry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sec_analyse_geometry ON public.sec_analyse USING gist (geometry);


--
-- Name: ix_donnees_brutes_ana_var_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_donnees_brutes_ana_var_index ON public.donnees_brutes_ana_var USING btree (index);


--
-- Name: ix_inv_reg_aggreg_cubf_n1_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inv_reg_aggreg_cubf_n1_index ON public.inv_reg_aggreg_cubf_n1 USING btree (index);


--
-- Name: ix_variabilite_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_variabilite_index ON public.variabilite USING btree (index);


--
-- Name: dens_stat_reg_quartier _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.dens_stat_reg_quartier AS
 SELECT sa.id_quartier,
    (((sum(stag.inv_2))::double precision / sa.superf_quartier) * (1000000)::double precision) AS dens_stat
   FROM (public.sec_analyse sa
     LEFT JOIN public.stat_agrege stag ON ((stag.id_quartier = sa.id_quartier)))
  GROUP BY sa.id_quartier;


--
-- PostgreSQL database dump complete
--

\unrestrict qvCh0bXbDO4P4zsBquFpNdGtNoigIT4MM3Cu5EdWm8Pijcsn0oMf9PGrjF4AxqH


