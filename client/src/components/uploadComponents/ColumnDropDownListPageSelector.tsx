import { FC, useState } from "react"
import { PropsPageSelect, PropsStdColumnsDropDown } from "../../types/InterfaceTypes"
import { Divider, FormControl, InputLabel, MenuItem, Select } from "@mui/material"


const ColumnDropDownListStd:FC<PropsPageSelect>=(props:PropsPageSelect)=>{


    return(<>
    {props.colonnesFichier.length>0 && <>
        <FormControl variant="outlined" size="medium" style={{ minWidth: 120 }}>
            <InputLabel id="select-objet"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                Page
            </InputLabel>
            <Select
                labelId="select-objet"
                id="select-n-charts"
                value={props.pageAct}
                onChange={(e) => props.defPageAct(String(e.target.value))}
                label="Page"
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
                
                {props.pages.map((item)=>{
                    return(
                        <MenuItem value={item}sx={{
                            backgroundColor: 'black',
                            color: 'white',
                            '&.Mui-selected': {
                                backgroundColor: '#222',
                                color: 'white',
                            },
                            '&.Mui-selected:hover': {
                                backgroundColor: '#333',
                            },
                        }}>{item}</MenuItem>
                    )
                })}
            </Select>
        </FormControl>
        <Divider variant="middle" sx={{borderColor:'white'}} />
    </>}
    </>)
}

export default ColumnDropDownListStd