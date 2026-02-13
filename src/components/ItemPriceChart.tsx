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

interface ItemPriceChartProps {
    asvzId: string;
}

export default function ItemPriceChart({ asvzId }: ItemPriceChartProps) {
    const { data, loading, error } = usePriceData(asvzId);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 1 }}>{error.message}</Alert>;
    }

    if (!data || data.length === 0) {
        return (
            <Box p={2}>
                <Typography variant="body2" color="text.secondary">
                    No price history available.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: 250, width: '100%', p: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 20,
                        left: 0,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(str) => format(parseISO(str), 'dd.MM')}
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fontSize: 11 }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fontSize: 11 }}
                        domain={['auto', 'auto']}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                        itemStyle={{ color: '#fff' }}
                        labelFormatter={(label) => format(parseISO(label), 'dd.MM.yyyy HH:mm')}
                        formatter={(value: number | undefined) => [value !== undefined ? `${value} €` : '', 'Price']}
                    />
                    <Line
                        type="stepAfter"
                        dataKey="price"
                        stroke="#ec4899"
                        strokeWidth={2}
                        dot={{ fill: '#ec4899', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        animationDuration={1000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
}
