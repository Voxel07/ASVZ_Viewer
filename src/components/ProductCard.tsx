import { Card, CardContent, CardMedia, Typography, Box, Chip, IconButton, Tooltip, Link, Skeleton } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { format, parseISO } from 'date-fns';
import type { MarketplaceItem } from '../types';
import React, { useState } from 'react';
interface ProductCardProps {
    item: MarketplaceItem;
    onHistoryClick: (id: string, title: string) => void;
    imageUrl?: string | null;
    imageLoading?: boolean;
}

const ProductCard = React.memo(function ProductCard({ item, onHistoryClick, imageUrl, imageLoading }: ProductCardProps) {
    const isDeleted = (item as any)._isDeleted;
    const hasUpdates = item.updated && item.updated !== item.timestamp;
    const [imgError, setImgError] = useState(false);

    return (
        <Card sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            bgcolor: 'background.paper',
            border: '2px solid',
            borderColor: 'divider',
            '&:hover': {
                transform: 'translate(-3px, -3px)',
                borderColor: 'primary.main',
                boxShadow: '9px 9px 0 0 #FF7A1A',
            },
            '&:hover .nb-card-title': { color: 'primary.main' }
        }}>
            <Box sx={{ position: 'relative', pt: '56.25%', bgcolor: '#101010', borderBottom: '2px solid', borderColor: 'divider' }}>
                {imageLoading ? (
                    <Skeleton variant="rectangular" animation="wave" sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                    }} />
                ) : imageUrl && !imgError ? (
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
                            objectFit: 'cover',
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
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        border: '2px solid',
                        borderColor: '#0A0A0A'
                    }}>
                        <Tooltip title="View Price History">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onHistoryClick(item.asvz_id, item.title);
                                }}
                                sx={{
                                    color: '#0A0A0A',
                                    border: 'none',
                                    '&:hover': { backgroundColor: '#FF9445', color: '#0A0A0A' }
                                }}
                            >
                                <TimelineIcon fontSize="small" />
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
                    className="nb-card-title"
                    sx={{
                        fontWeight: 800,
                        lineHeight: 1.25,
                        mb: 1,
                        transition: 'color 120ms ease',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}
                >
                    {item.title}
                </Link>

                <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 900, letterSpacing: '0.02em' }}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(item.price)}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        ID: {item.asvz_id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {item.user}
                    </Typography>
                </Box>

                {isDeleted && (
                    <Chip
                        label="Deleted"
                        color="error"
                        size="small"
                        variant="outlined"
                        sx={{ alignSelf: 'flex-start', mt: 'auto', borderRadius: 0 }}
                    />
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {item.timestamp ? format(parseISO(item.timestamp), 'dd.MM.yyyy') : '-'}
                </Typography>
            </CardContent>
        </Card>
    );
});

export default ProductCard;
