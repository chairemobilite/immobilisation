import MenuBar from "../components/menus/MenuBar";
import React,{useState} from 'react';
import './versementCadastre.css';
import './common.css';
import MenuManipCadastre from "../components/menus/MenuVersementCadastre";
import ModalVersementCadastre from "../components/uploadComponents/ModalVersementCadastre";
import CarteVisionnementCadastre from "../components/maps/CarteVisionnementCadastre";

const VersementCadastre:React.FC =() =>{
    const [modalSelectionCadastreOuvert,defModalSelectionCadastreOuvert] = useState<boolean>(false);

    return(
        <div className='page-versement-visu-cadastre'>
            <MenuBar/>
            <MenuManipCadastre
                modalOuvert={modalSelectionCadastreOuvert}
                defModalOuvert={defModalSelectionCadastreOuvert}
            />
            <ModalVersementCadastre
                modalOuvert={modalSelectionCadastreOuvert}
                defModalOuvert={defModalSelectionCadastreOuvert}
            />
            <>
            {
                <CarteVisionnementCadastre/>
            }
            </>
            
        </div>
    )
}

export default VersementCadastre;