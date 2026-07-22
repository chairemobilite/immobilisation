import { useState } from "react"
import { PropsInterfaceStrates } from "../../types/InterfaceTypes"
import ArbreStrates from "../lists/arbreStrates"
import ModifStrates from "./modifStrates"

const DefinitionStratesEchantionnage:React.FC<PropsInterfaceStrates>=(props:PropsInterfaceStrates)=>{
    const [modif, defModif] = useState<boolean>(false)
    return(
        <div className='onglet-definition-strates'>
            <ArbreStrates
                strates={props.strates}
                defStrates={props.defStrates}
                strateAct={props.strateActuelle}
                defStrateAct={props.defStrateActuelle}
                modif={modif}
                defModif={defModif}
                ancienneStrateAct={props.ancienneStrateAct}
                defAncienneStrateAct={props.defAncienneStrateAct}
                anciennesStrates={props.anciennesStrates}
                defAnciennesStrates={props.defAnciennesStrates}
                idParent={props.idParent}
                defIdParent={props.defIdParent}
            />
            <ModifStrates
                strateAct={props.strateActuelle}
                defStrateAct={props.defStrateActuelle}
                strates={props.strates}
                defStrates={props.defStrates}
                modif={modif}
                defModif={defModif}
                ancienneStrateAct={props.ancienneStrateAct}
                defAncienneStrateAct={props.defAncienneStrateAct}
                anciennesStrates={props.anciennesStrates}
                defAnciennesStrates={props.defAnciennesStrates}
                idParent={props.idParent}
                defIdParent={props.defIdParent}
            />
        </div>
    )
}

export default DefinitionStratesEchantionnage;