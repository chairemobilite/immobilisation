import { Modal,Box } from "@mui/material"
import FiltreReglement from "./filtreReglement"
import { ModalFiltrageReglementProps } from "../../types/InterfaceTypes"
const FiltrerReglementDansLeurPage:React.FC<ModalFiltrageReglementProps>=(props)=>{
    const gestFermetureModal = ()=>{
        props.defModalOuvert(false)
    }
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 300,
        width: 'auto',
        // This is key:
        maxHeight: '80vh', // Or any value
        overflowY: 'auto', // Enables scrolling
        bgcolor: 'black',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    return(<>
    <Modal
        open={props.modalOuvert}
        onClose={gestFermetureModal}
    >
        <Box sx={style}>
            <Box sx={{ overflowY: 'auto' }}>
            <form onSubmit={(e) => e.preventDefault()}>
                {/*Recherche Reglement*/}
                <FiltreReglement
                    resultatReglements={props.reglementVisu}
                    defResultatReglements={props.defReglementVisu}
                    tousReglements={props.tousReglements}
                    defTousReglement={props.defTousReglement}
                />
            </form>
            </Box>
        </Box>
    </Modal>
    </>)
}

export default FiltrerReglementDansLeurPage;