import { ArrowBack, PropaneSharp, Settings } from "@mui/icons-material";
import { ControlValStatProps } from "../../types/InterfaceTypes";
import { Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { width } from "@mui/system";
import serviceValidation from "../../services/serviceValidation";
import { serviceCadastre } from "../../services";



const ControlValStat : React.FC<ControlValStatProps>=(props:ControlValStatProps)=>{
    const regenereInputs=async()=>{
        if (props.calculEnCours===false){
            props.defCalculEnCours(true)
            try {
                await serviceValidation.regenereInputs()
            }catch(err:any){
                alert('Erreur lors de la génération des inputs')
            } finally {
                props.defCalculEnCours(false)
            }
        }
    }

    const handleItemChange = async(valeur:string)=>{
        const idStrateSearch = Number(valeur)
        const nouvelleFeuille = props.feuillesPossibles.find((rangee)=>rangee.id_strate ===idStrateSearch)??{id_strate:-1,desc_concat:''}
        props.defFeuilleSelect(nouvelleFeuille)
        if (nouvelleFeuille.id_strate!==-1){
            const lotsRecus = await serviceCadastre.chercheCadastreQuery({id_strate:nouvelleFeuille.id_strate})
            props.defLots(lotsRecus.data)
        }
    }
    const selectedStrate = props.feuilleSelect.id_strate
    return(<div className='validation-menu'>
        {props.definitionStrate===false ?
            <>
                <Settings
                    className="menu-icon-valid"
                    onClick={()=>props.defDefinitionStrate(!props.definitionStrate)}
                />
                <FormControl variant="standard">
                    <InputLabel
                        id="strate-valid-label"
                        sx={{
                            color: "#cccccc",
                            "&.Mui-disabled": { color: "#cccccc", WebkitTextFillColor: "#cccccc" },
                        }}
                    >
                        Strate à valider
                    </InputLabel>
                    <Select
                        labelId="strate-valid-label"
                        value={String(selectedStrate)}
                        onChange={(e) => handleItemChange(String(e.target.value))}
                        sx={{
                            "& .MuiSelect-select": { color: "white", backgroundColor: "#1f1f1f" },
                            "& .MuiSelect-select.Mui-disabled": {
                                color: "#cccccc",
                                WebkitTextFillColor: "#cccccc",
                                opacity: 1,
                            },
                            "& .MuiInput-underline:before": { borderBottomColor: "white" },
                            "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                        }}
                    >
                        {props.feuillesPossibles.map((rangee)=>
                            <MenuItem value={String(rangee.id_strate)}>{rangee.desc_concat} - n = {rangee.n_sample?? 'N/A'} - N = {rangee.popu_strate??'N/A'}</MenuItem>
                        )}
                    </Select>
                </FormControl>
            </>
            :
            <>
                <ArrowBack
                    className="menu-icon-valid"
                    onClick={()=>props.defDefinitionStrate(!props.definitionStrate)}
                />
                <Button variant="outlined"  
                onClick={regenereInputs}
                sx={{
                    ml: 2,
                    color: 'white',
                    borderColor: 'white',
                    borderWidth:'2px',
                    '&:hover': {
                        backgroundColor: '#222',
                        borderColor: 'white',
                    },
                }}>
                    Regénérer table entrée stratification
                </Button>
            </>
        }
    </div>)
}

export default ControlValStat