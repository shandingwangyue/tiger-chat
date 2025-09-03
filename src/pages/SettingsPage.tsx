import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          设置
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            应用设置
          </Typography>
          <Typography variant="body1" color="text.secondary">
            设置页面正在开发中...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default SettingsPage;
