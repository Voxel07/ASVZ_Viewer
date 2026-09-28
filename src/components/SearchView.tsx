import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Paper, Typography, Link, Alert, TextField, InputAdornment, FormControlLabel, Switch, Chip, IconButton, Tooltip, ToggleButton, ToggleButtonGroup, Grid, Pagination, Skeleton, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Select, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { useItemSearch, type SearchQuery } from '../hooks/useData';
import ProductCard from './ProductCard';
import type { MarketplaceItem } from '../types';
import { format, parseISO } from 'date-fns';
import type { MarketplaceDeletedItem } from '../types';
import ItemHistoryDialog from './ItemHistoryDialog';
import { useProductImages } from '../hooks/useProductImages';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function SearchView() {
    const [searchQuery, setSearchQuery] = useState<SearchQuery>(() => {
        const saved = localStorage.getItem('searchQueryObj');
        return saved ? JSON.parse(saved) : { title: '', user: '', id: '' };
    });
    const [includeDeleted, setIncludeDeleted] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'details' | 'trend'>(
        () => (localStorage.getItem('searchViewMode') as 'list' | 'details' | 'trend') || 'list'
    );
    const [trendViewType, setTrendViewType] = useState<'week' | 'month' | 'year'>(
        () => (localStorage.getItem('searchTrendViewType') as 'week' | 'month' | 'year') || 'month'
    );
    const [currentPeriod, setCurrentPeriod] = useState<string>('');
    const [clickedGroup, setClickedGroup] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('searchTrendViewType', trendViewType);
    }, [trendViewType]);
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

    const availableWeeks = useMemo(() => {
        if (!data || data.length === 0) return [];
        const weeks = new Set<string>();
        data.forEach(item => {
            const dateStr = (item as any)._isDeleted ? ((item as MarketplaceDeletedItem).last_available || item.timestamp) : item.timestamp;
            if (dateStr) {
                const date = parseISO(dateStr);
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
                const monday = new Date(date.setDate(diff));
                weeks.add(format(monday, 'yyyy-MM-dd'));
            }
        });
        return Array.from(weeks).sort();
    }, [data]);

    const availableMonths = useMemo(() => {
        if (!data || data.length === 0) return [];
        const months = new Set<string>();
        data.forEach(item => {
            const dateStr = (item as any)._isDeleted ? ((item as MarketplaceDeletedItem).last_available || item.timestamp) : item.timestamp;
            if (dateStr) {
                months.add(dateStr.substring(0, 7)); // YYYY-MM
            }
        });
        return Array.from(months).sort();
    }, [data]);

    const availableYears = useMemo(() => {
        if (!data || data.length === 0) return [];
        const years = new Set<string>();
        data.forEach(item => {
            const dateStr = (item as any)._isDeleted ? ((item as MarketplaceDeletedItem).last_available || item.timestamp) : item.timestamp;
            if (dateStr) {
                years.add(dateStr.substring(0, 4)); // YYYY
            }
        });
        return Array.from(years).sort();
    }, [data]);

    const filteredDataByPeriod = useMemo(() => {
        if (!data || data.length === 0 || !currentPeriod) return [];

        return data.filter(item => {
            const dateStr = (item as any)._isDeleted ? ((item as MarketplaceDeletedItem).last_available || item.timestamp) : item.timestamp;
            if (!dateStr) return false;
            
            if (trendViewType === 'week') {
                const itemDate = parseISO(dateStr);
                const weekStart = parseISO(currentPeriod);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);
                return itemDate >= weekStart && itemDate < weekEnd;
            } else if (trendViewType === 'month') {
                return dateStr.substring(0, 7) === currentPeriod;
            } else { // year
                return dateStr.substring(0, 4) === currentPeriod;
            }
        });
    }, [data, trendViewType, currentPeriod]);

    useEffect(() => {
        if (!data || data.length === 0) return;

        if (trendViewType === 'week') {
            if (availableWeeks.length > 0 && !availableWeeks.includes(currentPeriod)) {
                setCurrentPeriod(availableWeeks[availableWeeks.length - 1]);
            }
        } else if (trendViewType === 'month') {
            if (availableMonths.length > 0 && !availableMonths.includes(currentPeriod)) {
                setCurrentPeriod(availableMonths[availableMonths.length - 1]);
            }
        } else if (trendViewType === 'year') {
            if (availableYears.length > 0 && !availableYears.includes(currentPeriod)) {
                setCurrentPeriod(availableYears[availableYears.length - 1]);
            }
        }
    }, [trendViewType, data, availableWeeks, availableMonths, availableYears, currentPeriod]);

    const availablePeriods = useMemo(() => {
        if (trendViewType === 'week') return availableWeeks;
        if (trendViewType === 'month') return availableMonths;
        return availableYears;
    }, [trendViewType, availableWeeks, availableMonths, availableYears]);

    const overallStats = useMemo(() => {
        if (!filteredDataByPeriod || filteredDataByPeriod.length === 0) return { avg: 0, count: 0, min: 0, max: 0 };
        const prices = filteredDataByPeriod.map(item => item.price).filter(p => p != null);
        if (prices.length === 0) return { avg: 0, count: 0, min: 0, max: 0 };
        const sum = prices.reduce((a, b) => a + b, 0);
        return {
            avg: Math.round(sum / prices.length),
            count: filteredDataByPeriod.length,
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    }, [filteredDataByPeriod]);

    const groupedData = useMemo(() => {
        if (!currentPeriod || !data) return [];

        if (trendViewType === 'week') {
            // Generate 7 days
            const baseDate = parseISO(currentPeriod);
            const days = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(baseDate);
                d.setDate(baseDate.getDate() + i);
                return format(d, 'yyyy-MM-dd');
            });

            return days.map(dayStr => {
                const dayItems = filteredDataByPeriod.filter(item => {
                    const dateStr = (item as any)._isDeleted ? ((item as MarketplaceDeletedItem).last_available || item.timestamp) : item.timestamp;
                    return dateStr && dateStr.startsWith(dayStr);
                });
                const prices = dayItems.map(item => item.price).filter(p => p != null);
                const count = dayItems.length;
                const sum = prices.reduce((a, b) => a + b, 0);
                
                return {
                    dateStr: dayStr,
                    avgPrice: count > 0 ? Math.round(sum / count) : undefined,
                    minPrice: count > 0 ? Math.min(...prices) : undefined,
                    maxPrice: count > 0 ? Math.max(...prices) : undefined,
                    count,
                };
            });
        } else if (trendViewType === 'month') {
            // 4 quarters: Q1: 1-8, Q2: 9-16, Q3: 17-24, Q4: 25-31
            const quarters = [
                { name: '1st - 8th', start: 1, end: 8 },
                { name: '9th - 16th', start: 9, end: 16 },
                { name: '17th - 24th', start: 17, end: 24 },
                { name: '25th - End', start: 25, end: 31 },
            ];

            return quarters.map(q => {
                const qItems = filteredDataByPeriod.filter(item => {
                    const dateStr = (item as any)._isDeleted ? ((item as MarketplaceDeletedItem).last_available || item.timestamp) : item.timestamp;
                    if (!dateStr) return false;
                    const date = parseISO(dateStr);
                    const day = date.getDate();
                    return day >= q.start && day <= q.end;
                });
                const prices = qItems.map(item => item.price).filter(p => p != null);
                const count = qItems.length;
                const sum = prices.reduce((a, b) => a + b, 0);

                return {
                    dateStr: q.name,
                    avgPrice: count > 0 ? Math.round(sum / count) : undefined,
                    minPrice: count > 0 ? Math.min(...prices) : undefined,
                    maxPrice: count > 0 ? Math.max(...prices) : undefined,
                    count,
                };
            });
        } else { // year
            // 12 months
            const months = Array.from({ length: 12 }).map((_, i) => {
                const m = i + 1;
                return `${currentPeriod}-${m.toString().padStart(2, '0')}`;
            });

            return months.map(mStr => {
                const mItems = filteredDataByPeriod.filter(item => {
                    const dateStr = (item as any)._isDeleted ? ((item as MarketplaceDeletedItem).last_available || item.timestamp) : item.timestamp;
                    return dateStr && dateStr.startsWith(mStr);
                });
                const prices = mItems.map(item => item.price).filter(p => p != null);
                const count = mItems.length;
                const sum = prices.reduce((a, b) => a + b, 0);

                return {
                    dateStr: mStr,
                    avgPrice: count > 0 ? Math.round(sum / count) : undefined,
                    minPrice: count > 0 ? Math.min(...prices) : undefined,
                    maxPrice: count > 0 ? Math.max(...prices) : undefined,
                    count,
                };
            });
        }
    }, [filteredDataByPeriod, trendViewType, currentPeriod, data]);

    const formatXAxis = useCallback((dateStr: string) => {
        try {
            if (trendViewType === 'week') {
                const date = parseISO(dateStr);
                return format(date, 'eee dd.MM');
            } else if (trendViewType === 'month') {
                return dateStr;
            } else { // year
                const date = parseISO(`${dateStr}-01`);
                return format(date, 'MMM');
            }
        } catch (e) {
            return dateStr;
        }
    }, [trendViewType]);

    const formatTooltipLabel = useCallback((dateStr: string) => {
        try {
            if (trendViewType === 'week') {
                const date = parseISO(dateStr);
                return format(date, 'EEEE, dd.MM.yyyy');
            } else if (trendViewType === 'month') {
                return `${dateStr} of ${format(parseISO(`${currentPeriod}-01`), 'MMMM yyyy')}`;
            } else { // year
                const date = parseISO(`${dateStr}-01`);
                return format(date, 'MMMM yyyy');
            }
        } catch (e) {
            return dateStr;
        }
    }, [trendViewType, currentPeriod]);

    const CustomTooltip = useCallback(({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <Paper
                    sx={{
                        p: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        boxShadow: 3
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {formatTooltipLabel(label)}
                    </Typography>
                    {dataPoint.avgPrice !== undefined && (
                        <>
                            <Typography variant="body2" color="primary.light" sx={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                                <span>Avg Price:</span>
                                <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(dataPoint.avgPrice)}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                                <span>Price Range:</span>
                                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(dataPoint.minPrice)} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(dataPoint.maxPrice)}</span>
                            </Typography>
                        </>
                    )}
                    <Typography variant="body2" color="success.light" sx={{ display: 'flex', justifyContent: 'space-between', gap: 4, mt: 0.5 }}>
                        <span>Items Listed:</span>
                        <strong>{dataPoint.count}</strong>
                    </Typography>
                </Paper>
            );
        }
        return null;
    }, [formatTooltipLabel]);

    const formatGroupLabel = useCallback((groupKey: string) => {
        try {
            if (trendViewType === 'week') {
                const date = parseISO(groupKey);
                return format(date, 'dd.MM.yyyy');
            } else if (trendViewType === 'month') {
                return `${groupKey} of ${format(parseISO(`${currentPeriod}-01`), 'MMMM yyyy')}`;
            } else { // year
                const date = parseISO(`${groupKey}-01`);
                return format(date, 'MMMM yyyy');
            }
        } catch (e) {
            return groupKey;
        }
    }, [trendViewType, currentPeriod]);

    const itemsInClickedGroup = useMemo(() => {
        if (!clickedGroup || !filteredDataByPeriod) return [];
        
        return filteredDataByPeriod.filter(item => {
            const dateStr = (item as any)._isDeleted ? ((item as MarketplaceDeletedItem).last_available || item.timestamp) : item.timestamp;
            if (!dateStr) return false;
            
            if (trendViewType === 'week') {
                return dateStr.startsWith(clickedGroup);
            } else if (trendViewType === 'month') {
                const date = parseISO(dateStr);
                const day = date.getDate();
                if (clickedGroup === '1st - 8th') return day >= 1 && day <= 8;
                if (clickedGroup === '9th - 16th') return day >= 9 && day <= 16;
                if (clickedGroup === '17th - 24th') return day >= 17 && day <= 24;
                return day >= 25 && day <= 31;
            } else { // year
                return dateStr.startsWith(clickedGroup);
            }
        });
    }, [clickedGroup, filteredDataByPeriod, trendViewType]);

    const handlePrevPeriod = useCallback(() => {
        if (trendViewType === 'week') {
            const index = availableWeeks.indexOf(currentPeriod);
            if (index > 0) setCurrentPeriod(availableWeeks[index - 1]);
        } else if (trendViewType === 'month') {
            const index = availableMonths.indexOf(currentPeriod);
            if (index > 0) setCurrentPeriod(availableMonths[index - 1]);
        } else {
            const index = availableYears.indexOf(currentPeriod);
            if (index > 0) setCurrentPeriod(availableYears[index - 1]);
        }
    }, [trendViewType, availableWeeks, availableMonths, availableYears, currentPeriod]);

    const handleNextPeriod = useCallback(() => {
        if (trendViewType === 'week') {
            const index = availableWeeks.indexOf(currentPeriod);
            if (index >= 0 && index < availableWeeks.length - 1) setCurrentPeriod(availableWeeks[index + 1]);
        } else if (trendViewType === 'month') {
            const index = availableMonths.indexOf(currentPeriod);
            if (index >= 0 && index < availableMonths.length - 1) setCurrentPeriod(availableMonths[index + 1]);
        } else {
            const index = availableYears.indexOf(currentPeriod);
            if (index >= 0 && index < availableYears.length - 1) setCurrentPeriod(availableYears[index + 1]);
        }
    }, [trendViewType, availableWeeks, availableMonths, availableYears, currentPeriod]);

    const formatPeriodDisplay = useCallback((periodStr: string) => {
        if (!periodStr) return '';
        try {
            if (trendViewType === 'week') {
                const date = parseISO(periodStr);
                return `Week of ${format(date, 'dd.MM.yyyy')}`;
            } else if (trendViewType === 'month') {
                const date = parseISO(`${periodStr}-01`);
                return format(date, 'MMMM yyyy');
            } else { // year
                return periodStr;
            }
        } catch (e) {
            return periodStr;
        }
    }, [trendViewType]);

    const isPrevDisabled = useMemo(() => {
        if (trendViewType === 'week') {
            return availableWeeks.length === 0 || availableWeeks.indexOf(currentPeriod) <= 0;
        } else if (trendViewType === 'month') {
            return availableMonths.length === 0 || availableMonths.indexOf(currentPeriod) <= 0;
        } else {
            return availableYears.length === 0 || availableYears.indexOf(currentPeriod) <= 0;
        }
    }, [trendViewType, availableWeeks, availableMonths, availableYears, currentPeriod]);

    const isNextDisabled = useMemo(() => {
        if (trendViewType === 'week') {
            return availableWeeks.length === 0 || availableWeeks.indexOf(currentPeriod) >= availableWeeks.length - 1;
        } else if (trendViewType === 'month') {
            return availableMonths.length === 0 || availableMonths.indexOf(currentPeriod) >= availableMonths.length - 1;
        } else {
            return availableYears.length === 0 || availableYears.indexOf(currentPeriod) >= availableYears.length - 1;
        }
    }, [trendViewType, availableWeeks, availableMonths, availableYears, currentPeriod]);

    // NOTE: 'data' from useItemSearch has type (MarketplaceItem | MarketplaceDeletedItem)[] 
    const currentItems = filteredDataByPeriod.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_e, newMode) => {
                            if (newMode !== null) setViewMode(newMode);
                        }}
                        aria-label="view mode"
                        size="small"
                    >
                        <Tooltip title="List View">
                            <ToggleButton value="list" aria-label="list view">
                                <ViewListIcon />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="Details View">
                            <ToggleButton value="details" aria-label="details view">
                                <ViewModuleIcon />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="Trend View">
                            <ToggleButton value="trend" aria-label="trend view">
                                <TimelineIcon />
                            </ToggleButton>
                        </Tooltip>
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 300, mt: 2 }}>
                        {viewMode === 'list' ? (
                            <Box>
                                {[...Array(10)].map((_, i) => (
                                    <Skeleton key={i} variant="rectangular" height={50} sx={{ mb: 1, borderRadius: 1 }} animation="wave" />
                                ))}
                            </Box>
                        ) : viewMode === 'details' ? (
                            <Grid container spacing={2}>
                                {[...Array(12)].map((_, i) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} animation="wave" />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box sx={{ p: 2 }}>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {[...Array(3)].map((_, i) => (
                                        <Grid size={{ xs: 12, sm: 4 }} key={i}>
                                            <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} animation="wave" />
                                        </Grid>
                                    ))}
                                </Grid>
                                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} animation="wave" />
                            </Box>
                        )}
                    </Box>
                ) : viewMode === 'list' ? (
                    <DataGrid
                        rows={filteredDataByPeriod}
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
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
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
                ) : viewMode === 'details' ? (
                    <Box>
                        {filteredDataByPeriod.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
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
                                {filteredDataByPeriod.length > ITEMS_PER_PAGE && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                        <Pagination
                                            count={Math.ceil(filteredDataByPeriod.length / ITEMS_PER_PAGE)}
                                            page={page}
                                            onChange={(_e, p) => setPage(p)}
                                            color="primary"
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                ) : (
                    <Box>
                        {filteredDataByPeriod.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                                <Typography color="text.secondary">
                                    {!searchQuery.title && !searchQuery.user && !searchQuery.id ? "Enter search criteria (at least 3 characters)" : "No results found"}
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                {/* Period Navigation */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<ChevronLeftIcon />}
                                        onClick={handlePrevPeriod}
                                        disabled={isPrevDisabled}
                                    >
                                        Previous
                                    </Button>
                                    <FormControl size="small" sx={{ minWidth: 220 }}>
                                        <Select
                                            value={currentPeriod}
                                            onChange={(e) => setCurrentPeriod(e.target.value as string)}
                                            sx={{
                                                fontWeight: 'bold',
                                                bgcolor: 'background.paper',
                                                borderRadius: 2,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(255,255,255,0.05)',
                                                },
                                            }}
                                        >
                                            {availablePeriods.map((period) => (
                                                <MenuItem key={period} value={period}>
                                                    {formatPeriodDisplay(period)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        endIcon={<ChevronRightIcon />}
                                        onClick={handleNextPeriod}
                                        disabled={isNextDisabled}
                                    >
                                        Next
                                    </Button>
                                </Box>

                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                                Average Price
                                            </Typography>
                                            <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(overallStats.avg)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                                Total Items Listed
                                            </Typography>
                                            <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                                {overallStats.count}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                                Price Range
                                            </Typography>
                                            <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(overallStats.min)} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(overallStats.max)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                    <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'medium' }}>
                                        Price & Volume Trend Over Time
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Trend View:
                                        </Typography>
                                        <ToggleButtonGroup
                                            value={trendViewType}
                                            exclusive
                                            onChange={(_e, newType) => {
                                                if (newType !== null) setTrendViewType(newType);
                                            }}
                                            size="small"
                                        >
                                            <ToggleButton value="week">Week</ToggleButton>
                                            <ToggleButton value="month">Month</ToggleButton>
                                            <ToggleButton value="year">Year</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
                                </Box>

                                <Box sx={{ height: 400, width: '100%', position: 'relative', overflow: 'hidden' }}>
                                    <ResponsiveContainer width="99%" height={400}>
                                        <ComposedChart
                                            data={groupedData}
                                            onClick={(state) => {
                                                if (state && state.activeLabel) {
                                                    setClickedGroup(String(state.activeLabel));
                                                }
                                            }}
                                            style={{ cursor: 'pointer' }}
                                            margin={{
                                                top: 20,
                                                right: 20,
                                                bottom: 20,
                                                left: 20,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                            <XAxis
                                                dataKey="dateStr"
                                                tickFormatter={formatXAxis}
                                                stroke="rgba(255,255,255,0.5)"
                                                tick={{ fontSize: 11 }}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                stroke="rgba(255,255,255,0.5)"
                                                tick={{ fontSize: 11 }}
                                                tickFormatter={(value) => `${value} €`}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                stroke="rgba(255,255,255,0.5)"
                                                tick={{ fontSize: 11 }}
                                                allowDecimals={false}
                                            />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar
                                                yAxisId="right"
                                                dataKey="count"
                                                name="Items Listed"
                                                fill="#10b981"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={40}
                                                opacity={0.6}
                                                animationDuration={1000}
                                            />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="avgPrice"
                                                name="Average Price"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                activeDot={{ r: 8 }}
                                                dot={{ r: 4, strokeWidth: 2 }}
                                                connectNulls={true}
                                                animationDuration={1500}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>
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

            {clickedGroup && (
                <GroupItemsDialog
                    open={!!clickedGroup}
                    onClose={() => setClickedGroup(null)}
                    groupLabel={formatGroupLabel(clickedGroup)}
                    items={itemsInClickedGroup}
                    onHistoryClick={handleOpenHistory}
                />
            )}
        </Paper>
    );
}

interface GroupItemsDialogProps {
    open: boolean;
    onClose: () => void;
    groupLabel: string;
    items: (MarketplaceItem | MarketplaceDeletedItem)[];
    onHistoryClick: (id: string, title: string) => void;
}

function GroupItemsDialog({ open, onClose, groupLabel, items, onHistoryClick }: GroupItemsDialogProps) {
    const columns: GridColDef[] = useMemo(() => [
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
                                onHistoryClick(params.row.asvz_id, params.row.title);
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
    ], [onHistoryClick]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" component="div">
                    Listings in {groupLabel} ({items.length} items)
                </Typography>
                <IconButton aria-label="close" onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500] }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, height: 500, display: 'flex', flexDirection: 'column' }}>
                <DataGrid
                    rows={items}
                    columns={columns}
                    getRowId={(row) => row.id}
                    disableRowSelectionOnClick
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 25, page: 0 },
                        },
                    }}
                    pageSizeOptions={[25, 50, 100]}
                    sx={{
                        flexGrow: 1,
                        border: 0,
                        '& .MuiDataGrid-cell:focus-within': {
                            outline: 'none',
                        },
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button variant="outlined" onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
