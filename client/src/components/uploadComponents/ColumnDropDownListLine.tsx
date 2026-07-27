import { FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import { PropsDropDownListGeom } from "../../types/InterfaceTypes"
import { FC } from "react"

const ColumnDropDownListLine: FC<PropsDropDownListGeom> = (props: PropsDropDownListGeom) => {
    const handleLineMapping=(colonne_db:string,extre:'deb'|'fin',LatOuLong:string,colonneFichierAffect:string)=>{
        const newValues = props.champsGeomARemplir.map((item)=>{
             if(extre==='deb' && item.desc_geometrie.type==='Ligne' && item.colonne_db===colonne_db){
                return{
                    ...item,
                    desc_geometrie:{
                        ...item.desc_geometrie,
                        pointDeb:{
                            ...item.desc_geometrie.pointDeb,
                            [LatOuLong]:colonneFichierAffect
                        }
                    }
                }
            } else if(extre==='fin' && item.desc_geometrie.type==='Ligne'&& item.colonne_db===colonne_db){
                return{
                    ...item,
                    desc_geometrie:{
                        ...item.desc_geometrie,
                        pointFin:{
                            ...item.desc_geometrie.pointFin,
                            [LatOuLong]:colonneFichierAffect
                        }
                    }
                }
            }else{
                return{...item}
            }
        })
        props.defChampsGeomARemplir(newValues)
    }
    return (<>
        <span>{props.geometrieActuelle.description}</span>
        {props.geometrieActuelle.desc_geometrie.type ==='Ligne'&&<>
        <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
            
            <InputLabel id="select-lon-label-ori"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                {props.geometrieActuelle.desc_geometrie.pointDeb.descriptionXLon}
            </InputLabel>
            <Select
                labelId="select-lon-label-ori"
                id="select-lon-ori"
                value={props.geometrieActuelle.desc_geometrie.pointDeb.colonneXLon}
                onChange={(e) => handleLineMapping(props.geometrieActuelle.colonne_db,'deb','colonneXLon' , e.target.value)}
                label={props.geometrieActuelle.desc_geometrie.pointDeb.descriptionXLon}
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
            <InputLabel id="select-lat-label-ori"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                {props.geometrieActuelle.desc_geometrie.pointDeb.descriptionYLat}
            </InputLabel>
            <Select
                labelId="select-lat-label-ori"
                id="select-lat-ori"
                value={props.geometrieActuelle.desc_geometrie.pointDeb.colonneYLat}
                onChange={(e) => handleLineMapping(props.geometrieActuelle.colonne_db,'deb','colonneYLat' , e.target.value)}
                label="N Graphes"
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
            
            <InputLabel id="select-lon-label-des"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                {props.geometrieActuelle.desc_geometrie.pointFin.descriptionXLon}
            </InputLabel>
            <Select
                labelId="select-lon-label-des"
                id="select-lon-des"
                value={props.geometrieActuelle.desc_geometrie.pointFin.colonneXLon}
                onChange={(e) => handleLineMapping(props.geometrieActuelle.colonne_db,'fin','colonneXLon' , e.target.value)}
                label={props.geometrieActuelle.desc_geometrie.pointFin.descriptionXLon}
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
            <InputLabel id="select-lat-label-des"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                {props.geometrieActuelle.desc_geometrie.pointFin.descriptionYLat}
            </InputLabel>
            <Select
                labelId="select-lat-label-des"
                id="select-lat-des"
                value={props.geometrieActuelle.desc_geometrie.pointFin.colonneYLat}
                onChange={(e) => handleLineMapping(props.geometrieActuelle.colonne_db,'fin','colonneYLat' , e.target.value)}
                label={props.geometrieActuelle.desc_geometrie.pointFin.descriptionYLat}
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
        </>
        
        }
    </>)
}

export default ColumnDropDownListLine