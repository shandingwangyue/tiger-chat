import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { useSelector } from 'react-redux';

const Header: React.FC = () => {
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  if (!isAuthenticated) return null;

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Tiger Chat
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;