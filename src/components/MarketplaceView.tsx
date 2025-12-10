import { DataGrid, GridToolbar, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Paper, Typography, Link, CircularProgress, Alert } from '@mui/material';
import { useMarketplaceContext } from '../contexts/MarketplaceContext';
import { format, parseISO } from 'date-fns';

const columns: GridColDef[] = [
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

export default function MarketplaceView() {
    const { items: data, loadingInitial: loading, error } = useMarketplaceContext();

    return (
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" color="primary">
                Marketplace Listings
            </Typography>

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
                )}
            </Box>
        </Paper>
    );
}
