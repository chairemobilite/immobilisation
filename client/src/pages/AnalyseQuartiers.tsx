import React from 'react';
import MenuBar from '../components/menus/MenuBar';
import MenuCompQuartiers from '../components/menus/MenuCompQuartiers';
import { useState } from 'react';
import {  TypesVisualisationAnalyseQuartier,PrioriteEstimeInventaire, VariablesPossibles } from '../types/AnalysisTypes';
import './common.css';
import './analyseparquartiers.css'
import AnalyseCartographiqueQuartiers from '../components/panels/AnalyseCartographiqueQuartiers';
import AnalyseProfilAccumulationVehiculeQuartiers from '../components/panels/AnalyseProfilAccumulationVehicule';
import AnalyseHistogrammeQuartier from '../components/panels/AnalyseHistogrammeQuartier';
import AnalyseXYQuartiers from '../components/panels/AnalyseXYQuartiers';
import { ClimbingBoxLoader } from 'react-spinners';


const AnalyseQuartiers:React.FC = () =>{
    const [methodeComp, defMethodeComp] = useState<number>(-1);
    const [prioriteEstimes,defPrioriteEstimes] = useState<number>(0);
    const [agregEnCours,defAgregEnCours] = useState<boolean>(false);
    const methodesAnalyse: TypesVisualisationAnalyseQuartier[] = [
        {
            idAnalyse: 0,
            descriptionAnalyse: "Cartographie",
        },
        {
            idAnalyse: 1,
            descriptionAnalyse: "Histogramme",
        },
        {
            idAnalyse:2,
            descriptionAnalyse: "Profile d'accumulation véhicule"
        },
        {
            idAnalyse:3,
            descriptionAnalyse:"Graphique XY"
        }
    ];
    const variablesPossibles: VariablesPossibles[]= [
            {
                idVariable:0,
                descriptionVariable:'Stationnement Total',
                requiertOrdrePriorite:true,
                queryKey:'stat-tot'
            },
            {
                idVariable:1,
                descriptionVariable:'Densité de stationnement',
                requiertOrdrePriorite:true,
                queryKey:'stat-sup'
            },
            {
                idVariable:2,
                descriptionVariable:'Stationnement par personne 2021',
                requiertOrdrePriorite:true,
                queryKey:'stat-popu-2021'
            },
            {
                idVariable:3,
                descriptionVariable:'Stationnement par voiture résident',
                requiertOrdrePriorite:true,
                queryKey:'stat-voit'
            },
            {
                idVariable:4,
                descriptionVariable:'Pourcentage territoire dédié stationnement',
                requiertOrdrePriorite:true,
                queryKey:'stat-perc'
            },
            {
                idVariable:5,
                descriptionVariable:'Superficie Quartier',
                requiertOrdrePriorite:false,
                queryKey:'superf'
            },
            {
                idVariable:6,
                descriptionVariable:'Population 2021',
                requiertOrdrePriorite:false,
                queryKey:'popu-2021'
            },
            {
                idVariable:7,
                descriptionVariable:'Densité Population 2021',
                requiertOrdrePriorite:false,
                queryKey:'dens-pop-2021'
            },
            {
                idVariable:8,
                descriptionVariable:'Valeur moyenne des logements',
                requiertOrdrePriorite:false,
                queryKey:'val-log-moy'
            },
            {
                idVariable:9,
                descriptionVariable:'Superficie moyenne des logements',
                requiertOrdrePriorite:false,
                queryKey:'sup-log-moy'
            },
            {
                idVariable:10,
                descriptionVariable:'Valeur Foncière totale',
                requiertOrdrePriorite:false,
                queryKey:'val-tot-quart'
            },
            {
                idVariable:11,
                descriptionVariable:'Valeur Foncière par superficie',
                requiertOrdrePriorite:false,
                queryKey:'val-tot-sup'
            },
            {
                idVariable:12,
                descriptionVariable:'Nombre de voitures',
                requiertOrdrePriorite:false,
                queryKey:'nb-voit'
            },
            {
                idVariable:13,
                descriptionVariable:'Nombre de voitures par 1000 personnes 2021',
                requiertOrdrePriorite:false,
                queryKey:'voit-par-pers-2021'
            },
            {
                idVariable:14,
                descriptionVariable:'Delta Voitures Jour Nuit',
                requiertOrdrePriorite:false,
                queryKey:'nb-voit-delta'
            },
            {
                idVariable:15,
                descriptionVariable:'Nombre de voitures max',
                requiertOrdrePriorite:false,
                queryKey:'nb-voit-max'
            },
            {
                idVariable:16,
                descriptionVariable:'Nombre de voitures min',
                requiertOrdrePriorite:false,
                queryKey:'nb-voit-min'
            },
            {
                idVariable:17,
                descriptionVariable:'Stationnement par voiture max',
                requiertOrdrePriorite:true,
                queryKey:'stat-voit-max'
            },
            {
                idVariable:18,
                descriptionVariable:'Stationnement par permis',
                requiertOrdrePriorite:true,
                queryKey:'stat-perm'
            },
            {
                idVariable:19,
                descriptionVariable:'Nombre de permis',
                requiertOrdrePriorite:false,
                queryKey:'perm'
            },
            {
                idVariable:20,
                descriptionVariable:'Nombre de voitures par permis',
                requiertOrdrePriorite:false,
                queryKey:'voit-par-perm'
            },
            {
                idVariable:21,
                descriptionVariable:'Stationnement par personne 2016',
                requiertOrdrePriorite:true,
                queryKey:'stat-popu-2016'
            },
            {
                idVariable:22,
                descriptionVariable:'Nombre de voitures par 1000 personnes 2016',
                requiertOrdrePriorite:false,
                queryKey:'voit-par-pers-2016'
            },
            {
                idVariable:23,
                descriptionVariable:'Population 2016',
                requiertOrdrePriorite:false,
                queryKey:'popu-2016'
            },
            {
                idVariable:24,
                descriptionVariable:'Densité Population 2016',
                requiertOrdrePriorite:false,
                queryKey:'dens-pop-2016'
            },
            {
                idVariable:25,
                descriptionVariable:'Part Modale AC résidents[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-ac-res'
            },
            {
                idVariable:26,
                descriptionVariable:'Part Modale AP résidents[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-ap-res'
            },
            {
                idVariable:27,
                descriptionVariable:'Part Modale TC résidents[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-tc-res'
            },
            {
                idVariable:28,
                descriptionVariable:'Part Modale MV résidents[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-mv-res'
            },
            {
                idVariable:29,
                descriptionVariable:'Part Modale BS résidents[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-bs-res'
            },
            {
                idVariable:30,
                descriptionVariable:'Part Modale AC interne[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-ac-int'
            },
            {
                idVariable:31,
                descriptionVariable:'Part Modale AP interne[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-ap-int'
            },
            {
                idVariable:32,
                descriptionVariable:'Part Modale TC interne[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-tc-int'
            },
            {
                idVariable:33,
                descriptionVariable:'Part Modale MV interne[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-mv-int'
            },
            {
                idVariable:34,
                descriptionVariable:'Part Modale BS interne[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-bs-int'
            },
            {
                idVariable:35,
                descriptionVariable:'Part Modale AC à destination du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-ac-des'
            },
            {
                idVariable:36,
                descriptionVariable:'Part Modale AP à destination du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-ap-des'
            },
            {
                idVariable:37,
                descriptionVariable:'Part Modale TC à destination du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-tc-des'
            },
            {
                idVariable:38,
                descriptionVariable:'Part Modale MV à destination du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-mv-des'
            },
            {
                idVariable:39,
                descriptionVariable:'Part Modale BS à destination du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-bs-des'
            },
            {
                idVariable:40,
                descriptionVariable:'Part Modale AC originant du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-ac-ori'
            },
            {
                idVariable:41,
                descriptionVariable:'Part Modale AP originant du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-ap-ori'
            },
            {
                idVariable:42,
                descriptionVariable:'Part Modale TC originant du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-tc-ori'
            },
            {
                idVariable:43,
                descriptionVariable:'Part Modale MV originant du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-mv-ori'
            },
            {
                idVariable:44,
                descriptionVariable:'Part Modale BS originant du secteur[%]',
                requiertOrdrePriorite:false,
                queryKey:'pm-bs-ori'
            },
            {
                idVariable:45,
                descriptionVariable:'Valeur Foncière Résidentielle par superficie',
                requiertOrdrePriorite:false,
                queryKey:'val-tot-log-sup'
            },
            {
                idVariable:46,
                descriptionVariable:'Places inutilisées',
                requiertOrdrePriorite:true,
                queryKey:'stat-inu'
            },
            {
                idVariable:47,
                descriptionVariable:'Superf Places inutilisée',
                requiertOrdrePriorite:true,
                queryKey:'stat-inu-sup'
            },
            {
                idVariable:48,
                descriptionVariable:'Nombre de Logements',
                requiertOrdrePriorite:false,
                queryKey:'n-logements'
            },
            {
                idVariable:49,
                descriptionVariable:'Nombre de voitures résidents par stationnement résidentiel',
                requiertOrdrePriorite:true,
                queryKey:'stat-res-voit'
            },
            {
                idVariable:50,
                descriptionVariable:'Stationnement résidentiel',
                requiertOrdrePriorite:true,
                queryKey:'stat-res'
            },
            {
                idVariable:51,
                descriptionVariable:'Stationnement industriel',
                requiertOrdrePriorite:true,
                queryKey:'stat-ind'
            },
            {
                idVariable:52,
                descriptionVariable:'Stationnement infrastructure',
                requiertOrdrePriorite:true,
                queryKey:'stat-inf'
            },
            {
                idVariable:53,
                descriptionVariable:'Stationnement commercial',
                requiertOrdrePriorite:true,
                queryKey:'stat-com'
            },
            {
                idVariable:54,
                descriptionVariable:'Stationnement services',
                requiertOrdrePriorite:true,
                queryKey:'stat-ser'
            },
            {
                idVariable:55,
                descriptionVariable:'Stationnement Récréation',
                requiertOrdrePriorite:true,
                queryKey:'stat-rec'
            },
            {
                idVariable:56,
                descriptionVariable:'Stationnement agricole',
                requiertOrdrePriorite:true,
                queryKey:'stat-agr'
            },
            {
                idVariable:57,
                descriptionVariable:'Stationnement immeubles non-exploités',
                requiertOrdrePriorite:true,
                queryKey:'stat-inex'
            },
            {
                idVariable:58,
                descriptionVariable:'Stationnement résidentiel par voiture',
                requiertOrdrePriorite:true,
                queryKey:'stat-res-voit'
            },
            {
                idVariable:59,
                descriptionVariable:'Stationnement résidentiel par logement',
                requiertOrdrePriorite:true,
                queryKey:'stat-res-log'
            },
            {
                idVariable:60,
                descriptionVariable:'Stationnement résidentiel par permis',
                requiertOrdrePriorite:true,
                queryKey:'stat-res-perm'
            },
        ];
    const prioritesPossibles:PrioriteEstimeInventaire[]=[
        {
            idPriorite:0,
            descriptionPriorite:"Manuel -> Reg. Manuel -> Reg. Rôle",
            listeMethodesOrdonnees:[1,3,2]
        },
        {
            idPriorite:1,
            descriptionPriorite:"Manuel -> Reg. Rôle -> Reg. Manuel",
            listeMethodesOrdonnees:[1,2,3]
        },
        {
            idPriorite:2,
            descriptionPriorite:"Reg. Rôle -> Manuel -> Reg. Manuel",
            listeMethodesOrdonnees:[2,1,3]
        },
        {
            idPriorite:3,
            descriptionPriorite:"Reg. Rôle -> Reg. Manuel -> Manuel",
            listeMethodesOrdonnees:[2,3,1]
        },
        {
            idPriorite:4,
            descriptionPriorite:"Reg. Manuel -> Reg. Rôle -> Manuel",
            listeMethodesOrdonnees:[3,2,1]
        },
        {
            idPriorite:5,
            descriptionPriorite:"Reg. Manuel -> Manuel -> Reg. Rôle",
            listeMethodesOrdonnees:[3,1,2]
        },
        {
            idPriorite:6,
            descriptionPriorite:"Manuel",
            listeMethodesOrdonnees:[1]
        },
        {
            idPriorite:7,
            descriptionPriorite:"Reg. Rôle",
            listeMethodesOrdonnees:[2]
        },
        {
            idPriorite:8,
            descriptionPriorite:"Reg. Manuel",
            listeMethodesOrdonnees:[3]
        },
    ];

    const renduComposanteAnalyse = () => {
        switch (methodeComp) {
            case 0:
                return (<div className="conteneur-resultat-comp-quartier">
                            <AnalyseCartographiqueQuartiers 
                                prioriteInventaire={prioriteEstimes}
                                prioriteInventairePossibles={prioritesPossibles}
                                variablesPossibles={variablesPossibles}
                            />
                        </div>);
            case 1:
                return (<div className="conteneur-resultat-comp-quartier-histo">
                            <AnalyseHistogrammeQuartier
                                prioriteInventaire={prioriteEstimes}
                                prioriteInventairePossibles={prioritesPossibles}
                                variablesPossibles={variablesPossibles}
                            />
                        </div>);
            case 2:
                return (<div className="conteneur-resultat-comp-quartier-PAV">
                            <AnalyseProfilAccumulationVehiculeQuartiers
                                prioriteInventaire={prioriteEstimes}
                                prioriteInventairePossibles={prioritesPossibles}
                            />
                        </div>);
            case 3:
                return (<div className='conteneur-resultat-comp-quartier-XY'>
                            <AnalyseXYQuartiers
                                prioriteInventaire={prioriteEstimes}
                                prioriteInventairePossibles={prioritesPossibles}
                                variablesPossibles={variablesPossibles}
                            />
                        </div>)
            default:
                return <div>Veuillez sélectionner une méthode d'analyse</div>;
        }
    };
    const renduNormal=()=>{
        return(
            <>
            <MenuCompQuartiers
                methodeAnalyse={methodeComp}
                defMethodeAnalyse={defMethodeComp}
                methodesPossibles={methodesAnalyse}
                prioriteInventaire={prioriteEstimes}
                defPrioriteInventaire={defPrioriteEstimes}
                prioriteInventairePossibles={prioritesPossibles}
                defCalculEnCours={defAgregEnCours}
            />
            {renduComposanteAnalyse()}
            </>
        )
    };

    return(
        <div className="page-comp-quart">
            <MenuBar/>
            {agregEnCours?<ClimbingBoxLoader loading={agregEnCours} size={50}/>:renduNormal()}
        </div>
    )
}
export default AnalyseQuartiers;