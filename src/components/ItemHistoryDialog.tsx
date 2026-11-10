import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ItemPriceChart from './ItemPriceChart';
import { useMobile } from '../hooks/useMobile';

interface ItemHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    asvzId: string;
    title: string;
}

export default function ItemHistoryDialog({ open, onClose, asvzId, title }: ItemHistoryDialogProps) {
    const isMobile = useMobile();
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" component="div" sx={{ minWidth: 0, overflowWrap: 'anywhere', pr: 1 }}>
                    Price History: {title}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ color: 'text.secondary', flexShrink: 0 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ px: { xs: 1, sm: 3 } }}>
                <Box sx={{ minHeight: 300 }}>
                    <ItemPriceChart asvzId={asvzId} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
