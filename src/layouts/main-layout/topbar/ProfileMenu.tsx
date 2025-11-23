import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconifyIcon from 'components/base/IconifyIcon';
import AvatarImage from 'assets/images/avater.png';

interface MenuItems {
  id: number;
  title: string;
  icon: string;
}

const menuItems: MenuItems[] = [
  { id: 1, title: 'View Profile', icon: 'mingcute:user-2-fill' },
  { id: 2, title: 'Account Settings', icon: 'material-symbols:settings-account-box-rounded' },
  { id: 3, title: 'Notifications', icon: 'ion:notifications' },
  { id: 4, title: 'Switch Account', icon: 'material-symbols:switch-account' },
  { id: 5, title: 'Help Center', icon: 'material-symbols:live-help' },
  { id: 6, title: 'Logout', icon: 'material-symbols:logout' },
];

const ProfileMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState<string>('Mr. John'); // Default name
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.error('No authentication token found');
          navigate('/authentication/login'); // Redirect to login page
          return;
        }

        const response = await axios.get('https://liveapi.sattalives.com/api/admin/admin-get', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.data.status === 200) {
          setUserName(response.data.data.name || 'Mr. John');
        } else {
          console.error('Failed to fetch user data:', response.data.message);
          navigate('/authentication/login'); // Redirect to login page on failure
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/authentication/login'); // Redirect to login page on error
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      await axios.post(
        'https://liveapi.sattalives.com/api/admin/admin-logout',
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Clear authentication token
      localStorage.removeItem('authToken');

      // Redirect to login page
      navigate('/authentication/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <Tooltip title="Profile">
        <ButtonBase onClick={handleProfileClick} disableRipple>
          <Stack
            spacing={1}
            alignItems="center"
            aria-controls={open ? 'account-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="true"
          >
            <Avatar
              src={AvatarImage}
              sx={(theme) => ({
                ml: 0.8,
                height: 32,
                width: 32,
                bgcolor: theme.palette.primary.main,
              })}
            />
            <Typography variant="subtitle2">{userName}</Typography>
          </Stack>
        </ButtonBase>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5,
            p: '0 !important',
            width: 240,
            overflow: 'hidden',
            '& .MuiAvatar-root': {
              width: 34,
              height: 34,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose} sx={{ '&:hover': { bgcolor: 'info.main' } }}>
          <Avatar
            src={AvatarImage}
            sx={{
              bgcolor: 'primary.main',
            }}
          />
          <Stack direction="column">
            <Typography variant="body2" fontWeight={500}>
              {userName}
            </Typography>
            <Typography variant="caption" fontWeight={400} color="text.secondary">
              john@example.com
            </Typography>
          </Stack>
        </MenuItem>

        <Divider />

        {menuItems.map((item) => (
          <MenuItem 
            key={item.id} 
            onClick={item.id === 6 ? handleLogout : handleProfileMenuClose} 
            sx={{ py: 1 }}
          >
            <ListItemIcon sx={{ mr: 2, fontSize: 'button.fontSize' }}>
              <IconifyIcon icon={item.icon} />
            </ListItemIcon>
            <Typography variant="body2" color="text.secondary">
              {item.title}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ProfileMenu;
