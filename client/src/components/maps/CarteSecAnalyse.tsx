import React, { useEffect, useState,useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON ,useMap} from 'react-leaflet';
import { CarteSecAnalyseProps } from '../../types/InterfaceTypes';
import { territoire } from '../../types/DataTypes';
import { FeatureCollection,Geometry } from 'geojson';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { utiliserContexte } from '../../contexte/ContexteImmobilisation';

const CarteSecAnalyse: React.FC<CarteSecAnalyseProps> = (props:CarteSecAnalyseProps) => {
    
    const contexte = utiliserContexte();
    const optionCartoChoisie = contexte?.optionCartoChoisie ?? "";
    const changerCarto = contexte?.changerCarto ?? (() => {});
    const optionsCartos = contexte?.optionsCartos ?? [];

    const urlCarto = optionsCartos.find((entree)=>entree.id===optionCartoChoisie)?.URL??"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    const attributionCarto = optionsCartos.find((entree)=>entree.id===optionCartoChoisie)?.attribution??'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    const zoomCarto = optionsCartos.find((entree)=>entree.id===optionCartoChoisie)?.zoomMax??18
    console.log('Map received  zone data:', JSON.stringify(props.territoires, null, 0));
    const geoJsonLayerGroupRef = useRef<L.LayerGroup | null>(null); // Refe
  
 

    
    return (<>
        <MapContainer
            center={props.startPosition}
            zoom={props.startZoom}
            style={{ height: '100%', width: '100%' }}
            minZoom={1}
            maxZoom={zoomCarto}
        >
            <TileLayer
                url={urlCarto}
                attribution={attributionCarto}
                maxZoom={zoomCarto}
                minZoom={1}
            />
            {props.territoires && (<>
                <MapComponent
                    territoires={props.territoires}
                    geoJsonLayerGroupRef={geoJsonLayerGroupRef}
                />
                </>
            )}
        </MapContainer>
        </>
    );
};

function MapComponent(
    {
        geoJsonLayerGroupRef,
        territoires
    }: {

        territoires: CarteSecAnalyseProps['territoires'],
        geoJsonLayerGroupRef: React.RefObject<L.LayerGroup | null>
    }
) {
    const map = useMap(); // Access the map instance

    useEffect(() => {
        if (map) {
            if (geoJsonLayerGroupRef.current) {
                geoJsonLayerGroupRef.current.clearLayers(); // Clear previous vector layers
            }

            if (territoires && territoires.features.length > 0) {
                // Create a new GeoJSON layer from props.geoJsondata
                const geoJsonLayer = L.geoJSON(territoires, {
                    style: {
                        color: 'blue', // Border color
                        weight: 2,     // Border thickness
                        fillColor: 'cyan', // Fill color
                        fillOpacity: 0.5,  // Fill transparency
                    },
                    onEachFeature: (feature: any, layer: any) => {
                        if (feature.properties) {
                            const { id_quartier, nom_quartier, superf_quartier, acro } = feature.properties; // Destructure properties
                            const escape = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ 
                                                            '&': '&amp;',
                                                            '<': '&lt;',
                                                            '>': '&gt;',
                                                            '"': '&quot;',
                                                            "'": '&#39;' 
                                                          }[c] as string));
                            const formattedPopupContent = `
                        <strong>Feature ID:</strong> ${escape(id_quartier)} <br/>
                        <strong>Name:</strong> ${escape(nom_quartier)} <br/>
                        <strong>Superficie:</strong> ${escape(superf_quartier)}  m2<br/>
                        <strong>Acronyme:</strong> ${escape(acro) ?? ''}<br/>
                      `;
                            layer.bindPopup(formattedPopupContent);
                        }
                    }
                });

                if (!geoJsonLayerGroupRef.current) {
                    geoJsonLayerGroupRef.current = L.layerGroup().addTo(map); // Create the layer group if it doesn't exist
                }

                geoJsonLayer.addTo(geoJsonLayerGroupRef.current); // Add the new layer to the group

                // Optionally, adjust the map bounds to fit the new GeoJSON data
                const bounds = geoJsonLayer.getBounds();
                map.fitBounds(bounds);
            }
        }
    }, [territoires, map]); // Dependency on props.geoJsondata and map

    return null; // No need to render anything for the map component itself
};

export default CarteSecAnalyse;