import { useRef, useState } from 'react';
import { Box, Button, Chip, Link, Pagination, Typography } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { format, parseISO } from 'date-fns';
import type { MarketplaceItem, MarketplaceDeletedItem } from '../types';
import { clampPage } from '../lib/data';

/** A readable, paginated alternative to the desktop table at phone widths. */
export default function MobileListings({ items, onHistoryClick, emptyMessage = 'No items found.' }: {
    items: MarketplaceItem[];
    onHistoryClick: (id: string, title: string) => void;
    emptyMessage?: string;
}) {
    const [requestedPage, setPage] = useState(1);
    const listRef = useRef<HTMLDivElement>(null);
    const pageSize = 24;
    const page = clampPage(requestedPage, items.length, pageSize);
    const dateLabel = (value?: string) => {
        if (!value) return '-';
        const date = parseISO(value);
        return Number.isNaN(date.getTime()) ? '-' : format(date, 'dd.MM.yyyy HH:mm');
    };

    return (
        <Box ref={listRef} sx={{ minWidth: 0, scrollMarginTop: 16 }}>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }} aria-live="polite">
                {items.length ? `${items.length.toLocaleString()} listings · ${((page - 1) * pageSize + 1).toLocaleString()}–${Math.min(page * pageSize, items.length).toLocaleString()}` : emptyMessage}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {items.slice((page - 1) * pageSize, page * pageSize).map(item => (
                    <Box component="article" key={item.id} sx={{ p: 2, border: '2px solid', borderColor: 'divider', bgcolor: 'background.default', overflowWrap: 'anywhere' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" color="secondary.main">
                                {item.price == null ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(item.price)}
                            </Typography>
                            {item._isDeleted && <Chip label="Deleted" size="small" color="error" />}
                        </Box>
                        <Link href={`https://www.airsoft-verzeichnis.de/index.php?status=forum&sp=1&threadnummer=${item.asvz_id}`} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', lineHeight: 1.5, mb: 1 }}>
                            {item.title}
                        </Link>
                        <Typography variant="body2" color="text.secondary">Seller: {item.user || '-'}</Typography>
                        <Typography variant="body2" color="text.secondary">ID: {item.asvz_id}</Typography>
                        <Typography variant="body2" color="text.secondary">Posted: {dateLabel(item.timestamp)}</Typography>
                        {item._isDeleted && <Typography variant="body2" color="text.secondary">Removed: {dateLabel((item as MarketplaceDeletedItem).last_available)} · Online: {(item as MarketplaceDeletedItem).duration_online || '-'}</Typography>}
                        {item.updated && item.updated !== item.timestamp && <Button variant="outlined" size="small" startIcon={<TimelineIcon />} onClick={() => onHistoryClick(item.asvz_id, item.title)} sx={{ mt: 1.5 }}>Price History</Button>}
                    </Box>
                ))}
            </Box>
            {items.length > pageSize && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination count={Math.ceil(items.length / pageSize)} page={page} onChange={(_event, value) => {
                    setPage(value);
                    listRef.current?.scrollIntoView({ block: 'start' });
                }} siblingCount={0} size="small" color="primary" />
            </Box>}
        </Box>
    );
}
