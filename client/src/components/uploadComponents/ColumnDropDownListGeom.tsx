import { FC, useState } from "react"
import { PropsGeomColumnsDropDown } from "../../types/InterfaceTypes"
import { Divider, FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import ColumnDropDownListLine from "./ColumnDropDownListLine"
import ColumnDropDownListPoint from "./ColumnDropDownListPoint"


const ColumnDropDownListGeom:FC<PropsGeomColumnsDropDown>=(props:PropsGeomColumnsDropDown)=>{
    
    return(<>
        {props.colonnesFichier.length > 0 && <>
        {
            props.champsgeomARemplir.map((champs) => {
                if(champs.page!== undefined  && String(champs.page) ===props.pageAct ){
                    if(champs.desc_geometrie.type ==='Ligne'){
                        return(
                            <>
                                <ColumnDropDownListLine
                                    geometrieActuelle={champs}
                                    colonnesFichier={props.colonnesFichier}
                                    defColonnesFichier={props.defColonnesFichier}
                                    champsGeomARemplir={props.champsgeomARemplir}
                                    defChampsGeomARemplir={props.defChampsGeomARemplir}
                                    pageAct={props.pageAct}
                                />
                            </>
                        )
                    }else if(champs.desc_geometrie.type ==='Point'){
                        return(
                            <>
                                <ColumnDropDownListPoint
                                    geometrieActuelle={champs}
                                    colonnesFichier={props.colonnesFichier}
                                    defColonnesFichier={props.defColonnesFichier}
                                    champsGeomARemplir={props.champsgeomARemplir}
                                    defChampsGeomARemplir={props.defChampsGeomARemplir}
                                    pageAct={props.pageAct}
                                />
                            </>
                        )
                    }else{
                        return(<></>)
                    }
                } else{
                    return (<></>)
                }
            })
        }
        
        <Divider variant="middle" sx={{borderColor:'white'}} />
        </>
        }
    </>)
}

export default ColumnDropDownListGeom