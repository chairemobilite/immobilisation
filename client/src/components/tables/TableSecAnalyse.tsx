import React, { FC,useState,useEffect } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material"
import { propsParamSecAnalyse } from '../../types/InterfaceTypes';
import { FeatureCollection, Geometry } from 'geojson';
import { quartiers_analyse, quartiers_analyse_db } from '../../types/DataTypes';
import { Edit,Calculate,Save, Delete,Cancel, SwapHoriz } from '@mui/icons-material';
import { serviceQuartiersAnalyse } from '../../services';
import { justifyContent, width } from '@mui/system';
const TableSecAnalyse: FC<propsParamSecAnalyse> = (props:propsParamSecAnalyse) => {
    const [edit,setEdit] = React.useState<number>(-1);
    const [ancienSetup,setAncienSetup] = React.useState<FeatureCollection<Geometry,quartiers_analyse>>({type:"FeatureCollection",features:[]});
    const manipulerTexte = (id_quartier:number,champs:string,nouvelleValeur:string): void => {
        // Implementation here
        const nouveauQuartiers = {
            type: "FeatureCollection",
            features: props.secAnalyseMontrer.features.map(feature => {
                if (feature.properties.id_quartier === id_quartier) {
                    return {
                        ...feature,
                        properties: {
                            ...feature.properties,
                            [champs]: nouvelleValeur
                        }
                    };
                }
                return feature;
            })
        } as FeatureCollection<Geometry, quartiers_analyse>;
        props.setSecAnalyseMontrer(nouveauQuartiers);
    }

    const gereEdition = (id_quartier:number): void => {
        setEdit(id_quartier);
        setAncienSetup(props.secAnalyseMontrer);
    };
    const gereAnnulation = (): void => {
        setEdit(-1);
        props.setSecAnalyseMontrer(ancienSetup);
    };

    const gereSauvegarde = async():Promise<void> => {
        const entree_modif = props.secAnalyseMontrer.features.find((feature)=>feature.properties.id_quartier===edit);
        if (entree_modif){
            const secteurs_a_sauvegarder:quartiers_analyse_db= {
                id_quartier:entree_modif.properties.id_quartier,
                nom_quartier:entree_modif.properties.nom_quartier??'',
                superf_quartier:entree_modif.properties.superf_quartier??0,
                acro:entree_modif.properties.acro??'',
                geometry:entree_modif.geometry??{type:"Point",coordinates:[0,0]},
            };
            const reponse = await serviceQuartiersAnalyse.modifieQuartierAnalyse(edit,secteurs_a_sauvegarder);
            if (reponse.success){
                const quartier_modifie = props.secAnalyseMontrer.features.map((feature)=>{
                    if (feature.properties.id_quartier===edit){
                        return{
                            type:"Feature",
                            properties:{
                                id_quartier:reponse.data.features[0].properties.id_quartier,
                                nom_quartier:reponse.data.features[0].properties.nom_quartier,
                                superf_quartier:reponse.data.features[0].properties.superf_quartier,
                                acro:reponse.data.features[0].properties.acro
                            },
                            geometry:reponse.data.features[0].geometry
                        }
                    } else{
                        return feature;
                    }
                });
                props.setSecAnalyseMontrer({
                    type: "FeatureCollection",
                    features: quartier_modifie
                } as FeatureCollection<Geometry,quartiers_analyse>);
                setEdit(-1);
            } else{
                alert('Erreur lors de la sauvegarde');
            }
        }
    
    };

    const gereSuppression = async():Promise<void> => {

    };
    const [tableWidth, setTableWidth] = useState(40);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = () => setIsDragging(true);

    const handleMouseMove = (e: MouseEvent): void => {
        if (!isDragging) return;
        const newWidth = Math.max(20, Math.min(90, (e.clientX / window.innerWidth) * 100));
        setTableWidth(newWidth);
    };
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

const handleMouseUp = () => setIsDragging(false);
    return(<>
        <div className="table-sec-analyse" style={{width:`${tableWidth}vw`}}>
            <TableContainer component={Paper} sx={{
                    maxHeight: '100%',
                    overflowY: 'auto',
                    overflowX: 'auto'
                }}>
                <Table stickyHeader>
                    <TableHead >
                        <TableRow>
                            <TableCell>ID Quartier</TableCell>
                            <TableCell>Nom Quartier</TableCell>
                            <TableCell>Superficie (m²)</TableCell>
                            <TableCell>Acronyme</TableCell>
                            {props.optionSecteurAnalyse.idSecs === 0 ? (
                                <>
                                    <TableCell>{edit===-1?'Edit':'Save'}</TableCell>
                                    <TableCell>{edit===-1?'Delete':'Cancel'}</TableCell>
                                </>):(
                                    <>
                                    </>
                                )
                            }
                        </TableRow>
                    </TableHead>
                    <TableBody >
                        {props.secAnalyseMontrer.features.map((feature) => (
                            <TableRow key={feature.properties.id_quartier}>
                                <TableCell>{feature.properties.id_quartier}</TableCell>
                                <TableCell>
                                    {props.optionSecteurAnalyse.idSecs === 1 || edit === feature.properties.id_quartier ? (
                                    <TextField 
                                        value={feature.properties.nom_quartier??''} 
                                        onChange={(e) => manipulerTexte(feature.properties.id_quartier, 'nom_quartier', e.target.value)}
                                    />):
                                    feature.properties.nom_quartier??''}
                                </TableCell>
                                <TableCell 
                                    sx={{ verticalAlign: 'center'}}
                                >
                                    {props.optionSecteurAnalyse.idSecs === 1 || edit === feature.properties.id_quartier?(
                                    <Calculate/>):<></>}
                                    {feature.properties.superf_quartier??''}
                                </TableCell>
                                <TableCell>
                                    {props.optionSecteurAnalyse.idSecs === 1 || edit === feature.properties.id_quartier?(<TextField 
                                        value={feature.properties.acro??''} 
                                        onChange={(e) => manipulerTexte(feature.properties.id_quartier, 'acro', e.target.value)}
                                    />):
                                    feature.properties.acro??''}
                                </TableCell>
                                <TableCell>
                                    {edit !== feature.properties.id_quartier ? (
                                        <Edit onClick={() => gereEdition(feature.properties.id_quartier)}/>
                                    ):(
                                        <Save onClick={() => gereSauvegarde()}/>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {edit !== feature.properties.id_quartier ? (
                                        <Delete/>
                                    ):(
                                        <Cancel onClick={gereAnnulation}/>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <SwapHoriz onMouseDown={handleMouseDown} />
        </div>
        
        </>
    )
}

export default TableSecAnalyse;