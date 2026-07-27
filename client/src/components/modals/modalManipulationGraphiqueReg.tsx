import { FC, useState,useEffect } from 'react';
import  { PropsModalManipGraphiqueReg } from '../../types/InterfaceTypes';
import { informations_pour_graph_unite_er_reg, utilisation_sol } from '../../types/DataTypes';
import {
    Modal,
    Box,
    Button,
    Autocomplete,
    TextField,
    Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import serviceUtilisationDuSol from '../../services/serviceUtilisationDuSol';
import { serviceEnsemblesReglements, serviceReglements } from '../../services';
/**
 * Permet de mettre en places les options pour un graphique
 * @param props issu de  PropsModalManipGraphiqueReg qui comporte l'ouverture du modal et 
 * @returns composante fonctionnelle JSX
 */
const ModalManipulationGraphiqueReg: FC<PropsModalManipGraphiqueReg> = (props: PropsModalManipGraphiqueReg) => {
    const [tousCUBF,defTousCUBF] = useState<utilisation_sol[]>([])
    
    {/* Obtention des cubf possibles pour le dropdowns */}
    /** section qui permet d'aller chercher les règlements pertinents au besoin */
    useEffect(()=>{
        const fetchData = async()=>{
            if (props.CUBFSelect.cubf!==-1 && props.ensRegAVis.length>0){
                const [response,reponseRegDispo] = await Promise.all([serviceUtilisationDuSol.obtientUtilisationDuSol(-1),serviceEnsemblesReglements.obtiensReglementsUnitesParCUBF(props.ensRegAVis,Number(props.CUBFSelect.cubf))])
                defTousCUBF(response.data)
                props.defRegDispo(reponseRegDispo.data)
            } else{
                const response = await serviceUtilisationDuSol.obtientUtilisationDuSol(-1)
                defTousCUBF(response.data)
            }
        }
        fetchData()
        console.log('obtention tous cubf')
    },[props.modalOuvert])
    {/* gestion de fermetude du modal */}
    /**
     * gestFermetureModal ferme le modal
     */
    const gestFermetureModal=()=>{
        props.defModalOuvert(false)
    }
    {/* Gestion de la sélection d'un CUBF pour le graphique */}
    /**
     * gestSelectionCUBF met à jour le CUBF et obtient les règlements associés et leurs unités pour pouoir les montrer dans une liste. Ultiment, j'ai besoin de pouvoir enlever les règlements qui n'ont pas tous les mêmes unités pour rendre le graphique lisible
     * @param CUBFSelect valeur unique du CUBF sélectionné
     */
    const gestSelectionCUBF = async(CUBFSelect:number|null)=>{
        if (typeof(CUBFSelect)==='number'){
            const objetCUBFSelect:utilisation_sol = tousCUBF.find((o)=>Number(o.cubf)===CUBFSelect)??{cubf:-1,description:'N/A'}
            props.defCUBFSelect(objetCUBFSelect)
            if (CUBFSelect!==-1 && props.ensRegAVis.length > 0){
                const reponse = await serviceEnsemblesReglements.obtiensReglementsUnitesParCUBF(props.ensRegAVis,CUBFSelect)
                const regSetSelect = [...new Set(reponse.data.map(item=>item.id_er))]
                props.defRegDispo(reponse.data)
                props.defEnsRegSelect(regSetSelect)
                const uniteSets = [...new Set(reponse.data.flatMap(item => item.unite))]
                const NUnites = uniteSets.length
                props.defNUnites(NUnites)
                if (NUnites ===1){
                    props.defUniteGraph(uniteSets[0])
                    const uniteVis = reponse.data.find((item)=>item.unite[0] === uniteSets[0])?.desc_unite;
                    props.defLabelAxeX(uniteVis ?? 'N/A')
                }else{
                    props.defLabelAxeX('N/A')
                }
                console.log('reponse unites obtenues pour le cubf et ER selectionnes')
            }
        }
    }
    {/** Gestion du lancement du graphage des règlements */}
    /**
     * gestLancementGraph envoie la requete au backend de générer le data pour le linechart pour pouvoir le montrer dans le graphique
     */
    const gestLancementGraph=async()=>{
        const regsToPlots = props.EnsRegSelect.map((item) => {
            const foundReg = props.regDispo.find((reg) => reg.id_er === item);
            return foundReg?.id_er ?? null;
        }).filter((id): id is number => id !== null);
        if (regsToPlots.length > 0) {
            const retourGraph = await serviceReglements.obtiensRepresentationGraphique(regsToPlots,props.uniteGraph,props.minGraph,props.maxGraph,props.pasGraph,Number(props.CUBFSelect.cubf))
            if (retourGraph.success){
                props.defData(retourGraph.data)
            }
            gestFermetureModal()
        }
    }
    {/*variable de style */}
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 300,
        width: 'auto',
        // This is key:
        maxHeight: '80vh', // Or any value
        overflowY: 'auto', // Enables scrolling
        bgcolor: 'black',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    return (
        <>
            <Modal
                open={props.modalOuvert}
                onClose={gestFermetureModal}
            >
                <Box sx={style}>
                    <Box sx={{ overflowY: 'auto' }}>
                    <form onSubmit={(e) => e.preventDefault()}>
                        {/*CUBF À sélectionner*/}
                        <label htmlFor='selection-cubf'>CUBF à visualiser</label>
                        <select onChange={(e)=>gestSelectionCUBF(Number(e.target.value))} id='selection-cubf' value={props.CUBFSelect.cubf}>
                            <option value={-1}>Select CUBF</option>
                            {tousCUBF.map((c)=><option value={c.cubf}>{c.description}</option>)}
                        </select>
                        {/* Réglement Pertinents */}
                        {props.CUBFSelect.cubf!==-1?
                        <>
                        <p>
                         N Unite: {props.nUnites!==-1?props.nUnites:'Sélectionner un CUBF'} - Unite graphe {props.uniteGraph}
                        </p>
                        <table>
                            <thead>
                                <th>Montrer</th>
                                <th>ER</th>
                                <th>Règlement</th>
                                <th>Unités</th>
                                <th>N unités</th>
                            </thead>
                            <tbody>
                                {props.regDispo.map((item)=>(
                                    <tr key={item.id_er}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={props.EnsRegSelect.includes(item.id_er)}
                                                onChange={() => {
                                                    if (props.EnsRegSelect.includes(item.id_er)) {
                                                        const newRegSelect = props.EnsRegSelect.filter(id => id !== item.id_er)
                                                        props.defEnsRegSelect(newRegSelect);
                                                        // Met à jour les règlements sélectionnés
                                                        const selectedItems = props.regDispo.filter(reg => newRegSelect.includes(reg.id_er));
                                                        const uniteSets = [...new Set(selectedItems.flatMap(item => item.unite))];
                                                        const NUnites = uniteSets.length;
                                                        props.defNUnites(NUnites);
                                                        if (uniteSets.length===1){
                                                            console.log('unite pour graphe',uniteSets)
                                                            props.defUniteGraph(uniteSets[0])
                                                        }
                                                    } else {
                                                        const newRegSelect = [...props.EnsRegSelect, item.id_er]
                                                        props.defEnsRegSelect([...props.EnsRegSelect, item.id_er]);
                                                        // Met à jour les règlements sélectionnés
                                                        const selectedItems = props.regDispo.filter(reg => newRegSelect.includes(reg.id_er));
                                                        const uniteSets = [...new Set(selectedItems.flatMap(item => item.unite))];
                                                        const NUnites = uniteSets.length;
                                                        if (uniteSets.length===1){
                                                            console.log('unite pour graphe',uniteSets)
                                                            props.defUniteGraph(uniteSets[0])
                                                        }
                                                        props.defNUnites(NUnites);
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>{item.desc_er}</td>
                                        <td>{item.desc_reg_stat}</td>
                                        <td>{item.desc_unite}</td>
                                        <td>{item.desc_unite.length}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></>:<></>
                        }
                        {props.nUnites===1&&props.regDispo.length>0?
                        <>
                            <h4>Sélectionner limites axe X: {props.regDispo[0].desc_unite}</h4>
                            <table>
                                <thead>
                                    <th>Min graph</th>
                                    <th>Max Graph</th>
                                    <th>Pas</th>
                                </thead>
                                <tbody>
                                    <td><input type='number' value={props.minGraph} onChange={(e)=>props.defMinGraph(Number(e.target.value))}/></td>
                                    <td><input type='number' value={props.maxGraph} onChange={(e)=>props.defMaxGraph(Number(e.target.value))}/></td>
                                    <td><input type='number' value={props.pasGraph} onChange={(e)=>props.defPasGraph(Number(e.target.value))}/></td>
                                </tbody>
                            </table>
                            <button onClick={gestLancementGraph}>Créer graphe</button>
                        </>:<></>
                        }
                        
                    </form>
                    </Box>
                </Box>
            </Modal>
        </>);
}

export default ModalManipulationGraphiqueReg;