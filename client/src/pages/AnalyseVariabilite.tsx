import React,{useState,useEffect} from 'react';
import MenuBar from '../components/menus/MenuBar';
import './analysevariabilite.css'
import { comptes_utilisations_sol, methodeAnalyseVariabillite } from '../types/DataTypes';
import ControlAnaVar from '../components/menus/ControlAnaVar';
import EditionParametresAnaVarFonc from '../components/panels/EditionParametresAnaVarFonc';
import EditionParametreAnaVarDistro from '../components/panels/EditionParametreAnaVarDistro';
import VisualisationResAnaVarFonc from '../components/panels/VisualisationResAnaVarFonc';
import { ClimbingBoxLoader } from 'react-spinners';


const AnalyseVariabilite:React.FC = () =>{
    const [methodeAnalyse,defMethodeAnalyse] = useState<methodeAnalyseVariabillite>({idMethodeAnalyse:1,
        descriptionMethodeAnalyse:'Données Foncières'});
    const [visualisationAnalyse,defVisualisationAnalyse] = useState<methodeAnalyseVariabillite>({idMethodeAnalyse:0,
        descriptionMethodeAnalyse:'Barres'})
    const [ensRegAAnalyser, defEnsRegAAnalyser] = useState<number[]>([]);
    const [editionParametres,defEditionParametres] = useState<boolean>(false);
    const [ensRegReference,defEnsRegReference] = useState<number>(-1);
    const [niveauCUBF,defNiveauCUBF] = useState<comptes_utilisations_sol>({niveau:-1,description:'invalide',n_entrees:0})
    const [calculsEnCours,defCalculsEnCours] = useState<boolean>(false);
    const [voirInv,defVoirInv] = useState<boolean>(false)
    const colorPalette = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe'
    ];
    const methodesAnalysesPossibles:methodeAnalyseVariabillite[] =[
    {
        idMethodeAnalyse:1,
        descriptionMethodeAnalyse:'Données Foncières'
    }] 
    const visualisationAnalysePossibles:methodeAnalyseVariabillite[]=[
        {
            idMethodeAnalyse:0,
            descriptionMethodeAnalyse:'Barres - par ER'
        },
        {
            idMethodeAnalyse:1,
            descriptionMethodeAnalyse:'Distribution - par Inventaire'
        },
        {
            idMethodeAnalyse:2,
            descriptionMethodeAnalyse:'Box Plot - par échelle conversion'
        },
        {
            idMethodeAnalyse:3,
            descriptionMethodeAnalyse:'Box Plot - Estimé principal'
        }
    ]

    return(
        <div className="page-ana-var">
            {!calculsEnCours?
            <>
                <MenuBar/>
                <ControlAnaVar
                    methodeAnalyse={methodeAnalyse}
                    defMethodeAnalyse={defMethodeAnalyse}
                    methodessAnalysesPossibles={methodesAnalysesPossibles}
                    ensRegAAnalyser = {ensRegAAnalyser}
                    defEnsRegAAnalyser={defEnsRegAAnalyser}
                    colorPalette={colorPalette}
                    defCalculsEnCours = {defCalculsEnCours}
                    voirInv={voirInv}
                    defVoirInv={defVoirInv}
                    methodeVisualisationPossibles={visualisationAnalysePossibles}
                    methodeVisualisation={visualisationAnalyse}
                    defMethodeVisualisation={defVisualisationAnalyse}
                />
                {(methodeAnalyse.idMethodeAnalyse === 1 && visualisationAnalyse.idMethodeAnalyse === 0) ? (//barre
                    <>
                        {editionParametres ? (
                            <EditionParametresAnaVarFonc
                                editionParams={editionParametres}
                                defEditionParams={defEditionParametres}
                                ensRegAAnalyser={ensRegAAnalyser}
                                ensRegReference={ensRegReference}
                                defEnsRegReference={defEnsRegReference}
                                niveauCUBF={niveauCUBF}
                                defNiveauCUBF={defNiveauCUBF}
                                colorPalette={colorPalette}
                            />
                        ) : (
                            <VisualisationResAnaVarFonc
                                editionParams={editionParametres}
                                defEditionParams={defEditionParametres}
                                ensRegAAnalyser={ensRegAAnalyser}
                                ensRegReference={ensRegReference}
                                colorPalette={colorPalette}
                                voirInv={voirInv}
                                methodeVisualisation={visualisationAnalyse}
                            />
                        )}
                    </>
                ) : (methodeAnalyse.idMethodeAnalyse === 1 && visualisationAnalyse.idMethodeAnalyse === 1) ? (//histo
                    <>
                    {editionParametres ? (
                            <EditionParametreAnaVarDistro
                                voirInv={voirInv}
                                defVoirInv={defVoirInv}
                                defEditionParams={defEditionParametres}
                            />
                        ):(
                            <VisualisationResAnaVarFonc
                                editionParams={editionParametres}
                                defEditionParams={defEditionParametres}
                                ensRegAAnalyser={ensRegAAnalyser}
                                ensRegReference={ensRegReference}
                                colorPalette={colorPalette}
                                voirInv={voirInv}
                                methodeVisualisation={visualisationAnalyse}
                            />
                        )}
                        </>
                ) : (methodeAnalyse.idMethodeAnalyse === 1 && visualisationAnalyse.idMethodeAnalyse === 2)?(//boxplot echelle
                    <VisualisationResAnaVarFonc
                        editionParams={editionParametres}
                        defEditionParams={defEditionParametres}
                        ensRegAAnalyser={ensRegAAnalyser}
                        ensRegReference={ensRegReference}
                        colorPalette={colorPalette}
                        voirInv={voirInv}
                        methodeVisualisation={visualisationAnalyse}
                    />
                ):(methodeAnalyse.idMethodeAnalyse === 1 && visualisationAnalyse.idMethodeAnalyse === 3)?(//boxplot standard
                    <VisualisationResAnaVarFonc
                        editionParams={editionParametres}
                        defEditionParams={defEditionParametres}
                        ensRegAAnalyser={ensRegAAnalyser}
                        ensRegReference={ensRegReference}
                        colorPalette={colorPalette}
                        voirInv={voirInv}
                        methodeVisualisation={visualisationAnalyse}
                    />
                ):<></>}
            </>
            :<div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '80vh'
                    }}>
                <ClimbingBoxLoader
                    loading={calculsEnCours}
                    size={50}
                    color="#fff"
                    aria-label="Calculs en Cours - Prends ton mal en patience"
                    data-testid="loader"
                />
            </div>}
            
        </div>
    )
}
export default AnalyseVariabilite;