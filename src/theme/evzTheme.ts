import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { EVZ_COLORS } from './tokens';

export const evzTheme = responsiveFontSizes(
  createTheme({
    palette: {
      primary: { main: EVZ_COLORS.green },
      secondary: { main: EVZ_COLORS.orange },
      background: {
        default: '#F8FAFC',
        paper: '#FFFFFF'
      },
      text: {
        primary: EVZ_COLORS.slate
      }
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: [
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'Helvetica',
        'Arial',
        'Apple Color Emoji',
        'Segoe UI Emoji'
      ].join(','),
      button: { textTransform: 'none', fontWeight: 700 }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 18 }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 22 }
        }
      }
    }
  })
);
