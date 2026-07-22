import React,{useState, useRef} from 'react';
import { association_territoire_entete_ensemble_reglement, entete_ensembles_reglement_stationnement,associaion_territoire_ensemble_reglement } from '../../types/DataTypes';
import { EnsRegTerrDispTable } from '../../types/InterfaceTypes';
import DeleteIcon from '@mui/icons-material/Delete'
import CancelIcon from '@mui/icons-material/Cancel';
import { Add, Cancel, Edit, Save } from '@mui/icons-material';
import { serviceEnsemblesReglements } from '../../services';
import { serviceEnsRegTerr } from '../../services/serviceEnsRegTerr';

const EnsRegTerrGantt:React.FC<EnsRegTerrDispTable> =(props:EnsRegTerrDispTable) =>{

    const [idAssociationEditee,defIdAssociationEditee] = useState<number>(-1);
    const [editionEnCours,defEditionEnCours] = useState<boolean>(false);
    const [entetesEnsembles,defEntetesEnsembles] = useState<entete_ensembles_reglement_stationnement[]>([]);
    const [idEnteteSelectionnee,defIdEnteteSelectionnee] = useState<number>(-1);
    const [ancienAssoDispo,defAncienAssoDispo] = useState<association_territoire_entete_ensemble_reglement[]>([]);
    const panelRefGauche = useRef<HTMLDivElement>(null);
    const getYearSpan = (): number[] => {
        const years = [];
        let startYear = 1920;
        let endYear = new Date().getFullYear();
        if (props.periodeSelect.id_periode!=-1){
            if (props.periodeSelect.date_debut_periode!=0){
                startYear = props.periodeSelect.date_debut_periode;
            }
            if (props.periodeSelect.date_fin_periode!=null){
                endYear = props.periodeSelect.date_fin_periode;
            }
        }
        for (let year = startYear; year <= endYear; year++) {
            years.push(year);
        }
        return years;
        
    };


    const displayYears = getYearSpan();

    const gestAjoutLigne = async()=>{
        const ensemblesReglementsRep = await serviceEnsemblesReglements.chercheTousEntetesEnsemblesReglements()
        const ensemblesReglements:entete_ensembles_reglement_stationnement[] = ensemblesReglementsRep.data
        defAncienAssoDispo(props.ensRegDispo);
        defEditionEnCours(true);
        defIdAssociationEditee(-1);
        const premierEnsReg = Math.min(...Array.from(new Set(ensemblesReglements.map((o)=>o.id_er))))
        defIdEnteteSelectionnee(premierEnsReg)
        defEntetesEnsembles(ensemblesReglements)
        const enteteSelectionnee = ensemblesReglements.find((o)=>o.id_er === premierEnsReg)!;
        const ligneAjouter: association_territoire_entete_ensemble_reglement = {
            id_asso_er_ter: -1,
            id_periode_geo: props.territoireSelect.features[0].properties.id_periode_geo,
            id_er: enteteSelectionnee.id_er,
            date_debut_er: enteteSelectionnee.date_debut_er,
            date_fin_er: enteteSelectionnee.date_fin_er,
            description_er: enteteSelectionnee.description_er
        };
        const nouvelEnsemblesDispos:association_territoire_entete_ensemble_reglement[] = [...props.ensRegDispo,ligneAjouter]
        props.defEnsRegDispo(nouvelEnsemblesDispos)
    }

    const gestSelectEnsReg = async(idEnsembleSelect:number)=>{
        defIdEnteteSelectionnee(idEnsembleSelect)
    }
    const gestAnnulation = ()=>{
        props.defEnsRegDispo(ancienAssoDispo)
        defEditionEnCours(false);
        defIdAssociationEditee(-1);
        defAncienAssoDispo([]);
    }
    const gestSauvegardeAsso=async()=>{
        const assoASauvegarder:Omit<associaion_territoire_ensemble_reglement,'id_asso_er_ter'>={
            id_er:idEnteteSelectionnee,
            id_periode_geo:props.territoireSelect.features[0].properties.id_periode_geo
        }
        if (idAssociationEditee===-1){
            const response = await serviceEnsRegTerr.nouvelleAssociationRegSetTer(assoASauvegarder)
            if (response.success){
                const MAJMatrice:association_territoire_entete_ensemble_reglement[] = props.ensRegDispo.map(
                    (assoc)=>assoc.id_asso_er_ter!==-1?
                    assoc:
                    {
                        id_asso_er_ter:response.data.id_asso_er_ter,
                        id_er:response.data.id_er,
                        description_er:entetesEnsembles.find((o)=>o.id_er==response.data.id_er)?.description_er,
                        date_debut_er:entetesEnsembles.find((o)=>o.id_er==response.data.id_er)?.date_debut_er,
                        date_fin_er:entetesEnsembles.find((o)=>o.id_er==response.data.id_er)?.date_fin_er
                    })
                props.defEnsRegDispo(MAJMatrice)
                defAncienAssoDispo([])
                defEditionEnCours(false)
            }
        }else{
            const idASauvergarder = idAssociationEditee;
            const response = await serviceEnsRegTerr.modifieAssociationRegSetTerr(idASauvergarder,assoASauvegarder)
            if (response.success){
                const MAJMatrice:association_territoire_entete_ensemble_reglement[] = props.ensRegDispo.map(
                    (assoc)=>assoc.id_asso_er_ter!==idAssociationEditee?
                    assoc:
                    {
                        id_asso_er_ter:response.data.id_asso_er_ter,
                        id_er:response.data.id_er,
                        description_er:entetesEnsembles.find((o)=>o.id_er==response.data.id_er)?.description_er,
                        date_debut_er:entetesEnsembles.find((o)=>o.id_er==response.data.id_er)?.date_debut_er,
                        date_fin_er:entetesEnsembles.find((o)=>o.id_er==response.data.id_er)?.date_fin_er
                    })
                props.defEnsRegDispo(MAJMatrice)
                defEditionEnCours(false)
                defIdAssociationEditee(-1)
                defAncienAssoDispo([])
            }
        }
    }

    const gestSuppression=async(idSuppression:number)=>{
        const response = await serviceEnsRegTerr.supprimeAssociationRegSetTerr(idSuppression)
        if (response){
            const trucAMaj = props.ensRegDispo.filter((o)=>o.id_asso_er_ter!==idSuppression)
            props.defEnsRegDispo(trucAMaj)
        }
        defEditionEnCours(false)
        defIdAssociationEditee(-1)
    }

    const gestEditionLigne = async(idAssoc:number)=>{
        // Si il y a un ancien, on met a jour la valeur pour revenir à l'ancien. Permet de commencer a éditer une ligne en période de création
        if (ancienAssoDispo.length>0){
            props.defEnsRegDispo(ancienAssoDispo)
        } else{// Si ce n'est pas le cas, on prend la liste actuelle comme valeur à rétablir
            defAncienAssoDispo(props.ensRegDispo)
        }
        const ensemblesReglementsRep = await serviceEnsemblesReglements.chercheTousEntetesEnsemblesReglements()
        const ensemblesReglements:entete_ensembles_reglement_stationnement[] = ensemblesReglementsRep.data
        defEntetesEnsembles(ensemblesReglements)
        defEditionEnCours(true)
        defIdAssociationEditee(idAssoc)
        const id_ens_reg = props.ensRegDispo.find((o)=>o.id_asso_er_ter===idAssoc)?.id_er??-1
        defIdEnteteSelectionnee(id_ens_reg)
    }

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
    return(
        <>
        
        <div className="gantt-ens-reg-terr" ref={panelRefGauche}>
            <div className="resize-handle-left-panel" onMouseDown={handleMouseDown}></div>
            <div className="gantt-table-scroll-container">
                <table className="table-vis-assoc-terr-ens-reg">
                    <thead>
                        <tr>
                            <th className="save-edit-col sticky-col"></th>
                            <th className="cancel-delete-col sticky-col"></th>
                            <th className="asso-id-col sticky-col">ID Asso</th>
                            <th className="id-col sticky-col">ID ER</th>
                            <th className="desc-col sticky-col">Description</th>
                            <th className="start-col sticky-col">Annee Deb</th>
                            <th className="end-col sticky-col">Annee Fin</th>
                            {displayYears.map((item) => (<th><div className="year-header">{item}</div></th>))}
                        </tr>
                    </thead>
                    <tbody>
                        {props.ensRegDispo.map((association)=>(
                            <tr>
                                <td className="save-edit-col sticky-col">{editionEnCours&& idAssociationEditee===association.id_asso_er_ter?<Save onClick={gestSauvegardeAsso}/>:<Edit onClick={()=>gestEditionLigne(association.id_asso_er_ter)}/>}</td>
                                <td className="cancel-delete-col sticky-col">{editionEnCours&& idAssociationEditee===association.id_asso_er_ter?<Cancel onClick={gestAnnulation}/>:<DeleteIcon onClick={()=>gestSuppression(association.id_asso_er_ter)}/>}</td>
                                <td className="asso-id-col sticky-col">{association.id_asso_er_ter}</td>
                                <td className="id-col sticky-col">{
                                    editionEnCours && idAssociationEditee===association.id_asso_er_ter ?
                                    entetesEnsembles.find((enteteSelect)=>enteteSelect.id_er===idEnteteSelectionnee)?.id_er??'N/A'
                                    :
                                    association.id_er}</td>
                                <td className="desc-col sticky-col">{
                                    editionEnCours && idAssociationEditee===association.id_asso_er_ter ?
                                        <select onChange={(e)=>gestSelectEnsReg(Number(e.target.value)) } value={idEnteteSelectionnee}>{
                                            entetesEnsembles.map((ensemble)=>
                                            <option key={ensemble.id_er} value={ensemble.id_er}>{ensemble.description_er}</option>)}
                                        </select>
                                        :
                                        association.description_er}
                                </td>
                                <td className="start-col sticky-col">{
                                    editionEnCours && idAssociationEditee===association.id_asso_er_ter ?
                                    entetesEnsembles.find((enteteSelect)=>enteteSelect.id_er===idEnteteSelectionnee)?.date_debut_er??'N/A'
                                    :
                                    association.date_debut_er}
                                </td>
                                <td className="end-col sticky-col">{
                                    editionEnCours && idAssociationEditee===association.id_asso_er_ter ?
                                    entetesEnsembles.find((enteteSelect)=>enteteSelect.id_er===idEnteteSelectionnee)?.date_fin_er??'N/A'
                                    :
                                    association.date_fin_er}</td>
                                {displayYears.map((annee)=>(
                                    editionEnCours && idAssociationEditee===association.id_asso_er_ter ?<td className="annee-invalide"></td>:
                                    ((annee>=association.date_debut_er || association.date_debut_er===null) && (annee<=association.date_fin_er || association.date_fin_er===null))?<td className="annee-valide">x</td> :<td className="annee-invalide"></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {props.territoireSelect.features.length>0 && editionEnCours===false ?<p><Add onClick={gestAjoutLigne}/> Ajouter Ensemble de règlements à ce territoire</p>:<></>}
        </div>
        
        </>
    )
}

export default EnsRegTerrGantt;