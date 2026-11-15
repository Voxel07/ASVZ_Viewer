import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle,
    MenuItem, Pagination, Paper, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { pb, isRequestAbort } from '../lib/pb';
import { defaultEgunFilters, egunImage, egunLink, filterEgun } from '../lib/egun';
import type { EgunFilters, EgunItem, EgunPrice } from '../lib/egun';
import { useAuth } from '../contexts/AuthState';
import { useMobile } from '../hooks/useMobile';
import { clampPage } from '../lib/data';

const money = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const dateTime = (value: string) => value ? new Date(value).toLocaleString() : '—';
const delta = (value: number) => `${value > 0 ? '+' : ''}${money(value)}`;

function PriceHistory({ item, onClose }: { item: EgunItem | null; onClose: () => void }) {
    const [data, setData] = useState<EgunPrice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const mobile = useMobile();
    useEffect(() => {
        if (!item) return;
        const controller = new AbortController();
        async function load() {
            setLoading(true);
            setData([]);
            setError('');
            try {
                const records = await pb.collection('egun_price').getFullList<EgunPrice>({
                    filter: pb.filter('egun_id = {:id}', { id: item!.egun_id }),
                    sort: 'timestamp,id', signal: controller.signal,
                });
                if (!controller.signal.aborted) setData(records);
            } catch (err) {
                if (!controller.signal.aborted && !isRequestAbort(err)) setError('Could not load price history.');
            } finally { if (!controller.signal.aborted) setLoading(false); }
        }
        void load();
        return () => controller.abort();
    }, [item]);
    const chart = data.map(row => ({ ...row, time: new Date(row.timestamp).getTime(), buyNow: row.buy_now_price || null }));
    return <Dialog open={!!item} onClose={onClose} fullWidth maxWidth="md" fullScreen={mobile} aria-labelledby="egun-history-title">
        <DialogTitle id="egun-history-title">{item?.title} — price history</DialogTitle>
        <DialogContent>
            <Button onClick={onClose} sx={{ mb: 2 }}>Close</Button>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Recorded observations in EUR. Auction bids can increase between crawls.</Typography>
            {loading ? <CircularProgress aria-label="Loading price history" /> : error ? <Alert severity="error">{error}</Alert> : data.length === 0 ? <Typography>No price observations yet.</Typography> : <>
                <Box sx={{ height: 280, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chart} margin={{ top: 10, right: 15, bottom: 10, left: 5 }}>
                            <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={value => new Date(value).toLocaleDateString()} />
                            <YAxis />
                            <Tooltip labelFormatter={value => new Date(Number(value)).toLocaleString()} />
                            <Line dataKey="price" name="Price / bid (EUR)" stroke="#00e5ff" type="stepAfter" />
                            <Line dataKey="buyNow" name="Buy now (EUR)" stroke="#ffbd59" type="stepAfter" connectNulls={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
                <TableContainer><Table size="small" aria-label="eGun price observations"><TableHead><TableRow>
                    <TableCell>Observed</TableCell><TableCell>Price / bid</TableCell><TableCell>Buy now</TableCell>
                </TableRow></TableHead><TableBody>{data.map(row => <TableRow key={row.id}>
                    <TableCell>{dateTime(row.timestamp)}</TableCell><TableCell>{money(row.price)}</TableCell><TableCell>{row.buy_now_price ? money(row.buy_now_price) : '—'}</TableCell>
                </TableRow>)}</TableBody></Table></TableContainer>
            </>}
        </DialogContent>
    </Dialog>;
}

export default function EgunView() {
    const { user } = useAuth();
    const [items, setItems] = useState<EgunItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const [filters, setFilters] = useState<EgunFilters>(defaultEgunFilters);
    const [requestedPage, setPage] = useState(1);
    const [selected, setSelected] = useState<EgunItem | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const mobile = useMobile();

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setLoading(true);
            setError('');
            setItems([]);
            try {
                const records = await pb.collection('egun_marketplace').getFullList<EgunItem>({ sort: '-first_seen,id', signal: controller.signal });
                if (!controller.signal.aborted) setItems(records);
            } catch (err) {
                if (!controller.signal.aborted && !isRequestAbort(err)) setError('Could not load eGun listings. Check your login and that the eGun collections have been installed.');
            } finally { if (!controller.signal.aborted) setLoading(false); }
        }
        void load();
        return () => controller.abort();
    }, [reload, user?.id]);

    const results = useMemo(() => filterEgun(items, filters), [items, filters]);
    const page = clampPage(requestedPage, results.length, 25);
    const visible = results.slice((page - 1) * 25, page * 25);
    const update = (field: keyof EgunFilters, value: string) => {
        setFilters(previous => ({ ...previous, [field]: value }));
        setPage(1);
    };
    const options = (field: 'condition' | 'seller_type') => [...new Set(items.map(item => item[field]).filter(Boolean))].sort();
    const select = (label: string, field: keyof EgunFilters, choices: [string, string][]) => <TextField key={field} select label={label} value={filters[field]} onChange={event => update(field, event.target.value)} size="small" fullWidth slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
        {choices.map(([value, text]) => <MenuItem key={value} value={value}>{text}</MenuItem>)}
    </TextField>;
    const price = (item: EgunItem) => <>
        <Typography sx={{ fontWeight: 700 }}>{money(item.price)}</Typography>
        <Typography variant="caption" color="text.secondary">{item.listing_type === 'auction' ? `${item.bids} bids` : 'Fixed price'}</Typography>
        {item.listing_type === 'auction' && item.buy_now_price > 0 && <Typography variant="body2">Buy now: {money(item.buy_now_price)}</Typography>}
    </>;
    const change = (item: EgunItem) => <>
        {item.last_price_change ? <>
            <Typography color={item.price_change < 0 ? 'success.main' : item.price_change > 0 ? 'warning.main' : 'text.secondary'}>{delta(item.price_change)}</Typography>
            {item.buy_now_change !== 0 && <Typography variant="body2">Buy now: {delta(item.buy_now_change)}</Typography>}
            <Typography variant="caption" color="text.secondary">{dateTime(item.last_price_change)}</Typography>
        </> : <Typography variant="body2" color="text.secondary">No change recorded</Typography>}
    </>;
    const title = (item: EgunItem) => <>
        <Button component="a" href={egunLink(item.egun_id)} target="_blank" rel="noopener noreferrer" sx={{ p: 0, textAlign: 'left', justifyContent: 'flex-start', overflowWrap: 'anywhere' }}>{item.title}</Button>
        <Typography variant="body2" color="text.secondary">#{item.egun_id} · {item.user} · {item.seller_type}</Typography>
        {item.condition && <Typography variant="caption">{item.condition}</Typography>}
        {!item.active && <Chip size="small" label="Inactive" sx={{ ml: 1 }} />}
    </>;

    return <Stack spacing={3}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between' }}>
            <Box><Typography variant="h4" component="h1">eGun Softair</Typography>
                <Typography color="text.secondary">Search Softair listings and compare recorded price changes.</Typography></Box>
            <Button onClick={() => setReload(value => value + 1)} disabled={loading}>Refresh</Button>
        </Box>
        <Paper sx={{ p: 2 }}>
            {mobile && <Button onClick={() => setShowFilters(value => !value)} aria-expanded={showFilters} aria-controls="egun-filters">{showFilters ? 'Hide search filters' : 'Show search filters'}</Button>}
            <Box id="egun-filters" sx={{ display: mobile && !showFilters ? 'none' : 'block', mt: mobile && showFilters ? 2 : 0 }}>
            <Box component="form" onSubmit={event => event.preventDefault()} sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
                {([['Title contains', 'title'], ['Seller contains', 'seller'], ['Exact item ID', 'id'], ['Min price (EUR)', 'min'], ['Max price (EUR)', 'max']] as const).map(([label, field]) => <TextField key={field} label={label} value={filters[field]} type={['min', 'max'].includes(field) ? 'number' : 'text'} slotProps={['min', 'max'].includes(field) ? { htmlInput: { min: 0, step: '0.01' } } : undefined} size="small" fullWidth onChange={event => update(field, event.target.value)} />)}
                {select('Status', 'status', [['active', 'Active'], ['inactive', 'Inactive'], ['all', 'All listings']])}
                {select('Listing type', 'type', [['', 'All types'], ['auction', 'Auction'], ['fixed', 'Fixed price'], ['buy-now', 'Buy now available']])}
                {select('Condition', 'condition', [['', 'All conditions'], ...options('condition').map(value => [value, value] as [string, string])])}
                {select('Seller type', 'sellerType', [['', 'All sellers'], ...options('seller_type').map(value => [value, value] as [string, string])])}
                {select('Latest price change', 'change', [['all', 'All listings'], ['changed', 'Any change'], ['down', 'Price decreased'], ['up', 'Price increased'], ['buy-down', 'Buy-now decreased'], ['buy-up', 'Buy-now increased']])}
                <TextField label="Changed since" type="datetime-local" value={filters.changedSince} onChange={event => update('changedSince', event.target.value)} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                {select('Sort by', 'sort', [['newest', 'First seen: newest'], ['ending', 'Ending soon'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['reduction', 'Largest price decrease']])}
            </Box>
            <Button sx={{ mt: 2 }} onClick={() => { setFilters(defaultEgunFilters); setPage(1); }}>Reset filters</Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Price filters use the displayed price or current bid, excluding shipping. Changes compare consecutive observations. Inactive means absent from a complete crawl; it does not confirm a sale.</Typography>
            </Box>
        </Paper>
        {error && <Alert severity="error" action={<Button color="inherit" onClick={() => setReload(value => value + 1)}>Retry</Button>}>{error}</Alert>}
        {loading ? <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress aria-label="Loading eGun listings" /></Box> : !error && <>
            <Typography>{results.length} matching listings · Last observed: {dateTime(items.reduce((latest, item) => item.last_seen > latest ? item.last_seen : latest, ''))}</Typography>
            {results.length === 0 ? <Alert severity="info">{items.length ? 'No listings match these filters.' : 'No eGun listings yet. Run the eGun crawler to populate this page.'}</Alert> : mobile ? <Stack spacing={2}>
                {visible.map(item => <Paper component="article" key={item.id} sx={{ p: 2 }}>
                    {title(item)}<Box sx={{ mt: 2 }}>{price(item)}{change(item)}</Box>
                    <Typography variant="body2">Ends: {dateTime(item.ends_at)}</Typography>
                    <Button onClick={() => setSelected(item)}>Price history</Button>
                </Paper>)}
            </Stack> : <TableContainer component={Paper}><Table aria-label="eGun Softair listings"><TableHead><TableRow>
                <TableCell>Listing</TableCell><TableCell>Price / bid</TableCell><TableCell>Latest change</TableCell><TableCell>Ends</TableCell><TableCell>History</TableCell>
            </TableRow></TableHead><TableBody>{visible.map(item => <TableRow key={item.id}>
                <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {egunImage(item.image_url) && <Box component="img" src={egunImage(item.image_url)} alt="" loading="lazy" referrerPolicy="no-referrer" sx={{ width: 80, height: 60, objectFit: 'contain' }} />}
                    <Box>{title(item)}</Box></Box></TableCell>
                <TableCell>{price(item)}</TableCell><TableCell>{change(item)}</TableCell><TableCell>{dateTime(item.ends_at)}</TableCell>
                <TableCell><Button onClick={() => setSelected(item)}>History</Button></TableCell>
            </TableRow>)}</TableBody></Table></TableContainer>}
            {results.length > 25 && <Pagination page={page} count={Math.ceil(results.length / 25)} onChange={(_, value) => setPage(value)} size={mobile ? 'small' : 'medium'} />}
        </>}
        <PriceHistory item={selected} onClose={() => setSelected(null)} />
    </Stack>;
}
