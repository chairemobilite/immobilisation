import React, { RefObject } from 'react';
import { AnalyseCartoQuartierProps } from "../../types/InterfaceTypes";
import { GeoJSONPropsAnaQuartier, TypesAnalysesCartographiqueQuartier } from '../../types/AnalysisTypes';
import { useState,useEffect,useRef } from 'react';
import { serviceAnalyseInventaire } from '../../services/serviceAnalyseInventaire';
import { Feature, FeatureCollection,Geometry } from 'geojson';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L, { LeafletEvent,LatLngExpression } from 'leaflet';
import chroma from 'chroma-js';
import { utiliserContexte } from '../../contexte/ContexteImmobilisation';
import { Download } from '@mui/icons-material';
const AnalyseCartographiqueQuartiers:React.FC<AnalyseCartoQuartierProps>=(props:AnalyseCartoQuartierProps)=>{
    const [typeCarto,defTypeCarto] = useState<number>(-1);
    const [cartoAMontrer,defCartoAMontrer] = useState<FeatureCollection<Geometry,GeoJSONPropsAnaQuartier>>({
            type: "FeatureCollection",
            features: []
        });
    const [cartoValid,defCartoValide] = useState<boolean>(false);
    const [chargement,defChargement] = useState<boolean>(false);
    const[positionDepart,defPositionDepart] = useState<LatLngExpression>([46.85,-71]);
    const[zoomDepart,defZoomDepart] = useState<number>(10);


    const contexte = utiliserContexte();
    const optionCartoChoisie = contexte?.optionCartoChoisie ?? "";
    const changerCarto = contexte?.changerCarto ?? (() => {});
    const optionsCartos = contexte?.optionsCartos ?? [];
    const zoomCarto = optionsCartos.find((entree)=>entree.id===optionCartoChoisie)?.zoomMax??18
    const urlCarto = optionsCartos.find((entree)=>entree.id===optionCartoChoisie)?.URL??"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    const attributionCarto = optionsCartos.find((entree)=>entree.id===optionCartoChoisie)?.attribution??'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    const geoJsonLayerGroupRef = useRef<L.LayerGroup | null>(null); // Refe
    const prevInventaireRef = useRef<GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSONPropsAnaQuartier> | null>(null);
   
    const saveGeoJSON = ( filename = "data.geojson") => {
        const blob = new Blob([JSON.stringify(cartoAMontrer)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const gestSelectionCarto = async(idTypeAnalyse:number) =>{
        try{
            let CartoRep;
            defCartoValide(false)
            defChargement(true)
            if (idTypeAnalyse!==-1){
                CartoRep = await serviceAnalyseInventaire.obtientVariableAgregeParQuartierCarto(props.prioriteInventairePossibles.find((ordre)=> ordre.idPriorite=== props.prioriteInventaire)?.listeMethodesOrdonnees??[1,3,2],props.variablesPossibles.find((item)=>item.idVariable===idTypeAnalyse)?.queryKey??'stat-tot')
            } else{
                CartoRep = {success:false,data:{
                    type: "FeatureCollection",
                    features: []
                } as FeatureCollection<Geometry,GeoJSONPropsAnaQuartier>}
            }
            if (CartoRep && CartoRep.success){
                defCartoValide(true)
                defChargement(false)
                defCartoAMontrer(CartoRep.data)
                defTypeCarto(idTypeAnalyse)
            } else{
                defChargement(false)
                defCartoValide(false)
                defCartoAMontrer({
                    type: "FeatureCollection",
                    features: []
                })
                defTypeCarto(idTypeAnalyse)
            }
        }catch(err:any){
            alert('Erreur lors du chargement')
        }finally{
            defChargement(false)
        }
    }
    const renduCartographie = ()=>{
        if ((chargement)){
            return(<p>Chargement en cours - Chill le grand</p>)
        } else if(cartoValid && !chargement){
            return(<div className="carte-quartiers">
                <MapContainer
                  center={positionDepart}
                  zoom={zoomDepart}
                  style={{ height: '100%', width: '100%' }}
                  
                >
                  <TileLayer
                    url={urlCarto}
                    attribution={attributionCarto}
                    maxZoom={zoomCarto}
                    minZoom={1}
                  />
                  {cartoValid && (<>
                    <MapComponent 
                        geoJsonLayerGroupRef={geoJsonLayerGroupRef}
                        prevInventaireRef={prevInventaireRef}
                        cartoAMontrer={cartoAMontrer}
                    />
                  </>
                  )}
                </MapContainer>
              </div>
              );
        }
    }
 
    return(<>
        <div className="menu-selection-couleur">
            <label htmlFor="select-map-color">Type d'analyse cartographique</label>
            <select id="select-map-color" name="select-type" onChange={e => gestSelectionCarto(Number(e.target.value))} value={typeCarto}>
                <option value={-1}>Selection carto</option>
                {props.variablesPossibles.map(methode=>(
                    <option key={methode.idVariable} value={methode.idVariable} >
                        {methode.descriptionVariable}
                    </option>
                ))}
            </select>
            <Download onClick={() => saveGeoJSON()}/>
        </div>
        {renduCartographie()}
        </>
    )
}


 const MapComponent = (
    {
        geoJsonLayerGroupRef,
        cartoAMontrer,
        prevInventaireRef
    }:{
        geoJsonLayerGroupRef: RefObject<L.LayerGroup|null>
        cartoAMontrer:FeatureCollection<Geometry,GeoJSONPropsAnaQuartier>,
        prevInventaireRef:RefObject<GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSONPropsAnaQuartier> | null>
    }

 ) => {
        const map = useMap(); // Access the map instance

            useEffect(() => {
                if (map) {
                    if (geoJsonLayerGroupRef.current) {
                        geoJsonLayerGroupRef.current.clearLayers(); // Clear previous vector layers
                    }
                    
                    if (cartoAMontrer && cartoAMontrer.features.length > 0) {
                        // Create a new GeoJSON layer from props.geoJsondata
                        const lotsAMontrer = cartoAMontrer;
                        // Extract min/max dynamically from the dataset
                        const values = lotsAMontrer.features.map(f => f.properties.valeur);
                        const minValue = Math.min(...values);
                        const maxValue = Math.max(...values);

                        // Create a color scale from light yellow to dark red
                        const colorScale = chroma.scale(['#FFEDA0', '#E31A1C', '#800026']).domain([minValue, maxValue]);
                        
                        const geoJsonLayer = L.geoJSON(lotsAMontrer, {
                            style: (feature) => {
                                if (!feature || !feature.properties) {return {color: 'blue',
                                    weight: 2,
                                    fillColor: 'cyan',
                                    fillOpacity: 0.5,}; // Ensure feature exists
                                } else{
                                    return {
                                        color: 'blue',
                                        weight: 2,
                                        fillColor: colorScale(Number(feature.properties.valeur) || minValue).hex(),
                                        fillOpacity: 0.5,
                                    };
                                }
                            },
                            onEachFeature: (feature: any, layer: any) => {
                                if (feature.properties) {
                                    const value = feature.properties.valeur ?? 'No data';
                                    const description = feature.properties.description ?? 'No data'
                                    const name = feature.properties.nom_quartier ?? 'No data'
                                    layer.bindPopup(`<h3>${name}</h3><b>${description}</b> ${value}`);
                                }
                            }
                        });

                        //if (!geoJsonLayerGroupRef.current) {
                            geoJsonLayerGroupRef.current = L.layerGroup().addTo(map); // Create the layer group if it doesn't exist
                        //}

                        geoJsonLayer.addTo(geoJsonLayerGroupRef.current); // Add the new layer to the group
                        
                        // Create a legend based on the color scale
                        const legend = new L.Control({ position: 'bottomright' });

                        if ((map as any)._legendControl) {
                            map.removeControl((map as any)._legendControl);
                        }
                        legend.onAdd = function () {
                            const div = L.DomUtil.create('div', 'info legend');
                            const grades = [minValue, (maxValue + minValue) / 2, maxValue]; // Define breakpoints
                            const labels: string[] = [];

                            // Generate legend items based on color scale
                            grades.forEach((grade, index) => {
                                const color = colorScale(grade).hex();
                                labels.push(
                                    `<i style="background:${color}"></i> ${Math.round(grade)}`
                                );
                            });

                            div.innerHTML = labels.join('<br>');
                            return div;
                        };
                        // Store the legend control on the map instance to remove it next time
                        (map as any)._legendControl = legend;

                        // Add legend to the map
                        legend.addTo(map);

                        // Check if inventaire has changed before adjusting bounds
                        if (prevInventaireRef.current !== cartoAMontrer) {
                            const bounds = geoJsonLayer.getBounds();
                            if (bounds.isValid()) {
                                map.fitBounds(bounds);
                            }
                        }
                    prevInventaireRef.current = cartoAMontrer;
                }
                }
            }, [cartoAMontrer, map]); // Dependency on props.geoJsondata and map

            return null; // No need to render anything for the map component itself
    };

export default AnalyseCartographiqueQuartiers;
