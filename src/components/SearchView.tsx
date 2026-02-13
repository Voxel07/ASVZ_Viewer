import { useState } from 'react';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Paper, Typography, Link, CircularProgress, Alert, TextField, InputAdornment, FormControlLabel, Switch, Chip, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useItemSearch, type SearchField } from '../hooks/useData';
import { format, parseISO } from 'date-fns';
import type { MarketplaceDeletedItem } from '../types';
import ItemHistoryDialog from './ItemHistoryDialog';

export default function SearchView() {
    const [query, setQuery] = useState('');
    const [includeDeleted, setIncludeDeleted] = useState(false);
    const [searchField, setSearchField] = useState<SearchField>('title');
    const [selectedItem, setSelectedItem] = useState<{ id: string; title: string } | null>(null);

    const { data, loading, error } = useItemSearch(query, includeDeleted, searchField);

    const handleOpenHistory = (id: string, title: string) => {
        setSelectedItem({ id, title });
    };

    const handleCloseHistory = () => {
        setSelectedItem(null);
    };

    const columns: GridColDef[] = [
        {
            field: 'actions',
            headerName: '',
            width: 50,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams) => {
                // Only show history button if updated date differs from created date (timestamp)
                const hasUpdates = params.row.updated && params.row.updated !== params.row.timestamp;

                if (!hasUpdates) return null;

                return (
                    <Tooltip title="View Price History">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenHistory(params.row.asvz_id, params.row.title);
                            }}
                        >
                            <TimelineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                );
            },
        },
        {
            field: 'asvz_id',
            headerName: 'ID',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Link
                    href={`https://www.airsoft-verzeichnis.de/index.php?status=forum&sp=1&threadnummer=${params.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    onClick={(e) => e.stopPropagation()}
                >
                    {params.value}
                </Link>
            ),
        },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
        {
            field: 'price',
            headerName: 'Price',
            width: 120,
            type: 'number',
            valueFormatter: (value: number) => {
                if (value == null) return '';
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value);
            },
        },
        { field: 'user', headerName: 'User', width: 140 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => {
                const isDeleted = (params.row as any)._isDeleted;
                return (
                    <Chip
                        label={isDeleted ? "Deleted" : "Active"}
                        color={isDeleted ? "error" : "success"}
                        size="small"
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: 'last_available',
            headerName: 'Last Available',
            width: 160,
            valueFormatter: (value: string) => {
                if (!value) return '';
                try {
                    return format(parseISO(value), 'dd.MM.yyyy HH:mm');
                } catch (e) {
                    return value;
                }
            },
        },
        {
            field: 'duration_online',
            headerName: 'Duration',
            width: 140,
            valueGetter: (_value, row) => {
                const del = row as MarketplaceDeletedItem;
                return del.duration_online || '-';
            }
        },
    ];

    return (
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" color="primary">
                    Advanced Search
                </Typography>

                <Box display="flex" alignItems="center" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="search-field-label">Search By</InputLabel>
                        <Select
                            labelId="search-field-label"
                            value={searchField}
                            label="Search By"
                            onChange={(e) => setSearchField(e.target.value as SearchField)}
                        >
                            <MenuItem value="title">Title</MenuItem>
                            <MenuItem value="id">ID</MenuItem>
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="all">All Fields</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={includeDeleted}
                                onChange={(e) => setIncludeDeleted(e.target.checked)}
                            />
                        }
                        label="Include Deleted"
                    />
                    <TextField
                        placeholder={`Search items by ${searchField === 'all' ? 'Title, ID, or User' : searchField.charAt(0).toUpperCase() + searchField.slice(1)}...`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ width: 300 }}
                    />
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

            <Box sx={{ width: '100%' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 300 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <DataGrid
                        rows={data}
                        columns={columns}
                        autoHeight
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 25, page: 0 },
                            },
                        }}
                        pageSizeOptions={[25, 50, 100]}
                        disableRowSelectionOnClick
                        getRowId={(row) => row.id}
                        slots={{
                            noRowsOverlay: () => (
                                <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 100 }}>
                                    <Typography color="text.secondary">
                                        {query.length < 3 ? "Type at least 3 characters to search" : "No results found"}
                                    </Typography>
                                </Box>
                            )
                        }}
                        sx={{
                            border: 0,
                            '& .MuiDataGrid-cell:focus-within': {
                                outline: 'none',
                            },
                        }}
                    />
                )}
            </Box>

            {selectedItem && (
                <ItemHistoryDialog
                    open={!!selectedItem}
                    onClose={handleCloseHistory}
                    asvzId={selectedItem.id}
                    title={selectedItem.title}
                />
            )}
        </Paper>
    );
}
