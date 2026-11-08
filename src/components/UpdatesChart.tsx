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
import { dailyUpdates, toLocalInput, type ChartUpdate } from '../lib/data';
import type { SelectChangeEvent } from '@mui/material';
import { chartColors as COLORS, chartTheme, nb } from '../theme';

const AVAILABLE_FIELDS = ['added', 'updated', 'deleted', 'total_items', 'total_value'];
const FIELD_AXES = {
    added: 'changes',
    updated: 'changes',
    deleted: 'changes',
    total_items: 'items',
    total_value: 'value',
} as const;

export default function UpdatesChart() {
    const [startDate, setStartDate] = useState<string>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return toLocalInput(date);
    });
    const [endDate, setEndDate] = useState<string>(toLocalInput(new Date()));
    const [selectedFields, setSelectedFields] = useState<string[]>(['added', 'updated', 'deleted']);
    const [grouping, setGrouping] = useState<'hourly' | 'daily'>('daily');
    const hasChanges = selectedFields.some(field => ['added', 'updated', 'deleted'].includes(field));
    const hasTotalItems = selectedFields.includes('total_items');
    const hasTotalValue = selectedFields.includes('total_value');

    const { data, loading, error } = useUpdatesData(startDate, endDate);

    const handleFieldChange = (event: SelectChangeEvent<string[]>) => {
        const {
            target: { value },
        } = event;
        setSelectedFields(typeof value === 'string' ? value.split(',') : value);
    };

    // Aggregate data based on grouping
    const chartData = useMemo(() => {
        if (!data.length) return [];

        if (grouping === 'daily') return dailyUpdates(data);
        return data.map(item => ({ ...item, updated: item.updated ?? item.update ?? 0 }));
    }, [data, grouping]);

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
                Collection Updates
            </Typography>

            <Box sx={{ height: 3, width: 56, bgcolor: 'primary.main', mb: 3 }} />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
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
                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>}
                {error && <Alert severity="error">{error.message}</Alert>}
                {!loading && !error && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{
                                top: 50,
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
                            <CartesianGrid yAxisId={hasChanges ? 'changes' : hasTotalItems ? 'items' : 'value'} strokeDasharray="0" stroke={chartTheme.grid} vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(str) => format(parseISO(str), 'dd.MM.yy')}
                                stroke={chartTheme.axis}
                                tick={{ fontSize: 11, fill: chartTheme.axis }}
                            />
                            <YAxis
                                yAxisId="changes"
                                hide={!hasChanges}
                                allowDecimals={false}
                                stroke={chartTheme.axis}
                                tick={{ fontSize: 11, fill: chartTheme.axis }}
                                label={{ value: 'Changes', position: 'top', offset: 24, fill: chartTheme.axis, fontSize: 11 }}
                            />
                            <YAxis
                                yAxisId="items"
                                hide={!hasTotalItems}
                                orientation="right"
                                width={80}
                                allowDecimals={false}
                                stroke={COLORS.total_items}
                                tick={{ fontSize: 11, fill: COLORS.total_items }}
                                tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}
                                label={{ value: 'Total items', position: 'top', offset: 24, fill: COLORS.total_items, fontSize: 11 }}
                            />
                            <YAxis
                                yAxisId="value"
                                hide={!hasTotalValue}
                                orientation="right"
                                width={85}
                                stroke={nb.amber}
                                tick={{ fontSize: 11, fill: nb.amber }}
                                tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact", style: "currency", currency: "EUR", maximumFractionDigits: 1 }).format(value)}
                                label={{ value: 'Total value', position: 'top', offset: 24, fill: nb.amber, fontSize: 11 }}
                            />
                            <Tooltip
                                contentStyle={chartTheme.tooltip}
                                itemStyle={chartTheme.tooltipItem}
                                labelStyle={{ color: nb.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                                cursor={{ stroke: nb.accent, strokeWidth: 1, strokeDasharray: '4 4' }}
                                labelFormatter={(label) => format(parseISO(String(label)), grouping === 'hourly' ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy')}
                                formatter={(value, name) => {
                                    if (value === undefined) return ['', name ?? ''];
                                    if (name === 'total_value') {
                                        return [new Intl.NumberFormat('en-US', { notation: "compact", style: "currency", currency: "EUR" }).format(Number(value)), name];
                                    }
                                    return [value, name ?? ''];
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
                                    yAxisId={FIELD_AXES[field as keyof typeof FIELD_AXES]}
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

function HighscoreTrack({ data, fields }: { data: ChartUpdate[], fields: string[] }) {
    if (!data.length || !fields.length) return null;

    const stats = fields.map(field => {
        let maxVal = -Infinity;
        let maxDate = '';
        let minVal = Infinity;
        let minDate = '';

        data.forEach(item => {
            const val = item[field as keyof ChartUpdate];
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
            <Box sx={{ height: 3, width: 56, bgcolor: 'primary.main', mb: 2 }} />
            <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
                {stats.map(stat => {
                    if (!stat) return null;
                    return (
                        <Paper key={stat.field} sx={{ p: 2, minWidth: 200, borderLeft: `6px solid ${nb.accent}` }}>
                            <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                {stat.field.replace('_', ' ')}
                            </Typography>
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Highest</Typography>
                                <Typography variant="body1" color="success.main" sx={{ fontWeight: 800 }}>{stat.formatVal(stat.maxVal)}</Typography>
                                <Typography variant="caption" sx={{ display: 'block', textTransform: 'none' }}>{stat.maxDate ? format(parseISO(stat.maxDate), 'dd.MM.yyyy HH:mm') : '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Lowest</Typography>
                                <Typography variant="body1" color="error.main" sx={{ fontWeight: 800 }}>{stat.formatVal(stat.minVal)}</Typography>
                                <Typography variant="caption" sx={{ display: 'block', textTransform: 'none' }}>{stat.minDate ? format(parseISO(stat.minDate), 'dd.MM.yyyy HH:mm') : '-'}</Typography>
                            </Box>
                        </Paper>
                    );
                })}
            </Stack>
        </Box>
    );
}
