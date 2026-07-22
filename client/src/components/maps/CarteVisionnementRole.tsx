import { useState, useEffect } from "react";
import MapShell from "../../map/MapShell";
import type { FeatureCollection, Geometry } from "geojson";
import type { roleFoncierGeoJsonProps } from "../../types/DataTypes";
import RoleLayer from "../../map/layers/RoleLayer";
import { useRoleViewport } from "../../map/hooks/useRoleViewport";

const CarteVisionnementRole = () => {
    const [data, setData] = useState<FeatureCollection<Geometry, roleFoncierGeoJsonProps> | null>(null);

    // Returns a debounced, zoom-gated handler
    const handleViewportChange = useRoleViewport(setData);
    
    return (
        <div className="map-container">
            <MapShell 
                onViewportChange={[handleViewportChange]} 
            >
                {data && 
                    <RoleLayer data={data} />
                }
                
            </MapShell>
        </div>
    );
};

export default CarteVisionnementRole;