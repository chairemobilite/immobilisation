import {Modal,Dialog,Box,Button} from '@mui/material'
import { PropsVersementCadastre } from '../../types/InterfaceTypes';
import {useState,FC,ChangeEvent} from 'react';
import { FeatureCollection,Geometry } from 'geojson';
import { lotCadastralGeoJsonProperties, quartiers_analyse } from '../../types/DataTypes';
import { serviceCadastre } from '../../services';
import LinearProgress from '@mui/material/LinearProgress';
import { ServiceGeoJson } from '../../services/serviceGeoJson';

const ModalVersementCadastre:FC<PropsVersementCadastre> = (props:PropsVersementCadastre) => {
    const [columns, setColumns] = useState<string[]>([]);
    const [gNoLotCol, setGNoLotCol] = useState('');
    const [gGSuprfCol, setGSuprfCol] = useState('');
    const [gLatCol, setGLatCol] = useState('');
    const [gLonCol,setGLongCol] = useState(''); 
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
        try {
            const {tempFileId,columns} = await ServiceGeoJson.verseFichierFlux(fileLoad,setProgress)
            setServerFileId(tempFileId)
            setColumns(columns)
        } catch (err) {
            console.error(err)
            alert('Échec du téléversement du fichier')
        }
    };

    const handleFileInsert = async()=>{
        const mapping: Record<string,string>={
            'g_no_lot':gNoLotCol,
            'g_nb_coord':gLonCol,
            'g_nb_coo_1':gLatCol,
            'g_va_suprf':gGSuprfCol
        }
        try{
            const response = await ServiceGeoJson.confirmeMajBDTemp(serverFileId,mapping,'cadastre')
            alert(`Inseré ${response.data} entrées cadastrales`)
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
                <h4>Modal de versement du cadastre</h4>
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
                
                {columns.length > 0 && (
                <>
                    <div className="form-group">
                    <label>Colonne pour g_no_lot</label>
                    <select
                        value={gNoLotCol}
                        onChange={(e) => setGNoLotCol(e.target.value)}
                    >
                        <option value="">-- sélectionner --</option>
                        {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                    </div>

                    <div className="form-group">
                        <label>Colonne pour superficie</label>
                        <select
                            value={gGSuprfCol}
                            onChange={(e) => setGSuprfCol(e.target.value)}
                        >
                            <option value="">-- sélectionner --</option>
                            {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" >
                        <label>Colonne pour la longitude du lot</label>
                        <select
                            value={gLonCol}
                            onChange={(e) => setGLongCol(e.target.value)}
                        >
                            <option value="">-- sélectionner --</option>
                            {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" >
                        <label>Colonne pour la latitude du lot</label>
                        <select
                            value={gLatCol}
                            onChange={(e) => setGLatCol(e.target.value)}
                        >
                            <option value="">-- sélectionner --</option>
                            {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>
                </>
                )}
                {gNoLotCol!=='' && gLatCol!=='' && gLonCol!=='' &&gGSuprfCol &&
                    <Button variant="outlined" onClick={handleFileInsert}>Importer le fichier dans la BD</Button>
                }
            </Box>
        </Dialog>
        </>
    )
}
export default ModalVersementCadastre;