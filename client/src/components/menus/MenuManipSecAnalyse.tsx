import React from 'react';
import { propsMenuSecAnalyse } from '../../types/InterfaceTypes';
import {Edit,Upload,FileOpen} from '@mui/icons-material';
import {Select,MenuItem} from '@mui/material';
import Button from '@mui/material/Button';
import { serviceQuartiersAnalyse } from '../../services';

const MenuManipSecAnalyse:React.FC<propsMenuSecAnalyse> = (props:propsMenuSecAnalyse) => {
    const gereSauvegarde = async() => {  
        const data = await serviceQuartiersAnalyse.ecraseSecteursAnalyse(props.secAnalyseNew);
        if (data.success){
            alert('Sauvegarde Réussie');
            props.setSecAnalyseAct(props.secAnalyseNew);
            props.setSecAnalyseNew({
                type: "FeatureCollection",
                features: []
            });
        } else{
            alert('Erreur lors de la sauvegarde');
        }
    }
    return(
        <div className='menu-manip-sec-analyse'>
            
            <Select
                value={props.optionsVis.idSecs}
                onChange={(e) => {
                    const selectedOption = props.optionVisPoss.find(
                    (option) => option.idSecs === Number(e.target.value)
                    );
                    if (selectedOption) {
                    props.setOptionsVis(selectedOption);
                    }
                }}
                sx={{
                    backgroundColor: 'black',
                    minWidth: '300px',
                    color: 'white',
                    '& .MuiSvgIcon-root': { color: 'white' }, // arrow
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#aaa' },
                    
                }}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            bgcolor: 'black',
                            color: 'white',
                        },
                    },
                }}
            >
                {props.optionVisPoss.map((option) => (
                    <MenuItem 
                        key={option.idSecs} 
                        value={option.idSecs}
                        selected={option.idSecs === props.optionsVis.idSecs}
                        sx={{
                            backgroundColor: 'black',
                            color: 'white',
                            '&.Mui-selected': {
                                backgroundColor: '#222',
                                color: 'white',
                            },
                            '&.Mui-selected:hover': {
                                backgroundColor: '#333',
                            },
                        }}
                    >
                        {option.description}
                    </MenuItem>
                ))}
            </Select>
            {props.optionsVis.idSecs === 1?<FileOpen onClick={() => props.setModalOuvert(!props.modalOuvert)}/>:<></>}
            {props.optionsVis.idSecs === 1 && props.secAnalyseNew.features.length >0 ?<Button variant="outlined" onClick={() => gereSauvegarde()}> Écraser anciens Secteurs</Button>:<></>}
        </div>
    )
}

export default MenuManipSecAnalyse;