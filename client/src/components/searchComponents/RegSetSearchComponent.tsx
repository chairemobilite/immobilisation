/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Component that is used to set search parameters for various regulation sets
*/

import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Box } from "@mui/system";
import { Dispatch, SetStateAction, useState } from "react";
import { ensemble_reglements_stationnement, entete_ensembles_reglement_stationnement } from "../../types/DataTypes";
import { serviceEnsemblesReglements } from "../../services/serviceEnsemblesReglements";

interface RSSCInterface{
    setRegSet:Dispatch<SetStateAction<entete_ensembles_reglement_stationnement[]>>
}

export default function RegSetSearchComponent(props:RSSCInterface){
    const [descSearch, setDescSearch] = useState<string | null>(null);
    const [startYear, setStartYear] = useState<number | null>(null);
    const [endYear, setEndYear] = useState<number | null>(null);
    const [startYearCard, setStartYearCard] = useState<'before' | 'after' | 'unused'>('unused');
    const [endYearCard, setEndYearCard] = useState<'before' | 'after' | 'unused'>('unused');

     function handleChangeInputs(newVal: string | number, target: string) {
            if (target === 'desc_search' && typeof newVal === 'string') {
                setDescSearch(newVal)
            }
            if (target === 'start_year' && typeof newVal === 'number') {
                setStartYear(newVal)
            }
            if (target==='end_year'&& typeof newVal === 'number'){
                setEndYear(newVal)
            }
            if (target==='start_year_card'&&(
                    newVal==='unused'||
                    newVal==='before'||
                    newVal==='after')
            ){
                if (newVal==='unused'){
                    setStartYear(null)
                }else if (startYear===null && (newVal==='before'||newVal==='after')){
                    setStartYear(1940)
                }
                setStartYearCard(newVal)
            }
            if (target==='end_year_card'&&(
                    newVal==='unused'||
                    newVal==='before'||
                    newVal==='after')
            ){
                if (newVal==='unused'){
                    setEndYear(null)
                }else if (endYear===null && (newVal==='before'||newVal==='after')){
                    setEndYear(2025)
                }
                setEndYearCard(newVal)
            }
        }
    
        async function handleRegSetSearch(){
            let searchBody={}
            if (descSearch!==''&&descSearch!==null){
                searchBody={...searchBody,descriptionLike:descSearch}
            }
            if (startYearCard==='before'){
                searchBody={...searchBody,dateDebutAvant:startYear}
            }
            if (startYearCard==='after'){
    
                searchBody={...searchBody,dateDebutApres:startYear}
            }
            if (endYearCard==='before'){
                searchBody={...searchBody,dateFinAvant:endYear}
            }
            if (endYearCard==='after'){
    
                searchBody={...searchBody,dateFinApres:endYear}
            }
            try {
                const ensregPos = await serviceEnsemblesReglements.chercheEntetesParPropriete(searchBody)
                if (ensregPos.success===true){
                    props.setRegSet(ensregPos.data)
                }
            } catch(err:any){
                console.error(err.message)
                alert('erreur en obtenant les ensembles de règlements ')
            }
        }
    return(
        <Box
            sx={{
                   width: 400, // was 100px — likely too narrow
                    bgcolor: "background.paper",
                    p: 3,
                    gap: 2,
                    flexDirection:'column',
                    display: "flex",
                }}
        >
            <TextField
                    label="Recherche description"
                    value={descSearch??''}
                    onChange={(e) => handleChangeInputs(e.target.value, "desc_search")}
                    fullWidth={true}
                />
                <FormControl
                    fullWidth={true}
                >
                    <InputLabel>
                        Opération année début
                    </InputLabel>
                <Select
                    value={startYearCard}
                    onChange={(e)=>handleChangeInputs(e.target.value,'start_year_card')}
                    label='Opération année début'
                    fullWidth={true}
                >
                    <MenuItem
                        key={'unused'}
                        value={'unused'}
                    >
                        Ne pas utiliser
                    </MenuItem>
                    <MenuItem
                        key={'before'}
                        value={'before'}
                    >
                        Avant
                    </MenuItem>
                    <MenuItem
                        key={'after'}
                        value={'after'}
                    >
                        Après
                    </MenuItem>
                </Select>
                </FormControl>
                <TextField
                    type="number"
                    label="Année début"
                    disabled={startYearCard==='unused'}
                    value={startYear??''}
                    onChange={(e) => handleChangeInputs(Number(e.target.value), "start_year")}
                    fullWidth={true}
                />
                <FormControl
                fullWidth={true}
                >
                    <InputLabel>Opération année fin</InputLabel>
                <Select
                    value={endYearCard}
                    onChange={(e)=>handleChangeInputs(e.target.value,'end_year_card')}
                    label='Opération année fin'
                    fullWidth={true}
                >
                    <MenuItem
                        key={'unused'}
                        value={'unused'}
                    >
                        Ne pas utiliser
                    </MenuItem>
                    <MenuItem
                        key={'before'}
                        value={'before'}
                    >
                        Avant
                    </MenuItem>
                    <MenuItem
                        key={'after'}
                        value={'after'}
                    >
                        Après
                    </MenuItem>
                </Select>
                </FormControl>
                <TextField
                    disabled={endYearCard==='unused'}
                    value={endYear??''}
                    type="number"
                    label="Année fin"
                    onChange={(e) => handleChangeInputs(Number(e.target.value), "end_year")}
                    fullWidth={true}
                />
                <Button
                    variant='outlined'
                    onClick={handleRegSetSearch}
                    fullWidth={true}
                >
                    Initier recherche
                </Button>
        </Box>
    )
}