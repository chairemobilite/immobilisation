import { Box, Dialog, Divider } from "@mui/material"
import { FC, useState } from "react"
import { PropsVersement } from "../../types/InterfaceTypes"
import FileUploadBox from "./FileUploadBox"
import { ServiceEnqueteOD } from "../../services/serviceEnqueteOD"
import ColumnDropDownListStd from "./ColumnDropDownListStd"
import ColumnDropDownListPageSelector from "./ColumnDropDownListPageSelector"
import ColumnDropDownListGeom from "./ColumnDropDownListGeom"
import BoutonApprobationVerse from "./BoutonApprobationVerse"


const ModalVersementOD:FC<PropsVersement> = (props:PropsVersement)=>{
    let allPages = props.champsARemplir.map((item)=>String(item.page))
    if(props.champsGeomARemplir!== undefined){
        props.champsGeomARemplir.map((item)=>allPages.push(String(item.page)))
    }
    let pages  = Array.from(new Set(allPages))
    if (pages.includes('undefined')){
        pages = pages.map((item)=>{if (item==='undefined'){return 'Autres'}else{return item}})
    }
    const [pageAct,defPageAct] = useState<string>(pages[0])
    const [colonnesFichier, defColonnesFichier] = useState<string[]>([]);
    const [idFichier,defIdFichier] = useState<string>('');
    const sxBox = {
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    bgcolor: '#1f1f1f',
                    color: 'white',
                    paddingTop: '20px',
                    padding: '10px',
                    display: 'grid',
                    gap: '10px',
                    width:'420px'
                }

    return(<>
        <Dialog
            open={props.modalOuvert}
            onClose={() => props.defModalOuvert(false)}
        >
            <Box
                sx={sxBox}
            >
                <FileUploadBox
                    colonnesFichier={colonnesFichier}
                    defColonnesFichier={defColonnesFichier}
                    idFichier={idFichier}
                    defIdFichier={defIdFichier}
                    accept='.csv'
                    title='Fichier CSV'
                    serviceUploadPeak={props.serviceUploadPeak}
                />
                
                <ColumnDropDownListPageSelector
                    colonnesFichier={colonnesFichier}
                    defColonnesFichier={defColonnesFichier}
                    pageAct={pageAct}
                    defPageAct={defPageAct}
                    pages={pages}
                />
                
                <ColumnDropDownListStd
                    colonnesFichier={colonnesFichier}
                    defColonnesFichier={defColonnesFichier}
                    champsARemplir={props.champsARemplir}
                    defChampsARemplir={props.defChampsARemplir}
                    pageAct={pageAct}
                />
                
                {
                    props.champsGeomARemplir&&props.defChampsGeomARemplir&&<>
                    <ColumnDropDownListGeom
                        colonnesFichier={colonnesFichier}
                        defColonnesFichier={defColonnesFichier}
                        champsgeomARemplir={props.champsGeomARemplir}
                        defChampsGeomARemplir={props.defChampsGeomARemplir}
                        pageAct={pageAct}
                    />
                    </>
                }
                <BoutonApprobationVerse
                    modalOuvert={props.modalOuvert}
                    defModalOuvert={props.defModalOuvert}
                    champsARemplir={props.champsARemplir}
                    champsGeomARemplir={props.champsGeomARemplir}
                    serviceMAJ={props.serviceMAJ}
                    idFichier={idFichier}
                    table={props.table}
                />
            </Box>
        </Dialog>
    </>)
}

export default ModalVersementOD