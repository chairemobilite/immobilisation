import React,{useState,useEffect} from 'react';
import { AnalyseXYQuartierProps } from '../../types/InterfaceTypes';
import {VariablesPossiblesGraphiqueXY,NhoodXYGraphDatasets} from '../../types/AnalysisTypes';
import { serviceAnalyseInventaire } from '../../services/serviceAnalyseInventaire';
import { Chart as ChartPlot,Bar } from 'react-chartjs-2';

const AnalyseXYQuartiers:React.FC<AnalyseXYQuartierProps>=(props:AnalyseXYQuartierProps)=>{
    const [variableSelectX,defVariableSelectX] = useState<number>(-1);
    const [variableSelectY,defVariableSelectY] = useState<number>(-1);
    const [calculEnCours,defCalculEncours] = useState<boolean>(false);
    const [donneesXY,defDonneesXY] = useState<NhoodXYGraphDatasets>({descriptionX:'',descriptionY:'',donnees:[]})

    const [key, setKey] = useState(0); // Utilisé pour forcer le re-rendu

    useEffect(() => {
        // Force le re-rendu en changeant la clé
        setKey(prevKey => prevKey + 1);
    }, [donneesXY]);
    const variablesPotentielles:VariablesPossiblesGraphiqueXY[] = [
        {
            idVariable:0,
            descriptionVariable:'Stationnement Total',
            requiertOrdrePriorite:true,
            queryKey:'stat-tot'
        },
        {
            idVariable:1,
            descriptionVariable:'Stationnement par mètre carré',
            requiertOrdrePriorite:true,
            queryKey:'stat-sup'
        },
        {
            idVariable:2,
            descriptionVariable:'Stationnement par personne',
            requiertOrdrePriorite:true,
            queryKey:'stat-popu'
        },
        {
            idVariable:3,
            descriptionVariable:'Stationnement par voiture résident',
            requiertOrdrePriorite:true,
            queryKey:'stat-voit'
        },
        {
            idVariable:4,
            descriptionVariable:'Pourcentage territoire dédié stationnement',
            requiertOrdrePriorite:true,
            queryKey:'stat-perc'
        },
        {
            idVariable:5,
            descriptionVariable:'Superficie Quartier',
            requiertOrdrePriorite:false,
            queryKey:'superf'
        },
        {
            idVariable:6,
            descriptionVariable:'Population',
            requiertOrdrePriorite:false,
            queryKey:'popu'
        },
        {
            idVariable:7,
            descriptionVariable:'Densité Population',
            requiertOrdrePriorite:false,
            queryKey:'dens-pop'
        },
        {
            idVariable:8,
            descriptionVariable:'Valeur moyenne des logements',
            requiertOrdrePriorite:false,
            queryKey:'val-log-moy'
        },
        {
            idVariable:9,
            descriptionVariable:'Superficie moyenne des logements',
            requiertOrdrePriorite:false,
            queryKey:'sup-log-moy'
        },
        {
            idVariable:10,
            descriptionVariable:'Valeur Foncière totale',
            requiertOrdrePriorite:false,
            queryKey:'val-tot-quart'
        },
        {
            idVariable:11,
            descriptionVariable:'Valeur Foncière par superficie',
            requiertOrdrePriorite:false,
            queryKey:'val-tot-sup'
        },
        {
            idVariable:12,
            descriptionVariable:'Nombre de voitures',
            requiertOrdrePriorite:false,
            queryKey:'nb-voit'
        }
    ];
    const gestSelectVariable=async(targetValue:number,axis:string)=>{
        switch(axis){
            case 'X':
                defVariableSelectX(targetValue);
                if ( variableSelectY!==-1){
                    const besoinOrdre = (props.variablesPossibles.find((variable)=>variable.idVariable === targetValue)?.requiertOrdrePriorite??true) || (props.variablesPossibles.find((variable)=>variable.idVariable === variableSelectY)?.requiertOrdrePriorite??true)
                    let data;
                    if (besoinOrdre){
                        const listOrdre = props.prioriteInventairePossibles.find((ordre) => ordre.idPriorite === props.prioriteInventaire)?.listeMethodesOrdonnees ?? [1, 3, 2]
                        data = await serviceAnalyseInventaire.obtientDonneesGraphiqueXY(listOrdre,props.variablesPossibles.find((variable)=>variable.idVariable===targetValue)?.queryKey??'stat-tot',props.variablesPossibles.find((variable)=>variable.idVariable===variableSelectY)?.queryKey??'stat-tot')
                    } else{
                        data = await serviceAnalyseInventaire.obtientDonneesGraphiqueXY(undefined,props.variablesPossibles.find((variable)=>variable.idVariable===targetValue)?.queryKey??'stat-tot',props.variablesPossibles.find((variable)=>variable.idVariable===variableSelectY)?.queryKey??'stat-tot')
                    }
                    defDonneesXY(data.data)
                }
                break;
            case 'Y':
                defVariableSelectY(targetValue);
                if (variableSelectX!==-1){
                    const besoinOrdre = (props.variablesPossibles.find((variable)=>variable.idVariable === variableSelectX)?.requiertOrdrePriorite??true) || (props.variablesPossibles.find((variable)=>variable.idVariable === targetValue)?.requiertOrdrePriorite??true)
                    let data;
                    if (besoinOrdre){
                        const listOrdre = props.prioriteInventairePossibles.find((ordre) => ordre.idPriorite === props.prioriteInventaire)?.listeMethodesOrdonnees ?? [1, 3, 2]
                        data = await serviceAnalyseInventaire.obtientDonneesGraphiqueXY(listOrdre,props.variablesPossibles.find((variable)=>variable.idVariable===variableSelectX)?.queryKey??'stat-tot',props.variablesPossibles.find((variable)=>variable.idVariable===targetValue)?.queryKey??'stat-tot')
                    } else{
                        data = await serviceAnalyseInventaire.obtientDonneesGraphiqueXY(undefined,props.variablesPossibles.find((variable)=>variable.idVariable===variableSelectX)?.queryKey??'stat-tot',props.variablesPossibles.find((variable)=>variable.idVariable===targetValue)?.queryKey??'stat-tot')
                    }
                    defDonneesXY(data.data)
                }
                break;
            default:
                console.log('invalid variable name')
        }
    };
    const gestObtientVariables = async()=>{
        const besoinOrdre = (props.variablesPossibles.find((variable)=>variable.idVariable === variableSelectX)?.requiertOrdrePriorite??true) || (props.variablesPossibles.find((variable)=>variable.idVariable === variableSelectY)?.requiertOrdrePriorite??true)
        let data;
        if (besoinOrdre){
            const listOrdre = props.prioriteInventairePossibles.find((ordre) => ordre.idPriorite === props.prioriteInventaire)?.listeMethodesOrdonnees ?? [1, 3, 2]
             data = await serviceAnalyseInventaire.obtientDonneesGraphiqueXY(listOrdre,props.variablesPossibles.find((variable)=>variable.idVariable===variableSelectX)?.queryKey??'stat-tot',props.variablesPossibles.find((variable)=>variable.idVariable===variableSelectY)?.queryKey??'stat-tot')
        } else{
            data = await serviceAnalyseInventaire.obtientDonneesGraphiqueXY(undefined,props.variablesPossibles.find((variable)=>variable.idVariable===variableSelectX)?.queryKey??'stat-tot',props.variablesPossibles.find((variable)=>variable.idVariable===variableSelectY)?.queryKey??'stat-tot')
        }
        defDonneesXY(data.data)
    };
    const gestRecalculeVariablesAncillaires = async()=>{

    };
    const renduGraphique = () =>{
        if (donneesXY.donnees.length>0){
        return(<ChartPlot
                    key={key} // Utilisez la clé pour forcer le re-rendu
                    type={'scatter'}
                    data={{
                        datasets: [
                          {
                            label: donneesXY.descriptionY,
                            data: donneesXY.donnees.map((item) => ({
                              x: item.x,
                              y: item.y,
                            })),
                            backgroundColor: 'cyan',
                          },
                        ],
                      }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const pointIndex = context.dataIndex;
                                    const point = donneesXY.donnees[pointIndex];
                                    return `${point.nom_quartier}: (X: ${point.x}, Y: ${point.y})`;
                                  }
                                },
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                titleFont: { size: 14 },
                                bodyFont: { size: 16 }
                              },
                            legend: {
                                position: 'top',
                                labels: {
                                    usePointStyle: true
                                    }
                            },
                            title: {
                                display: true,
                                text: `X:${donneesXY.descriptionX} vs Y: ${donneesXY.descriptionY}`,
                                font: {
                                    size: 30,
                                }
                            },
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: donneesXY.descriptionX,
                                    font: {
                                        size: 25,
                                    }
                                },
                                ticks:{
                                    font:{
                                        size:20
                                    }
                                },
                                grid: {
                                    display: false,
                                },
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: donneesXY.descriptionY,
                                    font: {
                                        size: 20,
                                    }
                                },
                                beginAtZero: true,
                                ticks: {
                                    callback: (value) => `${value}`, // Optional: format Y-axis values
                                }
                            },
                        }
                    }}
                    //plugins={[levelLinePlugin]}
                />
            )
        } else{
            return(<></>)
        }
    }
    return(<div className={"conteneur-xy"}>
        <div className="menu-selection-variable">
            <label htmlFor="select-variable-X">Selectionner Variable X </label>
            <select id="select-variable-X" name="select-variable-X" onChange={e => gestSelectVariable(Number(e.target.value),'X')} value={variableSelectX}>
                <option value={-1}>Selection variable</option>
                {props.variablesPossibles.map(variable => (
                    <option key={variable.idVariable} value={variable.idVariable} >
                        {variable.descriptionVariable}
                    </option>
                ))}
            </select>
            <label htmlFor="select-variable-Y">Selectionner Variable Y </label>
            <select id="select-variable-Y" name="select-variable-Y" onChange={e => gestSelectVariable(Number(e.target.value),'Y')} value={variableSelectY}>
                <option value={-1}>Selection variable Y</option>
                {props.variablesPossibles.map(variable => (
                    <option key={variable.idVariable} value={variable.idVariable} >
                        {variable.descriptionVariable}
                    </option>
                ))}
            </select>
        </div>
        <div className={"graphxy"}>
            {renduGraphique()}

        </div>
    </div>)
}

export default AnalyseXYQuartiers;