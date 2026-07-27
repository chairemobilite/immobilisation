import MenuBar from '../components/menus/MenuBar'
import TableSommaireVersementDonnees from '../components/tables/TableSommaireVersementDonnees'
import './common.css'
import './sommaireVersement.css'
import {FC} from 'react'

const SommaireVersement:FC =()=>{
    return(
        <div className="page-sommaire-versement">
            <MenuBar/>
            <TableSommaireVersementDonnees/>
        </div>
    )
}

export default SommaireVersement