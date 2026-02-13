import { useState, useMemo } from 'react';
import {
    Paper,
    Box,
    Typography,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    InputLabel,
    OutlinedInput,
    Stack,
    CircularProgress,
    Alert,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useUpdatesData } from '../hooks/useData';

const AVAILABLE_FIELDS = ['added', 'updated', 'deleted', 'total_items', 'total_value'];
const COLORS = {
    added: '#82ca9d',
    updated: '#8884d8',
    deleted: '#ff8042',
    total_items: '#0088fe',
    total_value: '#ffbb28'
};

export default function UpdatesChart() {
    const [startDate, setStartDate] = useState<string>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().slice(0, 16);
    });
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 16));
    const [selectedFields, setSelectedFields] = useState<string[]>(['added', 'updated', 'deleted']);
    const [grouping, setGrouping] = useState<'hourly' | 'daily'>('daily');

    const { data, loading, error } = useUpdatesData(startDate, endDate);

    const handleFieldChange = (event: any) => {
        const {
            target: { value },
        } = event;
        setSelectedFields(typeof value === 'string' ? value.split(',') : value);
    };

    // Aggregate data based on grouping
    const chartData = useMemo(() => {
        if (!data.length) return [];

        // Map raw data to include 'updated' alias to match AVAILABLE_FIELDS
        // Also handle potential database field name mismatch ('update' vs 'updated')
        const normalizedData = data.map(item => {
            const raw = item as any;
            return {
                ...item,
                updated: raw.updated ?? raw.update ?? 0
            };
        });

        if (grouping === 'hourly') return normalizedData;

        const groups = normalizedData.reduce((acc, curr) => {
            // Safer way to get YYYY-MM-DD from ISO string (handles 'T' or ' ' separator)
            const day = curr.timestamp.substring(0, 10);

            if (!acc[day]) {
                acc[day] = {
                    timestamp: day,
                    added: 0,
                    updated: 0,
                    deleted: 0,
                    total_items: 0,
                    total_value: 0
                };
            }

            // Sum deltas
            acc[day].added += curr.added || 0;
            acc[day].updated += curr.updated || 0;
            acc[day].deleted += curr.deleted || 0;

            // For totals, take the last available value for the day (snapshot)
            // Assuming data is sorted, which it is from the API
            acc[day].total_items = curr.total_items;
            acc[day].total_value = curr.total_value;

            return acc;
        }, {} as Record<string, any>);

        return Object.values(groups);
    }, [data, grouping]);

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
                Collection Updates
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }} alignItems="center">
                <TextField
                    label="Start Date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    variant="outlined"
                    size="small"
                />
                <TextField
                    label="End Date"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    variant="outlined"
                    size="small"
                />

                <FormControl sx={{ m: 1, width: 300 }} size="small">
                    <InputLabel>Fields</InputLabel>
                    <Select
                        multiple
                        value={selectedFields}
                        onChange={handleFieldChange}
                        input={<OutlinedInput label="Fields" />}
                        renderValue={(selected) => selected.join(', ')}
                    >
                        {AVAILABLE_FIELDS.map((field) => (
                            <MenuItem key={field} value={field}>
                                <Checkbox checked={selectedFields.indexOf(field) > -1} />
                                <ListItemText primary={field} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControlLabel
                    control={
                        <Switch
                            checked={grouping === 'daily'}
                            onChange={(e) => setGrouping(e.target.checked ? 'daily' : 'hourly')}
                        />
                    }
                    label={grouping === 'daily' ? "Daily" : "Hourly"}
                />
            </Stack>

            <Box sx={{ height: 400, width: '100%' }}>
                {loading && <Box display="flex" justifyContent="center" alignItems="center" height="100%"><CircularProgress /></Box>}
                {error && <Alert severity="error">{error.message}</Alert>}
                {!loading && !error && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                {AVAILABLE_FIELDS.map(field => (
                                    <linearGradient key={field} id={`color${field}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[field as keyof typeof COLORS]} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={COLORS[field as keyof typeof COLORS]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(str) => format(parseISO(str), 'dd.MM.yy')}
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#ffbb28"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact", style: "currency", currency: "EUR", maximumFractionDigits: 1 }).format(value)}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                                itemStyle={{ color: '#fff' }}
                                labelFormatter={(label) => format(parseISO(label), grouping === 'hourly' ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy')}
                                formatter={(value: number | undefined, name: any) => {
                                    if (value === undefined) return ['', name];
                                    if (name === 'total_value') {
                                        return [new Intl.NumberFormat('en-US', { notation: "compact", style: "currency", currency: "EUR" }).format(value), name];
                                    }
                                    return [value, name];
                                }}
                            />
                            <Legend />
                            {selectedFields.map(field => (
                                <Area
                                    key={field}
                                    type="monotone"
                                    dataKey={field}
                                    stroke={COLORS[field as keyof typeof COLORS]}
                                    fillOpacity={1}
                                    fill={`url(#color${field})`}
                                    animationDuration={1500}
                                    yAxisId={field === 'total_value' ? 'right' : 'left'}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Box>

            <HighscoreTrack data={chartData} fields={selectedFields} />
        </Paper>
    );
}

function HighscoreTrack({ data, fields }: { data: any[], fields: string[] }) {
    if (!data.length || !fields.length) return null;

    const stats = fields.map(field => {
        let maxVal = -Infinity;
        let maxDate = '';
        let minVal = Infinity;
        let minDate = '';

        data.forEach(item => {
            const val = item[field];
            // Ensure val is a number
            if (typeof val === 'number') {
                if (val > maxVal) {
                    maxVal = val;
                    maxDate = item.timestamp;
                }
                if (val < minVal) {
                    minVal = val;
                    minDate = item.timestamp;
                }
            }
        });

        // Loop didn't find any valid numbers?
        if (maxVal === -Infinity) return null;

        const formatVal = (v: number) => {
            if (field === 'total_value') return new Intl.NumberFormat('en-US', { notation: "compact", style: "currency", currency: "EUR" }).format(v);
            return v.toLocaleString();
        };

        return { field, maxVal, maxDate, minVal, minDate, formatVal };
    });

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Highscore Track</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                {stats.map(stat => {
                    if (!stat) return null;
                    return (
                        <Paper key={stat.field} sx={{ p: 2, minWidth: 200, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="subtitle2" color="primary" sx={{ textTransform: 'capitalize', mb: 1 }}>{stat.field.replace('_', ' ')}</Typography>
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">Highest</Typography>
                                <Typography variant="body1" fontWeight="bold" color="success.main">{stat.formatVal(stat.maxVal)}</Typography>
                                <Typography variant="caption" display="block">{stat.maxDate ? format(parseISO(stat.maxDate), 'dd.MM.yyyy HH:mm') : '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Lowest</Typography>
                                <Typography variant="body1" fontWeight="bold" color="error.main">{stat.formatVal(stat.minVal)}</Typography>
                                <Typography variant="caption" display="block">{stat.minDate ? format(parseISO(stat.minDate), 'dd.MM.yyyy HH:mm') : '-'}</Typography>
                            </Box>
                        </Paper>
                    );
                })}
            </Stack>
        </Box>
    );
}
