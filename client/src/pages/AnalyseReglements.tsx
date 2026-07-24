import React,{useState,useEffect} from 'react';
import MenuBar from '../components/menus/MenuBar';
import './analyseReglements.css'
import GraphiqueReglements from '../components/charts/GraphiqueReglement';
import { entete_ensembles_reglement_stationnement } from '../types/DataTypes';
import { serviceEnsemblesReglements } from '../services';
import ControlAnaReg from '../components/menus/ControlAnaReg';

const AnalyseReglements:React.FC = () =>{
    const [nGraphiques,defNGraphiques] = useState<number>(4);
    const [EnsRegAVis,defEnseRegAVis] = useState<number[]>([]);
    
    const colorPalette = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe'
    ];

    const getColsFromCount = (count: number): number => {
        switch (count) {
            case 2: return 2;
            case 4: return 2;
            case 6: return 3;
            case 8: return 4;
            case 10: return 5;
            default: return 2; // fallback
        }
    };

    return(
        <div className="page-comp-reg">
            <MenuBar/>
            <ControlAnaReg
                nGraphiques={nGraphiques}
                defNGraphiques={defNGraphiques}
                ensRegSelectionnesHaut={EnsRegAVis}
                defEnsRegSelectionnesHaut={defEnseRegAVis}
                colorPalette={colorPalette}
            />
            <div className="comp-reg-charts" style={{ gridTemplateColumns: `repeat(${getColsFromCount(nGraphiques)}, 1fr)` }}>
                {Array.from({ length: nGraphiques }, (_, i) => (
                    <GraphiqueReglements 
                        key={i} 
                        index={i} 
                        ensRegSelectionnesHaut={EnsRegAVis}
                        colorPalette={colorPalette}
                    />
                ))}
            </div>
        </div>
    )
}
export default AnalyseReglements;