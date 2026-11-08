import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Snackbar, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { pb, isRequestAbort } from '../lib/pb';
import { useAuth } from '../contexts/AuthState';
import { deleteAlerts } from '../lib/data';
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
    const [editingAlert, setEditingAlert] = useState<SearchAlert | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const alertsRequest = useRef<AbortController | null>(null);
    const currentUserId = currentUser?.id || currentUser?.record?.id || '';

    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event | null, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchAlerts = useCallback(async () => {
        alertsRequest.current?.abort();
        if (!isAuthenticated) return;
        const controller = new AbortController();
        alertsRequest.current = controller;
        setLoading(true);
        try {
            const records = await pb.collection('asvz_search_alerts').getFullList<SearchAlert>({
                sort: '-created',
                filter: pb.filter('user_id = {:id}', { id: currentUserId }),
                signal: controller.signal,
            });
            if (!controller.signal.aborted) {
                setAlerts(records);
                setSelectedAlerts(prev => prev.filter(id => records.some(alert => alert.id === id)));
            }
        } catch (err) {
            if (controller.signal.aborted || isRequestAbort(err)) return;
            console.error("Failed to fetch alerts", err);
            setSnackbar({ open: true, message: "Failed to fetch alerts.", severity: 'error' });
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [isAuthenticated, currentUserId]);

    useEffect(() => {
        const timer = setTimeout(() => void fetchAlerts(), 0);
        return () => { clearTimeout(timer); alertsRequest.current?.abort(); };
    }, [fetchAlerts]);

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
                user_id: currentUserId,
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

    const handleEditClose = () => {
        if (!savingEdit) setEditingAlert(null);
    };

    const handleUpdateAlert = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!editingAlert || savingEdit) return;

        const changes = {
            title: editingAlert.title.trim(),
            user: editingAlert.user.trim(),
            webhook: (editingAlert.webhook || '').trim()
        };
        if (!changes.title && !changes.user) {
            setSnackbar({ open: true, message: "Please enter a Title or User to save an alert.", severity: 'warning' });
            return;
        }

        setSavingEdit(true);
        try {
            const updatedAlert = await pb.collection('asvz_search_alerts').update<SearchAlert>(editingAlert.id, changes);
            setAlerts(prev => prev.map(alert => alert.id === updatedAlert.id ? updatedAlert : alert));
            setEditingAlert(null);
            setSnackbar({ open: true, message: "Alert updated successfully!", severity: 'success' });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to update alert. Please try again.", severity: 'error' });
        } finally {
            setSavingEdit(false);
        }
    };

    const reconcileDeleted = (id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
        setSelectedAlerts(prev => prev.filter(selected => selected !== id));
    };

    const handleDeleteConfirm = async () => {
        alertsRequest.current?.abort();
        const failed = await deleteAlerts([deleteDialog.alertId], id => pb.collection('asvz_search_alerts').delete(id), reconcileDeleted);
        setSnackbar({ open: true, message: failed.length ? 'Failed to delete alert.' : 'Alert deleted.', severity: failed.length ? 'error' : 'success' });
        setDeleteDialog({ open: false, alertId: '' });
        await fetchAlerts();
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
        alertsRequest.current?.abort();
        setLoading(true);
        const failed = await deleteAlerts(selectedAlerts, id => pb.collection('asvz_search_alerts').delete(id), reconcileDeleted);
        setSnackbar({ open: true, message: failed.length ? `Failed to delete ${failed.length} alerts. Retry the remaining selection.` : 'Selected alerts deleted.', severity: failed.length ? 'error' : 'success' });
        await fetchAlerts();
        setLoading(false);
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
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Create New Alert</Typography>
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

            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">Active Alerts</Typography>
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
                                                    color="primary"
                                                    aria-label="Edit alert"
                                                    title="Edit alert"
                                                    onClick={() => setEditingAlert({ ...alert })}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    aria-label="Delete alert"
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

            <Dialog open={!!editingAlert} onClose={handleEditClose} fullWidth maxWidth="sm" aria-labelledby="edit-alert-title">
                <Box component="form" onSubmit={handleUpdateAlert}>
                    <DialogTitle id="edit-alert-title">Edit Alert</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Enter a title or user to match. Leave the webhook empty to use the global webhook.
                        </Typography>
                        <TextField
                            autoFocus
                            label="Title Match"
                            value={editingAlert?.title || ''}
                            onChange={(e) => setEditingAlert(prev => prev ? { ...prev, title: e.target.value } : null)}
                            disabled={savingEdit}
                            margin="dense"
                            fullWidth
                        />
                        <TextField
                            label="User Match"
                            value={editingAlert?.user || ''}
                            onChange={(e) => setEditingAlert(prev => prev ? { ...prev, user: e.target.value } : null)}
                            disabled={savingEdit}
                            margin="dense"
                            fullWidth
                        />
                        <TextField
                            label="Custom Webhook URL (Optional)"
                            value={editingAlert?.webhook || ''}
                            onChange={(e) => setEditingAlert(prev => prev ? { ...prev, webhook: e.target.value } : null)}
                            disabled={savingEdit}
                            margin="dense"
                            fullWidth
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleEditClose} disabled={savingEdit}>Cancel</Button>
                        <Button type="submit" variant="contained" color="secondary" disabled={savingEdit || (!editingAlert?.title.trim() && !editingAlert?.user.trim())}>
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

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
