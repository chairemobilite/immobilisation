import {Modal,Dialog,Box,Button} from '@mui/material'
import { PropsVersSecAnalyse } from '../../types/InterfaceTypes';
import React from 'react';
import { FeatureCollection,Geometry } from 'geojson';
import { quartiers_analyse } from '../../types/DataTypes';
const modalVersementSecAnalyse:React.FC<PropsVersSecAnalyse> = (props:PropsVersSecAnalyse) => {
    const [file, setFile] = React.useState<File | null>(null);
    const [columns, setColumns] = React.useState<string[]>([]);
    const [idQuartierCol, setIdQuartierCol] = React.useState('');
    const [nomQuartierCol, setNomQuartierCol] = React.useState('');
    const [superficieQuartierCol, setSuperficieQuartierCol] = React.useState(''); 
    const [acronymeCol, setAcronymeCol] = React.useState('');
    const sxBox = {
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    bgcolor: '#1f1f1f',
                    color: 'white',
                    paddingTop: '20px',
                    padding: '10px',
                    display: 'grid',
                    gap: '10px',
                    width:'420px'
                }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        setFile(f);

        const reader = new FileReader();
        reader.onload = () => {
            try {
            const geojson = JSON.parse(reader.result as string);
            const firstFeature = geojson.features?.[0];
            if (firstFeature?.properties) {
                setColumns(Object.keys(firstFeature.properties));
            }
            } catch (err) {
            console.error('GeoJSON invalide', err);
            }
        };
        reader.readAsText(f);
    };

    const handleFileLoad = () => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const geojson = JSON.parse(reader.result as string);
                const geojson_out:FeatureCollection<Geometry,quartiers_analyse> = {
                    type: "FeatureCollection",
                    features:geojson.features.map((feature:any)=>{
                        const properties_out:quartiers_analyse = {
                            id_quartier: feature.properties[idQuartierCol],
                            nom_quartier: feature.properties[nomQuartierCol],
                        };
                        if (superficieQuartierCol!==''){
                            properties_out.superf_quartier = feature.properties[superficieQuartierCol];
                        }
                        if (acronymeCol!==''){
                            properties_out.acro = feature.properties[acronymeCol];
                        }
                        return {
                            type: "Feature",
                            geometry: feature.geometry,
                            properties: properties_out
                        }
                    })
                }
                props.setSecAnalyseNew(geojson_out);
                console.log('Fichier chargé et converti en format interne.')
                props.setModalOuvert(false);
            } catch (err) {
                console.error('GeoJSON invalide', err);
                alert('GeoJSON invalide')
            }
        };
        reader.readAsText(file);
    };
    return(
        <>
        <Dialog
            open={props.modalOuvert}
            onClose={() => props.setModalOuvert(false)}
        >
            <Box
                sx={sxBox}
            >
                <h4>Modal de versement des secteurs d'analyse</h4>
                <div className="form-group">
                    <label>Fichier GeoJSON</label>
                    <input
                        type="file"
                        accept=".geojson,.json"
                        onChange={handleFileChange}
                    />
                </div>

                    {columns.length > 0 && (
                    <>
                        <div className="form-group">
                        <label>Colonne pour id_quartier</label>
                        <select
                            value={idQuartierCol}
                            onChange={(e) => setIdQuartierCol(e.target.value)}
                        >
                            <option value="">-- sélectionner --</option>
                            {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        </div>

                        <div className="form-group">
                            <label>Colonne pour nom_quartier</label>
                            <select
                                value={nomQuartierCol}
                                onChange={(e) => setNomQuartierCol(e.target.value)}
                            >
                                <option value="">-- sélectionner --</option>
                                {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" >
                            <label>Colonne pour superficie quartier</label>
                            <select
                                value={superficieQuartierCol}
                                onChange={(e) => setSuperficieQuartierCol(e.target.value)}
                            >
                                <option value="">-- sélectionner --</option>
                                {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" >
                            <label>Acronyme</label>
                            <select
                                value={acronymeCol}
                                onChange={(e) => setAcronymeCol(e.target.value)}
                            >
                                <option value="">-- sélectionner --</option>
                                {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                    </>
            )}
            {idQuartierCol!=='' && nomQuartierCol!=='' && file && (
                <Button
                    onClick={() => handleFileLoad()}
                    variant="outlined"
                >
                    Charger les données
                </Button>)}
            </Box>
        </Dialog>
        </>
    )
}
export default modalVersementSecAnalyse;