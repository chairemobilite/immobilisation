import { Button } from '@mui/material'
import {FC} from 'react'
import { serviceAssocCadRole } from '../../services/serviceAssociationCadRole'

const MenuAssociationCadastreRole:FC =()=>{
    const gereCreationAuto =async()=>{
        try {
            const resultat = await serviceAssocCadRole.creeAssocAutomatique()
            if (resultat.success){
                alert(`Inséré ${resultat.insert_rows} associations`)
            }else{
                alert(`Erreur d'insertion automatique`)
            }
        } catch {
            alert(`Erreur d'insertion automatique`)
        }
    }
    return(
        <div className="menu-manip-assoc-cadastre-role">
            <Button variant="outlined" sx={{backgroundColor:'red'}} onClick={gereCreationAuto}>
                Générer association spatiale automatique
            </Button>
        </div>
    )
}

export default MenuAssociationCadastreRole