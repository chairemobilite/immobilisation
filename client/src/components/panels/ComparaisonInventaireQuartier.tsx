import { ComparaisonInventaireQuartierProps } from "../../types/InterfaceTypes";
import { FaCheck } from "react-icons/fa";
import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import { Delete } from "@mui/icons-material";
import { inventaire_stationnement, lotCadastralAvecBoolInvGeoJsonProperties } from "../../types/DataTypes";
import { serviceInventaire } from "../../services";
import metAJourLotsInventaire from "../../utils/metAJourLotsInventaire";
import { MAJLotsInventaireProps } from "../../types/utilTypes";
import { Geometry } from "geojson";
import { ApiResponse } from "../../types/serviceTypes";

const ComparaisonInventaireQuartier: React.FC<ComparaisonInventaireQuartierProps> = (props: ComparaisonInventaireQuartierProps) => {
    const gestAnnulCalculQuartier = () => {
        console.log('Annuldation calcul Quartier')
        props.defNouvelInventaireReg([])
        props.defValidationInventaireQuartier(false)
    }
    const gestAnnulerItem = (noLot: string) => {
        const nouvelNouvelInventaire = props.nouvelInventaireReg.filter((o) => o.g_no_lot !== noLot)
        props.defNouvelInventaireReg(nouvelNouvelInventaire)
        console.log('annulation item', noLot)
        if (nouvelNouvelInventaire.length === 0) {
            props.defPanneauComparInventaireQuartierVis(false)
        }
    }
    const gestApprouverItem = async (noLot: string) => {
        console.log('A implementer - get approuver item')
        const ancienItem = props.ancienInventaireReg.find((o) => o.g_no_lot === noLot && o.methode_estime === 2)
        const nouvelItem = props.nouvelInventaireReg.find((o) => o.g_no_lot === noLot && o.methode_estime === 2)
        if (ancienItem) {
            const itemAinserer: inventaire_stationnement = {
                g_no_lot: nouvelItem?.g_no_lot || '',
                n_places_min: nouvelItem?.n_places_min || 0,
                n_places_max: nouvelItem?.n_places_max || 0,
                n_places_estime: nouvelItem?.n_places_estime || 0,
                n_places_mesure: nouvelItem?.n_places_mesure || 0,
                id_er: nouvelItem?.id_er || '',
                id_reg_stat: nouvelItem?.id_reg_stat || '',
                commentaire: nouvelItem?.commentaire || '',
                methode_estime: nouvelItem?.methode_estime || 2,
                cubf: nouvelItem?.cubf || '',
                id_inv: null
            }
            const idMAJ = ancienItem.id_inv;
            const reussi = await serviceInventaire.modifieInventaire(idMAJ, itemAinserer)
            if (reussi.success) {
                const nouvelNouvelInventaire = props.nouvelInventaireReg.filter((o) => o.g_no_lot !== noLot)
                props.defNouvelInventaireReg(nouvelNouvelInventaire)
                const ancienLotsDuQuartier = props.lotsDuQuartier;
                const nouveauLotsDuQuatier: GeoJSON.FeatureCollection<Geometry, lotCadastralAvecBoolInvGeoJsonProperties> = {
                    type: "FeatureCollection",
                    features: ancienLotsDuQuartier.features.map((lot) =>
                        lot.properties.g_no_lot !== noLot
                            ? lot
                            : {
                                type: lot.type,
                                geometry: lot.geometry,
                                bbox: lot.bbox,
                                id: lot.id,
                                properties: {
                                    g_no_lot: lot.properties.g_no_lot,
                                    g_va_suprf: lot.properties.g_va_suprf,
                                    g_nb_coord: lot.properties.g_nb_coord,
                                    g_nb_coo_1: lot.properties.g_nb_coo_1,
                                    bool_inv: true,
                                },
                            }
                    ),
                };
                const ancienInventaire = props.ancienInventaireReg
                const nouvelInventaire: inventaire_stationnement[] = ancienInventaire.map(item =>
                    (item.g_no_lot === noLot && item.methode_estime === nouvelItem?.methode_estime)
                        ? { ...reussi.data }
                        : item
                );
                props.defAncienInventaireReg(nouvelInventaire)
                props.defLotsDuQuartier(nouveauLotsDuQuatier)
                if (nouvelNouvelInventaire.length === 0) {
                    props.defPanneauComparInventaireQuartierVis(false)
                }
            } else {
                alert('sauvegarde non réussie')
            }
        } else {
            const itemAinserer: Omit<inventaire_stationnement, 'id_inv'> = {
                g_no_lot: nouvelItem?.g_no_lot || '',
                n_places_min: nouvelItem?.n_places_min || 0,
                n_places_max: nouvelItem?.n_places_max || 0,
                n_places_estime: nouvelItem?.n_places_estime || 0,
                n_places_mesure: nouvelItem?.n_places_mesure || 0,
                id_er: nouvelItem?.id_er || '',
                id_reg_stat: nouvelItem?.id_reg_stat || '',
                commentaire: nouvelItem?.commentaire || '',
                methode_estime: nouvelItem?.methode_estime || 2,
                cubf: nouvelItem?.cubf || '',
            }
            const reussi = await serviceInventaire.nouvelInventaire(itemAinserer)
            if (reussi.success) {
                const nouvelNouvelInventaire = props.nouvelInventaireReg.filter((o) => o.g_no_lot !== noLot)
                props.defNouvelInventaireReg(nouvelNouvelInventaire)

                const propMAJ: MAJLotsInventaireProps = {
                    defInventaire: props.defAncienInventaireReg,
                    defLotsDuQuartier: props.defLotsDuQuartier
                };
                // this is very slow needa better way of doing this than fucking redownloading the whole shenanigan
                //const succes = await metAJourLotsInventaire(props.quartierSelect,propMAJ)
                const ancienLotsDuQuartier = props.lotsDuQuartier;

                const nouveauLotsDuQuatier: GeoJSON.FeatureCollection<Geometry, lotCadastralAvecBoolInvGeoJsonProperties> = {
                    type: "FeatureCollection",
                    features: ancienLotsDuQuartier.features.map((lot) =>
                        lot.properties.g_no_lot !== noLot
                            ? lot
                            : {
                                type: lot.type,
                                geometry: lot.geometry,
                                bbox: lot.bbox,
                                id: lot.id,
                                properties: {
                                    g_no_lot: lot.properties.g_no_lot,
                                    g_va_suprf: lot.properties.g_va_suprf,
                                    g_nb_coord: lot.properties.g_nb_coord,
                                    g_nb_coo_1: lot.properties.g_nb_coo_1,
                                    bool_inv: true,
                                },
                            }
                    ),
                };
                const ancienInventaire = props.ancienInventaireReg
                const nouvelInventaire: inventaire_stationnement[] = [...ancienInventaire, reussi.data]
                props.defAncienInventaireReg(nouvelInventaire)
                props.defLotsDuQuartier(nouveauLotsDuQuatier)
                if (nouvelNouvelInventaire.length === 0) {
                    props.defPanneauComparInventaireQuartierVis(false)
                }
                alert('Sauvegarde Reussie, inventaire mis a jour')
            } else {
                alert('sauvegarde non réussie')
            }
        }
    }

    const splitNewVsUpdate = () => {
        const updatedItems: inventaire_stationnement[] = [];
        const newItems: inventaire_stationnement[] = [];

        // Iterate over each item in nouvelInventaireReg
        props.nouvelInventaireReg.forEach(newItem => {
            const matchIndex = props.ancienInventaireReg.findIndex(
                oldItem => oldItem.g_no_lot === newItem.g_no_lot
            );

            if (matchIndex !== -1) {
                // If a match is found, update the id_inv and add to updatedItems
                const updatedItem = {
                    ...newItem,
                    id_inv: props.ancienInventaireReg[matchIndex].id_inv // Assuming you want to update id_inv with the new item's id_inv
                };
                updatedItems.push(updatedItem);
            } else {
                // If no match is found, add the new item to newItems
                newItems.push(newItem);
            }
        });

        return { updatedItems, newItems };
    };

    const gestApprobationMasse = async () => {
        const { updatedItems: inventaireMAJ, newItems: nouvelItems } = splitNewVsUpdate();
        console.log('Separation entre les nouveaux items et les items à mettre à jour complétée')
        let reussiMAJ:ApiResponse<inventaire_stationnement[]>={success:false,data:[]};
        let reussiNouveau:ApiResponse<inventaire_stationnement[]>={success:false,data:[]};
        try{
            if (inventaireMAJ.length>0 && nouvelItems.length>0){
                [reussiMAJ, reussiNouveau] = await Promise.all([serviceInventaire.modifiePlusieursInventaires(inventaireMAJ), serviceInventaire.plusieursNouveauxInventaires(nouvelItems)])
                if(reussiMAJ.success===false||reussiNouveau.success===false){
                    throw new Error('error during update')
                }
            } else if(inventaireMAJ.length>0){
                reussiMAJ = await serviceInventaire.modifiePlusieursInventaires(inventaireMAJ)
                if(reussiMAJ.success===false){
                    throw new Error('error during update')
                }
            } else if(nouvelItems.length>0){
                reussiNouveau = await serviceInventaire.plusieursNouveauxInventaires(nouvelItems)
                if(reussiNouveau.success===false){
                    throw new Error('error during creattion')
                }
            }
            console.log('Mis les choses dans la base de données')
            const updatedItems = reussiMAJ?.data ?? [];
            const newItems = reussiNouveau?.data ?? [];

            // Merge the results into the state
            props.defAncienInventaireReg((prev: inventaire_stationnement[]) => {
                // Replace existing items based on id_inv
                const updatedMap = new Map(prev.map(item => [item.id_inv, item]));

                // Iterate safely
                (updatedItems ?? []).forEach((item: inventaire_stationnement) => {
                    updatedMap.set(item.id_inv, item);  // Replace existing items
                });

                (newItems ?? []).forEach((item: inventaire_stationnement) => {
                    updatedMap.set(item.id_inv, item);  // Add new ones
                });

                // Convert the map back to an array
                return Array.from(updatedMap.values());
            }
            );
            props.defNouvelInventaireReg([])
            props.defValidationInventaireQuartier(false)
        }catch(err:any){
            alert('Erreur dans la mise a jour')
        }
    }
    return (
        <div className="panneau-confirmation-inventaire-quartier">
            {props.chargement ?
                (<p>Chargement en cours</p>)
                : (<>
                    <button onClick={gestAnnulCalculQuartier}>Annuler</button>
                    <button onClick={gestApprobationMasse}>Approuver Tous</button>
                    <table>
                        <tbody>
                        <tr>
                            <td className="old">old is gold</td>
                            <td className="new">blue is new</td>
                            <td className="difference">Red is change</td>
                            <td>Montre seulement les résultats montrant un changement à l'inventaire actuel</td>
                        </tr>
                        </tbody>
                    </table>
                    <div className="conteneur-table-comparaison-quartier">
                        <table className="table-comparaison-inventaire-quartier">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th colSpan={5}>Ancien Inventaire</th>
                                    <th colSpan={4}>Nouvel Inventaire</th>
                                    <th></th>
                                    <th></th>
                                </tr>
                                <tr>
                                    <th>Lot</th>
                                    <th>ID Inv</th>
                                    <th>N Places Min</th>
                                    <th>N Places Max</th>
                                    <th>Ens. Reg.</th>
                                    <th>Reg. </th>
                                    <th>N Places Min</th>
                                    <th>N Places Max</th>
                                    <th>Ens. Reg.</th>
                                    <th>Reg. </th>
                                    <th></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.nouvelInventaireReg.map(item => {
                                    const old = props.ancienInventaireReg.find(
                                        o => o.g_no_lot === item.g_no_lot && o.methode_estime === item.methode_estime
                                    );

                                    const fmt = (v: number | null | undefined) =>
                                        v != null ? v.toFixed(2) : '‑';

                                    return (
                                        <tr key={item.g_no_lot}>
                                            <td>{item.g_no_lot}</td>

                                            <td className="old">{old?.id_inv ?? '‑'}</td>
                                            <td className="old">{fmt(old?.n_places_min)}</td>
                                            <td className="old">{fmt(old?.n_places_max)}</td>
                                            <td className="old">{old?.id_er ?? '‑'}</td>
                                            <td className="old">{old?.id_reg_stat ?? '‑'}</td>

                                            <td className={old?.n_places_min !== item.n_places_min ? 'difference' : 'new'}>
                                                {fmt(item.n_places_min)}
                                            </td>
                                            <td className={old?.n_places_max !== item.n_places_max ? 'difference' : 'new'}>
                                                {fmt(item.n_places_max)}
                                            </td>
                                            <td className={old?.id_er !== item.id_er ? 'difference' : 'new'}>
                                                {item.id_er ?? '‑'}
                                            </td>
                                            <td className={old?.id_reg_stat !== item.id_reg_stat ? 'difference' : 'new'}>
                                                {item.id_reg_stat ?? '‑'}
                                            </td>

                                            <td onClick={() => gestApprouverItem(item.g_no_lot)}>
                                                <CheckIcon style={{ color: '#FFF' }} />
                                            </td>
                                            <td onClick={() => gestAnnulerItem(item.g_no_lot)}>
                                                <DeleteIcon style={{ color: '#FFF' }} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div></>)
            }
        </div>
    )
}

export default ComparaisonInventaireQuartier;