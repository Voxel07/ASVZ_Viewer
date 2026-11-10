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
  Tab,
  Button,
  Dialog
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import { pb } from './lib/pb';
import theme from './theme';
import UpdatesChart from './components/UpdatesChart';
import MarketplaceView from './components/MarketplaceView';
import SearchView from './components/SearchView';
import AlertView from './components/AlertView';
import Login from './components/Login';
// Marketplace Provider wraps the app to provide global state
import { MarketplaceProvider } from './contexts/MarketplaceContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthState';

function MainApp() {
  const { isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => pb.authStore.onChange(() => {
    if (pb.authStore.isValid) setShowLogin(false);
  }), []);

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
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          bgcolor: 'rgba(15, 15, 15, 0.96)',
          borderBottom: '2px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Toolbar sx={{
          gap: { xs: 1, lg: 2 },
          flexWrap: { xs: 'wrap', lg: 'nowrap' },
          px: { xs: 2, sm: 3 },
          pt: { xs: 1.5, lg: 0 },
        }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: { xs: 1, lg: 0 },
              mr: { xs: 0, lg: 2 },
              pl: 1.5,
              borderLeft: '6px solid',
              borderColor: 'primary.main',
              fontWeight: 900,
              letterSpacing: { xs: '0.06em', sm: '0.14em' },
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              color: 'text.primary',
              whiteSpace: 'nowrap',
            }}
          >
            ASVZ Analytics
          </Typography>

          <Tabs
            aria-label="Main navigation"
            value={currentTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth"
            sx={{
              flexGrow: 1,
              order: { xs: 3, lg: 0 },
              width: { xs: '100%', lg: 'auto' },
              minWidth: 0,
              '& .MuiTab-root': {
                minWidth: 0,
                px: { xs: 0.25, sm: 2 },
                minHeight: { xs: 64, sm: 56 },
                fontSize: { xs: '0.55rem', sm: '0.75rem' },
                letterSpacing: { xs: 0, sm: '0.09em' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 1 },
              },
              '& .MuiTab-icon': { mr: 0, mb: 0, fontSize: { xs: 21, sm: 24 } },
            }}
          >
            <Tab icon={<DashboardIcon />} iconPosition="start" label="Dashboard" />
            <Tab icon={<StoreIcon />} iconPosition="start" label="Marketplace" />
            <Tab icon={<SearchIcon />} iconPosition="start" label="Search" />
            <Tab icon={<NotificationsActiveIcon />} iconPosition="start" label="Alerts" />
          </Tabs>

          <Box sx={{ flexGrow: 0 }}>
            {isAuthenticated ? (
              <Button variant="outlined" onClick={logout}>
                Logout
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={() => setShowLogin(true)}>
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog
        open={showLogin}
        onClose={() => setShowLogin(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            style: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              border: 'none',
            },
          },
        }}
      >
        <Login />
      </Dialog>

      <Box component="main" sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto', py: { xs: 2, sm: 3, lg: 4 }, pb: 'max(24px, env(safe-area-inset-bottom))', bgcolor: 'transparent' }}>
        <Container maxWidth={false} sx={{ width: { xs: '100%', lg: '90%' }, px: { xs: 1.5, sm: 3 } }}>
          {/* Tab Panel 0: Dashboard */}
          <div role="tabpanel" hidden={currentTab !== 0}>
            {currentTab === 0 && (
              <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
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

          {/* Tab Panel 3: Alerts */}
          <div role="tabpanel" hidden={currentTab !== 3}>
            {currentTab === 3 && (
              <AlertView />
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
      <AuthProvider>
        <MarketplaceProvider>
          <MainApp />
        </MarketplaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
