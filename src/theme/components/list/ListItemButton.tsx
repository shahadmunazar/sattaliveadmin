import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const ListItemButton: Components<Omit<Theme, 'components'>>['MuiListItemButton'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(1),
      borderRadius: theme.shape.borderRadius,
      '&:hover': {
        backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.info.dark,
      },
    }),
  },
};

export default ListItemButton;
