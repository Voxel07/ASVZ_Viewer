import {
    Box,
    CircularProgress,
    Alert,
    Typography
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { usePriceData } from '../hooks/useData';
import { chartTheme, nb } from '../theme';

interface ItemPriceChartProps {
    asvzId: string;
}

export default function ItemPriceChart({ asvzId }: ItemPriceChartProps) {
    const { data, loading, error } = usePriceData(asvzId);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 1 }}>{error.message}</Alert>;
    }

    if (!data || data.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    No price history available.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ height: 250, width: '100%', position: 'relative', overflow: 'hidden' }}>
                <ResponsiveContainer width="99%" height={250}>
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="0" stroke={chartTheme.grid} vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={(str) => format(parseISO(str), 'dd.MM')}
                            stroke={chartTheme.axis}
                            tick={{ fontSize: 11, fill: chartTheme.axis }}
                        />
                        <YAxis
                            stroke={chartTheme.axis}
                            tick={{ fontSize: 11, fill: chartTheme.axis }}
                            domain={['auto', 'auto']}
                            width={40}
                        />
                        <Tooltip
                            contentStyle={chartTheme.tooltip}
                            itemStyle={chartTheme.tooltipItem}
                            labelStyle={{ color: nb.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                            cursor={{ stroke: nb.accent, strokeWidth: 1, strokeDasharray: '4 4' }}
                            labelFormatter={(label) => format(parseISO(String(label)), 'dd.MM.yyyy HH:mm')}
                            formatter={(value) => [typeof value === 'number' ? `${value} €` : '', 'Price']}
                        />
                        <Line
                            type="stepAfter"
                            dataKey="price"
                            stroke={nb.pink}
                            strokeWidth={3}
                            dot={{ fill: nb.pink, r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: nb.accent, stroke: nb.black, strokeWidth: 2 }}
                            animationDuration={1000}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
}
