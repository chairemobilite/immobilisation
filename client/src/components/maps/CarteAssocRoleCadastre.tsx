import { useState, useEffect } from "react";
import MapShell from "../../map/MapShell";
import CadastreLayer from "../../map/layers/CadastreLayer";
import { useCadastreViewport } from "../../map/hooks/useCadastreViewport";
import type { FeatureCollection, Geometry } from "geojson";
import type { lotCadastralGeoJsonProperties, roleFoncierGeoJsonProps } from "../../types/DataTypes";
import { useMap } from "react-leaflet";
import { useRoleViewport } from "../../map/hooks/useRoleViewport";

import { MapPanes } from "../../map/utils/MapPanes";

import RoleLayer from "../../map/layers/RoleLayer";
import { LayersControl } from "react-leaflet";
import { LatLng } from "leaflet";
import { PropsCarteAssoc } from "../../types/InterfaceTypes";

const CarteAssocRoleCadastre = (props:PropsCarteAssoc) => {
    const [cadastre, defCadastre] = useState<FeatureCollection<Geometry, lotCadastralGeoJsonProperties> | null>(null);
    const [role,defRole] = useState<FeatureCollection<Geometry, roleFoncierGeoJsonProps> | null>(null);
    const { Overlay } = LayersControl;
    // Returns a debounced, zoom-gated handler
    const handleViewportChange = useCadastreViewport(defCadastre,cadastre,props.defLotSelect);
    const handleRoleViewportChange = useRoleViewport(defRole,role,props.defRoleSelect,props.defRoleRegard)
    return (
            <MapShell 
                onViewportChange={[handleViewportChange,handleRoleViewportChange]} 
            >
                {cadastre && role && <>
                    <MapPanes/>
                    <LayersControl>
                        <Overlay name={"Role"} checked>
                            <RoleLayer 
                                data={role}
                                lotSelect={props.lotSelect}
                                defLotSelect={props.defLotSelect}
                                roleSelect={props.roleSelect}
                                defRoleSelect={props.defRoleSelect}
                                defRoleRegard={props.defRoleRegard}
                                roleRegard={props.roleRegard}
                            />
                        </Overlay>
                        <Overlay name={"Cadastre"} checked>
                            <CadastreLayer 
                                data={cadastre} 
                                lotSelect={props.lotSelect}
                                defLotSelect={props.defLotSelect}
                                roleSelect={props.roleSelect}
                                defRoleSelect={props.defRoleSelect}
                                defRoleRegard={props.defRoleRegard}
                            />
                        </Overlay>
                    </LayersControl>
                    
                    </>
                }
                
            </MapShell>
    );
};

export default CarteAssocRoleCadastre;