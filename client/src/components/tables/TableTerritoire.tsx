import React,{useState,useRef} from 'react';
import { territoire, territoireGeoJsonProperties } from '../../types/DataTypes';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { Delete, Edit,Save,Cancel } from "@mui/icons-material";
import {Button,TextField, TableCell, TableContainer,TableRow,Table,TableHead,TableBody,Paper} from '@mui/material';
import { TableTerritoireProps } from '../../types/InterfaceTypes';
import { serviceTerritoires } from '../../services';
import {FeatureCollection,Geometry,Feature} from 'geojson';

const TableTerritoire:React.FC<TableTerritoireProps> =(props:TableTerritoireProps)=> {
    const panelRef = useRef<HTMLDivElement>(null);
    const handleMouseDown = (e: React.MouseEvent) => {
            const startY = e.clientY;
            const startHeight = panelRef.current ? panelRef.current.offsetHeight : 0;
    
            const handleMouseMove = (e: MouseEvent) => {
                const newHeight = startHeight + (startY - e.clientY);
                if (panelRef.current) {
                    panelRef.current.style.height = `${newHeight}px`;
                }
            };
    
            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
    
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };
    const [territoireEdit,defTerritoireEdit] = useState<number>(0);
    const [ancientTerritoires,defAncienTerritoires] = useState<FeatureCollection<Geometry,territoireGeoJsonProperties>>({type:'FeatureCollection',features:[]})
    const saveGeoJSON = ( filename = "data.geojson") => {
        const blob = new Blob([JSON.stringify(props.territoires)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        };
    const gestDebutModifTerritoires =(id_periode_geo:number)=>{
        if (id_periode_geo >0){
            defTerritoireEdit(id_periode_geo??0)
            defAncienTerritoires(props.territoires as FeatureCollection<Geometry,territoireGeoJsonProperties>)
            props.defEditionEnCours(true)
        }
    }
    const verseDonnees = async() => {
        // À implémenter : fonction pour verser les données
        const dataReturn = await serviceTerritoires.ajouteTerritoiresEnBloc(props.periodeSelect,props.secTerritoireNew)
        if (dataReturn.success===true){
            props.defTerritoire(dataReturn.data)
            props.defSecTerritoireNew({type:'FeatureCollection',features:[]})
            props.defNouvelleCartoDispo(false)
        } else{
            alert('Échec')
        }
    };
    const annuleVersement = () => {
        // À implémenter : fonction pour annuler le versement
        props.defNouvelleCartoDispo(false);
        props.defSecTerritoireNew({type: "FeatureCollection", features: []});
    };

    const gestSupprimeUnTerr = async (id_periode_geo: number | null) => {
        if (id_periode_geo && id_periode_geo > 0) {
            const res = await serviceTerritoires.supprimeTerritoire(id_periode_geo);
            if (res === true) {
                const nouvTerr: FeatureCollection<Geometry, territoireGeoJsonProperties> = {
                    type: 'FeatureCollection',
                    features: props.territoires.features.filter(
                        (item:any): item is Feature<Geometry, territoireGeoJsonProperties> =>
                            (item.properties as territoireGeoJsonProperties).id_periode_geo !== id_periode_geo
                    )
                };
                props.defTerritoire(nouvTerr);
            } else {
                alert('Erreur');
            }
        }
    };

    const gereEditionPropsTerr= (id_periode_geo:number,newValue:string,field:string)=>{
        //implementer
        const updatedFeature ={
            type:'FeatureCollection',
            features:props.territoires.features.map((feature)=>{
                if (feature.properties?.id_periode_geo===id_periode_geo){
                    return {
                        type:'Feature',
                        geometry:feature.geometry,
                        properties:{
                            ...feature.properties,
                            [field]:newValue
                        }
                    }
                } else{
                    return feature
                }
            })
        } as FeatureCollection<Geometry,territoireGeoJsonProperties>;
        props.defTerritoire(updatedFeature)
    }

    const gestAnnulationEdition = ()=>{
        defTerritoireEdit(0);
        props.defTerritoire(ancientTerritoires)
        props.defEditionEnCours(false)
    }

    const gestModifTerritoire = async()=>{
        const dataASauver = props.territoires.features.find((feature): feature is Feature<Geometry, territoireGeoJsonProperties>=>feature.properties?.id_periode_geo === territoireEdit)
        if (typeof dataASauver!== 'undefined'){
            const resultat = await serviceTerritoires.modifieTerritoire(territoireEdit,dataASauver)
            const filterOld = {
                type:'FeatureCollection',
                features: props.territoires.features.map((feature)=>{
                    if(feature.properties?.id_periode_geo!== territoireEdit){
                        return feature
                    } else{
                        return resultat.data
                    }
                } )
            }
            props.defTerritoire(filterOld as FeatureCollection<Geometry,territoireGeoJsonProperties>)
            defAncienTerritoires({type:'FeatureCollection',features:[]})
            defTerritoireEdit(0)
            props.defEditionEnCours(false)
        }
    }

    return (
        <div className="panneau-bas-historique" ref={panelRef}>
            <div className="resize-handle" onMouseDown={handleMouseDown}></div>
            <h4>Table Territoire</h4>
            <div className="upload-download-geopolitics" style={{gap:'10px'}}>
                {props.periodeSelect === -1 ? (
                    <span>Choisir une période</span>
                ):(props.nouvelleCartoDispo  ? (
                        <>  
                            <span>Periode: {props.periodeSelect}</span>
                            <Button 
                                variant='outlined' 
                                sx={{backgroundColor:'green',color:'black'}}
                                onClick={()=>verseDonnees()}
                            >
                                Verser
                            </Button>
                            <Button 
                                variant='outlined' 
                                sx={{backgroundColor:'red', color:'black'}}
                                onClick={()=>annuleVersement()}
                            >
                                Annuler
                            </Button>
                        </>
                    ):(
                        !props.editionEnCours?
                            <><FileUploadIcon
                            onClick={() => props.defModalVersementOuvert(!props.modalOuvert)}
                        />
                        <DownloadIcon 
                            onClick={()=>saveGeoJSON()} 
                        /></>:<></>
                    )
                )}
            </div>
            <div className="table-territoire-historique" style={{width:'97.5%'}}>
                <TableContainer 
                    component={Paper} 
                    sx={{
                        height: '100%',
                        overflowY: 'auto',
                        overflowX:'hidden',
                        width:'100%',
                        tableLayout:'fixed'
                    }}
                >
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID période</TableCell>
                                <TableCell>Ville</TableCell>
                                <TableCell>Secteur</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {props.territoires.features.map((territoire) => (
                            territoire.properties && (
                                <TableRow key={territoire.properties.id_periode_geo}>
                                    <TableCell sx={{width:120}}>
                                        {territoire.properties.id_periode}
                                    </TableCell>
                                    <TableCell>
                                        {territoireEdit===territoire.properties.id_periode_geo?
                                        <TextField value={territoire.properties.ville} onChange={(e)=>gereEditionPropsTerr(territoire.properties?.id_periode_geo??0,e.target.value,'ville')}/>:
                                        territoire.properties.ville}
                                    </TableCell>
                                    <TableCell >
                                        {territoireEdit===territoire.properties.id_periode_geo?
                                        <TextField 
                                            value={territoire.properties.secteur} 
                                            onChange={(e:React.ChangeEvent<HTMLInputElement>)=>gereEditionPropsTerr(territoire.properties?.id_periode_geo??0,e.target.value,'secteur')}
                                        />:
                                        territoire.properties.secteur
                                        }   
                                    </TableCell>
                                    <TableCell sx={{width:48}}>
                                        {props.nouvelleCartoDispo===true||
                                            (territoireEdit !== territoire.properties.id_periode_geo && 
                                            props.editionEnCours===true)?
                                            <></>:
                                            territoireEdit===territoire.properties.id_periode_geo?
                                            <Save onClick={()=>gestModifTerritoire()}/>:
                                            <Edit onClick={()=>gestDebutModifTerritoires(territoire.properties?.id_periode_geo??0)}/>
                                        }
                                    </TableCell>
                                    <TableCell sx={{width:48}}>
                                        {props.nouvelleCartoDispo===true||
                                            (territoireEdit !== territoire.properties.id_periode_geo && 
                                            props.editionEnCours===true)?
                                            <></>:
                                            territoireEdit===territoire.properties.id_periode_geo?
                                            <Cancel onClick={()=>gestAnnulationEdition()}/>:
                                            <DeleteIcon onClick={()=> gestSupprimeUnTerr(territoire.properties?.id_periode_geo??-1)}/>
                                        }
                                    </TableCell>
                                </TableRow>
                            )
                        ))}
                    </TableBody>
                    </Table>    
                </TableContainer>
            </div>
        </div>
    );
};


export default TableTerritoire;