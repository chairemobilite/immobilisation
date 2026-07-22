import { FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import { FC } from "react"
import { PropsDropDownListGeom } from "../../types/InterfaceTypes"

const ColumnDropDownListPoint: FC<PropsDropDownListGeom> = (props: PropsDropDownListGeom) => {
    const handlePointMapping=(field:string,coordinate:string,value:string)=>{
        const newValues = props.champsGeomARemplir.map((item)=>{
            if(item.colonne_db!==field){
                return {...item}
            }else{
                return{...item,desc_geometrie:{...item.desc_geometrie,[coordinate]:value}}
            }
        })
        props.defChampsGeomARemplir(newValues)
    }
    return (<>
        <span>{props.geometrieActuelle.description}</span>
        {props.geometrieActuelle.desc_geometrie.type ==='Point'&&<>
        <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
            
            <InputLabel id="select-lon-label"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                {props.geometrieActuelle.desc_geometrie.descriptionXLon}
            </InputLabel>
            <Select
                labelId="select-lon-label"
                id="select-lon"
                value={props.geometrieActuelle.desc_geometrie.colonneXLon}
                onChange={(e) => handlePointMapping(props.geometrieActuelle.colonne_db,'colonneXLon' , e.target.value)}
                label={props.geometrieActuelle.desc_geometrie.descriptionXLon}
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
                {props.colonnesFichier.map((item) => {
                    return (
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
        <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
            <InputLabel id="select-lat-label"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                {props.geometrieActuelle.desc_geometrie.descriptionYLat}
            </InputLabel>
            <Select
                labelId="select-lat-label"
                id="select-lat"
                value={props.geometrieActuelle.desc_geometrie.colonneYLat}
                onChange={(e) => handlePointMapping(props.geometrieActuelle.colonne_db,'colonneYLat' , e.target.value)}
                label={props.geometrieActuelle.desc_geometrie.descriptionYLat}
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
                {props.colonnesFichier.map((item) => {
                    return (
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
        </FormControl></>
        }
    </>)
}

export default ColumnDropDownListPoint