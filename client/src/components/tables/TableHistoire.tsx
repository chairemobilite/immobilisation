import React, { useState, useEffect,useRef } from 'react';
import { periode } from '../../types/DataTypes';
import { serviceHistorique } from '../../services';
import { TableHistoireProps } from '../../types/InterfaceTypes';
import { serviceTerritoires } from '../../services';
import { Add, Check, Edit } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { ReponsePeriode } from '../../types/serviceTypes';
const TableHistoire: React.FC<TableHistoireProps> = (props:TableHistoireProps) => {
    const [etat_periodes, defPeriodes] = useState<periode[]>([]);
    const [charge, defCharg] = useState<boolean>(true);
    const [edit, defEdit] = useState<boolean>(false);
    const [etat_anciennes_periodes, defAnciennesPeriodes] = useState<periode[]>([]);
    const panelRefGauche = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const ResPeriodes = await serviceHistorique.obtientTous();
                console.log('Recu les périodes', ResPeriodes);
                defPeriodes(ResPeriodes.data);
                defAnciennesPeriodes([])
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                defCharg(false);
            }
        };

        fetchData();
    }, []); // Empty dependency array means this runs once when the component mounts

    if (charge) {
        return <div>Chargement...</div>; // You can show a loading state while waiting for the data
    }    

    const gestChangement = (id_periode: number, column:string, value: string|null) => {
        const newPeriodes = etat_periodes.map((periode) => {
            if (periode.id_periode === id_periode) {
                if (column!=='nom_periode' && value!==null){
                    return {...periode, [column]: Number(value)};
                }else{
                    return {...periode, [column]: value};
                }
            }
            return periode;
        });
        defPeriodes(newPeriodes);
    }

    const gestBoutonEdit = async(periode:number) => {
        props.defPeriodeSelect(periode)
        const territoire = await serviceTerritoires.chercheTerritoiresParPeriode(periode)
        props.defTerritoires(territoire.data)
        props.defEditionEnCours(true);
        defEdit(true);
        defAnciennesPeriodes(etat_periodes);
    }

    const gestBoutonAnnul = () => { 
        defPeriodes(etat_anciennes_periodes)
        props.defEditionEnCours(false)
        defEdit(false);
        defAnciennesPeriodes([])
    }

    const gestBoutonAjout = () => {
        const newPeriode = {
            id_periode: -2,
            nom_periode: '',
            date_debut_periode: 0,
            date_fin_periode: 0        
        }
        defPeriodes([...etat_periodes, newPeriode])
        props.defEditionEnCours(true)
        defEdit(true)
        props.defPeriodeSelect(newPeriode.id_periode)
        defAnciennesPeriodes(etat_periodes)
        props.defTerritoires({type:'FeatureCollection',features:[]})
    }

    const gestSelectRadio = async(id_periode: number) => {
        props.defPeriodeSelect(id_periode)
        const territoire = await serviceTerritoires.chercheTerritoiresParPeriode(id_periode)
        props.defTerritoires(territoire.data)
        console.log('not implemented')
    }    

    const gestBoutonSauv = async() => {
        if (props.periodeSelect != -1) {
            const entry_to_add = etat_periodes.find(o => o.id_periode === props.periodeSelect);
            
            if (entry_to_add) {
                const isNew = entry_to_add.id_periode===-2;
                let itemResponse:ReponsePeriode;
                let updatedItem:periode;
                if (isNew){
                    itemResponse = await serviceHistorique.nouvellePeriode({nom_periode:entry_to_add.nom_periode,date_debut_periode:entry_to_add.date_debut_periode,date_fin_periode:entry_to_add.date_fin_periode});
                    updatedItem = itemResponse.data[0];

                } else{
                    itemResponse = await serviceHistorique.majPeriode(entry_to_add.id_periode,entry_to_add)
                    updatedItem = itemResponse.data[0];
                }    
                defPeriodes(prev => {
                    const index = prev.findIndex(o => o.id_periode === props.periodeSelect);
                    console.log('test');
                    if (index !== -1) {
                        // Update existing entry
                        const updatedPeriods = [...prev];
                        updatedPeriods[index] = updatedItem; // Replace the existing entry
                        return updatedPeriods;
                    } else {
                        // Add new entry
                        return [...prev, updatedItem];
                    }
                });
                props.defPeriodeSelect(updatedItem.id_periode)
                defAnciennesPeriodes([]); // Clear previous periods
                props.defEditionEnCours(false); // Disable edit mode
                defEdit(false);
            } else {
                console.warn('Entry not found for the selected period.');
            }
        } else {
            console.warn('Invalid PeriodesSelect: must be a number.');
        }
    };

    const gestBoutonSuppr = async(idPeriode:number) =>{
        const success = await serviceHistorique.supprimePeriode(idPeriode)
        if (success){
            defPeriodes(prev => prev.filter(p => p.id_periode !== idPeriode));
        }
    };

    

    const renduBoutonsTableHistoire=() =>{
            return(<div className="bouton-modif-historique">
                {
                    props.nouvelleCartoDispo || 
                    edit ||
                    (props.editionEnCours && !edit)?<></>:
                    <AddIcon 
                        onClick={gestBoutonAjout}
                    />
                }
                
            </div>)
    };

    const handleMouseDown = (e: React.MouseEvent) => {
            const startX = e.clientX;
            const startWidth = panelRefGauche.current ? panelRefGauche.current.offsetWidth : 0;
    
            const handleMouseMove = (e: MouseEvent) => {
                const newWidth = startWidth - (startX - e.clientX);
                if (panelRefGauche.current) {
                    panelRefGauche.current.style.width = `${newWidth}px`;
                }
            };
    
            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
    
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

    return (
        <div className="panneau-histoire-modifiable" ref={panelRefGauche}>
            <div className="resize-handle-left-panel" onMouseDown={handleMouseDown}></div>
            <h4>Table Histoire</h4>
            {renduBoutonsTableHistoire()}
            <table className="table-histoire">
                <thead>
                    <tr>
                        <th>Édit.</th>
                        <th>Nom</th>
                        <th>Annee Debut</th>
                        <th>Annee Fin</th>
                        <th>En vigueur</th>
                        <th></th>
                        {edit?<th></th>:<></>}
                        <th></th>
                        
                    </tr>
                </thead>
                <tbody>
                    {etat_periodes.map((periode) => (
                        <tr key={periode.id_periode}>
                            <td><input
                                    type="radio"
                                    name="periode_a_editer"
                                    value={periode.id_periode}
                                    onClick={()=>gestSelectRadio(periode.id_periode)}
                                    disabled = {edit || props.editionEnCours || props.nouvelleCartoDispo}
                                    checked = {props.periodeSelect === periode.id_periode}
                                />    
                            </td>
                            <td>{(props.periodeSelect === periode.id_periode) && (edit) ? (<input
                                type={'string'}
                                value={periode.nom_periode !== null ? periode.nom_periode : ''}
                                onChange={(e) => gestChangement(periode.id_periode, 'nom_periode', e.target.value)}
                            />):(periode.nom_periode)}</td>
                            <td>{(props.periodeSelect === periode.id_periode) && (edit) ? (<input
                                type={'number'}
                                value={periode.date_debut_periode !== null ? periode.date_debut_periode : 0}
                                onChange={(e) => gestChangement(periode.id_periode, 'date_debut_periode', e.target.value)}
                                min='0'
                                max='9999'
                                size={4}
                            />):(periode.date_debut_periode)}</td>
                            <td>
                                {(props.periodeSelect === periode.id_periode) && (edit) ? (
                                    periode.date_fin_periode === null ? (
                                        <>
                                        </>
                                    ) : (
                                        <input
                                            type={'number'}
                                            value={periode.date_fin_periode !== null ? periode.date_fin_periode : 0}
                                            onChange={(e) => gestChangement(periode.id_periode, 'date_fin_periode', e.target.value)}
                                            min="0"
                                            max="9999"
                                            size={4}
                                        />
                                    )
                                ) : (
                                    periode.date_fin_periode
                                )}
                            </td>
                            <td>{(props.periodeSelect === periode.id_periode) && (edit)?
                                        <input
                                                type='checkbox'
                                                onClick={() => periode.date_fin_periode===null?gestChangement(periode.id_periode, 'date_fin_periode', '2025'):gestChangement(periode.id_periode,'date_fin_periode',null)}
                                                id='end-present'
                                                checked={periode.date_fin_periode===null}
                                        />:(periode.date_fin_periode===null? 'Oui':'Non')}</td>
                            <td>
                                {props.nouvelleCartoDispo || 
                                ((props.periodeSelect !== periode.id_periode) && (edit)) || 
                                (props.editionEnCours && !edit)?
                                    <>
                                    </>
                                :(props.periodeSelect === periode.id_periode) && (edit)?<SaveIcon onClick={gestBoutonSauv}/>:<Edit onClick={()=>gestBoutonEdit(periode.id_periode)}/>}</td>
                            <td>{props.nouvelleCartoDispo || 
                                ((props.periodeSelect !== periode.id_periode) && (edit)) || 
                                (props.editionEnCours && !edit) ?<></>:(props.periodeSelect === periode.id_periode) && (edit)?<CancelIcon onClick={gestBoutonAnnul}/>:<DeleteIcon onClick={()=> gestBoutonSuppr(periode.id_periode)}/>}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableHistoire;