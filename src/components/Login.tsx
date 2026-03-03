import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    Container
} from '@mui/material';
import { pb } from '../lib/pb';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        background: 'rgba(30, 41, 59, 0.8)', // Slate 800 with opacity
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 700, background: 'linear-gradient(45deg, #6366f1, #ec4899)', backgroundClip: 'text', textFillColor: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Welcome Back
                    </Typography>

                    {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                    <Box sx={{ mt: 1, width: '100%' }}>
                        {/* <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, height: 48, background: 'linear-gradient(45deg, #6366f1, #ec4899)' }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button> */}

                        {/* <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>OR</Typography>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                        </div> */}

                        <Button
                            fullWidth
                            variant="outlined"
                            sx={{ mt: 1, mb: 2, height: 48, borderColor: 'rgba(255,255,255,0.5)', color: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const authData = await pb.collection('users').authWithOAuth2({ provider: 'oidc' });

                                    // Make sure we update the user's name/email from the provider if it's their first time
                                    if (authData.meta?.isNew || !authData.record.name) {
                                        await pb.collection('users').update(authData.record.id, {
                                            name: authData.meta?.name || authData.meta?.username || 'New User',
                                            // email is usually auto-synced by PB, but can be forced if needed
                                        });
                                    }
                                } catch (err) {
                                    console.error(err);
                                    setError('Failed to login with Authentik (OIDC)');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            Login with Authentik
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
