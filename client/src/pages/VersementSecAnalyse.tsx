import React,{useEffect,useState} from 'react';
import MenuBar from '../components/menus/MenuBar';

import ModalVersementSecAnalyse from '../components/uploadComponents/ModalVersementSecAnalyse';
import './versementSecAnalyse.css';
import './common.css';
import { quartiers_analyse } from '../types/DataTypes';
import { FeatureCollection,Geometry } from 'geojson';
import MenuManipSecAnalyse from '../components/menus/MenuManipSecAnalyse';
import TableSecAnalyse from '../components/tables/TableSecAnalyse';    
import { NouveauAncienSecteurAnalyse } from '../types/InterfaceTypes';
import { serviceQuartiersAnalyse } from '../services';
import CarteSecAnalyse from '../components/maps/CarteSecAnalyse';
import { LatLngExpression } from 'leaflet';
const VersementSecAnalyse: React.FC = () => {
    const [modal, setModal] = React.useState<boolean>(false);
    const [secAnalyseAct, setSecAnalyseAct] = React.useState<FeatureCollection<Geometry,quartiers_analyse>>({type:"FeatureCollection",features:[]});
    const [secAnalyseNew, setSecAnalyseNew] = React.useState<FeatureCollection<Geometry,quartiers_analyse>>({type:"FeatureCollection",features:[]});
    const [optionsVis, setOptionsVis] = React.useState<NouveauAncienSecteurAnalyse>({idSecs:0,description:'BD'});

    const[positionDepart,defPositionDepart] = useState<LatLngExpression>([46.85,-71]);
    const[zoomDepart,defZoomDepart] = useState<number>(10);

    const[territoireSelect,defTerritoireSelect] = useState<number>(-1);
    useEffect( () => {
        const fetchData = async () => {
            const reponse = await serviceQuartiersAnalyse.chercheTousQuartiersAnalyse();
            setSecAnalyseAct(reponse.data);
        }
        fetchData();
    }, []);
    const optionsVisPoss: NouveauAncienSecteurAnalyse[] = [
        {
            idSecs: 0,
            description: "BD",
        },
        {
            idSecs: 1,
            description: "Nouveaux secteurs d'analyse",
        }
    ];
    /*
    useEffect(() => {
            const fetchData = async () => {
                const quartiers = await serviceQuartiersAnalyse.chercheTousQuartiersAnalyse();
                setSecAnalyseAct(quartiers.data);
            };
            fetchData();
        }, []);*/
    return(
        <div className="page-sec-analyse">
            <MenuBar/>
            <MenuManipSecAnalyse
                modalOuvert={modal}
                setModalOuvert={setModal}
                secAnalyseAct={secAnalyseAct}
                setSecAnalyseAct={setSecAnalyseAct}
                secAnalyseNew={secAnalyseNew}
                setSecAnalyseNew={setSecAnalyseNew}
                optionsVis={optionsVis}
                setOptionsVis={setOptionsVis}
                optionVisPoss={optionsVisPoss}
            />
            <ModalVersementSecAnalyse 
                modalOuvert={modal} 
                setModalOuvert={setModal}
                secAnalyseNew={secAnalyseNew}
                setSecAnalyseNew={setSecAnalyseNew}
            />
            <div className="contenu-sec-analyse">
                {secAnalyseAct.features.length > 0 || secAnalyseNew.features.length > 0 ? <>
                <TableSecAnalyse 
                    secAnalyseMontrer={optionsVis.idSecs === 0 ? secAnalyseAct : secAnalyseNew}
                    setSecAnalyseMontrer={optionsVis.idSecs === 0 ? setSecAnalyseAct : setSecAnalyseNew}
                    optionSecteurAnalyse={optionsVis}
                />
                <CarteSecAnalyse
                    territoires={optionsVis.idSecs === 0 ? secAnalyseAct : secAnalyseNew}
                    defTerritoires={optionsVis.idSecs === 0 ? setSecAnalyseAct : setSecAnalyseNew}
                    territoireSelect={territoireSelect}
                    defTerritoireSelect={defTerritoireSelect}
                    startPosition={positionDepart}
                    setStartPosition={defPositionDepart}
                    startZoom={zoomDepart}
                    setStartZoom={defZoomDepart}
                /></>
                :
                <></>}
            </div>
        </div>
    )
};

export default VersementSecAnalyse;