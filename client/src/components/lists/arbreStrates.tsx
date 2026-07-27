import { Add, Delete } from "@mui/icons-material";
import { Strate } from "../../types/DataTypes";
import { PropsArbreStrates } from "../../types/InterfaceTypes"
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import React, { useEffect } from 'react';
import serviceValidation from "../../services/serviceValidation";
import manipStrates from "../../utils/manipStrates";

const ArbreStrates: React.FC<PropsArbreStrates> = (props: PropsArbreStrates) => {
    const selectStrate = (nodeId: string) => {
        if (nodeId.substring(0,3)==='add'){
            console.log('entering creation of new strata')
            const  idParentString = nodeId.substring(4)
            if (typeof Number(idParentString)=== 'number' && !Number.isNaN(Number(idParentString))){
                props.defIdParent(Number(idParentString))
            }
            manipStrates.ajoutStrate(nodeId,{
                strates:props.strates,
                defStrates:props.defStrates,
                strateAct:props.strateAct,
                defStrate:props.defStrateAct,
                ancinnesStrates:props.anciennesStrates,
                defAnciennesStrates:props.defAnciennesStrates,
                ancienneStrateAct:props.ancienneStrateAct,
                defAncienneStrateAct:props.defAncienneStrateAct,
                modif:props.modif,
                defModif:props.defModif,
                idParent:props.idParent,
                defIdParent:props.defIdParent
            })
        }else{
            console.log('entering selection of existing strata')
            const selected = manipStrates.findStrateById(props.strates, Number(nodeId));
            if (selected) props.defStrateAct(selected)
        }
    }

    

    

    const renderTree = (strateTree: Strate[],parentId:number|null): React.ReactNode => (
        <>
            {strateTree.map((row) => (
                <TreeItem
                    key={row.id_strate}
                    itemId={String(row.id_strate)}
                    label={row.nom_strate}
                    disabled={props.modif}
                >
                    {/* render children if they exist */}
                    {row.subStrata && row.subStrata.length > 0 
                        ? renderTree(row.subStrata,row.id_strate)
                        : !props.modif?<TreeItem
                                key={`add-${row.id_strate}`}
                                itemId={`add-${row.id_strate}`}
                                disabled={!props.modif}
                                label={
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            color: "#4caf50",
                                        }}
                                    >
                                        <Add fontSize="small"/> Ajouter
                                    </span>
                                }
                            />:<></>}
                </TreeItem>
            ))}

            {/* Global Add at root level */}
            {!props.modif?
                (parentId===null?
                    <TreeItem
                        key="add-top"
                        itemId="add-top"
                        disabled={!props.modif}
                        label={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    color: "#4caf50",
                                }}
                            >
                                <Add fontSize="small"/> Ajouter
                            </span>
                        }
                    />
                    :<TreeItem
                        key={`add-${parentId}`}
                        itemId={`add-${parentId}`}
                        disabled={!props.modif}
                        label={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    color: "#4caf50",
                                }}
                            >
                                <Add fontSize="small"/> Ajouter
                            </span>
                        }
            />):<></>}
        </>
    );

    return (
        <div className='tree-sample'>
            <SimpleTreeView
                onItemClick={(event, nodeId) => {!props.modif?selectStrate(nodeId):null}}
            >
                {renderTree(props.strates,null)}
            </SimpleTreeView>
        </div>
    )
}

export default ArbreStrates;