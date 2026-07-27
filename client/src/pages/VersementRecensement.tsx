import { FC, useState } from "react";
import MenuBar from "../components/menus/MenuBar";
import ModalVersementGen from "../components/uploadComponents/ModalVersement";
import { EquivalenceVersementCarto, recensementGeoJsonProperties } from "../types/DataTypes";
import MenuManipRecensement from "../components/menus/MenuManipRecensement";
import CarteVisionnementRecensement from "../components/maps/CarteVisionnementRecensement";
import './common.css'
import './versementRecensement.css'
import { useRecensementViewPort } from "../map/hooks/useRecensementViewport";
import { FeatureCollection, Geometry } from "geojson";
import { LatLngBounds } from "leaflet";
import { ServiceGeoJson } from "../services/serviceGeoJson";


const VersementRecensement:FC =()=>{
    const [modalSelectionCadastreOuvert,defModalSelectionCadastreOuvert] = useState<boolean>(false);

    const equivOptions:Record<2016|2021,EquivalenceVersementCarto[]>={
        2016:[
            {
                colonne_db:'ADIDU',
                description:'Identifiant de l aire de diffusion',
                colonne_fichier:'',
                obligatoire:true
            },
            {
                colonne_db:'pop_2016',
                description:'Population secteur',
                colonne_fichier:'',
                obligatoire:true
            },
            {
                colonne_db:'habitats_2016',
                description:'Nombre de logements 2016',
                colonne_fichier:'',
                obligatoire:true
            },
            {
                colonne_db:'habitats_occup_2016',
                description:'Nombre de logements 2016',
                colonne_fichier:'',
                obligatoire:true
            },
            {
                colonne_db:'superf_2016',
                description:'Superficie 2016',
                colonne_fichier:'',
                obligatoire:true
            }],
        2021:[
            {
                colonne_db:'ADIDU',
                description:'Identifiant de l aire de diffusion',
                colonne_fichier:'',
                obligatoire:true
            },
            {
                colonne_db:'pop_2021',
                description:'Population secteur',
                colonne_fichier:'',
                obligatoire:true
            },
            {
                colonne_db:'habitats_2021',
                description:'Nombre de logements 2021',
                colonne_fichier:'',
                obligatoire:true
            },
            {
                colonne_db:'habitats_occup_2021',
                description:'Nombre de logements occupes2021',
                colonne_fichier:'',
                obligatoire:true
            },
            {
                colonne_db:'superf',
                description:'Superficie',
                colonne_fichier:'',
                obligatoire:true
            }]
        }
    const [equivalenceFDB, defEquivalenceFBD] = useState<EquivalenceVersementCarto[]>(equivOptions[2016]
        )
    const [table,defTable] = useState<'census_population'|'census_population_2016'>('census_population_2016')
    const [anneeRecens,defAnneeRecense] = useState<2016|2021>(2016)
    const [carteRecensement, defCarteRecensement] = useState<FeatureCollection<Geometry, recensementGeoJsonProperties> | null>(null);
    const [limites,defLimites] = useState<LatLngBounds|null>(null)
    // Returns a debounced, zoom-gated handler
    const minZoom=12
    const handleViewportChange = useRecensementViewPort(defCarteRecensement,anneeRecens,defLimites,minZoom);

    return(
        <div className='page-versement-visu-cadastre'>
            <MenuBar/>
            <MenuManipRecensement
                modalOuvert={modalSelectionCadastreOuvert}
                defModalOuvert={defModalSelectionCadastreOuvert}
                anneeRecens={anneeRecens}
                defAnneeRecens={defAnneeRecense}
                tableModif={table}
                defTableModif={defTable}
                Equiv={equivalenceFDB}
                defEquiv={defEquivalenceFBD}
                equivOptions={equivOptions}
                limites={limites}
                defDonnees={defCarteRecensement}
            />
            <ModalVersementGen
                modalOuvert={modalSelectionCadastreOuvert}
                defModalOuvert={defModalSelectionCadastreOuvert}
                table={table}
                title="Versement des données de recensement"
                champsARemplir={equivalenceFDB}
                defChampsARemplir={defEquivalenceFBD}
                serviceUploadPeak={ServiceGeoJson.verseFichierFlux}
                serviceMAJ={ServiceGeoJson.confirmeMajBDTemp}
            />
            <>
            {
                <CarteVisionnementRecensement
                    annee={anneeRecens}
                    viewPortChange={handleViewportChange}
                    carteRecensement={carteRecensement}
                    minZoom={minZoom}
                />
            }
            </>
            
        </div>
    )
}

export default VersementRecensement