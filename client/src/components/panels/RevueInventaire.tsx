import React, { useState, useEffect,useRef } from 'react';
import { TableRevueProps } from '../../types/InterfaceTypes';

const TableRevueInventaire: React.FC<TableRevueProps> =(props:TableRevueProps) =>{
    const panelRef = useRef<HTMLDivElement>(null);
    const [visibleTable, setTableVisible] = useState<number|null>(1);
    
    const handleMouseDown = (e: React.MouseEvent) => {
        const startX = e.clientX;
        const startWidth = panelRef.current ? panelRef.current.offsetWidth : 0;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth + (startX - e.clientX);
            if (panelRef.current) {
                panelRef.current.style.width = `${newWidth}px`;
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const clickTableCollapse = (tableNumber:number)=>{
        if (tableNumber != visibleTable){
            setTableVisible(tableNumber)
        }else{
            setTableVisible(-1)
        }
    }

    const gestSelectRole =(e: string) =>{
        props.defRoleRegard(e)
    }

    const gestSelectInventaire = (e:number)=>{
        if (props.defMethodeEstimeRegard){

        props.defMethodeEstimeRegard(e)
        }
    }

    const gestSelectRule = (e:number) =>{
        if (props.defRegRegard) props.defRegRegard(e)
    }

    const gestSelectRuleSet = (e:number) =>{
        if (props.defEnsRegRegard) props.defEnsRegRegard(e)
    }

    const gestModifInventaire  =() =>{

        if (!props.panneauModifVisible){
            if (props.defPanneauModifVisible)
            props.defPanneauModifVisible(true)
        }
    }

    return(
        <div className="panneau-detail-inventaire-lot" ref={panelRef}>
            <div className="resize-handle-right-panel" onMouseDown={handleMouseDown}></div>
            <h4 onClick={()=>clickTableCollapse(1)}className="table-lot-title">Cadastre</h4>
            { visibleTable===1 && (<div className="lot-data-table" >
                   
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Valeur</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Id Lot</td>
                                <td>{props.lots?.features[0]?.properties.g_no_lot}</td>
                            </tr>
                            <tr>
                                <td>Superficie</td>
                                <td>{props.lots?.features[0]?.properties.g_va_suprf}</td>
                            </tr>
                            <tr>
                                <td>Latitude</td>
                                <td>{props.lots?.features[0]?.properties.g_nb_coo_1}</td>
                            </tr>
                            <tr>
                                <td>Longitude</td>
                                <td>{props.lots?.features[0]?.properties.g_nb_coord}</td>
                            </tr>
                        </tbody>
                    </table>
                    </div>)
            }
            <h4 onClick={()=>clickTableCollapse(2)}className="table-lot-title">Role</h4>
            { visibleTable===2 && (<div className="lot-data-table" >
                <div className="table-inventaire-control">
                    <label htmlFor="select-role-inventaire">Sélection Role</label>
                    <select 
                        id="select-role" 
                        name="select-role" 
                        onChange={e => gestSelectRole(e.target.value)}
                        value={props.roleRegard}
                    >
                        <option value={""} key={""}>Selection Role</option>
                        {props.donneesRole?.features.map(role=>(
                            <option 
                                key={role.properties.id_provinc} 
                                value={role.properties.id_provinc} 
                            >
                                {role.properties?.id_provinc}
                            </option>
                        ))}
                    </select>
                </div>
                   <table>
                       <thead>
                           <tr>
                               <th>Description</th>
                               <th>Valeur</th>
                           </tr>
                       </thead>
                       <tbody>
                           <tr>
                               <td>Id Provinc</td>
                               <td>{props.donneesRole?.features.find(item => 
                                   item.properties.id_provinc===props.roleRegard
                               )?.properties?.id_provinc}</td>
                           </tr>
                           <tr>
                               <td>Util Pred (RL0105A)</td>
                               <td>{props.donneesRole?.features.find(item => 
                                   item.properties.id_provinc===props.roleRegard
                               )?.properties?.rl0105a}</td>
                           </tr>
                           <tr>
                               <td>Nb Étages (RL0306A)</td>
                               <td>{props.donneesRole?.features.find(item => 
                                   item.properties.id_provinc===props.roleRegard
                               )?.properties?.rl0306a}</td>
                           </tr>
                           <tr>
                               <td>Année Construction(RL0307A)</td>
                               <td>{props.donneesRole?.features.find(item => 
                                   item.properties.id_provinc===props.roleRegard
                               )?.properties?.rl0307a}</td>
                           </tr>
                           <tr>
                               <td>Metres Carres(RL0308A)</td>
                               <td>{props.donneesRole?.features.find(item => 
                                   item.properties.id_provinc===props.roleRegard
                               )?.properties?.rl0308a}</td>
                           </tr>
                           <tr>
                               <td>Nb logements(RL0311A)</td>
                               <td>{props.donneesRole?.features.find(item => 
                                   item.properties.id_provinc===props.roleRegard
                               )?.properties.rl0311a}</td>
                           </tr>
                           <tr>
                               <td>Nb chambres loc(RL0312A)</td>
                               <td>{props.donneesRole?.features.find(item => 
                                   item.properties.id_provinc===props.roleRegard
                               )?.properties?.rl0312a}</td>
                           </tr>
                           <tr>
                               <td>Valeur Immeuble(RL0404A)</td>
                               <td>{props.donneesRole?.features.find(item => 
                                   item.properties.id_provinc===props.roleRegard
                               )?.properties?.rl0404a?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
                           </tr>
                       </tbody>
                   </table>
                   </div>)
           }
           {props.inventaire?<>
            <h4 onClick={()=>clickTableCollapse(3)}className="table-lot-title">Inventaire</h4>
            { visibleTable===3 && (<div className="lot-data-table" >
                <div className="table-inventaire-control">
                    <label htmlFor="select-methode-inventaire">Sélection inventaire</label>
                    <select 
                        id="select-methode-inventaire" 
                        name="select-quartier" 
                        onChange={e => gestSelectInventaire(Number(e.target.value))}
                        value={props.methodeEstimeRegard}
                    >
                        <option 
                            value={-1}>
                            Selection inventaire
                            </option>
                        {props.inventaire.map(inventaire=>(
                            <option 
                                key={inventaire.methode_estime} value={inventaire.methode_estime} >
                                {inventaire.methode_estime}
                            </option>
                        ))
                        }
                    </select>
                    <button onClick={gestModifInventaire} disabled={props.panneauModifVisible}>Modifier Inventaire</button>
                </div>
                   <table>
                       <thead>
                           <tr>
                               <th>Description</th>
                               <th>Valeur</th>
                           </tr>
                       </thead>
                       <tbody>
                           <tr>
                               <td>No Lot</td>
                               <td>{props.inventaire.find(item => 
                                   item.methode_estime===props.methodeEstimeRegard
                               )?.g_no_lot}</td>
                           </tr>
                           <tr>
                               <td>N place min</td>
                               <td>{props.inventaire.find(item => 
                                   item.methode_estime===props.methodeEstimeRegard
                               )?.n_places_min}</td>
                           </tr>
                           <tr>
                               <td>N place max</td>
                               <td>{props.inventaire.find(item => 
                                   item.methode_estime===props.methodeEstimeRegard
                               )?.n_places_max}</td>
                           </tr>
                           <tr>
                               <td>N place comptees</td>
                               <td>{props.inventaire.find(item => 
                                   item.methode_estime===props.methodeEstimeRegard
                               )?.n_places_mesure}</td>
                           </tr>
                           <tr>
                               <td>N place estimee</td>
                               <td>{props.inventaire.find(item => 
                                   item.methode_estime===props.methodeEstimeRegard
                               )?.n_places_estime}</td>
                           </tr>
                           <tr>
                               <td>Commentaire</td>
                               <td>{props.inventaire.find(item => 
                                   item.methode_estime===props.methodeEstimeRegard
                               )?.commentaire}</td>
                           </tr>
                       </tbody>
                   </table>
                   </div>)}</>:<></>
            }
            {props.reglements?<>
            <h4 onClick={()=>clickTableCollapse(4)}className="table-lot-title">Reglements</h4>
            { visibleTable===4 && (<div className="lot-data-table" >
                <div className="table-inventaire-control">
                    <label htmlFor="select-role-inventaire">Sélection règlements</label>
                    <select 
                        id="select-rule" 
                        name="select-rule" 
                        onChange={e => gestSelectRule(Number(e.target.value))}
                        value={props.regRegard}
                    >
                        <option value={-1} key={-1}>Selection Reglement</option>
                        {props.reglements.map(reglement=>(
                            <option 
                                key={reglement.entete.id_reg_stat} 
                                value={reglement.entete.id_reg_stat} >
                                {reglement.entete.id_reg_stat}
                            </option>
                        ))
                        }
                    </select>
                </div>
                   <table>
                       <thead>
                           <tr>
                               <th>Description</th>
                               <th>Valeur</th>
                           </tr>
                       </thead>
                       <tbody>
                           <tr>
                               <td>ID Règ</td>
                               <td>{props.reglements.find(item => 
                                   item.entete.id_reg_stat===props.regRegard
                               )?.entete.id_reg_stat}</td>
                           </tr>
                           <tr>
                               <td>Description</td>
                               <td>{props.reglements.find(item => 
                                   item.entete.id_reg_stat===props.regRegard
                               )?.entete.description}</td>
                           </tr>
                           <tr>
                               <td>Annee Debut</td>
                               <td>{props.reglements.find(item => 
                                   item.entete.id_reg_stat===props.regRegard
                               )?.entete.annee_debut_reg}</td>
                           </tr>
                           <tr>
                               <td>Annee Fin</td>
                               <td>{props.reglements.find(item => 
                                   item.entete.id_reg_stat===props.regRegard
                               )?.entete.annee_fin_reg}</td>
                           </tr>
                           <tr>
                               <td>Ville</td>
                               <td>{props.reglements.find(item => 
                                   item.entete.id_reg_stat===props.regRegard
                               )?.entete.ville}</td>
                           </tr>
                           <tr>
                               <td>Texte Loi</td>
                               <td>{props.reglements.find(item => 
                                   item.entete.id_reg_stat===props.regRegard
                               )?.entete.texte_loi}</td>
                           </tr>
                           <tr>
                               <td>Art. Loi</td>
                               <td>{props.reglements.find(item => 
                                   item.entete.id_reg_stat===props.regRegard
                               )?.entete.article_loi}</td>
                           </tr>
                           <tr>
                               <td>Para. Loi</td>
                               <td>{props.reglements.find(item => 
                                   item.entete.id_reg_stat===props.regRegard
                               )?.entete.paragraphe_loi}</td>
                           </tr>
                       </tbody>
                   </table>
                   </div>)}
                   </>:<></>}
            {props.ensemblesReglements?<>
            <h4 onClick={()=>clickTableCollapse(5)}className="table-lot-title">Ensembles Reglements</h4>
            { visibleTable===5 && (<div className="lot-data-table" >
                <div className="table-inventaire-control">
                    <label htmlFor="select-role-inventaire">Sélection règlements</label>
                    <select id="select-ens-reg" name="select-ens-reg" onChange={e => gestSelectRuleSet(Number(e.target.value))}>
                        <option value={-1} key={-1}>Selection ens-reg</option>
                        {props.ensemblesReglements.map(ensReg=>(
                            <option key={ensReg.entete.id_er} value={ensReg.entete.id_er} >
                                {ensReg.entete.id_er}
                            </option>
                        ))
                        }
                    </select>
                </div>
                   <table>
                       <thead>
                           <tr>
                               <th>Description</th>
                               <th>Valeur</th>
                           </tr>
                       </thead>
                       <tbody>
                           <tr>
                               <td>ID Ens. Reg. </td>
                               <td>{props.ensemblesReglements.find(item => 
                                   item.entete.id_er===props.ensRegRegard
                               )?.entete.id_er}</td>
                           </tr>
                           <tr>
                               <td>description</td>
                               <td>{props.ensemblesReglements.find(item => 
                                   item.entete.id_er===props.ensRegRegard
                               )?.entete.description_er}</td>
                           </tr>
                           <tr>
                               <td>Annee Debut</td>
                               <td>{props.ensemblesReglements.find(item => 
                                   item.entete.id_er===props.ensRegRegard
                               )?.entete.date_debut_er}</td>
                           </tr>
                           <tr>
                               <td>Annee Fin</td>
                               <td>{props.ensemblesReglements.find(item => 
                                   item.entete.id_er===props.ensRegRegard
                               )?.entete.date_fin_er}</td>
                           </tr>
                       </tbody>
                   </table>
                   </div>)}</>:<></>}
        </div>
    )
}

export default TableRevueInventaire;