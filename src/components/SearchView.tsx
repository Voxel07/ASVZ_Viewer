import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Paper, Typography, Link, Alert, TextField, InputAdornment, FormControlLabel, Switch, Chip, IconButton, Tooltip, ToggleButton, ToggleButtonGroup, Grid, Pagination, Skeleton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useItemSearch, type SearchQuery } from '../hooks/useData';
import ProductCard from './ProductCard';
import type { MarketplaceItem } from '../types';
import { format, parseISO } from 'date-fns';
import type { MarketplaceDeletedItem } from '../types';
import ItemHistoryDialog from './ItemHistoryDialog';
import { useProductImages } from '../hooks/useProductImages';

export default function SearchView() {
    const [searchQuery, setSearchQuery] = useState<SearchQuery>(() => {
        const saved = localStorage.getItem('searchQueryObj');
        return saved ? JSON.parse(saved) : { title: '', user: '', id: '' };
    });
    const [includeDeleted, setIncludeDeleted] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'details'>(
        () => (localStorage.getItem('searchViewMode') as 'list' | 'details') || 'list'
    );
    const [page, setPage] = useState(() => {
        const saved = localStorage.getItem('searchPage');
        return saved ? parseInt(saved, 10) : 1;
    });
    const ITEMS_PER_PAGE = 24;

    useEffect(() => {
        localStorage.setItem('searchPage', page.toString());
    }, [page]);

    useEffect(() => {
        localStorage.setItem('searchViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('searchQueryObj', JSON.stringify(searchQuery));
    }, [searchQuery]);

    const [selectedItem, setSelectedItem] = useState<{ id: string; title: string } | null>(null);

    const { data, loading, error } = useItemSearch(searchQuery, includeDeleted);

    // NOTE: 'data' from useItemSearch has type (MarketplaceItem | MarketplaceDeletedItem)[] 
    const currentItems = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const { imageUrls, loadingImages } = useProductImages(viewMode === 'details' ? currentItems : []);

    const handleOpenHistory = useCallback((id: string, title: string) => {
        setSelectedItem({ id, title });
    }, []);

    const handleCloseHistory = () => {
        setSelectedItem(null);
    };

    const columns: GridColDef[] = useMemo(() => [
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
    ], [handleOpenHistory]);

    return (
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" color="primary">
                    Advanced Search
                </Typography>

                <Box display="flex" alignItems="center" gap={2}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_e, newMode) => {
                            if (newMode !== null) setViewMode(newMode);
                        }}
                        aria-label="view mode"
                        size="small"
                    >
                        <ToggleButton value="list" aria-label="list view">
                            <ViewListIcon />
                        </ToggleButton>
                        <ToggleButton value="details" aria-label="details view">
                            <ViewModuleIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>

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
                        placeholder="Search by ID"
                        value={searchQuery.id || ''}
                        onChange={(e) => setSearchQuery(prev => ({ ...prev, id: e.target.value }))}
                        variant="outlined"
                        size="small"
                        sx={{ width: 150 }}
                    />
                    <TextField
                        placeholder="Search by User"
                        value={searchQuery.user || ''}
                        onChange={(e) => setSearchQuery(prev => ({ ...prev, user: e.target.value }))}
                        variant="outlined"
                        size="small"
                        sx={{ width: 200 }}
                        disabled={!!searchQuery.id && searchQuery.id.length > 0}
                    />
                    <TextField
                        placeholder="Search by Title"
                        value={searchQuery.title || ''}
                        onChange={(e) => setSearchQuery(prev => ({ ...prev, title: e.target.value }))}
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
                        disabled={!!searchQuery.id && searchQuery.id.length > 0}
                    />
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

            <Box sx={{ width: '100%' }}>
                {loading ? (
                    <Box display="flex" flexDirection="column" gap={2} sx={{ minHeight: 300, mt: 2 }}>
                        {viewMode === 'list' ? (
                            <Box>
                                {[...Array(10)].map((_, i) => (
                                    <Skeleton key={i} variant="rectangular" height={50} sx={{ mb: 1, borderRadius: 1 }} animation="wave" />
                                ))}
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {[...Array(12)].map((_, i) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} animation="wave" />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                ) : viewMode === 'list' ? (
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
                                        {!searchQuery.title && !searchQuery.user && !searchQuery.id ? "Enter search criteria (at least 3 characters)" : "No results found"}
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
                ) : (
                    <Box>
                        {data.length === 0 ? (
                            <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 100 }}>
                                <Typography color="text.secondary">
                                    {!searchQuery.title && !searchQuery.user && !searchQuery.id ? "Enter search criteria (at least 3 characters)" : "No results found"}
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Grid container spacing={2}>
                                    {currentItems.map((item) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
                                            <ProductCard
                                                item={item as MarketplaceItem}
                                                onHistoryClick={handleOpenHistory}
                                                imageUrl={imageUrls[item.asvz_id]?.url}
                                                imageLoading={loadingImages && !imageUrls[item.asvz_id]}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                                {data.length > ITEMS_PER_PAGE && (
                                    <Box display="flex" justifyContent="center" mt={3}>
                                        <Pagination
                                            count={Math.ceil(data.length / ITEMS_PER_PAGE)}
                                            page={page}
                                            onChange={(_e, p) => setPage(p)}
                                            color="primary"
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
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
