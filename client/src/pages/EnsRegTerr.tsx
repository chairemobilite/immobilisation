import React,{useState,useEffect,useRef} from 'react';
import MenuBar from '../components/menus/MenuBar';
import EnsRegTerrGantt from '../components/gantt/EnsRegTerrGantt';
import './ensregterr.css'
import './common.css'
import { association_territoire_entete_ensemble_reglement, entete_ensembles_reglement_stationnement, periode, territoireGeoJsonProperties } from '../types/DataTypes';
import GeoJSON,{FeatureCollection,Geometry} from 'geojson';
import ControlEnsRegTerr from '../components/menus/ControlEnsRegTerr';
import { serviceHistorique } from '../services';
import CarteEnsRegTerr from '../components/maps/carteEnsRegTerr';
import { LatLngExpression } from 'leaflet';

const EnsRegTerritoire: React.FC =()=>{
    const [periodesDispo,defPeriodesDispo] = useState<periode[]>([]);
    const [periodeSelect,defPeriodeSelect] = useState<periode>(
        {
            id_periode:-1,
            nom_periode:'NA',
            date_debut_periode:NaN,
            date_fin_periode:NaN
        }
    );
    const [territoireDispo,defTerritoireDispo] = useState<GeoJSON.FeatureCollection<GeoJSON.Geometry,territoireGeoJsonProperties>>({
        type:"FeatureCollection",
        features:[]
    });
    const [territoireSelect,defTerritoireSelect] = useState<FeatureCollection<Geometry,territoireGeoJsonProperties>>(
        {
            type:'FeatureCollection',
            features:[]
        }
    )
    const [ensRegDispo,defEnsRegDispo] = useState<association_territoire_entete_ensemble_reglement[]>([]);
    const [annees,defAnnees] = useState<number[]>([]);
    const [centre,defCentre] = useState<LatLngExpression>([46.85,-71]);
    const [zoom,defZoom] = useState<number>(10);
    
    useEffect(() => {
        const fetchData = async () => {
            const periode = await serviceHistorique.obtientTous();
            defPeriodesDispo(periode.data);
        };
        fetchData();
    }, []);
    
    return(
        <div className="page-ens-reg-terr">
            <MenuBar/>
            <div className="control-visu-ens-reg">
                <ControlEnsRegTerr
                    ensRegDispo={ensRegDispo}
                    defEnsRegDispo={defEnsRegDispo}
                    territoireSelect={territoireSelect}
                    defTerritoireSelect={defTerritoireSelect}
                    periodeSelect={periodeSelect}
                    defPeriodeSelect={defPeriodeSelect}
                    periodesDispo={periodesDispo}
                    defPeriodesDispo={defPeriodesDispo}
                    territoiresDispo={territoireDispo}
                    defTerritoireDispo={defTerritoireDispo}
                    defAnneesVisu={defAnnees}
                    anneesVisu={annees}
                />
            </div>
            <div className="carte-et-tableau-ens-reg-terr">
                
                <EnsRegTerrGantt
                    ensRegDispo={ensRegDispo}
                    defEnsRegDispo={defEnsRegDispo}
                    periodeSelect={periodeSelect}
                    defPeriodeSelect={defPeriodeSelect}
                    territoireSelect={territoireSelect}
                />
                <CarteEnsRegTerr
                    territoireSelect={territoireSelect}
                    defTerritoireSelect={defTerritoireSelect}
                    centre={centre}
                    defCentre={defCentre}
                    zoom={zoom}
                    defZoom={defZoom}/>
                    
            </div>
        </div>
    )
}

export default EnsRegTerritoire;