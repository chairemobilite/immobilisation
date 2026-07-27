import { PropsPanneauValid } from "../../types/InterfaceTypes"
import CarteValidation from "../CarteValidation";
import GraphiqueValidation from "../charts/GraphiqueValidation";
import ListeLotsValidation from "../lists/ListeLotsValidation";
import TableRevisionValidation from "../tables/TableRevisionValidation";

const PanneauValidation:React.FC<PropsPanneauValid>=(props:PropsPanneauValid)=>{
    return(
        <div className='panneau-valid'>
            <ListeLotsValidation
                lots={props.lots}
                defLots={props.defLots}
                inventairePert={props.inventairePert}
                defInventairePert={props.defInventairePert}
                entreeValid={props.entreeValid}
                defEntreeValid={props.defEntreeValid}
                feuilleSelect={props.feuilleSelect}
                lotSelect={props.lotSelect}
                defLotSelect={props.defLotSelect}
                adresse={props.adresse}
                defAdresse={props.defAdresse}
                newValid={props.newValid}
                defNewValid={props.defNewValid}
            />
            <div className='panneau-centre'>
                <TableRevisionValidation
                    inventairePert={props.inventairePert}
                    defInventairePert={props.defInventairePert}
                    entreeValid={props.entreeValid}
                    defEntreeValid={props.defEntreeValid}
                    adresse={props.adresse}
                    defAdresse={props.defAdresse}
                    newValid={props.newValid}
                    defNewValid={props.defNewValid}
                    lotSelect={props.lotSelect}
                    defLotSelect={props.defLotSelect}
                />
                <GraphiqueValidation 
                    feuilleSelect={props.feuilleSelect}
                    inventairePert={props.inventairePert}
                />
            </div>
            <CarteValidation
                lotSelect={props.lotSelect}
                defLotSelect={props.defLotSelect}
                startPosition={props.centre}
                setStartPosition={props.defCentre}
                startZoom={props.zoom}
                setStartZoom={props.defZoom}
            />
        </div>
    )
}

export default PanneauValidation;