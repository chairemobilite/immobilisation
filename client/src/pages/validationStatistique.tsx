import React, { useEffect, useState } from 'react';
import MenuBar from '../components/menus/MenuBar';
import './common.css';
import './validationStatistique.css'
import ControlValStat from '../components/menus/ControlValStat';
import ModifStrates from '../components/panels/modifStrates';
import { EntreeValidation, FeuilleFinaleStrate, inventaire_stationnement, lotCadastralAvecBoolInvGeoJsonProperties, lotCadastralGeoJsonProperties, Strate } from '../types/DataTypes';
import DefinitionStratesEchantionnage from '../components/panels/definitionStratesEchantionnage';
import serviceValidation from '../services/serviceValidation';
import { ClimbingBoxLoader } from 'react-spinners';
import PanneauValidation from '../components/panels/PanneauValidation';
import { FeatureCollection, Geometry } from 'geojson';
import { serviceCadastre } from '../services';
import { LatLngExpression } from 'leaflet';

const ValidationStatistique: React.FC = () => {
    const [definitionStrate, defDefinitionStrate] = useState<boolean>(false);
    const [strateActuelle, defStrateActuelle] = useState<Strate>({
        id_strate: 0,
        nom_strate: 'logement',
        nom_colonne: 'cubf',
        nom_table: 'test',
        est_racine: true,
        index_ordre: 0,
        ids_enfants: [2, 3],
        superf_valide: null,
        logements_valides: null,
        date_valide: null,
        condition: {
            condition_type: "range",
            condition_min: 1000,
            condition_max: 1999
        }
    })
    const [toutesStrates, defToutesStrates] = useState<Strate[]>(
        [{
            id_strate: 0,
            nom_strate: 'logement',
            nom_colonne: 'cubf',
            nom_table: 'test',
            est_racine: true,
            index_ordre: 0,
            ids_enfants: [2, 3],
            logements_valides: null,
            superf_valide: null,
            date_valide: null,
            condition: {
                condition_type: "range",
                condition_min: 1000,
                condition_max: 1999
            },
            subStrata: [
                {
                    id_strate: 2,
                    nom_strate: 'unifamiliaL',
                    nom_colonne: 'n_logements',
                    nom_table: 'test',
                    est_racine: true,
                    index_ordre: 0,
                    ids_enfants: null,
                    logements_valides: null,
                    superf_valide: null,
                    date_valide: null,
                    condition: {
                        condition_type: "equals",
                        condition_valeur: 1
                    },
                    n_sample: 30
                },
                {
                    id_strate: 3,
                    nom_strate: 'plex',
                    nom_colonne: 'n_logements',
                    nom_table: 'test',
                    est_racine: true,
                    index_ordre: 0,
                    ids_enfants: null,
                    logements_valides: null,
                    superf_valide: null,
                    date_valide: null,
                    condition: {
                        condition_type: "range",
                        condition_min: 2,
                        condition_max: 2000
                    },
                    n_sample: 30
                }
            ]
        }, {
            id_strate: 1,
            nom_strate: 'industriel',
            nom_colonne: 'cubf',
            nom_table: 'test',
            est_racine: true,
            index_ordre: 0,
            ids_enfants: null,
            logements_valides: null,
            superf_valide: null,
            date_valide: null,
            condition: {
                condition_type: "range",
                condition_min: 2000,
                condition_max: 2999
            },
            n_sample: 30
        }]
    );
    const [anciennesStrates, defAnciennesStrates] = useState<Strate[]>([]);
    const [ancienneStrateAct, defAncienneStrateAct] = useState<Strate>({
        id_strate: -1,
        nom_colonne: '',
        nom_table: '',
        nom_strate: '',
        n_sample: 0,
        ids_enfants: null,
        est_racine: false,
        index_ordre: 0,
        logements_valides: null,
        superf_valide: null,
        date_valide: null,
        condition: {
            condition_type: 'equals',
            condition_valeur: 0
        }
    })
    const [strateParent, defStrateParent] = useState<number | null>(null);
    const [calculEnCours, defCalculEnCours] = useState<boolean>(false);
    const [feuillesPossibles, defFeuillesPossibles] = useState<FeuilleFinaleStrate[]>([])
    const [feuilleSelect, defFeuilleSelect] = useState<FeuilleFinaleStrate>({ id_strate: -1, desc_concat: '' })
    const [lots, defLots] = useState<FeatureCollection<Geometry, lotCadastralAvecBoolInvGeoJsonProperties>>({
        type: 'FeatureCollection',
        features: [
            {
                geometry: { type: 'Point', coordinates: [0, 0] },
                type: 'Feature',
                properties: {
                    g_no_lot: '',
                    g_va_suprf: 0,
                    g_nb_coo_1: 0,
                    g_nb_coord: 0,
                    bool_inv:false
                }
            }
        ]
    })
    const [lotSelect, defLotSelect] = useState<FeatureCollection<Geometry, lotCadastralAvecBoolInvGeoJsonProperties>|null>({
        type: 'FeatureCollection',
        features: [
            {
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                type: 'Feature',
                properties: {
                    g_no_lot: '',
                    g_va_suprf: 0,
                    g_nb_coo_1: 0,
                    g_nb_coord: 0,
                    bool_inv:false
                }
            }
        ]
    })
    const [inventairePert, defInventairePert] = useState<inventaire_stationnement[]>([])
    const [resultValid, defResultValid] = useState<EntreeValidation>({
        id_strate: -1,
        g_no_lot: '',
        n_places: 0,
        fond_tuile: '',
        id_val:-1
    })
    const [centre, defCentre] = useState<LatLngExpression>([-71.208, 46.813]);
    const [zoom, defZoom] = useState<number>(16);
    const [adresse,defAdresse] = useState<string>('');
    const [newValid,defNewValid] = useState<boolean>(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resStrates = await serviceValidation.obtiensStrates();
                const resFeuilles = await serviceValidation.obtiensFeuilles();

                if (resFeuilles.data.length > 0) {
                    defFeuillesPossibles(resFeuilles.data)
                    defFeuilleSelect(resFeuilles.data[0])
                    const resLots = await serviceCadastre.chercheCadastreQuery({ id_strate: resFeuilles.data[0].id_strate })
                    defLots(resLots.data)
                }
                console.log('Recu les strates', resStrates);
                defToutesStrates(resStrates.data)
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                //props.defCharge(false);
            }
        };

        fetchData();
    }, []); // Empty dependency array means this runs once when the component mounts
    return (
        <div className='page-validation-stat'>
            {calculEnCours === false ? <>
                <MenuBar />
                <ControlValStat
                    definitionStrate={definitionStrate}
                    defDefinitionStrate={defDefinitionStrate}
                    calculEnCours={calculEnCours}
                    defCalculEnCours={defCalculEnCours}
                    feuillesPossibles={feuillesPossibles}
                    defFeuillesPossibles={defFeuillesPossibles}
                    feuilleSelect={feuilleSelect}
                    defFeuilleSelect={defFeuilleSelect}
                    lots={lots}
                    defLots={defLots}
                />
                {definitionStrate === true ?
                    <DefinitionStratesEchantionnage
                        strateActuelle={strateActuelle}
                        defStrateActuelle={defStrateActuelle}
                        strates={toutesStrates}
                        defStrates={defToutesStrates}
                        anciennesStrates={anciennesStrates}
                        defAnciennesStrates={defAnciennesStrates}
                        ancienneStrateAct={ancienneStrateAct}
                        defAncienneStrateAct={defAncienneStrateAct}
                        idParent={strateParent}
                        defIdParent={defStrateParent}
                    />
                    :
                    <>
                        <PanneauValidation
                            feuilleStrate={feuilleSelect}
                            defFeuilleStrate={defFeuilleSelect}
                            lots={lots}
                            defLots={defLots}
                            inventairePert={inventairePert}
                            defInventairePert={defInventairePert}
                            entreeValid={resultValid}
                            defEntreeValid={defResultValid}
                            feuilleSelect={feuilleSelect}
                            centre={centre}
                            defCentre={defCentre}
                            zoom={zoom}
                            defZoom={defZoom}
                            lotSelect={lotSelect}
                            defLotSelect={defLotSelect}
                            adresse={adresse}
                            defAdresse={defAdresse}
                            newValid={newValid}
                            defNewValid={defNewValid}
                        />
                    </>
                }
            </>
                : <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '80vh'
                }}>
                    <ClimbingBoxLoader
                        loading={calculEnCours}
                        size={50}
                        color="#fff"
                        aria-label="Calculs en Cours - Prends ton mal en patience"
                        data-testid="loader"
                    />
                </div>
            }

        </div>
    )
}

export default ValidationStatistique