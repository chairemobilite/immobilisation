import { Dispatch, SetStateAction, useState } from "react";
import MapShell from "../../map/MapShell";
import { useCadastreViewport } from "../../map/hooks/useCadastreViewport";
import type { FeatureCollection, Geometry } from "geojson";
import type { lotCadastralGeoJsonProperties, ODFeatureCollection, } from "../../types/DataTypes";
import ODLayer from "../../map/layers/ODLayer";
import { useEnqueteODViewPort } from "../../map/hooks/useEnqueteODViewport";
import {ODGeomTypes} from'../../types/EnumTypes';
import { LatLngBounds } from "leaflet";

const CarteVerseEnqueteOD = (
    {
        vue,
        limites,
        defLimites,
        mode,
        motif,
        heure
    }:{
        vue:ODGeomTypes,
        limites: LatLngBounds|null,
        defLimites:Dispatch<SetStateAction<LatLngBounds|null>>,
        mode?:number[]|null,
        motif?:number[]|null,
        heure?:number[]|null
    }
) => {
    const [data, setData] = useState<ODFeatureCollection>(null);

    // Returns a debounced, zoom-gated handler
    const handleViewportChange = useEnqueteODViewPort(setData,vue,16,defLimites,mode,motif,heure);
    
    return (
        <div className="map-container">
            <MapShell 
                onViewportChange={[handleViewportChange]} 
            >
                {data && 
                    <ODLayer 
                        data={data} 
                        vue={vue}
                    />
                }
            </MapShell>
        </div>
    );
};

export default CarteVerseEnqueteOD;