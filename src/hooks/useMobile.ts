import { useMediaQuery, useTheme } from '@mui/material';

export function useMobile() {
    return useMediaQuery(useTheme().breakpoints.down('sm'));
}
