import { LatLng } from "leaflet";

export type ThemeMode = 'light' | 'dark';

export interface donneesCarteDeFond{
    id:number,
    description:string,
    URL:string,
    attribution:string;
    zoomMax:number
}

export type ContexteImmobilisationType = {
    optionCartoChoisie: number;
    changerCarto: (idAUtiliser: number) => void;
    optionsCartos: donneesCarteDeFond[],
    mode:ThemeMode,
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
};

export type FournisseurContexteProps = {
    children: ReactNode;
};

export interface CentreDeCarte{
    idLieu:number,
    nomLieu:string,
    zoomDebut:number,
    centreDebut:LatLng
}
