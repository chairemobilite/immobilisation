import React,{useState,useEffect} from 'react';
import { EnsRegTerrControlProps } from '../../types/InterfaceTypes';
import { serviceEnsemblesReglements, serviceHistorique, serviceTerritoires } from '../../services';
import { serviceEnsRegTerr } from '../../services/serviceEnsRegTerr';
import { useSearchParams } from 'react-router';


const ControlEnsRegTerr:React.FC<EnsRegTerrControlProps> = (props:EnsRegTerrControlProps) =>{

    const [ddSelectedValue,defddSelectedValue] = useState(-1);
    const [ddPerSelectedValue,defddPerSelectedValue] = useState(-1);
    const [searchParams] = useSearchParams()

    useEffect(() => {
        // code for handling search query change
            const fetchRST=async(idPeriode:number,idPeriodeGeo?:number)=>{
                const response = await serviceHistorique.obtientTous()
                props.defPeriodesDispo(response.data)
                defddPerSelectedValue(idPeriode)
                props.defPeriodeSelect(response.data.find((o)=>o.id_periode===idPeriode))
                const responseTerr = await serviceTerritoires.chercheTerritoiresParPeriode(idPeriode)
                props.defTerritoireDispo(responseTerr.data)
                if (idPeriodeGeo!==undefined){
                    const terrSelectData = await serviceTerritoires.chercheTerritoiresParId(idPeriodeGeo)
                    props.defTerritoireSelect(terrSelectData.data)
                    defddSelectedValue(idPeriodeGeo)
                    const ensRegTerrData = await serviceEnsRegTerr.obtiensEnsRegEtAssocParTerritoire(idPeriodeGeo)
                    props.defEnsRegDispo(ensRegTerrData.data)
                }

            }
            
            const id_periode = searchParams.get("id_periode");
            const id_periode_geo = searchParams.get("id_periode_geo")
            const periode = id_periode === null ? NaN : Number(id_periode.trim());
            const periodeGeo = id_periode_geo === null ? NaN : Number(id_periode_geo.trim());
            if (Number.isInteger(periode) && Number.isInteger(periodeGeo)){
                fetchRST(Number(id_periode),Number(id_periode_geo))
            } else if(Number.isInteger(periode)){
                fetchRST(Number(id_periode))
            }
        }, [searchParams]);
    const gestSelectionPeriode = async (periodeAChanger:number,push:boolean)=>{
        if (periodeAChanger!=-1){
            const territoires = await serviceTerritoires.chercheTerritoiresParPeriode(periodeAChanger)
            props.defTerritoireDispo(territoires.data)
            const periodeSelect =props.periodesDispo.find((o) => (o.id_periode === periodeAChanger)); 
            props.defPeriodeSelect(periodeSelect)
            const territoireSelect = {type:'FeatureCollection',features:[]}
            props.defTerritoireSelect(territoireSelect)
            defddSelectedValue(-1)
            props.defEnsRegDispo([])
            defddPerSelectedValue(periodeAChanger)
            if(push){
                window.history.pushState({}, '', `?id_periode=${periodeAChanger}`)
            }
        }else{
            defddSelectedValue(-1)
            props.defEnsRegDispo([])
            defddPerSelectedValue(periodeAChanger)
            const territoires = {type:'FeatureCollection'as const,features:[] as never[]}
            props.defTerritoireDispo(territoires)
            const territoireSelect = {type:'FeatureCollection',features:[]}
            props.defTerritoireSelect(territoireSelect)
        }
    };

    const gestSelectionTerritoire = async(territoireAregarder:number,push:boolean)=>{
        if (territoireAregarder!=-1){
            const ensReg = await serviceEnsRegTerr.obtiensEnsRegEtAssocParTerritoire(territoireAregarder)
            const territoireSelectTemp =await serviceTerritoires.chercheTerritoiresParId(territoireAregarder);
            props.defEnsRegDispo(ensReg.data);
            props.defTerritoireSelect(territoireSelectTemp.data);
            defddSelectedValue(territoireAregarder)
            if (push){
                window.history.pushState({}, '', `?id_periode=${ddPerSelectedValue}&id_periode_geo=${territoireAregarder}`)
            }
        } else{
            defddSelectedValue(territoireAregarder)
            props.defEnsRegDispo([])
        }
        
    }
    return(
        <div className="control-ens-reg-terr-comp">
        <div className="select-periode">
            <label 
                htmlFor="selection-periode" 
                className="label-selection-periode">
                Sélection Période
            </label>
            <select 
            className="selection-periode" 
            value ={ddPerSelectedValue}
            onChange={e => gestSelectionPeriode(Number(e.target.value),true)}>
                <option value={-1}>Choisir Période</option>
                {props.periodesDispo.map((periode)=>(
                    <option value={periode.id_periode}>{periode.nom_periode}</option>
                ))}
            </select>
        </div>
        <div className="select-territoire">
            <label 
                htmlFor="select-territoire" 
                className="label-select-territoire">
                Sélection Territoire
            </label>
            <select 
            className="select-territoire" 
            value={ddSelectedValue}
            onChange={e=>gestSelectionTerritoire(Number(e.target.value),true)}>
                <option value={-1}>Selection Territoire</option>
                {props.territoiresDispo.features.map((territoire)=>(
                    <option value= {territoire.properties.id_periode_geo}>{territoire.properties.ville} - {territoire.properties.secteur}</option>
                ))}
            </select>
        </div>
        </div>
    )
}

export default ControlEnsRegTerr;