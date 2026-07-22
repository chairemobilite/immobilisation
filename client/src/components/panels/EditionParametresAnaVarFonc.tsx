import { ArrowBack } from "@mui/icons-material";
import { PropsEditionParametresAnaVarFonc } from "../../types/InterfaceTypes";
import React, { useEffect, useState } from 'react'
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { comptes_utilisations_sol, entete_ensembles_reglement_stationnement, ProprietesRequetesER } from "../../types/DataTypes";
import { serviceEnsemblesReglements } from "../../services/serviceEnsemblesReglements";
import serviceUtilisationDuSol from "../../services/serviceUtilisationDuSol";

const EditionParametresAnaVarFonc: React.FC<PropsEditionParametresAnaVarFonc> = (props: PropsEditionParametresAnaVarFonc) => {
    const [entetesEnsRegAAnalyser, defEntetesEnsRegAAnalyser] = useState<entete_ensembles_reglement_stationnement[]>([])

    const [niveauxCUBFPossibles, defNiveauxCUBFPossibles] = useState<comptes_utilisations_sol[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            if (props.ensRegAAnalyser.length > 0) {
                const requete: ProprietesRequetesER = {
                    idER: props.ensRegAAnalyser
                }

                const reponseEnsReg = await serviceEnsemblesReglements.chercheEntetesParPropriete(requete)
                defEntetesEnsRegAAnalyser(reponseEnsReg.data)
            }
        }
        fetchData()
    }, [props.ensRegAAnalyser])
    /*useEffect(() => {
        const fetchCUBF = async () => {
            if (niveauxCUBFPossibles.length === 0) {
                const reponse = await serviceUtilisationDuSol.obtientComptesUtilsiationSol()
                const comptesPossibles: comptes_utilisations_sol[] = reponse.data
                defNiveauxCUBFPossibles(reponse.data)
                const niveauMin = Math.min(...Array.from(new Set(comptesPossibles.map((entree) => entree.niveau))))
                const niveauSelectDeBase = comptesPossibles.find((entree) => entree.niveau === niveauMin)
                props.defNiveauCUBF(niveauSelectDeBase ?? { niveau: -1, description: 'invalide', n_entrees: 0 })
            }
        }
        fetchCUBF();
    }, [props.editionParams])*/

    const gestChangementEnsRegReference = (idEnsReg: number) => {
        props.defEnsRegReference(idEnsReg)
    }

    const gestChangementNiveau = (niveauASelect: number) => {
        const niveau = niveauxCUBFPossibles.find((entree) => entree.niveau === niveauASelect) ?? { niveau: -1, description: 'invalide', n_entrees: 0 }
        props.defNiveauCUBF(niveau)
    }
    return (
        <div className="pan-parametres">
            <div>
            <ArrowBack
                onClick={() => props.defEditionParams(false)}
            /> Retour à la page de comparaison
            </div>
            <div style={{ height: 24 }} />
                {props.ensRegAAnalyser.length>0?<><FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
                    <InputLabel id="select-reference-ER-label"
                        sx={{
                            color: 'white',
                            '&.Mui-focused': { color: 'white' },
                            '&.MuiInputLabel-shrink': { color: 'white' },
                        }}
                    >
                        Ensemble Règlement de Référence
                    </InputLabel>
                    <Select
                        labelId="select-reference-ER-label"
                        id="select-reference-ER"
                        value={props.ensRegReference}
                        onChange={(e) => gestChangementEnsRegReference(Number(e.target.value))}
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
                            key={-1}
                            value={-1}
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

                        {entetesEnsRegAAnalyser.map((val) => (
                            <MenuItem
                                key={val.id_er}
                                value={val.id_er}
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
                                {val.description_er}
                            </MenuItem>
                        ))}
                    </Select>
                    
                </FormControl></>:<><p style={{ color: 'red' }}>Sélectionner des ensembles de règlements</p></>}
                

            {/* Finesse de la comparaison */}
            {/*<FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
                <InputLabel id="select-level-label"
                    sx={{
                        color: 'white',
                        '&.Mui-focused': { color: 'white' },
                        '&.MuiInputLabel-shrink': { color: 'white' },
                    }}
                >
                    Finesse de la comparaison
                </InputLabel>
                <Select
                    labelId="select-level-label"
                    id="select-level"
                    value={props.niveauCUBF.niveau}
                    onChange={(e) => gestChangementNiveau(Number(e.target.value))}
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
                    {niveauxCUBFPossibles.map((val) => (
                        <MenuItem
                            key={val.niveau}
                            value={val.niveau}
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
                            {val.description} - N valeurs {val.n_entrees}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>*/}
            
        </div>
    )
}

export default EditionParametresAnaVarFonc;