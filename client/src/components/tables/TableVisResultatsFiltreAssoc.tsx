import React from 'react';
import { VisResultatFiltre } from '../../types/InterfaceTypes';
import InsertLinkIcon from '@mui/icons-material/InsertLink'
const TableVisResultatsFiltreAssoc:React.FC<VisResultatFiltre>=(props)=>{

    return(
        <div>
            <table className="table-reg-possibles">
                <thead>
                    <th>Desc.</th>
                    <th>Debut</th>
                    <th>Fin</th>
                    <th>Ville</th>
                    <th></th>
                </thead>
                <tbody>
                    {props.reglementsPossible.map((entete) => {
                        return (
                            <tr>
                                <td>{entete.description}</td>
                                <td>{entete.annee_debut_reg}</td>
                                <td>{entete.annee_fin_reg}</td>
                                <td>{entete.ville}</td>
                                <td><InsertLinkIcon style={{ verticalAlign: 'middle', marginLeft: 8 }} onClick={()=>props.defReglementAssocier(entete)}/></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default TableVisResultatsFiltreAssoc;