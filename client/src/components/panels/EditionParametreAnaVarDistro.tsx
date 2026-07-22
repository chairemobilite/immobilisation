import { ArrowBack } from "@mui/icons-material";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { SetStateAction } from "react";


const EditionParametreAnaVarDistro: React.FC<
    {
        voirInv: boolean,
        defVoirInv: React.Dispatch<SetStateAction<boolean>>,
        defEditionParams: React.Dispatch<SetStateAction<boolean>>
    }> =
    (
        props: {
            voirInv: boolean,
            defVoirInv: React.Dispatch<SetStateAction<boolean>>,
            defEditionParams: React.Dispatch<SetStateAction<boolean>>
        }
    ) => {
        const gestChangementBaseX = (value:string)=>{
            if (value==='false'){
                props.defVoirInv(false)
            }else{
                props.defVoirInv(true)
            }
        }

        return (<div className="pan-parametres">
            <div>
                <ArrowBack
                    onClick={() => props.defEditionParams(false)}
                /> Retour à la page de comparaison
            </div>
            <div style={{ height: 24 }} />
            <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
                <InputLabel id="select-reference-ER-label"
                    sx={{
                        color: 'white',
                        '&.Mui-focused': { color: 'white' },
                        '&.MuiInputLabel-shrink': { color: 'white' },
                    }}
                >
                    Format de l'axe des X
                </InputLabel>
                <Select
                    labelId="select-reference-ER-label"
                    id="select-reference-ER"
                    value={String(props.voirInv)}
                    onChange={(e) => gestChangementBaseX(e.target.value)}
                    label="Methode analyse"
                    sx={{
                        backgroundColor: 'black',
                        minWidth: 300,
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
                        key={'false'}
                        value={'false'}
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
                        }}>
                        Aucune référence
                    </MenuItem>
                    <MenuItem
                        key={'true'}
                        value={'true'}
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
                        }}>
                        Inventaire
                    </MenuItem>

                </Select>

            </FormControl>



        </div>)
    }
export default EditionParametreAnaVarDistro;