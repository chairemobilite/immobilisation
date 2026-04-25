import { FormControl, TextField, FormLabel, Button, InputAdornment, IconButton, OutlinedInput, InputLabel } from "@mui/material";
import { authClient } from "../lib/auth-client";
import { useState } from "react";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const ProfilUtilisateur: React.FC = () =>{
    const { data: data, isPending } = authClient.useSession();
    const [ancienMdp,defAncienMdp] = useState('');
    const [nouveauMdp,defNouveauMdp] = useState('');
    const [confNouveauMdp,defConfNouveauMdp] = useState('');
    const [montreMDP, defMontreMDP] = useState(false);
    const handleItemChange = (field:string, value:string)=>{
        if (field==='ancienMdp'){
            defAncienMdp(value)
        }
        if (field==='nouveauMdp'){
            defNouveauMdp(value)
        }
        if (field==='confNouveauMdp'){
            defConfNouveauMdp(value)
        }
    }
    const handlePasswordChange = async()=>{
        if (nouveauMdp!==confNouveauMdp){
            alert("Le nouveau mot de passe et sa confirmation ne correspondent pas.")
            return
        }
        try{
            await authClient.changePassword({currentPassword: ancienMdp, newPassword: nouveauMdp})
            alert("Mot de passe changé avec succès.")
            defAncienMdp('')
            defNouveauMdp('')
            defConfNouveauMdp('')
        }catch(error){
            alert("Erreur lors du changement de mot de passe : "+error)
        }
    }
    const handleClickShowPassword = () => defMontreMDP((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };
    return(
        <div className="montre-profil" style={{padding: '10px'}}>
            <h2>Profil utilisateur</h2>
            <p>Nom: {data?.user.name}</p>
            <p>Email: {data?.user.email}</p>
            <p>Session Créée : {data?.session?.createdAt.toISOString()}</p>
            <p>Session expire: {data?.session?.expiresAt.toISOString()}</p>
            <FormControl variant="standard" fullWidth sx={{ gap: 2 }}>
                <FormLabel sx={{ color: "white" }}>Modification mot de passe</FormLabel>
                <FormControl>
                <InputLabel htmlFor='ancien-mdp-boite' sx={{color:"white","& .MuiFormLabel-root": { color: "white" },"& .MuiInputLabel-root":{color:"white"}}}>Ancien Mot de passe</InputLabel>
                <OutlinedInput
                    key={'ancienMdp'}
                    id='ancien-mdp-boite'
                    label={"Ancien Mot de passe"}
                    value={ancienMdp}
                    onChange={(e) => handleItemChange('ancienMdp', e.target.value)}
                    type={montreMDP?"text":"password"}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                            aria-label={
                                montreMDP ? 'hide the password' : 'display the password'
                            }
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            onMouseUp={handleMouseUpPassword}
                            edge="end"
                            >
                            {montreMDP ? <VisibilityOff sx={{color:'white'}}/> : <Visibility sx={{color:'white'}}/>}
                            </IconButton>
                        </InputAdornment>
                        }
                    sx={{
                        "& .MuiInputBase-input": {
                            color: "white",
                            backgroundColor: "#1f1f1f",
                        },
                        "& .MuiInputLabel-root": { color: "white" },
                        "& .MuiInputLabel-root.Mui-disabled": {
                            color: "#cccccc",
                            WebkitTextFillColor: "#cccccc",
                        },
                        "& .MuiInputBase-input.Mui-disabled": {
                            color: "#cccccc",
                            WebkitTextFillColor: "#cccccc",
                            opacity: 1,
                        },
                        "& .MuiInput-underline:before": { borderBottomColor: "white" },
                        "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                    }}
                />
                </FormControl>
                <FormControl>
                <InputLabel htmlFor='nouveau-mdp-boite'sx={{color:'white'}}>Nouveau Mot de passe</InputLabel>
                <OutlinedInput
                    key={'nouveauMdp'}
                    id='nouveau-mdp-boite'
                    label={"Nouveau Mot de passe"}
                    value={nouveauMdp}
                    onChange={(e) => handleItemChange('nouveauMdp', e.target.value)}
                    type={montreMDP?"text":"password"}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                            aria-label={
                                montreMDP ? 'hide the password' : 'display the password'
                            }
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            onMouseUp={handleMouseUpPassword}
                            edge="end"
                            >
                            {montreMDP ? <VisibilityOff sx={{color:'white'}}/> : <Visibility sx={{color:'white'}}/>}
                            </IconButton>
                        </InputAdornment>
                        }
                    sx={{
                        "& .MuiInputBase-input": {
                            color: "white",
                            backgroundColor: "#1f1f1f",
                        },
                        "& .MuiInputLabel-root": { color: "white" },
                        "& .MuiInputLabel-root.Mui-disabled": {
                            color: "#cccccc",
                            WebkitTextFillColor: "#cccccc",
                        },
                        "& .MuiInputBase-input.Mui-disabled": {
                            color: "#cccccc",
                            WebkitTextFillColor: "#cccccc",
                            opacity: 1,
                        },
                        "& .MuiInput-underline:before": { borderBottomColor: "white" },
                        "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                    }}
                />
                </FormControl>
                <FormControl>
                <InputLabel htmlFor='nouveau-mdp-conf-boite' sx={{color:'white'}}>Confirme Nouveau Mot de passe</InputLabel>
                <OutlinedInput
                    key={'confNouveauMdp'}
                    id='nouveau-mdp-conf-boite'
                    label={"Confirmer Nouveau Mot de passe"}
                    value={confNouveauMdp}
                    onChange={(e) => handleItemChange('confNouveauMdp', e.target.value)}
                    type={montreMDP?"text":"password"}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                            aria-label={
                                montreMDP ? 'hide the password' : 'display the password'
                            }
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            onMouseUp={handleMouseUpPassword}
                            edge="end"
                            >
                            {montreMDP ? <VisibilityOff sx={{color:'white'}}/> : <Visibility sx={{color:'white'}}/>}
                            </IconButton>
                        </InputAdornment>
                        }
                    sx={{
                        "& .MuiInputBase-input": {
                            color: "white",
                            backgroundColor: "#1f1f1f",
                        },
                        "& .MuiInputLabel-root": { color: "white" },
                        "& .MuiInputLabel-root.Mui-disabled": {
                            color: "#cccccc",
                            WebkitTextFillColor: "#cccccc",
                        },
                        "& .MuiInputBase-input.Mui-disabled": {
                            color: "#cccccc",
                            WebkitTextFillColor: "#cccccc",
                            opacity: 1,
                        },
                        "& .MuiInput-underline:before": { borderBottomColor: "white" },
                        "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                    }}
                />
                </FormControl>
                {(ancienMdp && nouveauMdp && confNouveauMdp) && (nouveauMdp.length>=10) && (nouveauMdp===confNouveauMdp )?<>
                    <Button variant="contained" color="primary" onClick={()=>handlePasswordChange()}>
                        Changer le mot de passe
                    </Button>
                    </>:<>
                        Le mot de passe doit être de 10 caractères minimum et être confirmé pour être changé
                    </>
                }
            </FormControl>
        </div>
    )
}

export default ProfilUtilisateur;