import React from 'react';
import { propsMenuSecAnalyse, PropsMenuVersementCadastre } from '../../types/InterfaceTypes';
import {Edit,Upload,FileOpen} from '@mui/icons-material';
import {Select,MenuItem} from '@mui/material';
import Button from '@mui/material/Button';
import { serviceQuartiersAnalyse } from '../../services';

const MenuManipCadastre:React.FC<PropsMenuVersementCadastre> = (props:PropsMenuVersementCadastre) => {
    
    return(
        <div className='menu-manip-cadastre'>
            <FileOpen onClick={() => props.defModalOuvert(!props.modalOuvert)}/>
        </div>
    )
}

export default MenuManipCadastre;