import { FormControl, FormLabel, Input, InputLabel, MenuItem, Select, TextField, } from "@mui/material"
import { PropsModifStrate } from "../../types/InterfaceTypes"
import ArbreStrates from "../lists/arbreStrates"
import { Delete, Edit, Save } from "@mui/icons-material"
import { useEffect, useState } from "react"
import Cancel from "@mui/icons-material/Cancel"
import manipStrates from "../../utils/manipStrates"
import serviceValidation from "../../services/serviceValidation"
import { Strate } from "../../types/DataTypes"
import { ReponseStrateValide } from "../../types/serviceTypes"

const ModifStrates: React.FC<PropsModifStrate> = (props: PropsModifStrate) => {
    const [colonnesPossibles,defColonnesPossible] = useState<string[]>([]);
    useEffect(() => {
            const fetchData = async () => {
                try {
                    const resColonnes = await serviceValidation.obtiensColonnesValides();
                    defColonnesPossible(resColonnes.data)
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    //props.defCharge(false);
                }
            };
    
            fetchData();
        }, []); 

    const handleItemChange = (field: string, value: string) => {
        manipStrates.modifStrateAct(field, value, props.strateAct, props.strates, props.defStrateAct, props.defStrates)
    }

    const turnOnEditing = () => {
        props.defModif(true)
    }
    const saveEdits = async () => {
        props.defModif(false)
        let data: ReponseStrateValide
        if (props.strateAct.id_strate !== -1) {
            data = await serviceValidation.modifieStrate(props.strateAct.id_strate, props.strateAct)
        } else {
            if (props.idParent !== null) {
                data = await serviceValidation.nouvelleStrate(props.strateAct, props.idParent)
            } else {
                data = await serviceValidation.nouvelleStrate(props.strateAct, null)
            }
        }
        props.defIdParent(null)
        props.defStrates(data.data)
    }

    const gestSupprime=async(id_strate:number)=>{
            if (id_strate!==-1){
                const resultat = await serviceValidation.supprimeStrate(id_strate)
                props.defStrates(resultat.data)
                props.defStrateAct(resultat.data[0])
            } else{
                props.defStrates(props.anciennesStrates)
                props.defStrateAct(props.ancienneStrateAct)
                props.defAncienneStrateAct({
                    id_strate:-1,
                    nom_colonne:'',
                    nom_table:'',
                    nom_strate:'',
                    ids_enfants:[],
                    est_racine:true,
                    index_ordre:0,
                    logements_valides:null,
                    date_valide:null,
                    superf_valide:null,
                    condition:{
                        condition_type:'equals',
                        condition_valeur:0
                    }
                })
                props.defAnciennesStrates([])
            }
        }
    const cancelEditing = () => {
        props.defStrateAct(props.ancienneStrateAct)
        props.defStrates(props.anciennesStrates)
        props.defAncienneStrateAct({ 
            id_strate: -1, 
            nom_strate: '',
            nom_colonne: '', 
            nom_table: '', 
            index_ordre: 0, 
            est_racine: false, 
            ids_enfants: null, 
            logements_valides:null,
            date_valide:null,
            superf_valide:null,condition: { condition_type: 'equals', condition_valeur: 0 } })
        props.defAnciennesStrates([])
        props.defModif(false)
    }
    const selectValueLogVal = String(props.strateAct.logements_valides ?? 'null');
    const selectValueSupVal = String(props.strateAct.superf_valide ?? 'null');
    const selectValueDateVal = String(props.strateAct.date_valide ?? 'null');
    return (
        <div className="modif-strate">
            {!props.modif ? (<div className='strate-edit-del'><Edit sx={{ paddingBottom: "8px" }} onClick={turnOnEditing} /><Delete onClick={()=>gestSupprime(props.strateAct.id_strate)}/></div>) : (<div className='strate-save-cancel'><Save onClick={saveEdits} /><Cancel onClick={cancelEditing} /></div>)}
            <FormControl variant="standard" fullWidth sx={{ gap: 2 }}>
                <FormLabel sx={{ color: "white" }}>Informations de base</FormLabel>

                {["nom_strate"].map((field) => (
                    <TextField
                        key={field}
                        label={field.replace("_", " ").toUpperCase()}
                        value={(props.strateAct as any)[field]}
                        disabled={!props.modif}
                        onChange={(e) => handleItemChange(field, e.target.value)}
                        variant="standard"
                        sx={{
                            "& .MuiInputBase-input": {
                                color: "white",
                                backgroundColor: "#1f1f1f",
                            },
                            "& .MuiInputLabel-root": { color: "white" },
                            "& .MuiInputLabel-root.Mui-disabled": {
                                color: "#cccccc",
                                WebkitTextFillColor: "#cccccc",
                            },
                            "& .MuiInputBase-input.Mui-disabled": {
                                color: "#cccccc",
                                WebkitTextFillColor: "#cccccc",
                                opacity: 1,
                            },
                            "& .MuiInput-underline:before": { borderBottomColor: "white" },
                            "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                        }}
                    />
                ))}
                <FormControl variant="standard" fullWidth>
                <InputLabel
                        id="colonne-select-label"
                        sx={{
                            color: "#cccccc",
                            "&.Mui-disabled": { color: "#cccccc", WebkitTextFillColor: "#cccccc" },
                        }}
                    >
                        Colonne pour sélection strate
                </InputLabel>
                <Select
                        labelId="colonne-select-label"
                        value={props.strateAct.nom_colonne}
                        disabled={!props.modif}
                        onChange={(e) => handleItemChange("nom_colonne", String(e.target.value))}
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
                        {colonnesPossibles.map((valeur)=><MenuItem value={valeur} key={valeur}>{valeur}</MenuItem>)}
                </Select>
                </FormControl>
                {/* Floating Select */}
                <FormControl variant="standard" fullWidth>
                    <InputLabel
                        id="strate-select-label"
                        sx={{
                            color: "#cccccc",
                            "&.Mui-disabled": { color: "#cccccc", WebkitTextFillColor: "#cccccc" },
                        }}
                    >
                        Type de valeur
                    </InputLabel>
                    <Select
                        labelId="strate-select-label"
                        value={props.strateAct.condition.condition_type}
                        disabled={!props.modif}
                        onChange={(e) => handleItemChange("condition_type", String(e.target.value))}
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
                        <MenuItem value={"equals"}>Valeur exacte</MenuItem>
                        <MenuItem value={"range"}>Étendue</MenuItem>
                    </Select>
                </FormControl>
                {props.strateAct.condition.condition_type === "range" ?
                    <>{["condition_min", "condition_max"].map((field) =>
                        <TextField
                            key={field}
                            label={field.replace("_", " ").toUpperCase()}
                            value={(props.strateAct.condition as any)[field]}
                            disabled={!props.modif}
                            onChange={(e) => handleItemChange(field, e.target.value)}
                            variant="standard"
                            sx={{
                                "& .MuiInputBase-input": {
                                    color: "white",
                                    backgroundColor: "#1f1f1f",
                                },
                                "& .MuiInputLabel-root": { color: "white" },
                                "& .MuiInputLabel-root.Mui-disabled": {
                                    color: "#cccccc",
                                    WebkitTextFillColor: "#cccccc",
                                },
                                "& .MuiInputBase-input.Mui-disabled": {
                                    color: "#cccccc",
                                    WebkitTextFillColor: "#cccccc",
                                    opacity: 1,
                                },
                                "& .MuiInput-underline:before": { borderBottomColor: "white" },
                                "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                            }}
                        />
                    )
                    }</> : <>
                        <TextField
                            key={"condition_valeur"}
                            label={"Valeur exacte"}
                            value={props.strateAct.condition.condition_valeur}
                            disabled={!props.modif}
                            onChange={(e) => handleItemChange("condition_valeur", e.target.value)}
                            variant="standard"
                            sx={{
                                "& .MuiInputBase-input": {
                                    color: "white",
                                    backgroundColor: "#1f1f1f",
                                },
                                "& .MuiInputLabel-root": { color: "white" },
                                "& .MuiInputLabel-root.Mui-disabled": {
                                    color: "#cccccc",
                                    WebkitTextFillColor: "#cccccc",
                                },
                                "& .MuiInputBase-input.Mui-disabled": {
                                    color: "#cccccc",
                                    WebkitTextFillColor: "#cccccc",
                                    opacity: 1,
                                },
                                "& .MuiInput-underline:before": { borderBottomColor: "white" },
                                "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                            }}
                        />
                    </>
                }
                {props.strateAct.subStrata === undefined ?
                <>
                <TextField
                    key={'n_sample'}
                    label={'Taille Échantillon'}
                    value={props.strateAct.n_sample??0}
                    disabled={!props.modif}
                    onChange={(e) => handleItemChange('n_sample', e.target.value)}
                    variant="standard"
                    sx={{
                        "& .MuiInputBase-input": {
                            color: "white",
                            backgroundColor: "#1f1f1f",
                        },
                        "& .MuiInputLabel-root": { color: "white" },
                        "& .MuiInputLabel-root.Mui-disabled": {
                            color: "#cccccc",
                            WebkitTextFillColor: "#cccccc",
                        },
                        "& .MuiInputBase-input.Mui-disabled": {
                            color: "#cccccc",
                            WebkitTextFillColor: "#cccccc",
                            opacity: 1,
                        },
                        "& .MuiInput-underline:before": { borderBottomColor: "white" },
                        "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                    }}
                />
                <FormControl variant="standard" fullWidth>
                    <InputLabel
                        id="log-val-select-label"
                        sx={{
                            color: "#cccccc",
                            "&.Mui-disabled": { color: "#cccccc", WebkitTextFillColor: "#cccccc" },
                        }}
                    >
                        Condition logement valide
                    </InputLabel>
                    <Select
                        labelId="log-val-select-label"
                        value={selectValueLogVal}
                        disabled={!props.modif}
                        onChange={(e) => handleItemChange("logements_valides", String(e.target.value))}
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
                        <MenuItem value="true">Condition Vraie</MenuItem>
                        <MenuItem value="false">Condition Fausse</MenuItem>
                        <MenuItem value="null">Condition inactive</MenuItem>
                    </Select>
                </FormControl>
                <FormControl variant="standard" fullWidth>
                    <InputLabel
                        id="sup-val-select-label"
                        sx={{
                            color: "#cccccc",
                            "&.Mui-disabled": { color: "#cccccc", WebkitTextFillColor: "#cccccc" },
                        }}
                    >
                        Condition superficie valide
                    </InputLabel>
                    <Select
                        labelId="sup-val-select-label"
                        value={selectValueSupVal}
                        disabled={!props.modif}
                        onChange={(e) => handleItemChange("superf_valide", String(e.target.value))}
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
                        <MenuItem value="true">Condition Vraie</MenuItem>
                        <MenuItem value="false">Condition Fausse</MenuItem>
                        <MenuItem value="null">Condition inactive</MenuItem>
                    </Select>
                </FormControl>
                <FormControl variant="standard" fullWidth>
                    <InputLabel
                        id="date-val-select-label"
                        sx={{
                            color: "#cccccc",
                            "&.Mui-disabled": { color: "#cccccc", WebkitTextFillColor: "#cccccc" },
                        }}
                    >
                        Condition date valide
                    </InputLabel>
                    <Select
                        labelId="date-val-select-label"
                        value={selectValueDateVal}
                        disabled={!props.modif}
                        onChange={(e) => handleItemChange("date_valide", String(e.target.value))}
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
                        <MenuItem value="true">Condition Vraie</MenuItem>
                        <MenuItem value="false">Condition Fausse</MenuItem>
                        <MenuItem value="null">Condition inactive</MenuItem>
                    </Select>
                </FormControl>
                </>:<></>}
                
            </FormControl>
        </div>

    )
}

export default ModifStrates