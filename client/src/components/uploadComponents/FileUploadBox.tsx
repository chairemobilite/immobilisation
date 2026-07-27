import { FC, useState } from "react";
import { ServiceGeoJson } from "../../services/serviceGeoJson";
import { PropsFileUploadBox } from "../../types/InterfaceTypes";
import { Divider, LinearProgress } from "@mui/material";


const FileUploadBox:FC<PropsFileUploadBox>=(props:PropsFileUploadBox)=>{
    const [progress, setProgress] = useState<number>(0);
    const handleFileLoad = async(fileLoad:File) => {
        if (!fileLoad) return;
        const {tempFileId,columns} = await props.serviceUploadPeak(fileLoad,setProgress)
        console.log(tempFileId)
        props.defIdFichier(tempFileId)
        props.defColonnesFichier(columns)
    };
    return(
        <div className="form-group">
            <label>{props.title}</label>
            <input
                type="file"
                accept={props.accept}
                onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;

                    await handleFileLoad(f);
                }}
            />
            <LinearProgress variant="determinate" value={progress} />
            <span></span>
            <Divider variant="middle" sx={{borderColor:'white',padding:'10px'}} />
        </div>
    )
}

export default FileUploadBox