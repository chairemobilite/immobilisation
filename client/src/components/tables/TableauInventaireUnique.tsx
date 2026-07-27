import { TableauInventaireUniqueProps } from "../../types/InterfaceTypes";
const TableauInventaireUnique: React.FC<TableauInventaireUniqueProps> =(props:TableauInventaireUniqueProps) =>{
    return(
        <>
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Valeur</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>No Lot</td>
                        <td>{props.inventaire.g_no_lot}</td>
                    </tr>
                    <tr>
                        <td>Methode estime</td>
                        <td>{props.inventaire?.methode_estime}</td>
                    </tr>
                    <tr>
                        <td>N place min</td>
                        <td>{props.inventaire?.n_places_min}</td>
                    </tr>
                    <tr>
                        <td>N place max</td>
                        <td>{props.inventaire?.n_places_max}</td>
                    </tr>
                    <tr>
                        <td>N place comptees</td>
                        <td>{props.inventaire?.n_places_mesure}</td>
                    </tr>
                    <tr>
                        <td>N place estimee</td>
                        <td>{props.inventaire?.n_places_estime}</td>
                    </tr>
                    <tr>
                        <td>Commentaire</td>
                        <td>{props.inventaire?.commentaire}</td>
                    </tr>
                    <tr>
                        <td>ID ER</td>
                        <td>{props.inventaire?.id_er}</td>
                    </tr>
                    <tr>
                        <td>ID Reg Stat</td>
                        <td>{props.inventaire?.id_reg_stat}</td>
                    </tr>
                    <tr>
                        <td>CUBF</td>
                        <td>{props.inventaire?.cubf}</td>
                    </tr>
                    <tr>
                        <td>ID inv</td>
                        <td>{props.inventaire?.id_inv}</td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}

export default TableauInventaireUnique;