import { FC, useState } from "react"
import MenuBar from "../components/menus/MenuBar"
import TableVisuCUBF from "../components/tables/TableVisuCUBFVerse"
import './versementCUBF.css'
import './common.css'
import MenuBarVerseCUBF from "../components/menus/MenuBarCUBFVerse"
import { EquivalenceVersementCarto, utilisation_sol } from "../types/DataTypes"
import ModalVersementOD from "../components/uploadComponents/ModalVersementOD"
import { ServiceFichierCSV } from "../services/serviceFichierCSV"

const VersementCUBF:FC=()=>{
    const [modalOuvert,defModalOuvert] = useState<boolean>(false)
    const [utilSol,defUtilSol] = useState<utilisation_sol[]>([])
    const [cubfOptsN1,defCubfOptsN1] = useState<utilisation_sol[]>([])
    const [equivalenceFDB, defEquivalenceFBD] = useState<EquivalenceVersementCarto[]>(
            [
                {
                    colonne_db:'cubf',
                    description:"Code d'utilisation du bien-fonds",
                    colonne_fichier:``,
                    obligatoire:true,
                },
                {
                    colonne_db:'description',
                    description: 'Description du code',
                    colonne_fichier:``,
                    obligatoire:true,
                },
            ]
        )
    return(
        <div className="page-versement-cubf">
            <MenuBar/>
            <MenuBarVerseCUBF
                modalOuvert={modalOuvert}
                defModalOuvert={defModalOuvert}
                cubf={utilSol}
                defCubf={defUtilSol}
                cubfN1Opts={cubfOptsN1}
                defCubfN1Opts={defCubfOptsN1}
            />
            <ModalVersementOD
                modalOuvert={modalOuvert}
                defModalOuvert={defModalOuvert}
                champsARemplir={equivalenceFDB}
                defChampsARemplir={defEquivalenceFBD}
                title='Versement des CUBF'
                table='cubf'
                serviceUploadPeak={ServiceFichierCSV.verseFichierFlux}
                serviceMAJ={ServiceFichierCSV.confirmeMAJBDTemp}
            />
            <TableVisuCUBF
                modalOuvert={modalOuvert}
                utilSol={utilSol}
                defUtilSol={defUtilSol}
                defUtilSolN1={defCubfOptsN1}
            />
        </div>)
}
export default VersementCUBF