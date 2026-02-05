import { useState } from 'react';
import {
    Paper,
    Box,
    Typography,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { usePriceData } from '../hooks/useData';

export default function PriceHistory() {
    const [asvzId, setAsvzId] = useState<string>('');
    const [searchInput, setSearchInput] = useState('');

    // Debounce could be added here, but for now we search on enter or button click
    // For simplicity, let's just use the input value directly for the hook after a small delay or on blur/enter?
    // Let's rely on user typing the whole ID for now.

    const { data, title, loading, error } = usePriceData(asvzId);

    // Calculate price differences if needed, but for "Price History" absolute price is best.
    // The user asked to "map the differenz prices over the timestamp". 
    // Maybe they mean visualizing the DELTA? 
    // Let's prepare a derived dataset that has both price and calculated change?
    // For now, let's just stick to Price.

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setAsvzId(searchInput);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary">
                    Price History
                </Typography>
                {title && (
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {title}
                    </Typography>
                )}
            </Box>

            <Box sx={{ mb: 4, maxWidth: 400 }}>
                <TextField
                    fullWidth
                    placeholder="Enter ASVZ ID (e.g., 511325)..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearch}
                    onBlur={() => setAsvzId(searchInput)}
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
                    helperText="Press Enter to search"
                />
            </Box>

            <Box sx={{ height: 400, width: '100%' }}>
                {loading && <Box display="flex" justifyContent="center" alignItems="center" height="100%"><CircularProgress /></Box>}
                {error && <Alert severity="error">{error.message}</Alert>}
                {!loading && !error && data.length === 0 && asvzId && (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">No data found for ID: {asvzId}</Typography>
                    </Box>
                )}

                {!loading && !error && data.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(str) => format(parseISO(str), 'dd.MM')}
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fontSize: 12 }}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                                itemStyle={{ color: '#fff' }}
                                labelFormatter={(label) => format(parseISO(label), 'dd.MM.yyyy HH:mm')}
                                formatter={(value: number | undefined) => [value !== undefined ? `${value} €` : '', 'Price']}
                            />
                            <Legend />
                            <Line
                                type="stepAfter"
                                dataKey="price"
                                stroke="#ec4899"
                                strokeWidth={3}
                                dot={{ fill: '#ec4899', r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                                animationDuration={1500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </Box>
        </Paper>
    );
}
