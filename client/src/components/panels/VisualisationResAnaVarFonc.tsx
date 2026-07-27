import { Settings } from "@mui/icons-material"
import { PropsVisualisationAnaVarFonc } from "../../types/InterfaceTypes"
import GraphiqueAnaVar from "../GraphiqueAnaVar"

const VisualisationResAnaVarFonc:React.FC<PropsVisualisationAnaVarFonc>=(props: PropsVisualisationAnaVarFonc)=>{
    return(
        <div className="pan-visualisation-resultats">
            <Settings
                onClick={() => props.defEditionParams(true)}
            />
            {(props.ensRegAAnalyser.length>0)?
                <div className="pan-vis-resultats-graph" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gridTemplateRows: 'repeat(2, 1fr)',
                    gap: '8px' // optional spacing
                    }}
                >
                    {Array.from({ length: 10 }, (_, i) => (
                        <GraphiqueAnaVar 
                            key={i} 
                            index={i} 
                            ensRegAGraph={props.ensRegAAnalyser}
                            ensRegReference={props.ensRegReference}
                            colorPalette={props.colorPalette}
                            voirInv={props.voirInv}
                            methodeVisualisation={props.methodeVisualisation}
                        />
                    ))}
                </div>
                :<>
                </>
            }
            
        </div>
    )
}

export default VisualisationResAnaVarFonc