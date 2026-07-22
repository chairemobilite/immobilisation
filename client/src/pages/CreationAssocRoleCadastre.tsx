import{Dispatch, FC, SetStateAction, useState} from 'react'
import MenuBar from '../components/menus/MenuBar'
import './creationAssocRoleCadastre.css';
import './common.css'
import CarteAssocRoleCadastre from '../components/maps/CarteAssocRoleCadastre';
import MenuAssociationCadastreRole from '../components/menus/MenuAssociationCadastreRole';
import TableRevueInventaire from '../components/panels/RevueInventaire';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { lotCadastralAvecBoolInvGeoJsonProperties, lotCadastralGeoJsonProperties, roleFoncierGeoJsonProps } from '../types/DataTypes';

const CreationAssocRoleCadastre:FC =()=>{

    const [cadastreSelect, defCadastreSelect] = useState<FeatureCollection<Geometry, lotCadastralGeoJsonProperties> | null>(null);
    const [roleSelect,defRoleSelect] = useState<FeatureCollection<Geometry, roleFoncierGeoJsonProps> | null>(null);
    const [roleRegard,defRoleRegard] = useState<string>('')
    return(
        <div className="page-assoc-cadastre-role">
            <MenuBar/>
            <MenuAssociationCadastreRole/>
            <div className='panneau-principal'>
                <div className='map-container-assoc'>
                <CarteAssocRoleCadastre
                    lotSelect={cadastreSelect}
                    defLotSelect={defCadastreSelect}
                    roleSelect={roleSelect}
                    defRoleSelect={defRoleSelect}
                    defRoleRegard={defRoleRegard}
                    roleRegard={roleRegard}
                />   
                </div>
                <div className='barre-details-inventaire'>
                <TableRevueInventaire
                    lots={cadastreSelect as FeatureCollection<Geometry, lotCadastralAvecBoolInvGeoJsonProperties>|null}
                    defLots={defCadastreSelect as Dispatch<SetStateAction<FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties>|null>>}
                    donneesRole={roleSelect}
                    defDonneesRole={defRoleSelect}
                    roleRegard={roleRegard}
                    defRoleRegard={defRoleRegard}
                />
                </div>
            </div>
        </div>
    )
}

export default CreationAssocRoleCadastre;