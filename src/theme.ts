import { createTheme, type SxProps, type Theme } from '@mui/material/styles';
import type { CSSProperties } from 'react';

/* ==================================================================
 *  ASVZ Analytics — Neo-Brutalism (Dark)
 *  ------------------------------------------------------------------
 *  Rules of the house:
 *   · sharp corners, never a radius
 *   · heavy 2px borders on everything that can be touched
 *   · hard, blur-less offset shadows (the "printed block" look)
 *   · one loud accent (acid yellow) + sparing secondary pops
 *   · heavy uppercase type on labels, buttons and headers
 * ================================================================== */

export const nb = {
    bg: '#0A0A0A',
    surface: '#141414',
    surfaceAlt: '#1B1B1B',
    sunken: '#0F0F0F',
    border: '#2E2E2E',
    borderStrong: '#4A4A4A',
    ink: '#F5F5F5',
    muted: '#8C8C8C',
    accent: '#FF7A1A',
    pink: '#FF4D9D',
    lime: '#7CFF5A',
    amber: '#FFD166',
    cyan: '#5CD8FF',
    red: '#FF5C5C',
    black: '#000000',
} as const;

/** Palette shared by every Recharts chart. */
export const chartColors = {
    added: nb.lime,
    updated: nb.cyan,
    deleted: nb.red,
    total_items: nb.accent,
    total_value: nb.amber,
} as const;

/** Chart chrome (axes / grid / tooltip) keeping the flat brutalist look. */
export const chartTheme = {
    axis: '#8C8C8C',
    grid: '#2E2E2E',
    tooltip: {
        backgroundColor: nb.surface,
        border: `2px solid ${nb.border}`,
        borderRadius: 0,
        boxShadow: '6px 6px 0 0 rgba(0, 0, 0, 0.75)',
    } as CSSProperties,
    tooltipItem: { color: nb.ink } as CSSProperties,
} as const;

const HARD = '4px 4px 0 0 #000000';
const HARD_ACCENT = '4px 4px 0 0 #FF7A1A';
const HARD_PANEL = '8px 8px 0 0 rgba(0, 0, 0, 0.75)';

const focusRing = {
    '&:focus-visible': {
        outline: `2px solid ${nb.accent}`,
        outlineOffset: 2,
    },
};

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: nb.accent,
            light: '#FF9445',
            dark: '#D9610A',
            contrastText: nb.black,
        },
        secondary: {
            main: nb.pink,
            light: '#FF7DB8',
            dark: '#D62E7B',
            contrastText: nb.black,
        },
        success: { main: nb.lime, contrastText: nb.black },
        warning: { main: nb.amber, contrastText: nb.black },
        error: { main: nb.red, contrastText: nb.black },
        info: { main: nb.cyan, contrastText: nb.black },
        background: {
            default: nb.bg,
            paper: nb.surface,
        },
        text: {
            primary: nb.ink,
            secondary: nb.muted,
            disabled: '#5A5A5A',
        },
        divider: nb.border,
        action: {
            active: nb.ink,
            hover: 'rgba(255, 122, 26, 0.08)',
            selected: 'rgba(255, 122, 26, 0.14)',
            disabled: '#4A4A4A',
            disabledBackground: '#1B1B1B',
        },
    },
    shape: {
        borderRadius: 0,
    },
    typography: {
        fontFamily: '"Inter", "Helvetica Neue", "Arial", sans-serif',
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 600,
        fontWeightBold: 800,
        allVariants: {
            letterSpacing: '0.01em',
        },
        h1: { fontWeight: 800, fontSize: '2.25rem', textTransform: 'uppercase', letterSpacing: '0.02em' },
        h2: { fontWeight: 800, fontSize: '1.85rem', textTransform: 'uppercase', letterSpacing: '0.02em' },
        h3: { fontWeight: 800, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em' },
        h4: { fontWeight: 800, fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.03em' },
        h5: { fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
        h6: { fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.1em' },
        subtitle1: { fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.85rem' },
        subtitle2: { fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' },
        body1: { fontSize: '0.9rem' },
        body2: { fontSize: '0.82rem' },
        button: { fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', fontSize: '0.75rem' },
        caption: {
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: nb.muted,
        },
        overline: { fontWeight: 800, letterSpacing: '0.18em', fontSize: '0.65rem' },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                html: {
                    backgroundColor: nb.bg,
                    scrollbarColor: `${nb.border} ${nb.bg}`,
                },
                body: {
                    backgroundColor: nb.bg,
                    color: nb.ink,
                    fontSynthesis: 'none',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                },
                '::selection': {
                    backgroundColor: nb.accent,
                    color: nb.black,
                },
                '*::-webkit-scrollbar': { width: 14, height: 14 },
                '*::-webkit-scrollbar-track': { backgroundColor: nb.bg },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: nb.border,
                    border: `4px solid ${nb.bg}`,
                },
                '*::-webkit-scrollbar-thumb:hover': { backgroundColor: nb.borderStrong },
                '*::-webkit-scrollbar-corner': { backgroundColor: nb.bg },
            },
        },

        /* ------------------------------------------------ surfaces */
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: nb.surface,
                    border: `2px solid ${nb.border}`,
                    borderRadius: 0,
                    boxShadow: HARD_PANEL,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: nb.surface,
                    border: `2px solid ${nb.border}`,
                    borderRadius: 0,
                    boxShadow: '6px 6px 0 0 rgba(0, 0, 0, 0.75)',
                    transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
                },
            },
        },
        MuiCardContent: {
            styleOverrides: { root: { padding: 16, '&:last-child': { paddingBottom: 16 } } },
        },
        MuiDivider: {
            styleOverrides: { root: { borderColor: nb.border, borderWidth: 2 } },
        },

        /* ------------------------------------------------ buttons */
        MuiButtonBase: {
            defaultProps: { disableRipple: true },
            styleOverrides: { root: focusRing },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    border: '2px solid transparent',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    fontSize: '0.75rem',
                    padding: '8px 18px',
                    boxShadow: 'none',
                    transition:
                        'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease, border-color 120ms ease, color 120ms ease',
                    '&:active': { transform: 'translate(2px, 2px)', boxShadow: 'none' },
                    '&.Mui-disabled': { opacity: 0.35 },
                },
                sizeSmall: { padding: '5px 12px', fontSize: '0.68rem' },
                outlined: {
                    border: `2px solid ${nb.borderStrong}`,
                    color: nb.ink,
                    '&:hover': {
                        borderColor: nb.accent,
                        color: nb.accent,
                        backgroundColor: 'rgba(255, 122, 26, 0.08)',
                        boxShadow: HARD_ACCENT,
                        transform: 'translate(-2px, -2px)',
                    },
                },
                text: {
                    color: nb.ink,
                    '&:hover': { backgroundColor: 'rgba(255, 122, 26, 0.1)', color: nb.accent },
                },
                contained: {
                    border: `2px solid ${nb.black}`,
                    color: nb.black,
                    boxShadow: HARD,
                    '&:hover': { boxShadow: '6px 6px 0 0 #000000', transform: 'translate(-2px, -2px)' },
                },
            },
            variants: [
                {
                    props: { variant: 'outlined', color: 'error' },
                    style: {
                        borderColor: nb.red,
                        color: nb.red,
                        '&:hover': {
                            borderColor: nb.red,
                            color: nb.red,
                            backgroundColor: 'rgba(255, 92, 92, 0.08)',
                            boxShadow: '4px 4px 0 0 #FF5C5C',
                            transform: 'translate(-2px, -2px)',
                        },
                    },
                },
                {
                    props: { variant: 'outlined', color: 'secondary' },
                    style: {
                        borderColor: nb.pink,
                        color: nb.pink,
                        '&:hover': {
                            borderColor: nb.pink,
                            color: nb.pink,
                            backgroundColor: 'rgba(255, 77, 157, 0.08)',
                            boxShadow: '4px 4px 0 0 #FF4D9D',
                            transform: 'translate(-2px, -2px)',
                        },
                    },
                },
                {
                    props: { variant: 'outlined', color: 'success' },
                    style: {
                        borderColor: nb.lime,
                        color: nb.lime,
                        '&:hover': {
                            borderColor: nb.lime,
                            color: nb.lime,
                            backgroundColor: 'rgba(124, 255, 90, 0.08)',
                            boxShadow: '4px 4px 0 0 #7CFF5A',
                            transform: 'translate(-2px, -2px)',
                        },
                    },
                },
                {
                    props: { variant: 'contained', color: 'primary' },
                    style: { backgroundColor: nb.accent, color: nb.black, '&:hover': { backgroundColor: '#FF9445' } },
                },
                {
                    props: { variant: 'contained', color: 'secondary' },
                    style: { backgroundColor: nb.pink, color: nb.black, '&:hover': { backgroundColor: '#FF7DB8' } },
                },
                {
                    props: { variant: 'contained', color: 'error' },
                    style: { backgroundColor: nb.red, color: nb.black, '&:hover': { backgroundColor: '#FF8080' } },
                },
                {
                    props: { variant: 'contained', color: 'success' },
                    style: { backgroundColor: nb.lime, color: nb.black, '&:hover': { backgroundColor: '#A6FF8C' } },
                },
            ],
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    border: '2px solid transparent',
                    color: nb.muted,
                    transition: 'background-color 120ms ease, color 120ms ease, border-color 120ms ease',
                    '&:hover': {
                        backgroundColor: nb.accent,
                        color: nb.black,
                        borderColor: nb.accent,
                    },
                },
                colorError: {
                    '&:hover': { backgroundColor: nb.red, color: nb.black, borderColor: nb.red },
                },
                sizeSmall: { padding: 6 },
            },
        },
        MuiFab: {
            styleOverrides: { root: { borderRadius: 0, boxShadow: HARD } },
        },

        /* ------------------------------------------------ tabs / toggles */
        MuiTabs: {
            styleOverrides: {
                indicator: { height: 4, backgroundColor: nb.accent },
                list: { gap: 4 },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    minHeight: 44,
                    padding: '8px 18px',
                    fontWeight: 800,
                    fontSize: '0.73rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    color: nb.muted,
                    '&:hover': { color: nb.ink, backgroundColor: 'rgba(255, 122, 26, 0.06)' },
                    '&.Mui-selected': { color: nb.accent },
                },
            },
        },
        MuiToggleButtonGroup: {
            styleOverrides: {
                root: { borderRadius: 0, gap: 0 },
                grouped: {
                    borderRadius: 0,
                    '&:not(:first-of-type)': { marginLeft: -2 },
                },
            },
        },
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    border: `2px solid ${nb.border}`,
                    color: nb.muted,
                    padding: '6px 14px',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    lineHeight: 1.2,
                    '&:hover': {
                        borderColor: nb.accent,
                        color: nb.accent,
                        backgroundColor: 'rgba(255, 122, 26, 0.08)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: nb.accent,
                        color: nb.black,
                        borderColor: nb.accent,
                        '&:hover': { backgroundColor: '#FF9445', color: nb.black },
                    },
                },
            },
        },

        /* ------------------------------------------------ inputs */
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: nb.muted,
                    '&.Mui-focused': { color: nb.accent },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    backgroundColor: nb.sunken,
                    fontSize: '0.85rem',
                    color: nb.ink,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: nb.border,
                        borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: nb.borderStrong },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: nb.accent,
                        borderWidth: 2,
                    },
                    '&.Mui-disabled': { backgroundColor: '#101010' },
                },
                input: { padding: '10px 12px' },
                sizeSmall: { padding: '7px 10px' },
            },
        },
        MuiFilledInput: {
            styleOverrides: { root: { borderRadius: 0, backgroundColor: nb.sunken } },
        },
        MuiInputBase: {
            styleOverrides: { root: { borderRadius: 0 } },
        },
        MuiFormControlLabel: {
            styleOverrides: {
                label: {
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: nb.muted,
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    color: nb.borderStrong,
                    padding: 6,
                    '&.Mui-checked': { color: nb.accent },
                },
            },
        },
        MuiRadio: {
            styleOverrides: {
                root: { color: nb.borderStrong, '&.Mui-checked': { color: nb.accent } },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                root: { padding: 8 },
                thumb: { borderRadius: 0, backgroundColor: nb.ink },
                track: { borderRadius: 0, opacity: 1, backgroundColor: nb.borderStrong, border: 'none' },
                switchBase: {
                    '&.Mui-checked': { color: nb.black },
                    '&.Mui-checked + .MuiSwitch-track': { backgroundColor: nb.accent, opacity: 1 },
                },
            },
        },
        MuiSelect: {
            styleOverrides: { root: { borderRadius: 0 }, icon: { color: nb.accent } },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    borderRadius: 0,
                    border: `2px solid ${nb.border}`,
                    backgroundColor: nb.surface,
                    boxShadow: HARD_PANEL,
                    backgroundImage: 'none',
                },
                list: { padding: 4 },
            },
        },
        MuiPopover: {
            styleOverrides: {
                paper: {
                    borderRadius: 0,
                    border: `2px solid ${nb.border}`,
                    backgroundColor: nb.surface,
                    boxShadow: HARD_PANEL,
                    backgroundImage: 'none',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    '&:hover': { backgroundColor: 'rgba(255, 122, 26, 0.08)' },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 122, 26, 0.16)',
                        color: nb.accent,
                        '&:hover': { backgroundColor: 'rgba(255, 122, 26, 0.22)' },
                    },
                },
            },
        },
        MuiAutocomplete: {
            styleOverrides: {
                paper: {
                    borderRadius: 0,
                    border: `2px solid ${nb.border}`,
                    boxShadow: HARD_PANEL,
                    backgroundImage: 'none',
                },
            },
        },

        /* ------------------------------------------------ dialogs */
        MuiBackdrop: {
            styleOverrides: { root: { backgroundColor: 'rgba(0, 0, 0, 0.85)' } },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 0,
                    border: `2px solid ${nb.borderStrong}`,
                    backgroundImage: 'none',
                    boxShadow: HARD_PANEL,
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    padding: '14px 20px',
                    borderBottom: `2px solid ${nb.border}`,
                    backgroundColor: nb.surfaceAlt,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: '0.85rem',
                },
            },
        },
        MuiDialogContent: {
            styleOverrides: {
                root: { padding: 20 },
                dividers: { borderColor: nb.border, borderWidth: 2 },
            },
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '14px 20px',
                    borderTop: `2px solid ${nb.border}`,
                    backgroundColor: nb.surfaceAlt,
                    gap: 8,
                },
            },
        },
        MuiSnackbar: {
            styleOverrides: { root: { '& .MuiPaper-root': { boxShadow: HARD_PANEL } } },
        },

        /* ------------------------------------------------ data display */
        MuiTableContainer: { styleOverrides: { root: { borderRadius: 0 } } },
        MuiTable: {
            styleOverrides: { root: { borderCollapse: 'separate', borderSpacing: 0 } },
        },
        MuiTableHead: {
            styleOverrides: { root: { backgroundColor: nb.surfaceAlt } },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderColor: nb.border,
                    borderBottom: `2px solid ${nb.border}`,
                    fontSize: '0.82rem',
                    padding: '10px 14px',
                },
                head: {
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: nb.muted,
                    borderBottom: `2px solid ${nb.borderStrong}`,
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: { '&:hover': { backgroundColor: 'rgba(255, 122, 26, 0.06)' } },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    fontWeight: 800,
                    fontSize: '0.66rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    height: 24,
                    border: '2px solid',
                },
            },
            variants: [
                {
                    props: { variant: 'outlined', color: 'error' },
                    style: {
                        borderColor: nb.red,
                        color: nb.red,
                        backgroundColor: 'rgba(255, 92, 92, 0.08)',
                    },
                },
                {
                    props: { variant: 'outlined', color: 'success' },
                    style: {
                        borderColor: nb.lime,
                        color: nb.lime,
                        backgroundColor: 'rgba(124, 255, 90, 0.08)',
                    },
                },
            ],
        },
        MuiAvatar: { styleOverrides: { root: { borderRadius: 0, border: '2px solid' } } },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: nb.ink,
                    color: nb.black,
                    borderRadius: 0,
                    border: `2px solid ${nb.black}`,
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '6px 10px',
                },
                arrow: { color: nb.ink },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    color: nb.accent,
                    fontWeight: 600,
                    textDecorationColor: 'rgba(255, 122, 26, 0.45)',
                    '&:hover': { color: '#FF9445' },
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    border: '2px solid',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                },
            },
            variants: [
                {
                    props: { variant: 'standard', severity: 'error' },
                    style: { borderColor: nb.red, backgroundColor: 'rgba(255, 92, 92, 0.12)', color: nb.ink },
                },
                {
                    props: { variant: 'standard', severity: 'success' },
                    style: { borderColor: nb.lime, backgroundColor: 'rgba(124, 255, 90, 0.12)', color: nb.ink },
                },
                {
                    props: { variant: 'standard', severity: 'warning' },
                    style: { borderColor: nb.amber, backgroundColor: 'rgba(255, 176, 61, 0.12)', color: nb.ink },
                },
                {
                    props: { variant: 'standard', severity: 'info' },
                    style: { borderColor: nb.cyan, backgroundColor: 'rgba(92, 216, 255, 0.12)', color: nb.ink },
                },
                {
                    props: { variant: 'filled', severity: 'error' },
                    style: { borderColor: nb.black, color: nb.black, backgroundColor: nb.red },
                },
                {
                    props: { variant: 'filled', severity: 'success' },
                    style: { borderColor: nb.black, color: nb.black, backgroundColor: nb.lime },
                },
                {
                    props: { variant: 'filled', severity: 'warning' },
                    style: { borderColor: nb.black, color: nb.black, backgroundColor: nb.amber },
                },
                {
                    props: { variant: 'filled', severity: 'info' },
                    style: { borderColor: nb.black, color: nb.black, backgroundColor: nb.cyan },
                },
            ],
        },
        MuiSkeleton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                },
                rectangular: { borderRadius: 0 },
            },
        },
        MuiCircularProgress: {
            styleOverrides: { root: { color: nb.accent } },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: { borderRadius: 0, height: 8, backgroundColor: nb.border },
                bar: { backgroundColor: nb.accent, borderRadius: 0 },
            },
        },
        MuiPagination: {
            styleOverrides: { root: { gap: 4 } },
        },
        MuiPaginationItem: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    border: `2px solid ${nb.border}`,
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: nb.muted,
                    '&:hover': {
                        borderColor: nb.accent,
                        color: nb.accent,
                        backgroundColor: 'transparent',
                    },
                    '&.Mui-selected': {
                        backgroundColor: nb.accent,
                        color: nb.black,
                        borderColor: nb.accent,
                        '&:hover': { backgroundColor: '#FF9445' },
                    },
                },
            },
        },
        MuiAccordion: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    border: `2px solid ${nb.border}`,
                    backgroundColor: nb.surface,
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                },
            },
        },
    },
});

/**
 * Shared DataGrid skin. Kept here (instead of a theme override) so the
 * grid package never has to be a hard dependency of the theme module.
 */
export const dataGridSx: SxProps<Theme> = {
    border: 0,
    backgroundColor: 'transparent',
    color: nb.ink,
    '--DataGrid-rowBorderColor': nb.border,
    '--DataGrid-containerBackground': 'transparent',
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: nb.surfaceAlt,
        borderBottom: `2px solid ${nb.border}`,
    },
    '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 800,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: nb.muted,
    },
    '& .MuiDataGrid-columnSeparator': { color: nb.border },
    '& .MuiDataGrid-cell': {
        borderColor: nb.border,
        fontSize: '0.82rem',
        '&:focus-within': { outline: 'none' },
    },
    '& .MuiDataGrid-row': { borderBottom: `1px solid ${nb.border}` },
    '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(255, 122, 26, 0.06)' },
    '& .MuiDataGrid-row.Mui-hovered': { backgroundColor: 'rgba(255, 122, 26, 0.06)' },
    '& .MuiDataGrid-row.Mui-selected': {
        backgroundColor: 'rgba(255, 122, 26, 0.12)',
        '&:hover': { backgroundColor: 'rgba(255, 122, 26, 0.16)' },
    },
    '& .MuiDataGrid-footerContainer': {
        borderTop: `2px solid ${nb.border}`,
        backgroundColor: nb.surfaceAlt,
    },
    '& .MuiDataGrid-toolbarContainer': {
        borderBottom: `2px solid ${nb.border}`,
        padding: '8px 4px',
        gap: 6,
    },
    '& .MuiDataGrid-toolbarContainer .MuiButton-root': { color: nb.muted },
    '& .MuiDataGrid-toolbarContainer .MuiButton-root:hover': {
        color: nb.accent,
        backgroundColor: 'rgba(255, 122, 26, 0.1)',
    },
    '& .MuiDataGrid-toolbarContainer .MuiInput-underline:before': { borderBottomColor: nb.border },
    '& .MuiDataGrid-toolbarContainer .MuiInput-underline:after': { borderBottomColor: nb.accent },
    '& .MuiTablePagination-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
        color: nb.muted,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    '& .MuiDataGrid-menuIcon button': { color: nb.muted },
    '& .MuiDataGrid-menuIcon button:hover': { color: nb.accent },
    '& .MuiDataGrid-overlay': {
        backgroundColor: 'transparent',
        color: nb.muted,
    },
    '& .MuiDataGrid-filler, & .MuiDataGrid-scrollbarFiller': { backgroundColor: nb.surfaceAlt },
};

export default theme;
