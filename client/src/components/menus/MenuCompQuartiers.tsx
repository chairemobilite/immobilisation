import { serviceAnalyseInventaire } from "../../services/serviceAnalyseInventaire";
import { MenuCompQuartiersProps } from "../../types/InterfaceTypes";

const MenuCompQuartiers:React.FC<MenuCompQuartiersProps>=(props:MenuCompQuartiersProps)=>{
    const gestSelectMethodeAnalyse=(idTypeAnalyse:number)=>{
        props.defMethodeAnalyse(idTypeAnalyse)
    }
    const gestSelectPrioriteEstime=(idPriorite:number)=>{
        props.defPrioriteInventaire(idPriorite)
    }
    const gestRecalculStationnementAgreg=async()=>{
        props.defCalculEnCours(true)
        try {
            await serviceAnalyseInventaire.recalculeInventaireBackend()
        } catch (e) {
            console.error(e)
            alert('Échec du recalcul de l\'inventaire')
        } finally {
            props.defCalculEnCours(false)
        }
    }
    const gestRecalculAncil=async()=>{
        props.defCalculEnCours(true)
        try {
            await serviceAnalyseInventaire.recalculeDonneesFoncieresBackend()
        } catch (e) {
            console.error(e)
            alert('Échec de l\'actualisation des données')
        } finally {
            props.defCalculEnCours(false)
        }
    }
    
    return(
        <div className="menu-comp-quartiers">
            <label htmlFor="select-type">Type d'analyse</label>
            <select id="select-type" name="select-type" onChange={e => gestSelectMethodeAnalyse(Number(e.target.value))} value={props.methodeAnalyse}>
                <option value={-1}>Selection méthode</option>
                {props.methodesPossibles.map(methode=>(
                    <option key={methode.idAnalyse} value={methode.idAnalyse} >
                        {methode.descriptionAnalyse}
                    </option>
                ))}
            </select>
            <label htmlFor="select-inventory-priority">Sélectionner la priorité des estimés</label>
            <select id="select-inventory-priority" name="select-inventory-priority" onChange={e => gestSelectPrioriteEstime(Number(e.target.value))} value={props.prioriteInventaire}>
                {props.prioriteInventairePossibles.map(priorite=>(
                    <option key={priorite.idPriorite} value={priorite.idPriorite} >
                        {priorite.descriptionPriorite}
                    </option>
                ))}
            </select>
            <label htmlFor="bouton-recalcul">Cliquer ici pour ré-agréger l'inventaire</label>
            <button className="bouton-recalcul" onClick={gestRecalculStationnementAgreg}>Recalculer Inventaire Agrege (3min)</button>
            <label htmlFor="bouton-recalcul-ancil">Cliquer ici pour ré-agréger les autres données</label>
            <button className="bouton-recalcul-ancil" onClick={gestRecalculAncil}>Actualiser val ancilaires(50s)</button>
        </div>
    )
}

export default MenuCompQuartiers;