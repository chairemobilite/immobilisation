import React,{useRef,useEffect} from 'react';
import { CarteEnsRegTerrProps } from '../../types/InterfaceTypes';
import { MapContainer, TileLayer,GeoJSON,useMap } from 'react-leaflet';
import L from 'leaflet';
import { utiliserContexte } from '../../contexte/ContexteImmobilisation';
import { escapeHTMLChars } from '../../utils/escapeHTMLChars';

const CarteEnsRegTerr:React.FC<CarteEnsRegTerrProps>=(props:CarteEnsRegTerrProps)=>{

    const contexte = utiliserContexte();
    const optionCartoChoisie = contexte?.optionCartoChoisie ?? "";
    const changerCarto = contexte?.changerCarto ?? (() => {});
    const optionsCartos = contexte?.optionsCartos ?? [];

    const urlCarto = optionsCartos.find((entree)=>entree.id===optionCartoChoisie)?.URL??"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    const attributionCarto = optionsCartos.find((entree)=>entree.id===optionCartoChoisie)?.attribution??'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    const zoomCarto = optionsCartos.find((entree)=>entree.id===optionCartoChoisie)?.zoomMax??18
    const geoJsonLayerGroupRef = useRef<L.LayerGroup | null>(null); // Refe
 
    
    return(
        <div className="div-carte-ens-reg-terr">
        <MapContainer
            center={props.centre}
            zoom={props.zoom}
            style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url={urlCarto}
                attribution={attributionCarto}
                maxZoom={zoomCarto}
                minZoom={1}
                
            />
            <MapComponent
              territoireSelect={props.territoireSelect}
              geoJsonLayerGroupRef={geoJsonLayerGroupRef}
            />
        </MapContainer>
        </div>
    )

}

function MapComponent({ 
  territoireSelect, 
  geoJsonLayerGroupRef 
}: { 
  territoireSelect: CarteEnsRegTerrProps['territoireSelect']; 
  geoJsonLayerGroupRef: React.RefObject<L.LayerGroup | null> 
}){
            const map = useMap(); // Access the map instance
        
            useEffect(() => {
              if (map) {
                if (geoJsonLayerGroupRef.current) {
                  geoJsonLayerGroupRef.current.clearLayers(); // Clear previous vector layers
                }
        
                if (territoireSelect && territoireSelect.features && territoireSelect.features.length > 0) {
                  // Create a new GeoJSON layer from props.geoJsondata
                  const geoJsonLayer = L.geoJSON(territoireSelect, {
                    style: {
                      color: 'blue', // Border color
                      weight: 2,     // Border thickness
                      fillColor: 'cyan', // Fill color
                      fillOpacity: 0.5,  // Fill transparency
                    },
                    onEachFeature: (feature: any, layer: any) => {
                        if (feature.properties) {
                          const { id_periode_geo, secteur, ville } = feature.properties; // Destructure properties
                          const formattedPopupContent = `
                            <strong>Feature ID:</strong> ${escapeHTMLChars(id_periode_geo)} <br/>
                            <strong>Name:</strong> ${escapeHTMLChars(ville)} <br/>
                            <strong>Secteur:</strong> ${escapeHTMLChars(secteur)} <br/>
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
            }, [territoireSelect, map]); // Dependency on props.geoJsondata and map
        
            return null; // No need to render anything for the map component itself
          };

export default CarteEnsRegTerr;