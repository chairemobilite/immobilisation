import { FC, useState, useEffect } from 'react'
import { GraphiqueReglementsProps, PropsGraphAnaVar } from '../../types/InterfaceTypes'
import { Chart as ChartPlot, Bar, Line } from 'react-chartjs-2';
import { data_graphique, utilisation_sol, data_box_plot, data_graphique_text_labels } from '../../types/DataTypes';
import { serviceAnaVariabilite } from '../../services/serviceAnaVariabilite';
import serviceUtilisationDuSol from '../../services/serviceUtilisationDuSol';
import { BoxPlotDataPoint } from '@sgratzl/chartjs-chart-boxplot';
import { ChartData, ChartDataset } from 'chart.js';



const GraphiqueAnaVar: FC<PropsGraphAnaVar> = (props: PropsGraphAnaVar) => {
    const [cubf, defCUBF] = useState<utilisation_sol>({ cubf: -1, description: 'N/A' })
    const [data, defData] = useState<data_graphique|data_graphique_text_labels>({
        labels: [0],
        datasets: [{
            label: `N/A`,
            data: [0]
        }],
    })
    const [dataBP, defDataBP] = useState<data_box_plot>({
        labels: ['0'],
        datasets: [
            { data: [] }
        ]

    })

    const { ensRegAGraph, ensRegReference, index, voirInv, methodeVisualisation } = props;
    const [options, setOptions] = useState<any>({
        maintainAspectRatio: false,
        plugins: {},
        scales: {}
    });
    useEffect(() => {
        const fetchData = async () => {
            if (methodeVisualisation.idMethodeAnalyse === 0) {//Diagramme à barres
                if (ensRegAGraph.length > 0 && ensRegReference !== -1) {
                    const [data_in, cubf_rep] = await Promise.all([
                        serviceAnaVariabilite.obtiensInventairesEnsRegs(
                            ensRegAGraph,
                            ensRegReference,
                            index < 9 ? index + 1 : undefined,
                            props.voirInv
                        ), serviceUtilisationDuSol.obtientUtilisationDuSol(index + 1, false)
                    ]);
                    defData(data_in.data);
                    if (props.index !== 9) {
                        defCUBF(cubf_rep.data[0]);
                    } else {
                        defCUBF({ cubf: 0, description: "Tous" })
                    }
                    setOptions({
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
                                text: cubf_rep.data[0].cubf !== -1 ? cubf_rep.data[0].description : 'N/A',
                                color: 'white',
                                font: {
                                    size: 25
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
                                    text: 'Ensemble de règlement',
                                    color: 'white',
                                    font: {
                                        size: 18,
                                    },
                                },
                                stacked: index === 9
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
                                    text: (props.ensRegReference !== -1 ? 'Indice (100 = ER de référence)' : 'Places de stationnement'),
                                    color: 'white',
                                    font: {
                                        size: 18,
                                    },
                                },
                                stacked: index === 9
                            },
                        },
                    })
                } else if (ensRegAGraph.length > 0) {
                    const [data_in, cubf_rep] = await Promise.all([
                        serviceAnaVariabilite.obtiensInventairesEnsRegs(
                            ensRegAGraph,
                            undefined,
                            index < 9 ? index + 1 : undefined,
                            props.voirInv
                        ), serviceUtilisationDuSol.obtientUtilisationDuSol(index + 1, false)
                    ]);
                    defData(data_in.data);
                    if (props.index !== 9) {
                        defCUBF(cubf_rep.data[0]);
                    } else {
                        defCUBF({ cubf: 0, description: "Tous" })
                    }
                    setOptions({
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: {
                                    color: 'white',
                                    font: {
                                        size: 8,
                                    },
                                },
                            },
                            title: {
                                display: true,
                                text: props.index !== 9 ? cubf_rep.data[0].description : 'TOUS',
                                color: 'white',
                                font: {
                                    size: 15
                                }
                            },
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: 'white',
                                    font: {
                                        size: 10,
                                    },
                                },
                                title: {
                                    display: true,
                                    text: 'Ensemble de règlement',
                                    color: 'white',
                                    font: {
                                        size: 10,
                                    },
                                },
                                stacked: index === 9
                            },
                            y: {
                                ticks: {
                                    color: 'white',
                                    font: {
                                        size: 10,
                                    },
                                },
                                title: {
                                    display: true,
                                    text: (props.ensRegReference !== -1 ? 'Indice (100 = ER de référence)' : 'Places de stationnement'),
                                    color: 'white',
                                    font: {
                                        size: 10,
                                    },
                                },
                                stacked: index === 9
                            },
                        },
                    })
                }

            } else if (methodeVisualisation.idMethodeAnalyse === 1) {// Histogramme

                const [data_in, cubf_rep] = await Promise.all([
                    serviceAnaVariabilite.obtiensDistributionInventaire(
                        ensRegAGraph,
                        index < 9 ? index + 1 : undefined,
                        voirInv
                    ), serviceUtilisationDuSol.obtientUtilisationDuSol(index + 1, false)
                ]);
                defData(data_in.data);
                if (props.index !== 9) {
                    defCUBF(cubf_rep.data[0]);
                } else {
                    defCUBF({ cubf: 0, description: "Tous" })
                }
                if (voirInv===true){
                    setOptions({
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
                            text: props.index !== 9 ? cubf_rep.data[0].description : 'Tous',
                            color: 'white',
                            font: {
                                size: 25
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
                                text: '<- Moins Ratio inventaire actuel Plus ->',
                                color: 'white',
                                font: {
                                    size: 18,
                                },
                            },
                            stacked: index === 9
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
                                text: 'Fréquence',
                                color: 'white',
                                font: {
                                    size: 18,
                                },
                            }
                        },
                    },
                })
                }else {
                    setOptions({
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
                            text: props.index !== 9 ? cubf_rep.data[0].description : 'Tous',
                            color: 'white',
                            font: {
                                size: 25
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
                                text: 'Nombre de places',
                                color: 'white',
                                font: {
                                    size: 18,
                                },
                            },
                            stacked: index === 9
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
                                text: 'Fréquence',
                                color: 'white',
                                font: {
                                    size: 18,
                                },
                            }
                        },
                    },
                })
                }
                
            } else if (methodeVisualisation.idMethodeAnalyse === 2) {//Box Plot echelle
                const [data_in, cubf_rep] = await Promise.all([
                    serviceAnaVariabilite.obtiensBoxPlotFacteurEchelle(
                        ensRegAGraph,
                        index < 9 ? index + 1 : undefined
                    ), serviceUtilisationDuSol.obtientUtilisationDuSol(index + 1, false)
                ]);
                defDataBP(data_in.data);
                if (props.index !== 9) {
                    defCUBF(cubf_rep.data[0]);
                } else {
                    defCUBF({ cubf: 0, description: "TOUS" })
                }
                setOptions({
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
                            text: props.index !== 9 ? cubf_rep.data[0].description : 'TOUS',
                            color: 'white',
                            font: {
                                size: 25
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
                                text: 'Facteur échelle',
                                color: 'white',
                                font: {
                                    size: 18,
                                },
                            },
                            stacked: index === 9
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
                            }
                        },
                    },
                })
            } else if (methodeVisualisation.idMethodeAnalyse === 3) {//box plot central
                const [data_in, cubf_rep] = await Promise.all([
                    serviceAnaVariabilite.obtiensBoxPlotEstimeCental(
                        ensRegAGraph,
                        index < 9 ? index + 1 : undefined
                    ), serviceUtilisationDuSol.obtientUtilisationDuSol(index + 1, false)
                ]);
                defDataBP(data_in.data);
                if (props.index !== 9) {
                    defCUBF(cubf_rep.data[0]);
                } else {
                    defCUBF({ cubf: 0, description: "TOUS" })
                }
                setOptions({
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
                            text: props.index !== 9 ? cubf_rep.data[0].description : 'TOUS',
                            color: 'white',
                            font: {
                                size: 25
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
                                display: false
                            },
                            stacked: index === 9
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
                            }
                        },
                    },
                })
            }
        };
        fetchData();
    }, [ensRegAGraph, ensRegReference, index, voirInv, methodeVisualisation]);


    return (
        <div className="graphique-rendu-ana-var">
            {(props.methodeVisualisation.idMethodeAnalyse != 2 && props.methodeVisualisation.idMethodeAnalyse != 3) ?
                <div className="graphique">
                    <Bar<number[], string | number>
                        data={{
                            ...data,
                            datasets: data.datasets.map((ds, i) => {
                                const paletteIndex = Math.max(0, ds.cubf ?? index) % props.colorPalette.length;    
                                return {
                                    ...ds,
                                    color: props.colorPalette[paletteIndex],
                                    backgroundColor: props.colorPalette[paletteIndex]
                                };
                            }),
                        }}
                        options={{
                            ...options,
                            plugins: {
                                ...options.plugins,
                                tooltip: {
                                    callbacks: {
                                        label: function (context: any) {
                                            const ds = context.dataset;
                                            // Find reglement by id_er
                                            const reglement = props.ensRegAGraph.find(r => r === ds.id_er);
                                            // Try to get desc_er and desc_reg_stat if available
                                            const value = context.parsed.y;

                                            let label = '';
                                            if (props.methodeVisualisation.idMethodeAnalyse === 0) {
                                                if (props.ensRegReference !== -1) {
                                                    label = `Indice pour ${context.label} par rapport à référence (100): ${value.toFixed(2)}`;
                                                } else {
                                                    label = `${ds.label}: ${value.toFixed(2)} places`;
                                                }
                                            } else {
                                                label = `Fréquence ${value.toFixed(2)}`
                                            }
                                            return label;
                                        }
                                    }
                                }
                            }
                        }}
                    />
                </div> :
                <div className='graphique'>
                    <ChartPlot
                        type="boxplot"
                        data={{
                            ...dataBP,
                            datasets: dataBP.datasets.map((ds: ChartDataset<'boxplot', BoxPlotDataPoint[]>) => ({
                                ...ds,
                                backgroundColor: props.colorPalette[index], // box fill
                                borderColor: props.colorPalette[index],          // box border
                                medianColor:props.colorPalette[index],          // median line
                                outlierColor: '#fff',                  // outliers in white
                                itemBackgroundColor: '#fff',             // raw points inside box
                                itemBorderColor: '#fff',                 // border of raw points  
                                itemRadius: 4                           // size of outlier points
                            }))
                        }}
                        options={options}
                    />
                </div>
            }

        </div>)
}
export default GraphiqueAnaVar;