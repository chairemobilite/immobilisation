import { useState, useEffect } from "react";
import MapShell from "../../map/MapShell";
import CadastreLayer from "../../map/layers/CadastreLayer";
import { useCadastreViewport } from "../../map/hooks/useCadastreViewport";
import type { FeatureCollection, Geometry } from "geojson";
import type { lotCadastralGeoJsonProperties, recensementGeoJsonProperties } from "../../types/DataTypes";
import { useMap } from "react-leaflet";
import RecensementLayer from "../../map/layers/RecensementLayer";
import { useRecensementViewPort } from "../../map/hooks/useRecensementViewport";
import { Viewport } from "../../types/MapTypes";

const CarteVisionnementRecensement = (
    props:{
        annee:2016|2021,
        viewPortChange:((viewport: Viewport) => void),
        carteRecensement: FeatureCollection<Geometry,recensementGeoJsonProperties>|null,
        minZoom:number
    }
) => {
    
    
    return (
        <div className="map-container">
            <MapShell 
                onViewportChange={[props.viewPortChange]} 
                minZoom={props.minZoom}
            >
                {props.carteRecensement && 
                    <RecensementLayer data={props.carteRecensement} />
                }
                
            </MapShell>
        </div>
    );
};

export default CarteVisionnementRecensement;