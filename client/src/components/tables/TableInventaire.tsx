import React, {useState,useRef,useEffect} from 'react';
import { inventaire_stationnement, quartiers_analyse } from '../../types/DataTypes';
import { TableInventaireProps } from '../../types/InterfaceTypes';
import { selectLotProps } from '../../types/utilTypes';
import { serviceInventaire } from '../../services/serviceInventaire';
import selectLotInventaire from '../../utils/selectLotInventaire';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import { Delete } from "@mui/icons-material";


const TableInventaire:React.FC<TableInventaireProps>=(props:TableInventaireProps) =>{
    const panelRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

    const handleRowClick = (key: string) => {
        const propsLot: selectLotProps = {
              inventaireComplet:props.inventaire,
              numLot:key,
              lotAnalyse:props.lots,
              defLotAnalyse: props.defLots,
              inventaireAnalyse:props.itemSelect,
              defInventaireAnalyse:props.defItemSelect,
              roleAnalyse:props.donneesRole,
              defRoleAnalyse:props.defDonneesRole,
              reglementsAnalyse: props.reglements,
              defReglementsAnalyse:props.defReglements,
              ensemblesAnalyse:props.ensemblesReglements,
              defEnsemblesAnalyse: props.defEnsemblesReglements,
              methodeEstimeRegard:props.methodeEstimeRegard,
              defMethodeEstimeRegard:props.defMethodeEstimeRegard,
              regRegard:props.regRegard,
              defRegRegard: props.defRegRegard,
              ensRegRegard:props.ensRegRegard,
              defEnsRegRegard:props.defEnsRegRegard,
              roleRegard:props.roleRegard,
              defRoleRegard:props.defRoleRegard,
              lotsDuQuartier:props.lotsDuQuartier
            }
        selectLotInventaire(propsLot)
    };

    const deleteInventoryEntry = async(id_inv:number|null)=>{
        if (id_inv){
            const reussi = await serviceInventaire.supprimerEntreeInventaire(id_inv)
            if (!reussi){
                alert('Suppression annulée')
            } else{
                alert('Suppression Réussie')
                props.defInventaire((prevInventaire) => 
                    prevInventaire.filter((item) => item.id_inv !== id_inv)
                )
            }
        }
    }

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

    useEffect(() => {
        const lot = props.lots?.features[0]
        if (lot?.properties.bool_inv) {
            const lotKey = lot.properties.g_no_lot;
            const row = rowRefs.current[lotKey];
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [props.lots]);


    return(
        <>
            
            <div className="panneau-bas-inventaire" ref={panelRef}>
                <div className="resize-handle" onMouseDown={handleMouseDown}></div>
                
                <div className="table-inventaire-rendu-container">
                    <table className="table-inventaire-rendu">
                        <thead>
                            <tr>
                                <th>ID inv</th>
                                <th>ID Lot</th>
                                <th>Places Min</th>
                                <th>Places Max</th>
                                <th>Places Mes.</th>
                                <th>Places Est.</th>
                                <th>Methode Est</th>
                                <th>ID Ens. Reg</th>
                                <th>ID Reg. </th>
                                <th>CUBF</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.inventaire.map((item_inventaire,index) => (
                                item_inventaire && (
                                <tr 
                                    key={item_inventaire.g_no_lot}
                                    data-key={item_inventaire.g_no_lot}
                                    ref={el => { rowRefs.current[item_inventaire.g_no_lot] = el; }}
                                    onClick={(e: React.MouseEvent) => handleRowClick(item_inventaire.g_no_lot)}
                                    className={props.lots?.features.map((row)=>row.properties.g_no_lot).includes(item_inventaire.g_no_lot)  ? 'selected-row' : ''}
                                    
                                >
                                    <td>{item_inventaire?.id_inv}</td>
                                    <td>{item_inventaire?.g_no_lot}</td>
                                    <td>{typeof(item_inventaire?.n_places_min) == 'number'? item_inventaire?.n_places_min.toFixed(2):item_inventaire.n_places_min}</td>
                                    <td>{item_inventaire?.n_places_max}</td>
                                    <td>{item_inventaire?.n_places_mesure}</td>
                                    <td>{item_inventaire?.n_places_estime}</td>
                                    <td>{item_inventaire?.methode_estime}</td>
                                    <td>{item_inventaire?.id_er}</td>
                                    <td>{item_inventaire?.id_reg_stat}</td>
                                    <td>{item_inventaire?.cubf}</td>
                                    <td onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteInventoryEntry(item_inventaire.id_inv); }}><DeleteIcon style={{ color: "#FFFFFF" }}/></td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
            
        </>
        
    );
};
export default TableInventaire;