import React from 'react';
import MenuBar from '../components/MenuBar';
import './common.css';
import './ParamsUtilisateurs.css'
import ProfileUtilisateur from '../components/ProfileUtilisateur';

const ParamsUtilisateurs: React.FC = () =>{
    return(
        <div className="page-params-util">  
            <MenuBar/>
            <ProfileUtilisateur/>
        </div>
    )
}

export default ParamsUtilisateurs;