import { useState, useEffect } from 'react';
import { DataGrid, GridToolbar, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Paper, Typography, Link, CircularProgress, Alert, IconButton, Tooltip, ToggleButton, ToggleButtonGroup, Grid, Pagination } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useMarketplaceContext } from '../contexts/MarketplaceContext';
import { format, parseISO } from 'date-fns';
import ItemHistoryDialog from './ItemHistoryDialog';
import ProductCard from './ProductCard';
import { useProductImages } from '../hooks/useProductImages';

export default function MarketplaceView() {
    const { items: data, loadingInitial: loading, error } = useMarketplaceContext();
    const [selectedItem, setSelectedItem] = useState<{ id: string; title: string } | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'details'>(
        () => (localStorage.getItem('marketplaceViewMode') as 'list' | 'details') || 'list'
    );
    const [page, setPage] = useState(() => {
        const saved = localStorage.getItem('marketplacePage');
        return saved ? parseInt(saved, 10) : 1;
    });
    const ITEMS_PER_PAGE = 24;

    useEffect(() => {
        localStorage.setItem('marketplacePage', page.toString());
    }, [page]);

    useEffect(() => {
        localStorage.setItem('marketplaceViewMode', viewMode);
    }, [viewMode]);

    const currentItems = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const { imageUrls, loadingImages } = useProductImages(viewMode === 'details' ? currentItems : []);

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
                    onClick={(e) => e.stopPropagation()} // Prevent row click
                >
                    {params.value}
                </Link>
            ),
        },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
        {
            field: 'price',
            headerName: 'Price',
            width: 130,
            type: 'number',
            valueFormatter: (value: number) => { // Use valueFormatter for DataGrid (value is passed directly if signature matches)
                if (value == null) return '';
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value);
            },
        },
        { field: 'user', headerName: 'User', width: 150 },
        {
            field: 'timestamp',
            headerName: 'Date',
            width: 180,
            valueFormatter: (value: string) => {
                if (!value) return '';
                try {
                    return format(parseISO(value), 'dd.MM.yyyy HH:mm');
                } catch (e) {
                    return value;
                }
            },
        },
    ];

    return (
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" color="primary">
                    Current Marketplace Listings
                </Typography>

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
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

            <Box sx={{ width: '100%' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 300 }}>
                        <CircularProgress />
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
                            sorting: {
                                sortModel: [{ field: 'timestamp', sort: 'desc' }],
                            },
                        }}
                        pageSizeOptions={[25, 50, 100]}
                        disableRowSelectionOnClick
                        getRowId={(row) => row.id}
                        slots={{
                            toolbar: GridToolbar,
                        }}
                        slotProps={{
                            toolbar: {
                                showQuickFilter: true,
                            },
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
                                    No items found.
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Grid container spacing={2}>
                                    {currentItems.map((item) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
                                            <ProductCard
                                                item={item}
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
