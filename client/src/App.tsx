import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Histoire from './pages/Histoire';
import VisualisationInventaire from './pages/VisualisationInventaire';
import Reglements from './pages/Reglements';
import EnsemblesReglements from './pages/EnsemblesReglements';
import EnsRegTerritoire from './pages/EnsRegTerr';
import AnalyseQuartiers from './pages/AnalyseQuartiers';
import AnalyseReglements from './pages/AnalyseReglements';
import AnalyseVariabilite from './pages/AnalyseVariabilite';
import { FournisseurContexte } from './contexte/ContexteImmobilisation';
import ValidationStatistique from './pages/validationStatistique';
import SommaireValidation from './pages/SommaireValidation';
import VersementSecAnalyse from './pages/VersementSecAnalyse';
import ModificationUnites from './pages/ModificationUnites';
import VersementCadastre from './pages/VersementCadastre';
import VersementRole from './pages/VersementRole';
import CreationAssocRoleCadastre from './pages/CreationAssocRoleCadastre';
import VersementRecensement from './pages/VersementRecensement';
import VersementEnqueteOD from './pages/VersementEnqueteOD';
import SommaireVersement from './pages/SommaireVersement';
import VersementCUBF from './pages/VersementCUBF';
import CreationOperateurs from './pages/CreationOperateurs';
import LoginPage from './pages/LoginPage';
import { authClient } from "./lib/auth-client";
import ProtectedRoute from './lib/protectedRouted';
import ParamsUtilisateurs from './pages/ParamsUtilisateurs';


const app: React.FC = () => {
  return (
    <FournisseurContexte>
      <Router>
        <Routes>
          {/* public */}
          <Route path="/" element={<Navigate to="/historique" />} />
          <Route path="/login" element={<LoginPage />} />

          {/* protected group */}
          <Route element={<ProtectedRoute />}>
            <Route path="/historique" element={<Histoire />} />
            <Route path="/inventaire" element={<VisualisationInventaire/>}/>
            <Route path="/reg" element={<Reglements/>}/>
            <Route path="/ens-reg" element={<EnsemblesReglements/>}/>
            <Route path="/ens-reg-terr" element={<EnsRegTerritoire/>}/>
            <Route path="/ana-reg" element={<AnalyseReglements/>}/>
            <Route path="/ana-var" element={<AnalyseVariabilite/>}/>
            <Route path="/ana-quartiers" element={<AnalyseQuartiers/>}/>
            <Route path="/valid-stat" element ={<ValidationStatistique/>}/>
            <Route path="/sommaire-valid" element={<SommaireValidation/>}/>
            <Route path="/sec-analyse-verse" element={<VersementSecAnalyse/>}/>
            <Route path="/unites" element={<ModificationUnites/>}/>
            <Route path="/cadastre" element={<VersementCadastre/>}/>
            <Route path='/role-foncier' element={<VersementRole/>}/>
            <Route path='/assoc-cadastre-role' element={<CreationAssocRoleCadastre/>}/>
            <Route path='/recensement' element={<VersementRecensement/>}/>
            <Route path='/enquete-od' element={<VersementEnqueteOD/>}/>
            <Route path='/sommaire-versement' element={<SommaireVersement/>}/>
            <Route path='/cubf' element={<VersementCUBF/>}/>
            <Route path='/operateurs-reg' element={<CreationOperateurs/>}/>
            <Route path='/profil' element={<ParamsUtilisateurs/>}/>
          </Route>
          {/* fallback */}
          <Route path="*" element={<Navigate to="/historique" />} />
        </Routes>
      </Router>
    </FournisseurContexte>
  );
};

export default app;