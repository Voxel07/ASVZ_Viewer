import { Card, CardContent, CardMedia, Typography, Box, Chip, IconButton, Tooltip, Link } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { format, parseISO } from 'date-fns';
import { pb } from '../lib/pb';
import type { MarketplaceItem } from '../types';
import { useState } from 'react';

interface ProductCardProps {
    item: MarketplaceItem;
    onHistoryClick: (id: string, title: string) => void;
}

export default function ProductCard({ item, onHistoryClick }: ProductCardProps) {
    const isDeleted = (item as any)._isDeleted;
    const hasUpdates = item.updated && item.updated !== item.timestamp;
    const [imgError, setImgError] = useState(false);

    const imageUrl = `${pb.baseUrl}/api/files/asvz_images/${item.asvz_id}/${item.asvz_id}.jpg`;

    return (
        <Card sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            '&:hover': {
                boxShadow: 6
            }
        }}>
            <Box sx={{ position: 'relative', pt: '56.25%', bgcolor: 'grey.100' }}>
                {!imgError ? (
                    <CardMedia
                        component="img"
                        image={imageUrl}
                        alt={item.title}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            p: 1
                        }}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary'
                    }}>
                        <Typography variant="caption">No Image</Typography>
                    </Box>
                )}

                {hasUpdates && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', borderRadius: '50%' }}>
                        <Tooltip title="View Price History">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onHistoryClick(item.asvz_id, item.title);
                                }}
                            >
                                <TimelineIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                    href={`https://www.airsoft-verzeichnis.de/index.php?status=forum&sp=1&threadnummer=${item.asvz_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    color="text.primary"
                    variant="subtitle1"
                    sx={{
                        fontWeight: 'bold',
                        lineHeight: 1.2,
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}
                >
                    {item.title}
                </Link>

                <Typography variant="h6" color="secondary.main" fontWeight="bold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(item.price)}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                        ID: {item.asvz_id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {item.user}
                    </Typography>
                </Box>

                {isDeleted && (
                    <Chip
                        label="Deleted"
                        color="error"
                        size="small"
                        variant="outlined"
                        sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                    />
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {item.timestamp ? format(parseISO(item.timestamp), 'dd.MM.yyyy') : '-'}
                </Typography>
            </CardContent>
        </Card>
    );
}
