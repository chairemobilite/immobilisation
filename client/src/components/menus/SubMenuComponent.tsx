import { useNavigate, } from "react-router";
import { useState } from "react";
import { SubMenuProps } from "../../types/InterfaceTypes";
import { FormControl,InputLabel,Select,MenuItem,SelectChangeEvent, Menu, Button } from "@mui/material";
const SubMenuComponent: React.FC<SubMenuProps> = ({ label, options }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        handleClose();
    };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleClick}
        className="nav-button"
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        classes={{ paper: "nav-menu" }}
      >
        {options.map((opt, idx) => (
          <MenuItem key={idx} onClick={() => handleNavigate(opt.path)}>
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </>);
};

export default SubMenuComponent;