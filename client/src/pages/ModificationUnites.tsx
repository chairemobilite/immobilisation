import React, { useEffect, useState } from 'react';
import MenuBar from '../components/menus/MenuBar';
import { colonnes_possibles_conversion, unites_reglement_stationnement } from '../types/DataTypes';
import { serviceReglements,serviceUnites } from '../services';
import ListeUnitesPossibles from '../components/lists/ListeUnitesPossibles';
import PanneauModificationUnites from '../components/panels/PanneauModificationUnites';
import './ModificationUnites.css'
import serviceValidation from '../services/serviceValidation';


const ModificationUnites: React.FC=() =>{
    const [unites,defUnites] = useState<unites_reglement_stationnement[]>([])
    const [anciennesUnites,defAnciennesUnites] =useState<unites_reglement_stationnement[]>([])
    const [uniteSelect,defUniteSelect] = useState<unites_reglement_stationnement>({
        id_unite:-1,
        colonne_role_foncier:'',
        desc_unite:'',
        facteur_correction:1,
        abscisse_correction:0
    })
    const [editionEnCours,defEditionEncours] = useState<boolean>(false);
    const [colonnesPossibles,defColonnesPossibles] = useState<colonnes_possibles_conversion[]>([])
    useEffect(() => {
            const fetchData = async () => {
                try {
                    const [resUnites,resColonnes] = await Promise.all([serviceUnites.obtiensUnitesPossibles(),serviceUnites.obtiensColonnesPossibles()]) ;
                    defUnites(resUnites.data)
                    defColonnesPossibles(resColonnes.data)
                    
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    //props.defCharge(false);
                }
            };
    
            fetchData();
        }, []); // Empty dependency array means this runs once when the component mounts
    return (
        <div className="page-modification-unites">
            <MenuBar/>
            <div className="panneau-modif-unites">
                <ListeUnitesPossibles
                    unites={unites}
                    defUnites={defUnites}
                    uniteSelect={uniteSelect}
                    defUniteSelect={defUniteSelect}
                    anciennesUnites={anciennesUnites}
                    defAnciennesUnites={defAnciennesUnites}
                    colonnesPossibles={colonnesPossibles}
                    defColonnesPossibles={defColonnesPossibles}
                    editionEnCours={editionEnCours}
                    defEditionEnCours={defEditionEncours}
                />
                <PanneauModificationUnites
                    unites={unites}
                    defUnites={defUnites}
                    uniteSelect={uniteSelect}
                    defUniteSelect={defUniteSelect}
                    editionEnCours={editionEnCours}
                    defEditionEnCours={defEditionEncours}
                    colonnesPossibles={colonnesPossibles}
                    defColonnesPossibles={defColonnesPossibles}
                    anciennesUnites={anciennesUnites}
                    defAnciennesUnites={defAnciennesUnites}
                />
            </div>
        </div>
    )
}

export default ModificationUnites;