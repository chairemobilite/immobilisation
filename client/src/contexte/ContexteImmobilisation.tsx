/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

A context tool so that all the pages can consume data and that user interface 
choices are persistent
*/


import { createContext, useState, ReactNode, Dispatch, SetStateAction, useContext } from 'react';
import { CentreDeCarte, ContexteImmobilisationType, donneesCarteDeFond, FournisseurContexteProps,ThemeMode } from '../types/ContextTypes';
import { latLng } from 'leaflet';
    import { createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo } from 'react';
import { ThemeProvider } from '@mui/system';


const ContexteImmobilisation = createContext<ContexteImmobilisationType | undefined>(undefined);


/**
 * this provides mapping and theme related items which could be used through out the app
 * @param children the components which consume the context
 * @returns a context provider which is used to to bracket other components and a 
 * useContext function which allows unpacking the context
 */
const FournisseurContexte = ({ children }: FournisseurContexteProps) => {
    // Mapping options for tiles
    const cartoPossibles: donneesCarteDeFond[] = [
        {
            id: 0,
            description: 'OSM',
            URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            zoomMax:19
        },
        {
            id: 1,
            description: 'Géodésie Québec',
            URL: 'https://geoegl.msp.gouv.qc.ca/carto/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=orthos&STYLE=default&TILEMATRIXSET=EPSG_3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png',
            attribution: '&copy; Géodésie Québec',
            zoomMax:19
        },
        {
            id: 2,
            description: 'ESRI',
            URL: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
            zoomMax:19
        }
    ];
    // the mapping options state. No sure this really needs to be a state honestly
    const [optionsCartos, defOptionsCarto] = useState<donneesCarteDeFond[]>(cartoPossibles);
    const [optionCartoChoisie, defOptionCartoChoisie] = useState<number>(0);
    // the changer for the mapping option
    const changerCarto = (idAUtiliser: number) => {
        defOptionCartoChoisie(idAUtiliser)
    }
    // basic indication of which theme to use
    const [mode, setMode] = useState<ThemeMode>('dark');

    const theme = useMemo(
        () => mode==='dark'?createTheme({ palette: { mode, primary: { main: '#cccbd3' } } }):createTheme({ palette: { mode, } }),
        [mode]
    );

    const toggleTheme = () => setMode(m => (m === 'light' ? 'dark' : 'light'));


    return (
        <ThemeProvider theme={theme}>
      <CssBaseline />
        <ContexteImmobilisation.Provider 
            value={{ 
                optionCartoChoisie, 
                changerCarto, 
                optionsCartos,
                mode,
                toggleTheme,
                setTheme:setMode
             }}
        >
            {children}
        </ContexteImmobilisation.Provider>

            </ThemeProvider>
    );
};
const utiliserContexte = () => {
    return useContext(ContexteImmobilisation)
};


export { FournisseurContexte, utiliserContexte };