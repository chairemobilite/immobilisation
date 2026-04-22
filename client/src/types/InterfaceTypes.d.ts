import {LatLng, LatLngBounds, LatLngExpression} from "leaflet";
import React, { SetStateAction,Dispatch } from "react";
import { inventaire_stationnement,quartiers_analyse, territoire,entete_reglement_stationnement,definition_reglement_stationnement, reglement_complet, entete_ensemble_reglement_stationnement, ensemble_reglements_stationnement, inventaireGeoJSONProps, lotCadastralGeoJsonProperties,roleFoncierGeoJsonProps, territoireGeoJsonProperties, lotCadastralAvecBoolInvGeoJsonProperties, informations_reglementaire_manuelle, utilisation_sol, data_graphique, methodeAnalyseVariabillite, comptes_utilisations_sol, Strate, FeuilleFinaleStrate, EntreeValidation, methodeCalcul, unites_reglement_stationnement, colonnes_possibles_conversion, EquivalenceVersementCarto, recensementGeoJsonProperties, EquivalenceCSVCoordPoint } from "./DataTypes";
import { Feature, FeatureCollection, Geometry } from "geojson";
import { PrioriteEstimeQuartier, TypesVisualisationAnalyseQuartier, VariablesPossibles } from "./AnalysisTypes";
import { SpeedDialActionStaticTooltipLabelSlotPropsOverrides } from "@mui/material";
import { ODGeomTypes } from "./EnumTypes";
// --------------------------------------------------------------------------
// ------------------------- Interface --------------------------------------
// --------------------------------------------------------------------------
export interface study_area{
    name: string;
    x: number;
    y: number;
    zoom: number;
}

export interface load_state{
    state: boolean,
    set_load_state: SetStateAction<boolean>,
}

export interface error_state{
    state:boolean,
    set_error_state: SetStateAction<boolean>
}

export interface Utilisateur{
    name:string|null,
    hash:string|null,
    role:1|2|undefined
}

export interface role_set_state{
    state:boolean,
    set_role_set_state:SetStateAction<boolean>
}
// ---------------------------------------------------------------
// ------------------ Versement Secteurs d'analyse ---------------
// ---------------------------------------------------------------
export interface PropsVersSecAnalyse{
    modalOuvert:boolean,
    setModalOuvert:Dispatch<SetStateAction<boolean>>,
    secAnalyseNew: FeatureCollection<Geometry,quartiers_analyse>,
    setSecAnalyseNew:Dispatch<SetStateAction<FeatureCollection<Geometry,quartiers_analyse>>>,
}

export interface propsMenuSecAnalyse{
    secAnalyseAct: FeatureCollection<Geometry,quartiers_analyse>,
    setSecAnalyseAct:Dispatch<SetStateAction<FeatureCollection<Geometry,quartiers_analyse>>>,
    secAnalyseNew: FeatureCollection<Geometry,quartiers_analyse>,
    setSecAnalyseNew:Dispatch<SetStateAction<FeatureCollection<Geometry,quartiers_analyse>>>,
    modalOuvert:boolean,
    setModalOuvert:React.Dispatch<SetStateAction<boolean>>,
    optionVisPoss: NouveauAncienSecteurAnalyse[],
    optionsVis:NouveauAncienSecteurAnalyse,
    setOptionsVis:React.Dispatch<SetStateAction<NouveauAncienSecteurAnalyse>>,
}

export interface NouveauAncienSecteurAnalyse{
    idSecs: number;
    description: string;
}

export interface propsParamSecAnalyse{
    secAnalyseMontrer:FeatureCollection<Geometry,quartiers_analyse>,
    setSecAnalyseMontrer:React.Dispatch<SetStateAction<FeatureCollection<Geometry,quartiers_analyse>>>,
    optionSecteurAnalyse:NouveauAncienSecteurAnalyse,
}

export interface CarteSecAnalyseProps{
    territoires:GeoJSON.FeatureCollection<GeoJSON.Geometry,quartiers_analyse>;
    defTerritoires: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,quartiers_analyse>>>;
    territoireSelect: number;
    defTerritoireSelect: React.Dispatch<SetStateAction<number>>;
    startPosition: LatLngExpression;
    setStartPosition:React.Dispatch<SetStateAction<LatLngExpression>>;
    startZoom: number;
    setStartZoom: React.Dispatch<SetStateAction<number>>;
}
// ---------------------------------------------------------------
// --------------------------- Unites ----------------------------
// ---------------------------------------------------------------

export interface PropsListeUnite{
    unites: unites_reglement_stationnement[]
    defUnites: React.Dispatch<SetStateAction<unites_reglement_stationnement[]>>
    uniteSelect: unites_reglement_stationnement
    defUniteSelect: React.Dispatch<SetStateAction<unites_reglement_stationnement>>
    anciennesUnites: unites_reglement_stationnement[]
    defAnciennesUnites: React.Dispatch<SetStateAction<unites_reglement_stationnement[]>>
    editionEnCours:boolean,
    defEditionEnCours:React.Dispatch<SetStateAction<boolean>>,
    colonnesPossibles:colonnes_possibles_conversion[],
    defColonnesPossibles: React.Dispatch<SetStateAction<colonnes_possibles_conversion[]>>
}
export interface PropsModifUnites{
    unites: unites_reglement_stationnement[]
    defUnites: React.Dispatch<SetStateAction<unites_reglement_stationnement[]>>
    uniteSelect: unites_reglement_stationnement
    defUniteSelect: React.Dispatch<SetStateAction<unites_reglement_stationnement>>
    editionEnCours:boolean,
    defEditionEnCours:React.Dispatch<SetStateAction<boolean>>,
    colonnesPossibles:colonnes_possibles_conversion[],
    defColonnesPossibles: React.Dispatch<SetStateAction<colonnes_possibles_conversion[]>>,
    anciennesUnites: unites_reglement_stationnement[]
    defAnciennesUnites: React.Dispatch<SetStateAction<unites_reglement_stationnement[]>>
}
// --------------------------------------------------------------
// ------------------- Versement --------------------------------
// --------------------------------------------------------------
export interface mappingLigne{
    type:'Ligne',
    data:string[][]
}
export interface mappingPoint{
    type:'Point'
    data:string[]
}



export interface PropsVersement{
    modalOuvert:boolean,
    defModalOuvert: React.Dispatch<SetStateAction<boolean>>
    champsARemplir: EquivalenceVersementCarto[]
    defChampsARemplir:Dispatch<SetStateAction<EquivalenceVersementCarto[]>>
    title:string
    table:'cadastre'|'role_foncier'|'census_population'|'census_population_2016'|'od_data'|'cubf',
    champsGeomARemplir?: EquivalenceCSVCoordPoint[]
    defChampsGeomARemplir?:Dispatch<SetStateAction<EquivalenceCSVCoordPoint[]>>
    serviceUploadPeak: (
        file:File,
        setProgress:Dispatch<SetStateAction<number>>
    )=>Promise<{
        tempFileId:string,
        columns:string[]
    }>
    serviceMAJ:(
        fileID:string,
        regularMapping:Record<string,string>,
        table:string,
        mappingCarto?:Record<string,mappingLigne|mappingPoint>
    )=>Promise<{
        success:boolean,
        data:number
    }>
}

export interface PropsFileUploadBox{
    colonnesFichier:string[],
    defColonnesFichier:Dispatch<SetStateAction<string[]>>,
    idFichier:string,
    defIdFichier:Dispatch<SetStateAction<string>>,
    accept:string,
    title:string,
    serviceUploadPeak: (file:File,setProgress:Dispatch<SetStateAction<number>>)=>Promise<{tempFileId:string,columns:string[]}>
}
export interface PropsPageSelect{
    colonnesFichier:string[],
    defColonnesFichier:Dispatch<SetStateAction<string[]>>
    pages:string[],
    pageAct:string,
    defPageAct:Dispatch<SetStateAction<string>>
}
export interface PropsStdColumnsDropDown{
    colonnesFichier:string[],
    defColonnesFichier:Dispatch<SetStateAction<string[]>>
    champsARemplir: EquivalenceVersementCarto[]
    defChampsARemplir:Dispatch<SetStateAction<EquivalenceVersementCarto[]>>,
    pageAct:string
}
export interface PropsGeomColumnsDropDown{
    colonnesFichier:string[],
    defColonnesFichier:Dispatch<SetStateAction<string[]>>
    champsgeomARemplir: EquivalenceCSVCoordPoint[]
    defChampsGeomARemplir:Dispatch<SetStateAction<EquivalenceCSVCoordPoint[]>>,
    pageAct:string
}

export interface PropsDropDownListGeom{
    geometrieActuelle:EquivalenceCSVCoordPoint
    colonnesFichier:string[],
    defColonnesFichier:Dispatch<SetStateAction<string[]>>
    champsGeomARemplir: EquivalenceCSVCoordPoint[]
    defChampsGeomARemplir:Dispatch<SetStateAction<EquivalenceCSVCoordPoint[]>>,
    pageAct:string
}
export interface PropsBoutApprobVersement{
    modalOuvert: boolean,
    defModalOuvert:Dispatch<SetStateAction<boolean>>,
    champsARemplir: EquivalenceVersementCarto[]
    champsGeomARemplir?: EquivalenceCSVCoordPoint[],
    idFichier:string,
    table:string,
    serviceMAJ:(
        fileID:string,
        regularMapping:Record<string,string>,
        table:string,
        mappingCarto?:Record<string,mappingLigne|mappingPoint>
    )=>Promise<{
        success:boolean,
        data:number
    }>
}
// ---------------------------------------------------------------
// ------------------------ Versement Cadastre -------------------
// ---------------------------------------------------------------
export interface PropsVersementCadastre{
    modalOuvert:boolean,
    defModalOuvert: React.Dispatch<SetStateAction<boolean>>
}
export interface PropsMenuVersementCadastre{
    modalOuvert:boolean,
    defModalOuvert: React.Dispatch<SetStateAction<boolean>>
}
// ---------------------------------------------------------------
// ----------------- Association Cadastre Role -------------------
// ---------------------------------------------------------------

export interface PropsAssocCadastreRole{
    modalOuvert:boolean,
    defModalOuvert: Dispatch<SetStateAction<boolean>>
}

export interface PropsCarteAssoc{
    lotSelect: FeatureCollection<Geometry,lotCadastralGeoJsonProperties>|null
    defLotSelect:Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralGeoJsonProperties>|null>>
    roleSelect: FeatureCollection<Geometry,roleFoncierGeoJsonProps>|null
    defRoleSelect:Dispatch<SetStateAction<FeatureCollection<Geometry,roleFoncierGeoJsonProps>|null>>
    defRoleRegard:Dispatch<SetStateAction<string>>
    roleRegard:string
}

// ---------------------------------------------------------------
// ----------------- Recensement -------------------
// ---------------------------------------------------------------
export interface PropsMenuVersementRecens{
    modalOuvert:boolean,
    defModalOuvert: React.Dispatch<SetStateAction<boolean>>
    anneeRecens:2016|2021
    defAnneeRecens:Dispatch<SetStateAction<2016|2021>>,
    tableModif:'census_population'|'census_population_2016'
    defTableModif: Dispatch<SetStateAction<'census_population'|'census_population_2016'>>
    Equiv:EquivalenceVersementCarto[]
    defEquiv:Dispatch<SetStateAction<EquivalenceVersementCarto[]>>
    equivOptions:Record<2016|2021,EquivalenceVersementCarto[]>
    limites:LatLngBounds|null
    defDonnees: Dispatch<SetStateAction<FeatureCollection<Geometry,recensementGeoJsonProperties>|null>>
}
// ---------------------------------------------------------------
// ----------------- Enquete OD -------------------
// ---------------------------------------------------------------
export interface PropsMenuEnqueteOD{
    modalOuvert:boolean,
    defModalOuvert:Dispatch<SetStateAction<boolean>>
    typeObjetOD:ODGeomTypes
    defTypeObjetOd: Dispatch<SetStateAction<ODGeomTypes>>,
    heure:number[]|null
    defHeure:Dispatch<SetStateAction<number[]|null>>,
    motif: number[]|null,
    defMotif:Dispatch<SetStateAction<number[]|null>>,
    mode:number[]|null
    defMode:Dispatch<SetStateAction<number[]|null>>
    limites:LatLngBounds|null
}

// ---------------------------------------------------------------
// --------------------------- Inventaire ------------------------
// ---------------------------------------------------------------
export interface TableInventaireProps{
    quartier: number;
    defQuartier:  React.Dispatch<SetStateAction<number>>;
    inventaire: inventaire_stationnement[];
    defInventaire: React.Dispatch<SetStateAction<inventaire_stationnement[]>>
    lots:GeoJSON.FeatureCollection<GeoJSON.Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null,
    defLots: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null>>,
    donneesRole: GeoJSON.FeatureCollection<GeoJSON.Geometry,roleFoncierGeoJsonProperties>|null,
    defDonneesRole: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,roleFoncierGeoJsonProperties>|null>>,
    ensemblesReglements:ensemble_reglements_stationnement[],
    defEnsemblesReglements: React.Dispatch<SetStateAction<ensemble_reglements_stationnement[]>>,
    reglements: reglement_complet[],
    defReglements: React.Dispatch<SetStateAction<reglement_complet[]>>,
    itemSelect: inventaire_stationnement[];
    defItemSelect :React.Dispatch<SetStateAction<inventaire_stationnement[]>>,
    methodeEstimeRegard:number,
    defMethodeEstimeRegard:React.Dispatch<SetStateAction<number>>,
    regRegard:number,
    defRegRegard:React.Dispatch<SetStateAction<number>>,
    ensRegRegard:number,
    defEnsRegRegard:React.Dispatch<SetStateAction<number>>,
    roleRegard:string,
    defRoleRegard:React.Dispatch<SetStateAction<string>>,
    lotsDuQuartier: GeoJSON.FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>,
    quartierSelect:number,
}

export interface CarteInventaireProps{
    lotsDuQuartier:GeoJSON.FeatureCollection<GeoJSON.Geometry,lotCadastralAvecBoolInvGeoJsonProperties>,
    defLotsDuQuartiers:  React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,lotCadastralAvecBoolInvGeoJsonProperties>>>,
    inventaire:inventaire_stationnement[];
    defInventaire: React.Dispatch<SetStateAction<inventaire_stationnement[]>>;
    itemSelect: inventaire_stationnement[];
    defItemSelect :React.Dispatch<SetStateAction<inventaire_stationnement[]>>,
    startPosition: LatLngExpression;
    setStartPosition:React.Dispatch<SetStateAction<LatLngExpression>>;
    startZoom: number;
    setStartZoom: React.Dispatch<SetStateAction<number>>;
    lotSelect:GeoJSON.FeatureCollection<GeoJSON.Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null,
    defLotSelect: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null>>,
    donneesRole: GeoJSON.FeatureCollection<GeoJSON.Geometry,roleFoncierGeoJsonProperties>|null,
    defDonneesRole: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,roleFoncierGeoJsonProperties>|null>>,
    ensemblesReglements:ensemble_reglements_stationnement[],
    defEnsemblesReglements: React.Dispatch<SetStateAction<ensemble_reglements_stationnement[]>>,
    reglements: reglement_complet[],
    defReglements: React.Dispatch<SetStateAction<reglement_complet[]>>,
    methodeEstimeRegard:number,
    defMethodeEstimeRegard:React.Dispatch<SetStateAction<number>>,
    regRegard:number,
    defRegRegard:React.Dispatch<SetStateAction<number>>,
    ensRegRegard:number,
    defEnsRegRegard:React.Dispatch<SetStateAction<number>>,
    roleRegard:string,
    defRoleRegard:React.Dispatch<SetStateAction<string>>,
    montrerTousLots:boolean,
    optionCouleur:number,
    defOptionCouleur:React.Dispatch<SetStateAction<number>>,
}

export interface TableRevueProps{
    lots:GeoJSON.FeatureCollection<GeoJSON.Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null,
    defLots: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null>>,
    donneesRole: GeoJSON.FeatureCollection<GeoJSON.Geometry,roleFoncierGeoJsonProperties>|null,
    defDonneesRole: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,roleFoncierGeoJsonProperties>|null>>,
    ensemblesReglements?:ensemble_reglements_stationnement[],
    defEnsemblesReglements?: React.Dispatch<SetStateAction<ensemble_reglements_stationnement[]>>,
    reglements?: reglement_complet[],
    defReglements?: React.Dispatch<SetStateAction<reglement_complet[]>>
    inventaire?: inventaire_stationnement[],
    defInventaire?: React.Dispatch<SetStateAction<inventaire_stationnement[]>>
    methodeEstimeRegard?:number,
    defMethodeEstimeRegard?:React.Dispatch<SetStateAction<number>>,
    regRegard?:number,
    defRegRegard?:React.Dispatch<SetStateAction<number>>,
    ensRegRegard?:number,
    defEnsRegRegard?:React.Dispatch<SetStateAction<number>>,
    roleRegard:string,
    defRoleRegard:React.Dispatch<SetStateAction<string>>,
    panneauModifVisible?: boolean,
    defPanneauModifVisible?:React.Dispatch<SetStateAction<boolean>>,
    quartier_select?:number,
    defInventaireQuartier?:React.Dispatch<SetStateAction<inventaire_stationnement[]>>
}

export interface SubMenuProps{
    label:string,
    options:{label:string, path:string}[]
}

export interface TableauInventaireUniqueProps{
    inventaire: inventaire_stationnement
}



export interface ComparaisonInventaireQuartierProps{
    ancienInventaireReg:inventaire_stationnement[],
    defAncienInventaireReg:React.Dispatch<SetStateAction<inventaire_stationnement[]>>,
    nouvelInventaireReg: inventaire_stationnement[],
    defNouvelInventaireReg: React.Dispatch<SetStateAction<inventaire_stationnement[]>>,
    validationInventaireQuartier:boolean,
    defValidationInventaireQuartier:React.Dispatch<SetStateAction<boolean>>
    chargement:boolean,
    defChargement:React.Dispatch<SetStateAction<boolean>>,
    quartierSelect:number,
    lotsDuQuartier:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>,
    defLotsDuQuartier: React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>>>,
    defPanneauComparInventaireQuartierVis:React.Dispatch<SetStateAction<boolean>>;
}

export interface MenuInventaireProps{
    lotsDuQuartier: FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>,
    defLotsDuQuartier: React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>>>,
    nouvelInventaireReg: inventaire_stationnement[],
    defNouvelInventaireReg: React.Dispatch<SetStateAction<inventaire_stationnement[],>>,
    inventaireActuel: inventaire_stationnement[],
    defInventaireActuel: React.Dispatch<SetStateAction<inventaire_stationnement[]>>,
    positionDepart: LatLngExpression;
    defPositionDepart:React.Dispatch<SetStateAction<LatLngExpression>>;
    zoomDepart: number;
    defZoomDepart: React.Dispatch<SetStateAction<number>>;
    optionsQuartier:FeatureCollection<Geometry,quartiers_analyse>;
    quartier:number,
    defQuartier:React.Dispatch<SetStateAction<number>>;
    defPanneauComparInventaireQuartierVis:React.Dispatch<SetStateAction<boolean>>;
    defNouvelInventaireQuartier:React.Dispatch<SetStateAction<inventaire_stationnement[]>>;
    chargement:boolean,
    defChargement:React.Dispatch<SetStateAction<boolean>>
    montrerTousLots:boolean,
    defMontrerTousLots:React.Dispatch<SetStateAction<boolean>>,
    optionCouleur:number,
    defOptionCouleur:React.Dispatch<SetStateAction<number>>,
}

export interface PropsInformationReglementaireManuelle{
    defInformationRegManuel:React.Dispatch<SetStateAction<informations_reglementaire_manuelle[]>>
}
// ------------------------------------------------------------------------------
// ---------------------------- Historique --------------------------------------
// ------------------------------------------------------------------------------
export interface CarteHistoriqueProps{
    territoires:GeoJSON.FeatureCollection<GeoJSON.Geometry>;
    defTerritoires: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>>>;
    territoireSelect: number;
    defTerritoireSelect: React.Dispatch<SetStateAction<number>>;
    startPosition: LatLngExpression;
    setStartPosition:React.Dispatch<SetStateAction<LatLngExpression>>;
    startZoom: number;
    setStartZoom: React.Dispatch<SetStateAction<number>>;
}

export interface TableHistoireProps{
    periodeSelect:number,
    defPeriodeSelect:React.Dispatch<SetStateAction<number>>;
    territoires:GeoJSON.FeatureCollection<GeoJSON.Geometry>;
    defTerritoires: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>>>;
    nouvelleCartoDispo:boolean;
    editionEnCours:boolean;
    defEditionEnCours: React.Dispatch<SetStateAction<boolean>>
}

export interface TableTerritoireProps{
    territoires:GeoJSON.FeatureCollection<GeoJSON.Geometry>;
    defTerritoire:React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>>>;
    modalOuvert:boolean;
    defModalVersementOuvert:React.Dispatch<SetStateAction<boolean>>;
    nouvelleCartoDispo:boolean;
    defNouvelleCartoDispo:React.Dispatch<SetStateAction<boolean>>;
    secTerritoireNew: FeatureCollection<Geometry,territoireGeoJsonProperties>,
    defSecTerritoireNew:React.Dispatch<SetStateAction<FeatureCollection<Geometry,territoireGeoJsonProperties>>>,
    periodeSelect:number,
    defPeriodeSelect:React.Dispatch<SetStateAction<number>>;
    editionEnCours: boolean,
    defEditionEnCours: React.Dispatch<SetStateAction<boolean>>
}

export interface PropsVersTerritoires{
    modalOuvert:boolean,
    setModalOuvert:React.Dispatch<SetStateAction<boolean>>,
    secTerritoireNew: FeatureCollection<Geometry,territoireGeoJsonProperties>,
    setSecTerritoireNew:React.Dispatch<SetStateAction<FeatureCollection<Geometry,territoireGeoJsonProperties>>>,
    idPeriodeSelect:number,
    nouvelleCartoDispo:boolean,
    defNouvelleCartoDispo:React.Dispatch<SetStateAction<boolean>>
}

// ---------------------------------------------------------------------------
// ------------------------------ reglements ---------------------------------
// ---------------------------------------------------------------------------

export interface TableEnteteProps{
    entetes:entete_reglement_stationnement[],
    defEntetes:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
    charge:boolean,
    defCharge:React.Dispatch<SetStateAction<boolean>>
    regSelect:reglement_complet,
    defRegSelect:React.Dispatch<SetStateAction<reglement_complet>>
    creationEnCours:boolean
    defCreationEnCours:React.Dispatch<SetStateAction<boolean>>
    editionEnteteEnCours:boolean
    defEditionEnteteEnCours:React.Dispatch<SetStateAction<boolean>>
    editionCorpsEnCours:boolean
    defEditionCorpsEnCours:React.Dispatch<SetStateAction<boolean>>
    modalOuvert:boolean
    defModalOuvert:React.Dispatch<SetStateAction<boolean>>
    toutesEntetes:entete_reglement_stationnement[]
    defToutesEntetes:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
}

export interface TableVisModRegProps{
    charge:boolean,
    defCharge:React.Dispatch<SetStateAction<boolean>>
    regSelect:reglement_complet,
    defRegSelect:React.Dispatch<SetStateAction<reglement_complet>>
    creationEnCours:boolean
    defCreationEnCours:React.Dispatch<SetStateAction<boolean>>
    editionEnteteEnCours:boolean
    defEditionEnteteEnCours:React.Dispatch<SetStateAction<boolean>>
    editionCorpsEnCours:boolean
    defEditionCorpsEnCours:React.Dispatch<SetStateAction<boolean>>
    entetesRegStationnement:entete_reglement_stationnement[],
    defEntetesRegStationnement:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
}


export interface FiltreReglementProps{
    resultatReglements:entete_reglement_stationnement[]
    defResultatReglements:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
    tousReglements:entete_reglement_stationnement[]
    defTousReglement:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
    anneeDebutDefaut?:number
    anneeFinDefaut?:number
}
export interface ModalFiltrageReglementProps{
    modalOuvert:boolean,
    defModalOuvert:React.Dispatch<SetStateAction<boolean>>
    tousReglements:entete_reglement_stationnement[]
    defTousReglement:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
    reglementVisu:entete_reglement_stationnement[]
    defReglementVisu:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
}
//-----------------------------------------------------------------------------
// ----------------------------- Ensembles Reglements -------------------------
// ---------------------------------------------------------------------------- 

export interface TableEnteteEnsembleProps{
    entetesEnsembles:entete_ensemble_reglement_stationnement[],
    defEntetesEnsembles:React.Dispatch<SetStateAction<entete_ensembles_reglement_stationnement[]>>
    ensembleReglement: ensemble_reglements_stationnement,
    defEnsembleReglement: React.Dispatch<SetStateAction<ensemble_reglements_stationnement>>,
    entetesReglements:entete_reglement_stationnement[],
    defEntetesReglements: React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
    editionEnteteEnCours:boolean,
    defEditionEnteteEnCours:React.Dispatch<SetStateAction<boolean>>,
    editionCorpsEnCours:boolean,
    defEditionCorpsEnCours:React.Dispatch<SetStateAction<boolean>>,
    ancienEnsRegComplet:ensemble_reglements_stationnement,
    defAncienEnsRegComplet:React.Dispatch<SetStateAction<ensemble_reglements_stationnement>>
}

export interface TableVisModEnsRegProps{
    charge:boolean,
    defCharge:React.Dispatch<SetStateAction<boolean>>
    ensembleReglement: ensemble_reglements_stationnement,
    defEnsembleReglement: React.Dispatch<SetStateAction<ensemble_reglements_stationnement>>,
    entetesReglements:entete_reglement_stationnement[],
    defEntetesReglements: React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>,
    editionEnteteEnCours:boolean,
    defEditionEnteteEnCours: React.Dispatch<SetStateAction<boolean>>,
    editionCorpsEnCours:boolean,
    defEditionCorpsEnCours:React.Dispatch<SetStateAction<boolean>>,
    idAssociationEnEdition:number,
    defIdAssociationEnEdition:React.Dispatch<SetStateAction<number>>,
    entetesEnsRegListe: entete_ensemble_reglement_stationnement[],
    defEntetesEnsRegListe: React.Dispatch<SetStateAction<entete_ensemble_reglement_stationnement[]>>,
    ancienEnsRegComplet:ensemble_reglements_stationnement,
    defAncienEnsRegComplet:React.Dispatch<SetStateAction<ensemble_reglements_stationnement>>
    modalOuvert:boolean,
    defModalOuvert:React.Dispatch<SetStateAction<boolean>>
}
export interface creationAssocCubfErRegStat {
    ensembleReglement: ensemble_reglements_stationnement,
    defEnsembleReglement: React.Dispatch<SetStateAction<ensemble_reglements_stationnement>>,
    editionEnteteEnCours:boolean,
    defEditionEnteteEnCours: React.Dispatch<SetStateAction<boolean>>,
    editionCorpsEnCours:boolean,
    defEditionCorpsEnCours:React.Dispatch<SetStateAction<boolean>>,
    idAssociationEnEdition:number,
    defIdAssociationEnEdition:React.Dispatch<SetStateAction<number>>,
    ancienEnsRegComplet:ensemble_reglements_stationnement,
    defAncienEnsRegComplet:React.Dispatch<SetStateAction<ensemble_reglements_stationnement>>
    modalOuvert:boolean,
    defModalOuvert:React.Dispatch<SetStateAction<boolean>>
    tousReglements:entete_reglement_stationnement[]
    defTousReglement:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
    reglementVisu:entete_reglement_stationnement[]
    defReglementVisu:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
}

export interface VisResultatFiltre{
    reglementsPossible:entete_reglement_stationnement[],
    defReglementPossible:React.Dispatch<SetStateAction<entete_reglement_stationnement[]>>
    reglementAAssocier:entete_reglement_stationnement|null
    defReglementAssocier:React.Dispatch<SetStateAction<entete_reglement_stationnement|null>>
}
// ----------------------------------------------------------------------------
// -------------------- Ensembles Reglements - Territoires --------------------
// ---------------------------------------------------------------------------- 

export interface EnsRegTerrControlProps{
    periodesDispo:periode[],
    defPeriodesDispo:React.Dispatch<SetStateAction<periode[]>>,
    periodeSelect:periode,
    defPeriodeSelect:React.Dispatch<SetStateAction<periode>>,
    territoiresDispo: GeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>,
    defTerritoireDispo: React.Dispatch<SetStateAction<GeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>>>,
    territoireSelect: GeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>,
    defTerritoireSelect: React.Dispatch<SetStateActionGeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>>,
    ensRegDispo:entete_ensemble_reglement_stationnement[],
    defEnsRegDispo:React.Dispatch<SetStateAction<entete_ensemble_reglement_stationnement[]>>,
    anneesVisu:number[],
    defAnneesVisu:React.Dispatch<SetStateAction<number[]>>
}

export interface EnsRegTerrDispTable{
    ensRegDispo:entete_ensemble_reglement_stationnement[],
    defEnsRegDispo:React.Dispatch<SetStateAction<entete_ensemble_reglement_stationnement[]>>,
    periodeSelect:periode,
    defPeriodeSelect:React.Dispatch<SetStateAction<periode>>,
    territoireSelect:GeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>,
}

export interface CarteEnsRegTerrProps{
    territoireSelect: GeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>,
    defTerritoireSelect: React.Dispatch<SetStateActionGeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>>
    centre: LatLngExpression;
    defCentre: React.Dispatch<SetStateAction<LatLngExpression>>
    zoom: number,
    defZoom:React.Dispatch<SetStateAction<number>>
}

// ----------------------------------------------------------------------------
// -------------------- Graphiques Comparaison Règlements ---------------------
// ---------------------------------------------------------------------------- 

export interface GraphiqueProps{
    listeReglements:number[],
    defListeReglements:React.Dispatch<SetStateAction<number[]>>
}

// ----------------------------------------------------------------------------
// -------------------- Graphiques Comparaison Quartiers ---------------------
// ---------------------------------------------------------------------------- 

export interface MenuCompQuartiersProps{
    methodeAnalyse:number,
    defMethodeAnalyse:React.Dispatch<SetStateAction<number>>,
    methodesPossibles:TypesVisualisationAnalyseQuartier[],
    prioriteInventaire:number,
    defPrioriteInventaire:React.Dispatch<SetStateAction<number>>,
    prioriteInventairePossibles:PrioriteEstimeQuartier[],
    defCalculEnCours:React.Dispacth<SetStateAction<boolean>>
}

export interface AnalyseCartoQuartierProps{
    prioriteInventaire:number,
    prioriteInventairePossibles:PrioriteEstimeQuartier[],
    variablesPossibles: VariablesPossibles[]
}

export interface AnalysePAVQuartierProps{
    prioriteInventaire:number,
    prioriteInventairePossibles:PrioriteEstimeQuartier[]
}

export interface AnalyseHistoQuartierProps{
    prioriteInventaire:number,
    prioriteInventairePossibles:PrioriteEstimeQuartier[],
    variablesPossibles: VariablesPossibles[]
}

export interface AnalyseXYQuartierProps{
    prioriteInventaire:number,
    prioriteInventairePossibles:PrioriteEstimeQuartier[],
    variablesPossibles: VariablesPossibles[]
}

// ----------------------------------------------------------------------------
// -------------------- Graphiques Comparaison Règlements ---------------------
// ---------------------------------------------------------------------------- 

export interface GraphiqueReglementsProps{
    ensRegSelectionnesHaut:number[],
    index:number,
    colorPalette:string[]
}

export interface PropsModalManipGraphiqueReg{
    modalOuvert:boolean,
    defModalOuvert:React.Dispatch<SetStateAction<boolean>>,
    CUBFSelect:utilisation_sol,
    defCUBFSelect:React.Dispatch<SetStateAction<utilisation_sol>>
    ensRegAVis:number[]
    data:data_graphique,
    defData: React.Dispatch<SetStateAction<data_graphique>>
    defLabelAxeX:React.Dispatch<SetStateAction<string>>
    regDispo:informations_pour_graph_unite_er_reg[]
    defRegDispo: React.Dispatch<SetStateAction<informations_pour_graph_unite_er_reg[]>>
    EnsRegSelect:number[]
    defEnsRegSelect:React.Dispatch<SetStateAction<number[]>>
    nUnites: number,
    defNUnites: React.Dispatch<SetStateAction<number>>
    minGraph: number
    defMinGraph:React.Dispatch<SetStateAction<number>>
    maxGraph:number,
    defMaxGraph: React.Dispatch<SetStateAction<number>>
    pasGraph:number
    defPasGraph:React.Dispatch<SetStateAction<number>>
    uniteGraph:number
    defUniteGraph:React.Dispatch<SetStateAction<number>>
}
export interface ControlAnaRegProps{
    ensRegSelectionnesHaut:number[],
    defEnsRegSelectionnesHaut:React.Dispatch<SetStateAction<number[]>>
    nGraphiques:number,
    defNGraphiques:React.Dispatch<SetStateAction<number>>
    colorPalette:string[]
}
// ----------------------------------------------------------------------------
// -------------------- Graphiques Variabilité Règlements ---------------------
// ---------------------------------------------------------------------------- 

export interface ControlAnaVarProps{
    methodeAnalyse:methodeAnalyseVariabillite,
    defMethodeAnalyse:React.Dispatch<SetStateAction<methodeAnalyseVariabillite>>
    methodessAnalysesPossibles: methodeAnalyseVariabillite[],
    ensRegAAnalyser:number[],
    defEnsRegAAnalyser:React.Dispatch<SetStateAction<number[]>>
    colorPalette:string[]
    defCalculsEnCours:React.Dispatch<SetStateAction<boolean>>,
    voirInv:boolean,
    defVoirInv: React.Dispatch<SetStateAction<boolean>>,
    methodeVisualisationPossibles: methodeAnalyseVariabillite[],
    methodeVisualisation: methodeAnalyseVariabillite,
    defMethodeVisualisation: React.Dispatch<SetStateAction<methodeAnalyseVariabillite>>
}
export interface PropsEditionParametresAnaVarFonc{
    editionParams:boolean,
    defEditionParams:React.Dispatch<SetStateAction<boolean>>
    ensRegAAnalyser:number[],
    ensRegReference:number,
    defEnsRegReference:React.Dispatch<SetStateAction<number>>
    niveauCUBF:comptes_utilisations_sol
    defNiveauCUBF:React.Dispatch<SetStateAction<comptes_utilisations_sol>>,
    colorPalette:string[]
}

export interface PropsVisualisationAnaVarFonc{
    editionParams:boolean,
    defEditionParams:React.Dispatch<SetStateAction<boolean>>,
    ensRegAAnalyser:number[],
    ensRegReference: number,
    colorPalette:string[],
    voirInv:boolean,
    methodeVisualisation: methodeAnalyseVariabillite
}

export interface PropsGraphAnaVar{
    ensRegAGraph:number[],
    ensRegReference: number,
    index:number,
    colorPalette:string[],
    voirInv:boolean,
    methodeVisualisation: methodeAnalyseVariabillite
}

// ----------------------------------------------------------------------------
// -------------------- Validation Statistique Inventaire ---------------------
// ---------------------------------------------------------------------------- 

export interface ControlValStatProps{
    definitionStrate:boolean
    defDefinitionStrate: React.Dispatch<SetStateAction<boolean>>
    calculEnCours:boolean,
    defCalculEnCours:React.Dispatch<SetStateAction<boolean>>
    feuillesPossibles: FeuilleFinaleStrate[],
    defFeuillesPossibles: React.Dispatch<SetStateAction<FeuilleFinaleStrate[]>>,
    feuilleSelect:FeuilleFinaleStrate,
    defFeuilleSelect:React.Dispatch<SetStateAction<FeuilleFinaleStrate>>
    lots:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>
    defLots:React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>>>
}

export interface PropsArbreStrates{
    strates:Strate[],
    defStrates:React.Dispatch<SetStateAction<Strate[]>>
    strateAct:Strate
    defStrateAct:React.Dispatch<SetStateAction<Strate>>
    modif:boolean;
    defModif:React.Dispatch<SetStateAction<boolean>>,
    anciennesStrates:Strate[],
    defAnciennesStrates:React.Dispatch<SetStateAction<Strate[]>>,
    ancienneStrateAct:Strate,
    defAncienneStrateAct:React.Dispatch<SetStateAction<Strate>>,
    idParent:number|null,
    defIdParent:React.Dispatch<SetStateAction<number|null>>
}
export interface PropsModifStrate{
    strateAct:Strate,
    defStrateAct:React.Dispatch<SetStateAction<Strate>>,
    strates:Strate[],
    defStrates:React.Dispatch<SetStateAction<Strate[]>>,
    modif:boolean;
    defModif:React.Dispatch<SetStateAction<boolean>>,
    anciennesStrates:Strate[],
    defAnciennesStrates:React.Dispatch<SetStateAction<Strate[]>>,
    ancienneStrateAct:Strate,
    defAncienneStrateAct:React.Dispatch<SetStateAction<Strate>>,
    idParent:number|null,
    defIdParent:React.Dispatch<SetStateAction<number|null>>
}

export interface PropsInterfaceStrates{
    strates:Strate[],
    defStrates:React.Dispatch<SetStateAction<Strate[]>>,
    strateActuelle: Strate,
    defStrateActuelle: React.Dispatch<SetStateAction<Strate>>,
    anciennesStrates:Strate[],
    defAnciennesStrates:React.Dispatch<SetStateAction<Strate[]>>,
    ancienneStrateAct:Strate,
    defAncienneStrateAct:React.Dispatch<SetStateAction<Strate>>,
    idParent:number|null,
    defIdParent:React.Dispatch<SetStateAction<number|null>>
}

export interface PropsPanneauValid{
    feuilleStrate:FeuilleFinaleStrate,
    defFeuilleStrate:React.Dispatch<SetStateAction<FeuilleFinaleStrate>>
    lots:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>,
    defLots:React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>>>
    inventairePert:inventaire_stationnement[];
    defInventairePert:React.Dispatch<SetStateAction<inventaire_stationnement[]>>
    entreeValid:EntreeValidation
    defEntreeValid:React.Dispatch<SetStateAction<EntreeValidation>>
    feuilleSelect:FeuilleFinaleStrate
    centre:LatLngExpression
    defCentre: React.Dispatch<SetStateAction<LatLngExpression>>
    zoom:number,
    defZoom:React.Dispatch<SetStateAction<number>>
    lotSelect:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null
    defLotSelect:React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null>>
    adresse:string
    defAdresse:React.Dispatch<SetStateAction<string>>
    newValid:boolean,
    defNewValid:React.Dispatch<SetStateAction<boolean>>
}

export interface PropsListeLotsValid{
    lots:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>
    defLots:React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>>>
    inventairePert:inventaire_stationnement[];
    defInventairePert:React.Dispatch<SetStateAction<inventaire_stationnement[]>>
    entreeValid:EntreeValidation
    defEntreeValid:React.Dispatch<SetStateAction<EntreeValidation>>
    feuilleSelect:FeuilleFinaleStrate
    lotSelect:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null
    defLotSelect:React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null>>
    adresse:string
    defAdresse:React.Dispatch<SetStateAction<string>>
    newValid:boolean,
    defNewValid:React.Dispatch<SetStateAction<boolean>>
}
export interface PropsTableRevValid{
    inventairePert:inventaire_stationnement[];
    defInventairePert:React.Dispatch<SetStateAction<inventaire_stationnement[]>>
    entreeValid:EntreeValidation
    defEntreeValid:React.Dispatch<SetStateAction<EntreeValidation>>
    adresse:string
    defAdresse:React.Dispatch<SetStateAction<string>>
    newValid:boolean,
    defNewValid:React.Dispatch<SetStateAction<boolean>>
    lotSelect:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null
    defLotSelect:React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null>>
}

export interface PropsCartoValidation{
    lotSelect:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null
    defLotSelect:React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null>>;
    startPosition: LatLngExpression;
    setStartPosition:React.Dispatch<SetStateAction<LatLngExpression>>;
    startZoom: number;
    setStartZoom: React.Dispatch<SetStateAction<number>>;
}

export interface PropsModalRecomputeInventaire{
    lotPert:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null
    defLotPert:React.Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null>>
    inventairePert:inventaire_stationnement[]; // Peut-être changer ça pour simplement indiquer le lot plutôt que l'ensemble des données de stationnement. Rendrait le modal plus générique.
    defInventairePert:React.Dispatch<SetStateAction<inventaire_stationnement[]>>
    modalOuvert:boolean
    defModalOuvert:React.Dispatch<SetStateAction<boolean>>
    methodesCalculs:number[]
}