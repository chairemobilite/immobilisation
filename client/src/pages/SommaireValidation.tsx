import { useState } from "react";
import MenuBar from "../components/menus/MenuBar";
import MenuSommaireValidation from "../components/menus/MenuSommaireValidation";
import './common.css';
import './SommaireValidation.css'
import GraphiqueReglements from "../components/charts/GraphiqueReglement";
import GraphiqueSommaireValidation from "../components/charts/GraphiqueSommaireValidation";

const SommaireValidation:React.FC=()=>{
    const [nGraphs,defNGraphs] = useState<number>(2);
    const [xMax,defXMax] = useState<number|null>(3);
    const [variable,defVariable] = useState<"pred_par_reel"|"reel_par_pred"|'bland_altman'|'reel_vs_pred'>("pred_par_reel")
    return(
    <div className='page-sommaire-valid'>
        <MenuBar/>
        <h2 style={{flex:0,textAlign:'center'}}>Résultats validation</h2>
        <MenuSommaireValidation
            xMax={xMax}
            defXMax={defXMax}
            nPlots={nGraphs}
            defNPlots={defNGraphs}
            variable={variable}
            defVariable={defVariable}
        />
        <div className="graphique-rendu">
            <div className="pan-vis-resultats-graph" style={{
                flex: "1 1 0",
                height: "100%",
                width: "100%",
                minHeight: 0,
                display: "grid",
                gridTemplateRows: `repeat(2, 1fr)`,
                gridTemplateColumns: `repeat(${nGraphs/2}, 1fr)`,
                gap: "8px",
            }}>
                {Array.from({ length: nGraphs }, (_, i) => (
                                 <div className="graphique" key={i}>
                                <GraphiqueSommaireValidation 
                                    key={i} 
                                    xMax={xMax}
                                    variable={variable}
                                />
                                </div>
                            ))}
            </div>
        </div>
    </div>
    )
}

export default SommaireValidation;