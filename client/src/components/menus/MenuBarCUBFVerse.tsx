import { FileOpen } from "@mui/icons-material"
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react"
import serviceUtilisationDuSol from "../../services/serviceUtilisationDuSol"
import { utilisation_sol } from "../../types/DataTypes"

interface PropsMenuBarCUBFVerse{
    modalOuvert:boolean,
    defModalOuvert:Dispatch<SetStateAction<boolean>>,
    cubf:utilisation_sol[]
    defCubf:Dispatch<SetStateAction<utilisation_sol[]>>
    cubfN1Opts:utilisation_sol[]
    defCubfN1Opts:Dispatch<SetStateAction<utilisation_sol[]>>
}


const MenuBarVerseCUBF:FC<PropsMenuBarCUBFVerse> =(
        props:PropsMenuBarCUBFVerse
    )=>{
  
    
    const [cubfOptsN2,defCubfOptsN2] = useState<utilisation_sol[]>([])
    const [cubfOptsN3,defCubfOptsN3] = useState<utilisation_sol[]>([])
    const [cubfN1,defCubfN1] = useState<number|null>(null);
    const [cubfN2,defCubfN2] = useState<number|null>(null);
    const [cubfN3,defCubfN3] = useState<number|null>(null);
    useEffect(()=>{
        const fetchData =async ()=>{
            const results = await serviceUtilisationDuSol.obtientUtilisationDuSol(-1)
            props.defCubfN1Opts(results.data)
        }
        fetchData()

    },[])
    async function handleLevelOneChange(value:number){
        if (value === -1){
            defCubfN1(null)
            defCubfN2(null)
            defCubfN3(null)
            const result = await serviceUtilisationDuSol.obtientUtilisationDuSol(-1)
            props.defCubf(result.data)
        }else{

            defCubfN1(value)
            const result = await serviceUtilisationDuSol.obtientUtilisationDuSol(value,true)
            defCubfOptsN2(result.data)
            props.defCubf(result.data)
            defCubfOptsN3([])
        }
    }
    async function handleLevelTwoChange(value:number){
        if (value === -1 && cubfN1!==null){
            const result = await serviceUtilisationDuSol.obtientUtilisationDuSol(cubfN1,true)
            defCubfOptsN2(result.data)
            props.defCubf(result.data)
            defCubfN2(null)
            defCubfN3(null)
        }else{

            defCubfN2(value)
            const result = await serviceUtilisationDuSol.obtientUtilisationDuSol(value,true)
            defCubfOptsN3(result.data)
            props.defCubf(result.data)
            defCubfN3(null)
        }
    }
    async function handleLevelThreeChange(value:number){
        if (value === -1 && cubfN2!==null){
            const result = await serviceUtilisationDuSol.obtientUtilisationDuSol(cubfN2,true)
            defCubfOptsN3(result.data)
            props.defCubf(result.data)
            defCubfN3(null)
        }else{
            defCubfN3(value)
            const result = await serviceUtilisationDuSol.obtientUtilisationDuSol(value,true)
            props.defCubf(result.data)
        }
    }
    return(<div className="menu-verse-cubf">
        <FileOpen
            onClick={()=> {props.defModalOuvert(true); defCubfOptsN2([]);defCubfOptsN3([]);defCubfN1(null);defCubfN2(null);defCubfN3(null)
            }}
        />
        <FormControl>
            <InputLabel id="select-n1"
                    sx={{
                        color: 'white',
                        '&.Mui-focused': { color: 'white' },
                        '&.MuiInputLabel-shrink': { color: 'white' },
                    }}
                >
                    Niveau 1
            </InputLabel>
            <Select
                labelId="select-n1"
                value={cubfN1!==null?cubfN1:-1}
                sx={{
                        backgroundColor: 'black',
                        color: 'white',
                        '& .MuiSvgIcon-root': { color: 'white' }, // arrow
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#aaa' },
                    }}
                onChange={(e)=>handleLevelOneChange(Number(e.target.value))}
            >
                <MenuItem value={-1}>Tous</MenuItem>
                {props.cubfN1Opts.map(item=><MenuItem key={item.cubf}value={item.cubf}>{item.description}</MenuItem>)}
            </Select>
        </FormControl>
        {cubfN1!== null?
            <FormControl>
                <InputLabel id="select-n2"
                    sx={{
                        color: 'white',
                        '&.Mui-focused': { color: 'white' },
                        '&.MuiInputLabel-shrink': { color: 'white' },
                    }}
                >
                    Niveau 2
            </InputLabel>
            <Select
                labelId="select-n2"
                value={cubfN2!==null?cubfN2:-1}
                sx={{
                        backgroundColor: 'black',
                        color: 'white',
                        '& .MuiSvgIcon-root': { color: 'white' }, // arrow
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#aaa' },
                    }}
                onChange={(e)=>handleLevelTwoChange(Number(e.target.value))}
            >
                <MenuItem value={-1}>Tous</MenuItem>
                {cubfOptsN2.map(item=><MenuItem value={item.cubf}>{item.description}</MenuItem>)}
            </Select>
            </FormControl>:<></>}
        {cubfN2!== null?
            <FormControl>
                <InputLabel id="select-n3"
                    sx={{
                        color: 'white',
                        '&.Mui-focused': { color: 'white' },
                        '&.MuiInputLabel-shrink': { color: 'white' },
                    }}
                >
                    Niveau 3
            </InputLabel>
            <Select
                labelId="select-n3"
                value={cubfN3!==null?cubfN3:-1}
                sx={{
                        backgroundColor: 'black',
                        color: 'white',
                        '& .MuiSvgIcon-root': { color: 'white' }, // arrow
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#aaa' },
                    }}
                onChange={(e)=>handleLevelThreeChange(Number(e.target.value))}
            >
                <MenuItem value={-1}>Tous</MenuItem>
                {cubfOptsN3.map(item=><MenuItem value={item.cubf}>{item.description}</MenuItem>)}
            </Select>
            </FormControl>:<></>}
    </div>)
}

export default MenuBarVerseCUBF 