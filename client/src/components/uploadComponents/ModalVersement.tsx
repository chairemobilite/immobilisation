import {Modal,Dialog,Box,Button} from '@mui/material'
import { PropsVersement } from '../../types/InterfaceTypes';
import {useState,FC,ChangeEvent} from 'react';
import { serviceCadastre } from '../../services';
import LinearProgress from '@mui/material/LinearProgress';
import { ServiceGeoJson } from '../../services/serviceGeoJson';
import { EquivalenceVersementCarto } from '../../types/DataTypes';

const ModalVersementGen:FC<PropsVersement> = (props:PropsVersement) => {
    const [columns, setColumns] = useState<string[]>([]);
    const [progress, setProgress] = useState<number>(0);
    const [serverFileId, setServerFileId] = useState<string>('')
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

    const handleFileLoad = async(fileLoad:File) => {
        if (!fileLoad) return;
        const {tempFileId,columns} = await props.serviceUploadPeak(fileLoad,setProgress)
        console.log(tempFileId)
        setServerFileId(tempFileId)
        setColumns(columns)
    };
    const handleMapping = (field:string,value:string)=>{
        const newEqui = props.champsARemplir.map((ligne)=>{
            if(ligne.colonne_db!==field){
                return ligne
            }else{
                return{...ligne,colonne_fichier:value}
            }})
        props.defChampsARemplir(newEqui)
    }

    const handleFileInsert = async()=>{
        const mappingColonnes = Object.values(props.champsARemplir)
        .filter(i => i.obligatoire || i.colonne_fichier !== '')
        .reduce((acc, i) => {
            acc[i.colonne_db] = i.colonne_fichier;
            return acc;
        }, {} as Record<string, string>);
        try{
            const response = await props.serviceMAJ(serverFileId,mappingColonnes,props.table)
            alert(`Inseré ${response.data} entrées `)
        }catch(err:any){
            console.log(err)
            alert('Échec d insertion')
        } finally{
            props.defModalOuvert(false)
        }

    }
    return(
        <>
        <Dialog
            open={props.modalOuvert}
            onClose={() => props.defModalOuvert(false)}
        >
            <Box
                sx={sxBox}
            >
                <h4>{props.title}</h4>
                <div className="form-group">
                    <label>Fichier GeoJSON</label>
                    <input
                        type="file"
                        accept=".geojson,.json"
                        onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;

                            await handleFileLoad(f);
                        }}
                    />
                    <LinearProgress variant="determinate" value={progress} />
                </div>
                

                {columns.length > 0 && props.champsARemplir.map((champs) => (
                <div className="form-group" key={champs.colonne_db}>
                    <label>Colonne pour {champs.description} ({champs.colonne_db})</label>
                    <select
                        value={champs.colonne_fichier}
                        onChange={(e) => handleMapping(champs.colonne_db, e.target.value)}
                    >
                    <option value="">-- sélectionner --</option>
                    {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                    ))}
                    </select>
                </div>
                ))}
                            
                { props.champsARemplir.every(val => val.colonne_fichier !== ''||val.obligatoire===false) &&
                    <Button variant="outlined" onClick={handleFileInsert}>Importer le fichier dans la BD</Button>
                }
            </Box>
        </Dialog>
        </>
    )
}
export default ModalVersementGen;