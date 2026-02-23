import { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Grid,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import SearchIcon from '@mui/icons-material/Search';

import theme from './theme';
import UpdatesChart from './components/UpdatesChart';
import MarketplaceView from './components/MarketplaceView';
import SearchView from './components/SearchView';
// Marketplace Provider wraps the app to provide global state
import { MarketplaceProvider } from './contexts/MarketplaceContext';

function MainApp() {
  const [currentTab, setCurrentTab] = useState(() => {
    const saved = localStorage.getItem('appCurrentTab');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('appCurrentTab', currentTab.toString());
  }, [currentTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4, fontWeight: 'bold', background: 'linear-gradient(45deg, #6366f1, #ec4899)', backgroundClip: 'text', textFillColor: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ASVZ Analytics
          </Typography>

          <Tabs value={currentTab} onChange={handleTabChange} textColor="primary" indicatorColor="primary" sx={{ flexGrow: 1 }}>
            <Tab icon={<DashboardIcon />} iconPosition="start" label="Dashboard" />
            <Tab icon={<StoreIcon />} iconPosition="start" label="Marketplace" />
            <Tab icon={<SearchIcon />} iconPosition="start" label="Search" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 4, bgcolor: 'background.default' }}>
        <Container maxWidth={false} sx={{ width: '90%' }}>
          {/* Tab Panel 0: Dashboard */}
          <div role="tabpanel" hidden={currentTab !== 0}>
            {currentTab === 0 && (
              <Grid container spacing={3} justifyContent="center">
                <Grid size={{ xs: 12 }}>
                  <UpdatesChart />
                </Grid>
              </Grid>
            )}
          </div>

          {/* Tab Panel 1: Marketplace */}
          <div role="tabpanel" hidden={currentTab !== 1}>
            {currentTab === 1 && (
              <MarketplaceView />
            )}
          </div>

          {/* Tab Panel 2: Search */}
          <div role="tabpanel" hidden={currentTab !== 2}>
            {currentTab === 2 && (
              <SearchView />
            )}
          </div>
        </Container>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MarketplaceProvider>
        <MainApp />
      </MarketplaceProvider>
    </ThemeProvider>
  );
}

export default App;
