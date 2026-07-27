import { FC } from "react"
import MenuBar from "../components/menus/MenuBar"
import './common.css'
import './creationOperateurs.css'
import PanneauCreationOperateurs from "../components/panels/PanneauCreationOperateurs"


const CreationOperateurs:FC=()=>{
    return(<div className="page-creation-operateurs">
        <MenuBar/>
        <PanneauCreationOperateurs/>
    </div>)
}

export default CreationOperateurs