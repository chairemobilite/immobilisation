import { AnalysePAVQuartierProps } from '../../types/InterfaceTypes'
import React, { useState, useEffect } from 'react';
import { Chart as ChartPlot,Bar } from 'react-chartjs-2'
import { PAVQuartier, quartiers_analyse, entreePAV, PAVDataVisOptions } from '../../types/DataTypes';
import { serviceQuartiersAnalyse, servicePAV } from '../../services';
import { yellow } from '@mui/material/colors';
import { Chart, registerables } from 'chart.js';
import { ClimbingBoxLoader } from 'react-spinners';
import { FeatureCollection, Geometry } from 'geojson';

Chart.register(...registerables);

const AnalyseProfilAccumulationVehiculeQuartiers: React.FC<AnalysePAVQuartierProps> = (props: AnalysePAVQuartierProps) => {
    const [quartierSelect, defQuartierSelect] = useState<number>(-1);
    const [quartierOptions, defQuartierOptions] = useState<FeatureCollection<Geometry,quartiers_analyse>>({type:"FeatureCollection",features:[]});
    const [PAVvalide, defPAVvalide] = useState<boolean>(false);
    const [PAVQuartier, defPAVQuartier] = useState<PAVQuartier>({ id_quartier: -1, capacite_stat_quartier: 0, PAV: [], nom_quartier: '' });
    const [PAVNouveau, defPAVNouveau] = useState<entreePAV[]>([]);
    const [PAVCalcule, defPAVCalcule] = useState<boolean>(false)
    const [calculEnCours,defCalculEnCours] = useState<boolean>(false);
    
    const optionsVisuPAV:PAVDataVisOptions[]=[
        {
            id_data_vis:1,
            label:'Voitures Stationnées total',
            api_id:'voitures',
            stat_comp:'tot'
        },
        {
            id_data_vis:2,
            label:'Voitures stationnées à la résidence',
            api_id:'voitures_res',
            stat_comp:'res'
        },
        {
            id_data_vis:3,
            label:'Voitures stationnées en lieu public',
            api_id: 'voitures_pub',
            stat_comp:'pub'
        },
        {
            id_data_vis:4,
            label:'Personnes dans le quartier',
            api_id:'personnes',
            stat_comp:'tot'
        },
        {
            id_data_vis:5,
            label:'Permis dans le quartier',
            api_id:'permis',
            stat_comp:'tot'
        }
    ]
    const defaultDataVis = optionsVisuPAV[0]

    const [OptionVisuPav,defOptionVisuPAV] = useState<PAVDataVisOptions>(defaultDataVis)
    useEffect(() => {
        const fetchData = async () => {
            const quartiers = await serviceQuartiersAnalyse.chercheTousQuartiersAnalyse();
            defQuartierOptions(quartiers.data);
        };
        fetchData();
    }, []);


    const gestSelectQuartier = async(id_quartier: number) => {
        defQuartierSelect(id_quartier)
        const resultat = await servicePAV.obtientPAVQuartier(props.prioriteInventairePossibles.find((ordre) => ordre.idPriorite === props.prioriteInventaire)?.listeMethodesOrdonnees ?? [1, 3, 2], id_quartier,OptionVisuPav.api_id,OptionVisuPav.stat_comp)
        defPAVQuartier(resultat.data)
        defPAVvalide(true)
    }

    const gestObtientPAV = async () => {
        const resultat = await servicePAV.obtientPAVQuartier(props.prioriteInventairePossibles.find((ordre) => ordre.idPriorite === props.prioriteInventaire)?.listeMethodesOrdonnees ?? [1, 3, 2], quartierSelect,OptionVisuPav.api_id,OptionVisuPav.stat_comp)
        defPAVQuartier(resultat.data)
        defPAVvalide(true)
    }
    const gestAnnulPAV = () => {
        defPAVNouveau([])
        defPAVCalcule(false)
    }
    const gestSauvegardePAV = async () => {
        const result = await servicePAV.sauvegardePAV(Number(PAVQuartier.id_quartier), PAVNouveau)
        if (result) {
            const PAV = await servicePAV.obtientPAVQuartier(props.prioriteInventairePossibles.find((ordre) => ordre.idPriorite === props.prioriteInventaire)?.listeMethodesOrdonnees ?? [1, 3, 2], PAVQuartier.id_quartier,OptionVisuPav.api_id,OptionVisuPav.stat_comp)
            defPAVQuartier(PAV.data)
            defPAVNouveau([])
            defPAVCalcule(false)
        }
    }
    const gestCalculPAV = async () => {
        defCalculEnCours(true)
        const resultPAVActuel = await servicePAV.obtientPAVQuartier(props.prioriteInventairePossibles.find((ordre) => ordre.idPriorite === props.prioriteInventaire)?.listeMethodesOrdonnees ?? [1, 3, 2], quartierSelect,OptionVisuPav.api_id,OptionVisuPav.stat_comp)
        const resultatPAVNouveau = await servicePAV.recalculePAVQuartier(quartierSelect)
        defPAVvalide(true)
        defPAVCalcule(true)
        defPAVQuartier(resultPAVActuel.data)
        defPAVNouveau(resultatPAVNouveau.data)
        console.log('obtenu Calculs PAV')
       defCalculEnCours(false)
    }

    const gestSelectVariable = async (id_data_vis:Number)=>{
        const newDataVis = optionsVisuPAV.find((opt)=>opt.id_data_vis===id_data_vis)??defaultDataVis
        defOptionVisuPAV(newDataVis)
        if (quartierSelect!==-1){
            const result = await servicePAV.obtientPAVQuartier(props.prioriteInventairePossibles.find((ordre) => ordre.idPriorite === props.prioriteInventaire)?.listeMethodesOrdonnees ?? [1, 3, 2], quartierSelect,newDataVis.api_id,newDataVis.stat_comp)
            defPAVQuartier(result.data)
        }
    }

    const maxValue = Math.max(...PAVQuartier.PAV.map((item)=>item.valeur??item.voitures),PAVQuartier.capacite_stat_quartier);
    

    const renduGraphique = () => {
        if (PAVvalide && PAVQuartier.PAV.length > 0 && !PAVCalcule) {
            return (
                <ChartPlot
                    type={'bar'}
                    data={{
                        // Name of the variables on x-axies for each bar
                        labels: PAVQuartier.PAV.map((item) => item.heure),
                        datasets: [
                            {
                                // Label for bars
                                label: [1,2,3].includes(OptionVisuPav.id_data_vis)?"N vehicules":OptionVisuPav.id_data_vis===4?'Personnes':'Permis',
                                // Data or value of your each variable
                                data: PAVQuartier.PAV.map((item) => item.valeur??item.voitures),
                                borderWidth: 0.5,
                                backgroundColor: 'cyan'
                            },
                            {
                                label:"Capacite",
                                data:PAVQuartier.PAV.map(()=> PAVQuartier.capacite_stat_quartier),
                                borderColor: 'red',
                                borderWidth: 2,
                                fill: false,  // Don't fill under the line
                                pointRadius: 0,  // No points on the line
                                spanGaps: true,  // Allow the line to span across gaps
                                tension: 0,  // Prevent the line from curving
                                pointStyle: 'line',
                                type:'line'
                            }
                        ],
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    usePointStyle: true
                                  }
                            },
                            title: {
                                display: true,
                                text: 'Profile Accumulation Véhicule',
                                font: {
                                    size: 18,
                                }
                            },
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Heure',
                                    font: {
                                        size: 16,
                                    }
                                },
                                grid: {
                                    display: false,
                                },
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'N vehicules ou places',
                                    font: {
                                        size: 16,
                                    }
                                },
                                beginAtZero: true,
                                ticks: {
                                    callback: (value) => `${value}`, // Optional: format Y-axis values
                                },
                                max: maxValue + 10
                            },
                        }
                    }}
                    //plugins={[levelLinePlugin]}
                />
            )
        } else if (PAVCalcule) {
            const lenPAVOld = PAVQuartier.PAV.length
            const lenPAVNew = PAVNouveau.length
            let heures:number[]
            if (lenPAVOld > lenPAVNew) {
                heures = PAVQuartier.PAV.map((item) => item.heure)
            } else {
                heures = PAVNouveau.map((item) => item.heure)
            }
            const propertyKeys = [
                    { key: 'voitures', label: "Voitures" },
                    { key: 'voitures_res', label: "Voitures Résidence" },
                    { key: 'voitures_pub', label: "Voitures Lieu Public" },
                    { key: 'personnes', label: "Personnes" },
                    { key: 'permis', label: "Permis" },
                    { key: '', label: "" }
                ];

            return (
                    <>
                        {
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", width: "100%", height: "100%" }}>
                                {propertyKeys.map((prop, idx) => (
                                    <div key={idx} style={{ height: "300px" }}>
                                        {prop.key ? (
                                            <Bar
                                                data={{
                                                    labels: heures,
                                                    datasets: [
                                                        {
                                                            label: `Ancien ${prop.label}`,
                                                            data: heures.map(h =>
                                                                (PAVQuartier.PAV.find(itemPAV => itemPAV.heure === h) as entreePAV | undefined)?.[prop.key as keyof entreePAV] ?? 0
                                                            ),
                                                            backgroundColor: 'cyan'
                                                        },
                                                        {
                                                            label: `Nouveau ${prop.label}`,
                                                            data: heures.map(h =>
                                                                (PAVNouveau.find(itemPAV => itemPAV.heure === h) as entreePAV | undefined)?.[prop.key as keyof entreePAV] ?? 0
                                                            ),
                                                            backgroundColor: 'red'
                                                        }
                                                    ]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: { position: 'top' },
                                                        title: {
                                                            display: true,
                                                            text: `Profile ${prop.label}`,
                                                            font: { size: 16 }
                                                        }
                                                    },
                                                    scales: {
                                                        x: {
                                                            title: { display: true, text: 'Heure', font: { size: 16 } },
                                                            grid: { display: false }
                                                        },
                                                        y: {
                                                            title: { display: true, text: 'Valeur' },
                                                            beginAtZero: true,
                                                            ticks: { callback: value => `${value}` },
                                                            max: maxValue + 10
                                                        }
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div />
                                        )}
                                    </div>
                                ))}
                            </div>
                        }
                    </>
               
            )
        } else {
            return (<></>)
        }
    }

    return (
        <div className={"conteneur-PAV"}>
            {calculEnCours?<><ClimbingBoxLoader
                loading={calculEnCours}
                size={10}
                color="#fff"
                aria-label="Calculs en Cours - Prends ton mal en patience"
                data-testid="loader"
            /></>:
            (
                <>
                <div className="menu-selection-couleur">
                    <label htmlFor="select-map-color">SelectionnerQuartier</label>
                    <select id="select-map-color" name="select-type" onChange={e => gestSelectQuartier(Number(e.target.value))} value={quartierSelect}>
                        <option value={-1}>Selection quartier</option>
                        <option value={0}>Ville complète</option>
                        {quartierOptions.features.map((quartier) => (
                            <option key={quartier.properties.id_quartier} value={quartier.properties.id_quartier} >
                                {quartier.properties.nom_quartier}
                            </option>
                        ))}
                    </select>
                    <label htmlFor="select-accumulation-type"> Sélectionner type d'accumulation</label>
                    <select id="select-accumulation-type" name="select-type" onChange={e => gestSelectVariable(Number(e.target.value))} value={OptionVisuPav.id_data_vis}>
                        {optionsVisuPAV.map(visu => (
                            <option key={visu.id_data_vis} value={visu.id_data_vis} >
                                {visu.label}
                            </option>
                        ))}
                    </select>
                    {quartierSelect !== -1 ? <><label htmlFor="bouton-recalcul">Recaluler PAV</label><button className="bouton-recalcul" onClick={gestCalculPAV}>Recalculer PAV</button> </>: <></>}
                    {PAVCalcule ? <><button onClick={gestSauvegardePAV}>Approuver PAV</button><button onClick={gestAnnulPAV}>Refuser PAV</button></> : <></>}
                </div>
                <div className={"PAV"}>
                    {renduGraphique()}
                </div>
                </>
            )}
            
        </div>
    )
}

export default AnalyseProfilAccumulationVehiculeQuartiers;