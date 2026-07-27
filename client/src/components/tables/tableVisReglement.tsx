import React, { useState, useRef,useEffect} from 'react';
import { TableVisModRegProps } from '../../types/InterfaceTypes';
import { definition_reglement_stationnement, entete_reglement_stationnement, operation_reglement_stationnement, reglement_complet, unites_reglement_stationnement } from '../../types/DataTypes';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { Add, Edit, Save } from '@mui/icons-material';
import { serviceReglements, serviceUnites } from '../../services';

const TableVisModReglement: React.FC<TableVisModRegProps> = (props) => {
    const enteteReglementVide: entete_reglement_stationnement = {
        id_reg_stat: 0,
        description: '',
        annee_debut_reg: 0,
        annee_fin_reg: 0,
        texte_loi: '',
        article_loi: '',
        paragraphe_loi: '',
        ville: ''
    };

    const reglementCompletVide: reglement_complet = {
        entete: enteteReglementVide,
        definition: []
    }
    
    const [ligneUnSauvegardee,defLigneUnSauvegardee] = useState<boolean>(true);
    const [operationsPossible,defOperationsPossibles] = useState<operation_reglement_stationnement[]>([]);
    const [unitesPossibles,defUnitesPossibles] = useState<unites_reglement_stationnement[]>([]);
    const [idLigneAModifier,defidLigneAModifier] = useState<number>(-1);
    const [prochainSSEnsemble,defProchainSSEnsemble] = useState<number>(1);
    const [ancienReglement,defAncienReglement] = useState<reglement_complet>({entete:{id_reg_stat:0,description:'',annee_debut_reg:null,annee_fin_reg:null,texte_loi:'',article_loi:'',paragraphe_loi:'',ville:''},definition:[]})

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resOperations, resUnites] = await Promise.all([
                    serviceReglements.obtiensOperationsPossibles(),
                    serviceUnites.obtiensUnitesPossibles()
                ]);
                console.log('Recu les operations', resOperations.data);
                console.log('recu les unites',resUnites.data)
                defOperationsPossibles(resOperations.data);
                defUnitesPossibles(resUnites.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                props.defCharge(false);
            }
        };
        fetchData();
    }, []);
    const panelRef = useRef<HTMLDivElement>(null);
    const handleMouseDown = (e: React.MouseEvent) => {
        const startY = e.clientY;
        const startHeight = panelRef.current ? panelRef.current.offsetHeight : 0;

        const handleMouseMove = (e: MouseEvent) => {
            const newHeight = startHeight + (startY - e.clientY);
            if (panelRef.current) {
                panelRef.current.style.height = `${newHeight}px`;
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    const gestChangementEntete=(idReg:number,champs:string,valeur:string|null)=>{
        const newEntete = ((champs === 'annee_debut_reg' || champs === 'annee_fin_reg') && valeur !== null)
            ? { ...props.regSelect.entete, [champs]: Number(valeur) }
            : { ...props.regSelect.entete, [champs]: valeur };
        const oldStack = props.regSelect.definition;
        const newRegSelect: reglement_complet = { entete: newEntete, definition: oldStack };
        props.defRegSelect(newRegSelect);
    }
    const gestChangementLigneDef=(idLigne:number,champs:string,valeur:string|null)=>{
        const oldLine = props.regSelect.definition.find((ligne)=>ligne.id_reg_stat_emp===idLigne)
        if (!oldLine) return;
        const newLine: definition_reglement_stationnement = {
            id_reg_stat: oldLine.id_reg_stat,
            id_reg_stat_emp: oldLine.id_reg_stat_emp,
            ss_ensemble: oldLine.ss_ensemble,
            oper: oldLine.oper,
            seuil: oldLine.seuil,
            cases_fix_min: oldLine.cases_fix_min,
            cases_fix_max: oldLine.cases_fix_max,
            pente_min: oldLine.pente_min,
            pente_max: oldLine.pente_max,
            unite: oldLine.unite,
            [champs]: valeur !== null ? Number(valeur) : null
        };
        const oldHead = props.regSelect.entete;
        const newStack:definition_reglement_stationnement[] = props.regSelect.definition.map((ligne)=>ligne.id_reg_stat_emp===idLigne?newLine:ligne);
        const newRegSelect: reglement_complet = { entete: oldHead, definition: newStack };
        props.defRegSelect(newRegSelect);
    }
    const gestAjoutSSEnsemble=()=>{
        
        defAncienReglement(props.regSelect)
        // TODO: use nSubsets for further logic or remove if not needed
        // Add a new line (definition) to the current reglement
        const newIdRegStatEmp = -1;
        const newDefinition: definition_reglement_stationnement = {
            id_reg_stat: props.regSelect.entete.id_reg_stat,
            id_reg_stat_emp: newIdRegStatEmp,
            ss_ensemble: 1,
            oper: null,
            seuil: 0,
            cases_fix_min: 0,
            cases_fix_max: null,
            pente_min: null,
            pente_max: null,
            unite: 2
        };
        const updatedDefinitions = [...props.regSelect.definition, newDefinition];
        props.defRegSelect({
            entete: props.regSelect.entete,
            definition: updatedDefinitions
        });
        defidLigneAModifier(-1)
        props.defEditionCorpsEnCours(true)
    }
    const gestSauvegardeEntete=async()=>{
        const enteteASauver:Omit<entete_reglement_stationnement,'id_reg_stat'>={
            description:props.regSelect.entete.description,
            annee_debut_reg:props.regSelect.entete.annee_debut_reg,
            annee_fin_reg:props.regSelect.entete.annee_fin_reg,
            texte_loi:props.regSelect.entete.texte_loi,
            article_loi:props.regSelect.entete.article_loi,
            paragraphe_loi:props.regSelect.entete.paragraphe_loi,
            ville:props.regSelect.entete.ville
        }
        let result;
        if (props.creationEnCours){
            result = await serviceReglements.nouvelEnteteReglement(enteteASauver);
        } else{
            result = await serviceReglements.modifieEnteteReglement(props.regSelect.entete.id_reg_stat,enteteASauver)
        }
        const newEntete:entete_reglement_stationnement = result.data[0]
        const newDef:definition_reglement_stationnement[] = props.regSelect.definition.map((entree)=>({
            id_reg_stat:newEntete.id_reg_stat,
            id_reg_stat_emp:entree.id_reg_stat_emp,
            ss_ensemble:entree.ss_ensemble,
            oper:entree.oper,
            seuil:entree.seuil,
            cases_fix_max:entree.cases_fix_max,
            cases_fix_min:entree.cases_fix_min,
            pente_max:entree.pente_max,
            pente_min:entree.pente_min,
            unite:entree.unite
        }))
        const newRegSelect: reglement_complet = {entete:newEntete,definition:newDef}
        
        props.defRegSelect(newRegSelect)
        props.defEditionEnteteEnCours(false)
        if(props.creationEnCours){
            props.defEntetesRegStationnement((prev) => [...prev, newEntete])
        }else{
            props.defEntetesRegStationnement((prev) =>
                prev.map(entete =>
                    entete.id_reg_stat === newEntete.id_reg_stat ? newEntete : entete
                )
            )
        }
        props.defCreationEnCours(false)
    }
    const gestSauvegardeLigne=async()=>{
        const ligne = props.regSelect.definition.find((o) => o.id_reg_stat_emp === idLigneAModifier);
        if (!ligne) {
            throw new Error(`Ligne avec id_reg_stat_emp=${idLigneAModifier} non trouvée`);
        }
        const ligneASauver: Omit<definition_reglement_stationnement, 'id_reg_stat_emp'> = {
            id_reg_stat: ligne.id_reg_stat,
            seuil:ligne.seuil,
            ss_ensemble: ligne.ss_ensemble,
            oper:ligne.oper,
            cases_fix_min:ligne.cases_fix_min,
            cases_fix_max:ligne.cases_fix_max,
            pente_min:ligne.pente_min,
            pente_max:ligne.pente_max,
            unite:ligne.unite
        };
        const idSave = idLigneAModifier;
        let lineOut;
        if (idSave===-1){
            lineOut = await serviceReglements.nouvelleLigneDefinition(ligneASauver)
        } else{
            lineOut = await serviceReglements.modifieLigneDefinition(idSave,ligneASauver)
        }
        const ligneRetournee= lineOut.data;
        // Remplace la ligne modifiée dans le tableau definition par la ligne retournée par l'API
        const updatedDefinitions = props.regSelect.definition.map((def) =>
            def.id_reg_stat_emp === idLigneAModifier ? ligneRetournee[0] : def
        );
        props.defRegSelect({
            ...props.regSelect,
            definition: updatedDefinitions
        });
        defidLigneAModifier(-1);
        props.defEditionCorpsEnCours(false);
    }
    const gestSupprimeLigne=async(idLigne:number)=>{
        const lineDeleted=await serviceReglements.supprimeLigneDefinition(idLigne)
        console.log('supprime ligne ',lineDeleted)
        if (lineDeleted){
            const newStack = props.regSelect.definition.filter((o)=>o.id_reg_stat_emp!==idLigne)
            const oldHeader = props.regSelect.entete
            const newRegSelect:reglement_complet={entete:oldHeader,definition:newStack}
            props.defRegSelect(newRegSelect)
        }
    }

    const gestModifLigne=(idStack:number)=>{
        if (props.editionEnteteEnCours){
            props.defRegSelect(ancienReglement)
            props.defEditionEnteteEnCours(false)
            props.defEditionCorpsEnCours(true)
            defidLigneAModifier(idStack)
        } else{
            defAncienReglement(props.regSelect)
            props.defEditionCorpsEnCours(true)
            defidLigneAModifier(idStack)
        }
    }
    return (
        <div className="panneau-details-reglements" ref={panelRef}>
            <div className="resize-handle" onMouseDown={handleMouseDown}></div>
            <h4>Détails Règlements</h4>
            <table className="table-modif-reglements-entete">
                <thead>
                    <tr>
                        <th>ID reglement</th>
                        <th>Description</th>
                        <th>Année Début</th>
                        <th>Année Fin</th>
                        {props.editionEnteteEnCours?<th>En vigueur</th>:<></>}
                        <th>Texte Loi</th>
                        <th>Article Loi</th>
                        <th>Paragraphe Loi</th>
                        <th>Ville</th>
                        <th></th>
                        {props.editionEnteteEnCours?<th></th>:<></>}
                    </tr>
                </thead>
                <tbody>
                    {<tr key={props.regSelect.entete.id_reg_stat}>
                        <td>{props.regSelect.entete.id_reg_stat}</td>
                        <td>{props.editionEnteteEnCours?
                            (
                                <input 
                                    type={'string'}
                                    value={props.regSelect.entete.description !== null ? props.regSelect.entete.description : ''}
                                    onChange={(e) => gestChangementEntete(props.regSelect.entete.id_reg_stat,'description', e.target.value)}/>
                            ):(
                                props.regSelect.entete.description
                            )}</td>
                        <td>{props.editionEnteteEnCours?
                                (
                                    <input 
                                    type={'number'}
                                    value={props.regSelect.entete.annee_debut_reg !== null ? props.regSelect.entete.annee_debut_reg : ''}
                                    onChange={(e) => gestChangementEntete(props.regSelect.entete.id_reg_stat,'annee_debut_reg', e.target.value)}
                                    size={6}
                                    min="0"
                                    max="9999"/>
                                ):(
                                    props.regSelect.entete.annee_debut_reg
                                )}
                        </td>
                        <td>{props.editionEnteteEnCours && props.regSelect.entete.annee_fin_reg!==null?
                                (
                                    <input 
                                    type={'number'}
                                    value={props.regSelect.entete.annee_fin_reg !== null ? props.regSelect.entete.annee_fin_reg : ''}
                                    onChange={(e) => gestChangementEntete(props.regSelect.entete.id_reg_stat,'annee_fin_reg', e.target.value)}
                                    size={6}
                                    min="0"
                                    max="9999"/>
                                ):(
                                    props.regSelect.entete.annee_fin_reg
                                )}</td>
                        {props.editionEnteteEnCours?
                            (<td><input 
                            type={'checkbox'}
                            checked={props.regSelect.entete.annee_fin_reg===null}
                            onClick={() => props.regSelect.entete.annee_fin_reg===null?gestChangementEntete(props.regSelect.entete.id_reg_stat, 'annee_fin_reg', '2025'):gestChangementEntete(props.regSelect.entete.id_reg_stat,'annee_fin_reg',null)}
                            /></td>):(<></>)}        
                        <td>{props.editionEnteteEnCours?
                                (
                                    <input 
                                    type={'string'}
                                    value={props.regSelect.entete.texte_loi !== null ? props.regSelect.entete.texte_loi : ''}
                                    onChange={(e) => gestChangementEntete(props.regSelect.entete.id_reg_stat,'texte_loi', e.target.value)}
                                    size={10}/>
                                ):(
                                    props.regSelect.entete.texte_loi
                                )
                            }
                        </td>
                        <td>{props.editionEnteteEnCours?
                                (
                                    <input 
                                    type={'string'}
                                    value={props.regSelect.entete.article_loi !== null ? props.regSelect.entete.article_loi : ''}
                                    onChange={(e) => gestChangementEntete(props.regSelect.entete.id_reg_stat,'article_loi', e.target.value)}
                                    size={10}/>
                                ):(
                                    props.regSelect.entete.article_loi
                                )
                            }</td>
                        <td>{props.editionEnteteEnCours?(
                                <input 
                                    type={'string'}
                                    value={props.regSelect.entete.paragraphe_loi !== null ? props.regSelect.entete.paragraphe_loi : ''}
                                    onChange={(e) => gestChangementEntete(props.regSelect.entete.id_reg_stat,'paragraphe_loi', e.target.value)}
                                    size={10}/>
                            ):(
                                props.regSelect.entete.paragraphe_loi
                            )
                        }
                        </td>
                        <td>{props.editionEnteteEnCours?(
                                <input 
                                    type={'string'}
                                    value={props.regSelect.entete.ville !== null ? props.regSelect.entete.ville : ''}
                                    onChange={(e) => gestChangementEntete(props.regSelect.entete.id_reg_stat,'ville', e.target.value)}
                                    size={10}/>
                            ):(props.regSelect.entete.ville)}</td>
                        <td>{props.editionEnteteEnCours?(<><SaveIcon onClick={gestSauvegardeEntete}/></>):(<><Edit onClick={()=>{props.defEditionEnteteEnCours(true);defAncienReglement(props.regSelect);}} /></>)}</td>
                        <td>{props.editionEnteteEnCours?(<><CancelIcon onClick={()=>{props.defEditionEnteteEnCours(false); props.defRegSelect(ancienReglement)}}/></>):(<></>)}</td>
                    </tr>
                    }
                </tbody>
            </table>
            <table className="table-modif-reglements-corps">
                <thead>
                    <tr>
                        <th>Sous-Ensemble</th>
                        <th>Seuil</th>
                        <th>Opération</th>
                        <th>Abscisse Min.</th>
                        {props.editionCorpsEnCours?<th>Util.</th>:<></>}
                        <th>Abscisse Max.</th>
                        {props.editionCorpsEnCours?<th>Util.</th>:<></>}
                        <th>Pente Minimum</th>
                        {props.editionCorpsEnCours?<th>Util.</th>:<></>}
                        <th>Pente Maximum</th>
                        {props.editionCorpsEnCours?<th>Util.</th>:<></>}
                        <th>Pl. par</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {props.regSelect.definition.map((ligneDef) => (
                        <tr key={ligneDef.id_reg_stat_emp} >
                            {/* ss-ensemble */}
                            <td>{props.editionCorpsEnCours && idLigneAModifier===ligneDef.id_reg_stat_emp ? 
                                <input
                                    type={'number'}
                                    value={ligneDef.ss_ensemble !== null ? ligneDef.ss_ensemble : ''}
                                    onChange={(e)=>gestChangementLigneDef(ligneDef.id_reg_stat_emp,'ss_ensemble',e.target.value)}
                                    size={10}
                                />:
                                ligneDef.ss_ensemble}</td>
                            {/* Seuil */}
                            <td>{props.editionCorpsEnCours && idLigneAModifier===ligneDef.id_reg_stat_emp ? 
                                <input
                                    type={'number'}
                                    value={ligneDef.seuil !== null ? ligneDef.seuil : ''}
                                    onChange={(e)=>gestChangementLigneDef(ligneDef.id_reg_stat_emp,'seuil',e.target.value)}
                                    size={10}
                                />:
                                ligneDef.seuil}</td>
                            {/* Operation */}
                            <td>{props.editionCorpsEnCours && 
                                idLigneAModifier===ligneDef.id_reg_stat_emp? 
                                <select
                                    value={ligneDef.oper !== null ? ligneDef.oper : ''}
                                    onChange={(e)=>gestChangementLigneDef(ligneDef.id_reg_stat_emp,'oper',e.target.value)}
                                >
                                    <option value='null'>Choisir...</option>
                                    {operationsPossible.map((oper)=>
                                        <option key={oper.id_operation} value={oper.id_operation}>{oper.desc_operation}</option>
                                    )}
                                </select>
                                :
                                (() => {
                                    const op = operationsPossible.find(o => o.id_operation === ligneDef.oper);
                                    return op ? op.desc_operation : ligneDef.oper;
                                })()
                            }</td>
                            {/* Cases fix min */}
                            <td>{props.editionCorpsEnCours && 
                                idLigneAModifier===ligneDef.id_reg_stat_emp && ligneDef.cases_fix_min!==null? 
                                    <input
                                        type={'number'}
                                        value={ligneDef.cases_fix_min !== null ? ligneDef.cases_fix_min : 0}
                                        onChange={(e)=>gestChangementLigneDef(ligneDef.id_reg_stat_emp,'cases_fix_min',e.target.value)}
                                        size={10}
                                    />
                                :ligneDef.cases_fix_min}</td>
                            {props.editionCorpsEnCours?
                            idLigneAModifier===ligneDef.id_reg_stat_emp?
                                <td>
                                    <input 
                                        type={"checkbox"} 
                                        checked={ligneDef.cases_fix_min!==null}
                                        onClick={()=>ligneDef.cases_fix_min===null?gestChangementLigneDef(idLigneAModifier,'cases_fix_min','0'):gestChangementLigneDef(idLigneAModifier,'cases_fix_min',null)}
                                    />
                                </td>
                                :
                                <td></td>:
                                <></>}
                            {/* Cases fix max */}
                            <td>{props.editionCorpsEnCours && 
                                idLigneAModifier===ligneDef.id_reg_stat_emp && ligneDef.cases_fix_max!==null? 
                                    <input
                                        type={'number'}
                                        value={ligneDef.cases_fix_max !== null ? ligneDef.cases_fix_max : 0}
                                        onChange={(e)=>gestChangementLigneDef(ligneDef.id_reg_stat_emp,'cases_fix_max',e.target.value)}
                                        size={10}
                                    />
                                :ligneDef.cases_fix_max}</td>
                            {/* Cases fix max utilise */}
                            {props.editionCorpsEnCours?
                            idLigneAModifier===ligneDef.id_reg_stat_emp?
                                <td>
                                    <input 
                                        type={"checkbox"} 
                                        checked={ligneDef.cases_fix_max!==null}
                                        onClick={()=>ligneDef.cases_fix_max===null?gestChangementLigneDef(idLigneAModifier,'cases_fix_max','0'):gestChangementLigneDef(idLigneAModifier,'cases_fix_max',null)}
                                    />
                                </td>
                                :
                                <td></td>:
                                <></>}
                            {/* Pente_min */}
                            <td>{props.editionCorpsEnCours && 
                                idLigneAModifier===ligneDef.id_reg_stat_emp && ligneDef.pente_min!==null? 
                                    <input
                                        type={'number'}
                                        value={ligneDef.pente_min !== null ? ligneDef.pente_min : 0}
                                        onChange={(e)=>gestChangementLigneDef(ligneDef.id_reg_stat_emp,'pente_min',e.target.value)}
                                        size={10}
                                    />
                                :ligneDef.pente_min}</td>
                            {/* Pente_min utilise*/}
                            {props.editionCorpsEnCours?idLigneAModifier===ligneDef.id_reg_stat_emp?
                            <td>
                                <input 
                                    type={"checkbox"}
                                    checked={ligneDef.pente_min!==null}
                                    onClick={()=>ligneDef.pente_min===null?gestChangementLigneDef(idLigneAModifier,'pente_min','0'):gestChangementLigneDef(idLigneAModifier,'pente_min',null)}/>
                            </td>
                            :
                            <td></td>
                            :
                            <></>}
                            {/* Pente_max */}
                            <td>{props.editionCorpsEnCours && 
                                idLigneAModifier===ligneDef.id_reg_stat_emp && ligneDef.pente_max!==null? 
                                    <input
                                        type={'number'}
                                        value={ligneDef.pente_max !== null ? ligneDef.pente_max : 0}
                                        onChange={(e)=>gestChangementLigneDef(ligneDef.id_reg_stat_emp,'pente_max',e.target.value)}
                                        size={10}
                                    />
                                :ligneDef.pente_max}</td>
                            {/* Pente_max utilisée */}
                            {props.editionCorpsEnCours?idLigneAModifier===ligneDef.id_reg_stat_emp?
                            <td>
                                <input 
                                    type={"checkbox"}
                                    checked={ligneDef.pente_max!==null}
                                    onClick={()=>ligneDef.pente_max===null?gestChangementLigneDef(idLigneAModifier,'pente_max','0'):gestChangementLigneDef(idLigneAModifier,'pente_max',null)}/>
                                </td>:<td>

                                </td>:<>
                                </>}
                            {/* Unité*/}
                            <td>{props.editionCorpsEnCours && 
                                idLigneAModifier===ligneDef.id_reg_stat_emp? 
                                <select
                                    value={ligneDef.unite !== null ? ligneDef.unite : ''}
                                    onChange={(e)=>gestChangementLigneDef(ligneDef.id_reg_stat_emp,'unite',e.target.value)}
                                >
                                    <option value='null' disabled>Choisir...</option>
                                    {unitesPossibles.map((oper)=>
                                        <option key={oper.id_unite} value={oper.id_unite}>{oper.desc_unite}</option>
                                    )}
                                </select>
                                :
                                (() => {
                                    const unite = unitesPossibles.find(o => o.id_unite === ligneDef.unite);
                                    return unite ? unite.desc_unite : ligneDef.unite;
                                })()
                            }</td>
                            {/* Édition sauvegard*/}
                            <td>{props.editionCorpsEnCours && ligneDef.id_reg_stat_emp===idLigneAModifier?
                            <Save onClick={gestSauvegardeLigne}/>
                            :<Edit onClick={()=>gestModifLigne(ligneDef.id_reg_stat_emp)}/>}</td>
                            {/* suppression annulation*/}
                            <td>{props.editionCorpsEnCours && ligneDef.id_reg_stat_emp===idLigneAModifier?
                                <CancelIcon
                                     onClick={()=>{props.defEditionEnteteEnCours(false); props.defRegSelect(ancienReglement)}}
                                />
                                :
                                <DeleteIcon
                                    onClick={()=>gestSupprimeLigne(ligneDef.id_reg_stat_emp)}
                                />
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {props.regSelect.entete.id_reg_stat>0?(
                <p>
                    <Add 
                        id='add-subset'
                        onClick={gestAjoutSSEnsemble}
                    />   
                    Ajout ligne à la définition                 
                </p>
            ):(
                <></>
            )
            }
        </div>
    );
};


export default TableVisModReglement;