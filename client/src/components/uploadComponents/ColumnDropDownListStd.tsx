import { FC, useState } from "react"
import { PropsStdColumnsDropDown } from "../../types/InterfaceTypes"
import { Divider, FormControl, InputLabel, MenuItem, Select } from "@mui/material"


const ColumnDropDownListStd:FC<PropsStdColumnsDropDown>=(props:PropsStdColumnsDropDown)=>{

    const handleMapping = (field:string,value:string)=>{
        const newEqui = props.champsARemplir.map((ligne)=>{
            if(ligne.colonne_db!==field){
                return ligne
            }else{
                return{...ligne,colonne_fichier:value}
            }})
        props.defChampsARemplir(newEqui)
    }
    return(<>
    {props.colonnesFichier.length > 0 && <>
    <span>Propriétés {props.pageAct}</span>
        {
            props.champsARemplir.map((champs) => {
                if((champs.page!== undefined  && champs.page ===props.pageAct)||(champs.page===undefined && props.pageAct==='Autres') ){
                    return(<>
                    <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
                        <InputLabel id="select-objet"
                            sx={{
                                color: 'white',
                                '&.Mui-focused': { color: 'white' },
                                '&.MuiInputLabel-shrink': { color: 'white' },
                            }}
                        >
                            {champs.description}
                        </InputLabel>
                        <Select
                            labelId="select-objet"
                            id="select-n-charts"
                            value={champs.colonne_fichier}
                            onChange={(e) => handleMapping(champs.colonne_db,e.target.value)}
                            label={champs.description}
                            sx={{
                                backgroundColor: 'black',
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
                            <MenuItem 
                                value={''}
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
                                Changez cette valeur
                            </MenuItem>
                            {props.colonnesFichier.map((item)=>{
                                return(
                                    <MenuItem 
                                        value={item}
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
                                        {item}
                                    </MenuItem>
                                )
                            })}
                        </Select>
                    </FormControl>
                    </>)
                } else{
                    return (<></>)
                }
            
            })
        }
            <Divider variant="middle" sx={{borderColor:'white'}} />
    </>}
    </>)
}

export default ColumnDropDownListStd