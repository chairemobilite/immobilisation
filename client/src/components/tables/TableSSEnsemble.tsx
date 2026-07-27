import React,{useState,useRef} from 'react';
import { entete_reglement_stationnement } from '../../types/DataTypes';
import { TableEnteteProps } from '../../types/InterfaceTypes';

const TableSSEnsemble:React.FC<TableEnteteProps> =(props) => {
    return (
        <table className="table-modif-reglements-entete">
            <thead>
                <tr>
                    <th>ID reglement</th>
                    <th>Description Reglement</th>
                    <th>Année Début Reglement</th>
                    <th>Année Fin Reglement</th>
                    <th>Année Fin Reglement</th>
                    <th>Texte Loi</th>
                    <th>Article Loi</th>
                    <th>Paragraphe Loi</th>
                    <th>Ville</th>
                </tr>
            </thead>
            <tbody>
                {props.entetes.map((entete) => (
                    <tr key={entete.id_reg_stat}>
                        <td>{entete.id_reg_stat}</td>
                        <td>{entete.description}</td>
                        <td>{entete.annee_debut_reg}</td>
                        <td>{entete.annee_fin_reg}</td>
                        <td>{entete.texte_loi}</td>
                        <td>{entete.article_loi}</td>
                        <td>{entete.paragraphe_loi}</td>
                        <td>{entete.ville}</td>
                    </tr>
                    
                ))}
            </tbody>
        </table>
    );
};


export default TableSSEnsemble;