import { Button } from "@mui/material"
import { FC } from "react"
import { PropsBoutApprobVersement } from "../types/InterfaceTypes"
import { EquivalenceCSVCoordPoint, EquivalenceVersementCarto } from "../types/DataTypes"

const BoutonApprobationVerse:FC<PropsBoutApprobVersement>=(props:PropsBoutApprobVersement)=>{
    const handleFileInsert=async ()=>{
        try{
            const regularMapping = Object.values(props.champsARemplir)
            .filter(entree=>entree.obligatoire ||entree.colonne_fichier!=='')
            .reduce((accumulator,entree)=>{
                accumulator[entree.colonne_db] = entree.colonne_fichier;
                return accumulator
            },{} as Record<string,string>)
            let cartoMapping
            let response
            if (props.champsGeomARemplir){
                cartoMapping = Object.values(props.champsGeomARemplir)
                .filter(entree=>entree.obligatoire ||
                    (
                        entree.desc_geometrie.type==='Point' && 
                        entree.desc_geometrie.colonneXLon!==''&& 
                        entree.desc_geometrie.colonneYLat!==''
                    )||
                    (
                        entree.desc_geometrie.type==='Ligne' && 
                        entree.desc_geometrie.pointDeb.colonneXLon!==''&& 
                        entree.desc_geometrie.pointDeb.colonneYLat!==''&&
                        entree.desc_geometrie.pointFin.colonneXLon!==''&&
                        entree.desc_geometrie.pointFin.colonneYLat!==''
                    )
                )
                .reduce((accumulator,entree)=>{
                    if(entree.desc_geometrie.type==='Ligne'){
                        accumulator[entree.colonne_db]={
                            type:'Ligne',
                            data:[
                                [   entree.desc_geometrie.pointDeb.colonneXLon,
                                    entree.desc_geometrie.pointDeb.colonneYLat
                                ],[
                                    entree.desc_geometrie.pointFin.colonneXLon,
                                    entree.desc_geometrie.pointFin.colonneYLat
                                ]
                            ]
                        }
                    }else{
                        accumulator[entree.colonne_db]={
                            type:'Point',
                            data:[   
                                    entree.desc_geometrie.colonneXLon,
                                    entree.desc_geometrie.colonneYLat
                                ]
                            }
                    }
                    return accumulator
                },{} as Record<string,any>)

                response = await props.serviceMAJ(props.idFichier,regularMapping,props.table,cartoMapping)
                if (response.success=== true){
                    alert(`Inséré ${response.data}`)
                    props.defModalOuvert(false)
                } else{
                    alert(`Erreur inconnue`)
                }

            }else{
                response = await props.serviceMAJ(props.idFichier,regularMapping,props.table)
                if (response.success=== true){
                    alert(`Inséré ${response.data}`)
                    props.defModalOuvert(false)
                } else{
                    alert(`Erreur inconnue`)
                }
            }

        } catch(err:any){
            alert('Erreur Versement')
        }
    }
    const lineGeomCheck =(entree:EquivalenceCSVCoordPoint):boolean=>{
        if (entree.desc_geometrie.type==='Ligne'){
            if(entree.desc_geometrie.pointDeb.colonneXLon!==''&&
                entree.desc_geometrie.pointDeb.colonneYLat!==''&&
                entree.desc_geometrie.pointFin.colonneXLon!==''&&
                entree.desc_geometrie.pointFin.colonneYLat!==''
            ){
                return true
            }else{
                return false
            }
        }else{
            return false
        }
    }
    const pointGeomCheck = (entree:EquivalenceCSVCoordPoint):boolean=>{
        if(entree.desc_geometrie.type==='Point'){
            if(
                entree.desc_geometrie.type==='Point' && 
                entree.desc_geometrie.colonneXLon!==''&&
                entree.desc_geometrie.colonneYLat!==''
            ){
                return true
            }else{
                return false
            }
        }else{
            return false
        }
    }
    const mandatoryCheck = (entree:EquivalenceCSVCoordPoint|EquivalenceVersementCarto):boolean=>{
        if(entree.obligatoire===false){
            return true
        }else{
            return false
        }
    }

    const geomNotPresentCheck=(entree:EquivalenceCSVCoordPoint[]|undefined):boolean=>{
        if (entree === undefined){
            return true
        }else{
            return false
        }
    }

    const basicPropsCheck = (entree:EquivalenceVersementCarto[]):boolean=>{
        if (props.champsARemplir.every(val => 
                    val.colonne_fichier !== ''||mandatoryCheck(val) // vérifie que tous les champs obligatoires sont remplis
                ) 
            ){
                return true
            }else{return false}
    }
    const geomPropsCheck = (entree:EquivalenceCSVCoordPoint[]|undefined):boolean=>{
            if (props.champsGeomARemplir){
                if (props.champsGeomARemplir.every(val=> (
                    (// si c'est un ligne je veux toutes les valeurs rentrées
                        lineGeomCheck(val)
                    )||(// si c'est un point je veux que toutes les valeurs soient rentrées
                        pointGeomCheck(val)
                    )||(// sauf si c'est pas obligatoire
                        mandatoryCheck(val)
                    )
                ))){
                    return true
                } else{
                    return false
                }
            }else{
                return true
            }
        }
    
    const overallCheck = ():boolean=>{
        if (basicPropsCheck(props.champsARemplir) && geomPropsCheck(props.champsGeomARemplir)){
        return true
        }else{return false}
    }
    return(<>
        { 
            overallCheck()&&// si toutes les conditions sont remplis (présence de données pour la géométrie et tout le reste)
            <Button variant="outlined" onClick={handleFileInsert}>Importer le fichier dans la BD</Button>
        }
    </>)
}

export default BoutonApprobationVerse