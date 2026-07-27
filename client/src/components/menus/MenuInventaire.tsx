import { MenuInventaireProps } from "../../types/InterfaceTypes";
import { serviceInventaire, serviceCadastre } from "../../services";
import L, { LatLngExpression } from 'leaflet';
import { inventaire_stationnement } from "../../types/DataTypes";
import { useRef } from "react";

const MenuInventaire: React.FC<MenuInventaireProps> = (props: MenuInventaireProps) => {
    let lastRequestId=useRef(0);
    // Gestion de selection de quartier
    const gestSelectQuartier = async (quartier_selectionne: number) => {
        const requestId= ++lastRequestId.current
        props.defQuartier(quartier_selectionne)
        try{
            const [inventaire,lots]=await Promise.all([
                serviceInventaire.obtientInventaireParQuartier(quartier_selectionne),
                serviceCadastre.obtiensCadastreParQuartier(quartier_selectionne)
            ])
            // added break here to discard changes if they are not the latest
            if(requestId!==lastRequestId.current) return;

            if (inventaire.success===true&&lots.success===true&&inventaire.data&&lots.data) {

                props.defLotsDuQuartier(lots.data)
                props.defInventaireActuel(inventaire.data)

                // Check if lotsDuQuartier is defined and has features
                if (lots.data && lots.data.features.length > 0) {
                    const geoJsonLayer = new L.GeoJSON(lots.data);
                    const bounds = geoJsonLayer.getBounds();

                    // Check if bounds are valid
                    if (bounds.isValid()) {
                        const center = bounds.getCenter();
                        props.defPositionDepart(center);
                        props.defZoomDepart(12);
                    } else {
                        console.error('Bounds are not valid');
                    }
                } else {
                    console.error('lotsDuQuartier is not defined or has no features');
                }
            } else {
                alert('Obtention inventaire échouée');
            }
        }catch(error:any){
            alert(error.message)
        }
    }

    const filtrerInventairePourChangements = (nouvelInventairePotentiel: inventaire_stationnement[]) => {
        // Create a Map for quick lookup of items in props.inventaireActuel
        const inventaireActuelMap = new Map(
            props.inventaireActuel
                .filter(item => item.methode_estime === 2)
                .map(item => [item.g_no_lot, item])
        );

        const filtreStationnementMin = nouvelInventairePotentiel.filter((o) => {
            const matchingItem = inventaireActuelMap.get(o.g_no_lot);

            // Return true if no matching item is found or if any of the specified fields have changed
            return !matchingItem ||
                Math.round(o.n_places_min*10)/10 !== Math.round(matchingItem.n_places_min*10)/10 ||
                Math.round(o.n_places_max*10)/10 !== Math.round(matchingItem.n_places_max*10)/10 ||
                o.id_er !== matchingItem.id_er ||
                o.id_reg_stat !== matchingItem.id_reg_stat ||
                o.cubf !== matchingItem.cubf;
        });
        const inventaireAligne = filtreStationnementMin.sort((a, b) => {
            // b comes before a when its n_places_min is larger
            return b.n_places_min - a.n_places_min;
        })
        return inventaireAligne;
    }

    const gestCalculInventaire = async () => {
        props.defChargement(true)
        if (props.quartier != -1) {
            props.defPanneauComparInventaireQuartierVis(true)
            const inventaire = await serviceInventaire.recalculeQuartierComplet(props.quartier)
            //console.log(inventaire.data);
            //const test = inventaire.data.filter((item) => item.g_no_lot === '4 040 053');
            //console.log(test);
            const inventaireFiltre = filtrerInventairePourChangements(inventaire.data)
            props.defNouvelInventaireQuartier(inventaireFiltre)
        }
        props.defChargement(false)
    }

    const gestMontrerLots = () => {
        if (props.montrerTousLots) {
            props.defMontrerTousLots(false)
        } else {
            props.defMontrerTousLots(true)
        }
    }

    const gestChoro = (value:number) => {
        props.defOptionCouleur(value)
    }

    return (
        <div className="table-inventaire-control">
            <label htmlFor="select-quartier">Sélection Quartier</label>
            <select id="select-quartier" name="select-quartier" onChange={e => gestSelectQuartier(Number(e.target.value))}>
                <option value="">Selection quartier</option>
                {props.optionsQuartier.features.map(quartier => (
                    <option key={quartier.properties.id_quartier} value={quartier.properties.id_quartier} >
                        {quartier.properties.nom_quartier}
                    </option>
                ))}
            </select>
            <button onClick={gestCalculInventaire}>
                Recalcule Inventaire Quartier
            </button>
            <label
                htmlFor="show-all-lots"
                className="label-show-all-lots">
                Montrer Tous Lots</label>
            <input
                type="checkbox"
                id="show-all-lots"
                checked={props.montrerTousLots}
                onChange={gestMontrerLots} />

            <label
                htmlFor="valeur-choroplethe"
                className="label-valeur-choroplethe">
                Échelle Couleur</label>
            <select
                id="valeur-choroplethe"
                name="valeur-choroplethe"
                onChange={(e)=>gestChoro(Number(e.target.value))}>
                <option value={-1}>Aucun</option>
                <option value={1}>places</option>
                <option value={2}>places/superf terrain</option>
            </select>
        </div>
    )
}

export default MenuInventaire;