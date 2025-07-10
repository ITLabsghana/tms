import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBarMui from '@mui/material/AppBar'; // Renamed to avoid conflict with local AppBar name
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import { styled, useTheme } from '@mui/material/styles'; // Import useTheme
import CopyrightIcon from '@mui/icons-material/Copyright';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(0), // Remove padding from Main so content can control its own
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

// Using AppBarMui to avoid conflict with a potential local variable named AppBar
const StyledAppBar = styled(AppBarMui, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const ContentBox = styled(Box)(({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(3), // Add padding here for the content area
    // overflowY: 'auto', // If content might overflow
  }));

const Footer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.5), // Reduced padding a bit
    marginTop: 'auto',
    backgroundColor: theme.palette.primary.main, // Use theme's primary color like AppBar
    color: theme.palette.primary.contrastText, // Ensure text is readable
    textAlign: 'center',
    // borderTop: `1px solid ${theme.palette.divider}`, // Optional: if you want a divider
  }));

const MainLayout = () => {
  const [open, setOpen] = useState(true);
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme(); // Get theme for footer color

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const baseMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Teachers', icon: <PeopleIcon />, path: '/teachers' },
    { text: 'Leave Management', icon: <EventNoteIcon />, path: '/leave' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  ];

  const adminSpecificMenuItems = [
    { text: 'User Management', icon: <SupervisedUserCircleIcon />, path: '/admin/users' },
  ];

  const userProfileMenuItems = [
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
  ];

  let displayedMenuItems = [...baseMenuItems];
  if (!authLoading && profile?.role === 'admin') {
    displayedMenuItems = [...baseMenuItems, ...adminSpecificMenuItems];
  }


  return (
    <Box sx={{ display: 'flex' }}>
      <StyledAppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Teacher Management System
          </Typography>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {user?.email} {profile && `(${profile.role})`}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </StyledAppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography variant="h6" sx={{ mr: 'auto', ml: 1}}>Menu</Typography>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {displayedMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding component={RouterLink} to={item.path}>
              <ListItemButton selected={location.pathname.startsWith(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {userProfileMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding component={RouterLink} to={item.path}>
              <ListItemButton selected={location.pathname.startsWith(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        <ContentBox> {/* Content wrapper with padding */}
          <Outlet />
        </ContentBox>
        <Footer>
            <Typography variant="body2"> {/* Removed color="text.secondary" to use contrastText */}
                Created By ITLabs Ghana <CopyrightIcon sx={{fontSize: 'inherit', verticalAlign: 'middle'}}/> 2025. Contact: 0248362847
            </Typography>
        </Footer>
      </Main>
    </Box>
  );
};

export default MainLayout;
