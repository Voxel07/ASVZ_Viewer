import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Snackbar, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { pb } from '../lib/pb';
import { useAuth } from '../contexts/AuthContext';
import type { SearchAlert } from '../types';

export default function AlertView() {
    const { isAuthenticated, user: currentUser } = useAuth();
    const [alerts, setAlerts] = useState<SearchAlert[]>([]);
    const [loading, setLoading] = useState(false);

    // New alert form
    const [titleStr, setTitleStr] = useState('');
    const [userStr, setUserStr] = useState('');
    const [webhookStr, setWebhookStr] = useState('');
    const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'info' });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, alertId: string }>({ open: false, alertId: '' });

    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchAlerts = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const records = await pb.collection('asvz_search_alerts').getFullList<SearchAlert>({
                sort: '-created',
                filter: `user_id="${currentUser?.id || (currentUser as any)?.record?.id}"`
            });
            setAlerts(records);
        } catch (err) {
            console.error("Failed to fetch alerts", err);
            setSnackbar({ open: true, message: "Failed to fetch alerts.", severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [isAuthenticated]);

    const handleCreateAlert = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!titleStr && !userStr) {
            setSnackbar({ open: true, message: "Please enter a Title or User to save an alert.", severity: 'warning' });
            return;
        }

        try {
            await pb.collection('asvz_search_alerts').create({
                title: titleStr,
                user: userStr,
                user_id: currentUser?.id || (currentUser as any)?.record?.id || '',
                webhook: webhookStr
            });
            setSnackbar({ open: true, message: "Alert saved successfully!", severity: 'success' });
            setTitleStr('');
            setUserStr('');
            setWebhookStr('');
            fetchAlerts();
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to save alert.", severity: 'error' });
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await pb.collection('asvz_search_alerts').delete(deleteDialog.alertId);
            setSnackbar({ open: true, message: "Alert deleted.", severity: 'success' });
            fetchAlerts();
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to delete alert.", severity: 'error' });
        } finally {
            setDeleteDialog({ open: false, alertId: '' });
        }
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAlerts(alerts.map(a => a.id));
        } else {
            setSelectedAlerts([]);
        }
    };

    const toggleSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedAlerts(prev => [...prev, id]);
        } else {
            setSelectedAlerts(prev => prev.filter(a => a !== id));
        }
    };

    const handleBulkDelete = async () => {
        setLoading(true);
        try {
            for (const id of selectedAlerts) {
                await pb.collection('asvz_search_alerts').delete(id);
            }
            setSnackbar({ open: true, message: `${selectedAlerts.length} alerts deleted.`, severity: 'success' });
            setSelectedAlerts([]);
            fetchAlerts();
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to delete some alerts.", severity: 'error' });
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    You must be logged in to view and manage Search Alerts.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Create New Alert</Typography>
                <Box component="form" onSubmit={handleCreateAlert} sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Search by Title"
                        value={titleStr}
                        onChange={(e) => setTitleStr(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ width: 300 }}
                    />
                    <TextField
                        placeholder="Search by User"
                        value={userStr}
                        onChange={(e) => setUserStr(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ width: 250 }}
                    />
                    <TextField
                        placeholder="Custom Webhook URL (Optional)"
                        value={webhookStr}
                        onChange={(e) => setWebhookStr(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ width: 350 }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        disabled={!titleStr && !userStr}
                    >
                        Save Alert
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Active Alerts</Typography>
                    {selectedAlerts.length > 0 && (
                        <Button variant="outlined" color="error" onClick={handleBulkDelete} disabled={loading}>
                            Delete Selected ({selectedAlerts.length})
                        </Button>
                    )}
                </Box>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={alerts.length > 0 && selectedAlerts.length === alerts.length}
                                            indeterminate={selectedAlerts.length > 0 && selectedAlerts.length < alerts.length}
                                            onChange={(e) => toggleSelectAll(e.target.checked)}
                                        />
                                    </TableCell>
                                    <TableCell>Title Match</TableCell>
                                    <TableCell>User Match</TableCell>
                                    <TableCell>Webhook</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {alerts.filter(a => !!a.title || !!a.user).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">No active alerts found.</TableCell>
                                    </TableRow>
                                ) : (
                                    alerts.map((alert) => (
                                        <TableRow key={alert.id}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedAlerts.includes(alert.id)}
                                                    onChange={(e) => toggleSelect(alert.id, e.target.checked)}
                                                />
                                            </TableCell>
                                            <TableCell>{alert.title || '-'}</TableCell>
                                            <TableCell>{alert.user || '-'}</TableCell>
                                            <TableCell>{alert.webhook ? 'Custom' : 'Global'}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => setDeleteDialog({ open: true, alertId: alert.id })}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, alertId: '' })}>
                <DialogTitle>Delete Alert</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this alert?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, alertId: '' })}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
