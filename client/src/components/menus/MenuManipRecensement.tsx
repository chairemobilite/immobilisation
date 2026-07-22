import React from 'react';
import { PropsMenuVersementRecens } from '../../types/InterfaceTypes';
import {FileOpen} from '@mui/icons-material';
import {Select,MenuItem, Menu} from '@mui/material';
import { serviceRecensement } from '../../services/serviceRecensement';
import { BoundsToArray, LatLngBoundsToBounds } from '../../map/utils/LatLngBndsToBounds';

const MenuManipRecensement:React.FC<PropsMenuVersementRecens> = (props:PropsMenuVersementRecens) => {
    const gestionChangementAnnee =async (nouvelleValeur:2016|2021)=>{
        console.log('Changement annee recense')
        if(nouvelleValeur === 2016 ){
            props.defAnneeRecens(nouvelleValeur)
            props.defTableModif('census_population_2016')
            props.defEquiv(props.equivOptions[2016])
            const bounds = LatLngBoundsToBounds(props.limites)
            if (bounds!==null){
                console.log('bbox dispo')
                const resultat = await serviceRecensement.chercheRecensementQuery({annee:nouvelleValeur,bbox:BoundsToArray(bounds)})
                props.defDonnees(resultat.data)
            }else{
                console.log('bbox non dispo')
            }
        }
        if(nouvelleValeur=== 2021 ){
            props.defAnneeRecens(nouvelleValeur)
            props.defTableModif('census_population')
            props.defEquiv(props.equivOptions[2021])
            const bounds = LatLngBoundsToBounds(props.limites)
            if (bounds!==null){
                console.log('bbox dispo')
                const resultat = await serviceRecensement.chercheRecensementQuery({annee:nouvelleValeur,bbox:BoundsToArray(bounds)})
                props.defDonnees(resultat.data)
            }else{
                console.log('bbox non dispo')
            }
        }
        
    }
    return(
        <div className='menu-manip-recensement'>
            <FileOpen onClick={() => props.defModalOuvert(!props.modalOuvert)}/>
            <Select 
                value={props.anneeRecens} 
                onChange={(e)=>gestionChangementAnnee(e.target.value)}
                sx={{
                    backgroundColor: 'black',
                    color: 'white',
                    '& .MuiSvgIcon-root': { color: 'white' }, // arrow
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#aaa' },
                }}
            >
                <MenuItem key={2016} value={2016}>2016</MenuItem>
                <MenuItem key={2021} value={2021}>2021</MenuItem>
            </Select>
        </div>
    )
}

export default MenuManipRecensement;