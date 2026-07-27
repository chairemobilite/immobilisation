import {FC,useState,useEffect} from 'react'
import  { GraphiqueReglementsProps } from '../../types/InterfaceTypes'
import { Chart as ChartPlot,Bar,Line } from 'react-chartjs-2';
import { Edit } from '@mui/icons-material';
import ModalManipulationGraphiqueReg from '../modals/modalManipulationGraphiqueReg';
import { data_graphique, informations_pour_graph_unite_er_reg, utilisation_sol } from '../../types/DataTypes';
import { serviceEnsemblesReglements, serviceReglements } from '../../services';

const GraphiqueReglements:FC<GraphiqueReglementsProps>=(props:GraphiqueReglementsProps)=>{
    const [modalParamsGraphOuvert,defModalParamsGraphOuvert] = useState<boolean>(false)
    const [CUBFSelectionne,defCUBFSelectionne] = useState<utilisation_sol>({cubf:-1,description:'N/A'})
    const [labelAxeX,defLabelAxeX] = useState<string>('N/A')
    const [EnsRegDispo,defEnsRegDispo] = useState<informations_pour_graph_unite_er_reg[]>([])
    const [ensRegAGraph,defEnsRegAGraph] = useState<number[]>([])
    const [nUnites,defNUnites] = useState<number>(-1);
    const [minGraph,defMinGraph] = useState<number>(0);
    const [maxGraph,defMaxGraph] = useState<number>(1000);
    const [pasGraph,defPasGraph] = useState<number>(50);
    const [uniteGraph,defUniteGraph] = useState<number>(-1);
    const [data,defData] = useState<data_graphique>({
        labels: [0],
        datasets: [{
            label: `N/A`,
            data: [0]
        }],
    })

    useEffect(()=>{
 
            const fetchData = async()=>{
                if (CUBFSelectionne.cubf!==-1 ){
                    if (props.ensRegSelectionnesHaut.length>0){
                        const reponse = await serviceEnsemblesReglements.obtiensReglementsUnitesParCUBF(props.ensRegSelectionnesHaut,Number(CUBFSelectionne.cubf))
                        let selectedUnit:number =4;
                        if (uniteGraph===-1){
                            const unitesRetournees = reponse.data.filter(entree=>entree.unite.length===1).flatMap((entree)=>entree.unite)
                            if (unitesRetournees.length > 0) {
                                // Count occurrences of each unit
                                const unitCounts = unitesRetournees.reduce((acc: Record<number, number>, unit: number) => {
                                    acc[unit] = (acc[unit] || 0) + 1;
                                    return acc;
                                }, {});
                                // Find the unit(s) with the max count
                                const maxCount = Math.max(...Object.values(unitCounts) as number[]);
                                const mostCommonUnits = Object.entries(unitCounts)
                                    .filter(([_, count]) => count === maxCount)
                                    .map(([unit]) => Number(unit));
                                // Pick the lowest value if tie
                                selectedUnit = Math.min(...mostCommonUnits);
                                defUniteGraph(selectedUnit);
                            }else{
                                defUniteGraph(selectedUnit);
                                return;
                            }
                        } else{
                            selectedUnit = uniteGraph
                        }
                        const EnsRegNouveau = reponse.data.filter((entree) => !ensRegAGraph.includes(entree.id_er) && entree.unite[0] === selectedUnit && entree.unite.length ===1)
                        const ensRegIdAAjouter = EnsRegNouveau
                            .map((entree)=> entree.id_er)
                            .filter(id => !ensRegAGraph.includes(id));
                        
                        const nouveauEnsRegARep = Array.from(new Set([...ensRegAGraph.filter((entree)=>props.ensRegSelectionnesHaut.includes(entree)), ...ensRegIdAAjouter]));
                        defEnsRegAGraph(nouveauEnsRegARep)
                        const reponseDonnees = await serviceReglements.obtiensRepresentationGraphique(nouveauEnsRegARep,selectedUnit,minGraph,maxGraph,pasGraph,Number(CUBFSelectionne.cubf))
                        const labelUnite = reponse.data.find(entree=> entree.unite.length===1 && entree.unite[0] === selectedUnit)?.desc_unite ??'N/A';
                        defLabelAxeX(labelUnite)
                        defData(reponseDonnees.data)
                    } else{
                        defData({
                            labels: [0],
                            datasets: [{
                                label: `N/A`,
                                data: [0]
                            }],
                        })
                    }
                } else{
                    console.log('pas de cubf selectionné')
                    defData({
                        labels: [0],
                        datasets: [{
                            label: `N/A`,
                            data: [0]
                        }],
                    })
                }
            }
            fetchData()
        },[props.ensRegSelectionnesHaut])

    

    const options = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'white',
                    font: {
                        size: 16,
                    },
                },
            },
            title: {
                display: true,
                text: CUBFSelectionne.cubf !== -1 ? CUBFSelectionne.description : 'N/A',
                color:'white',
                font:{
                    size:25
                }
            },
        },
        scales: {
            x: {
                ticks: {
                    color: 'white',
                    font: {
                        size: 16,
                    },
                },
                title: {
                    display: true,
                    text: labelAxeX,
                    color: 'white',
                    font: {
                        size: 18,
                    },
                },
            },
            y: {
                ticks: {
                    color: 'white',
                    font: {
                        size: 16,
                    },
                },
                title: {
                    display: true,
                    text: 'Nombre de places',
                    color: 'white',
                    font: {
                        size: 18,
                    },
                },
            },
        },
    };


    return(<div className="graphique-rendu-reglements">
        <div className="graph-control"><Edit onClick={()=>defModalParamsGraphOuvert(true)}/> Éditer Paramètres graph</div>
        <div className="graphique">
            <Line
            data={{
                ...data,
                datasets: data.datasets.map((ds, i) => {
                // Find the matching reglement by id_er
                const reglement = props.ensRegSelectionnesHaut.find(r => r === ds.id_er);
                // Get color from palette by index or fallback
                const colorIndex = reglement ? props.ensRegSelectionnesHaut.indexOf(reglement) : i;
                const color = props.colorPalette[colorIndex % props.colorPalette.length] || '#cccccc';
                return {
                    ...ds,
                    borderColor: color,
                    backgroundColor: color + '80', // add alpha for background
                };
                }),
            }}
            options={{
                ...options,
                plugins: {
                ...options.plugins,
                tooltip: {
                    callbacks: {
                    label: function(context: any) {
                        const ds = context.dataset;
                        // Find reglement by id_er
                        const reglement = props.ensRegSelectionnesHaut.find(r => r === ds.id_er);
                        // Try to get desc_er and desc_reg_stat if available
                        const desc_er = ds?.desc_er || '';
                        const desc_reg_stat = ds?.desc_reg_stat || '';
                        const value = context.parsed.y;
                        let label = '';
                        if (desc_er && desc_reg_stat) {
                            label = `${desc_er} (${desc_reg_stat}): ${value} places`;
                        } else if (desc_er) {
                            label = `${desc_er}: ${value} places`;
                        } else {
                            label = `${ds.label}: ${value} places`;
                        }
                        return label;
                    }
                    }
                }
                }
            }}
            />
        </div>
        <ModalManipulationGraphiqueReg
            modalOuvert={modalParamsGraphOuvert}
            defModalOuvert={defModalParamsGraphOuvert}
            CUBFSelect={CUBFSelectionne}
            defCUBFSelect={defCUBFSelectionne}
            ensRegAVis={props.ensRegSelectionnesHaut}
            data = {data}
            defData = {defData}
            defLabelAxeX = {defLabelAxeX}
            regDispo={EnsRegDispo}
            defRegDispo={defEnsRegDispo}
            EnsRegSelect={ensRegAGraph}
            defEnsRegSelect={defEnsRegAGraph}
            nUnites={nUnites}
            defNUnites={defNUnites}
            minGraph={minGraph}
            defMinGraph={defMinGraph}
            maxGraph={maxGraph}
            defMaxGraph={defMaxGraph}
            pasGraph={pasGraph}
            defPasGraph={defPasGraph}
            uniteGraph={uniteGraph}
            defUniteGraph={defUniteGraph}
        />
    </div>)
}
export default GraphiqueReglements;