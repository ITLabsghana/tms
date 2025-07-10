import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBarMui from '@mui/material/AppBar';
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
// SupervisedUserCircleIcon import removed
import { styled, useTheme } from '@mui/material/styles';
import CopyrightIcon from '@mui/icons-material/Copyright';
import useMediaQuery from '@mui/material/useMediaQuery';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open, isMobile }) => ({
    flexGrow: 1,
    padding: 0,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: isMobile ? 0 : `-${drawerWidth}px`,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    ...(open && !isMobile && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const StyledAppBar = styled(AppBarMui, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile',
})(({ theme, open, isMobile }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && !isMobile && {
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
    padding: theme.spacing(3),
    width: '100%',
    boxSizing: 'border-box',
  }));

const Footer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.5),
    marginTop: 'auto',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    textAlign: 'center',
  }));

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

  const handleMenuItemClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };


  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const menuItems = [ // Combined base and potential admin items
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Teachers', icon: <PeopleIcon />, path: '/teachers' },
    { text: 'Leave Management', icon: <EventNoteIcon />, path: '/leave' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  ];

  // User Management link is no longer added here as it's removed from the project
  // if (!authLoading && profile?.role === 'admin') {
  //   menuItems.push({ text: 'User Management', icon: <SupervisedUserCircleIcon />, path: '/admin/users' });
  // }

  const userProfileMenuItems = [
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
  ];


  const currentDrawerOpen = isMobile ? mobileOpen : desktopOpen;


  return (
    <Box sx={{ display: 'flex' }}>
      <StyledAppBar position="fixed" open={currentDrawerOpen} isMobile={isMobile}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2, ...(currentDrawerOpen && !isMobile && { display: 'none' }) }}
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
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={currentDrawerOpen}
        onClose={isMobile ? handleDrawerToggle : undefined}
        ModalProps={{
            keepMounted: true,
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {/* Drawer Content */}
        <div>
          <DrawerHeader>
            <Typography variant="h6" sx={{ mr: 'auto', ml: 1 }}>Menu</Typography>
            <IconButton onClick={handleDrawerToggle}>
              <ChevronLeftIcon />
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List>
            {menuItems.map((item) => (  // Using menuItems directly
              <ListItem key={item.text} disablePadding component={RouterLink} to={item.path} onClick={handleMenuItemClick}>
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
              <ListItem key={item.text} disablePadding component={RouterLink} to={item.path} onClick={handleMenuItemClick}>
                <ListItemButton selected={location.pathname.startsWith(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer>
      <Main open={currentDrawerOpen} isMobile={isMobile}>
        <DrawerHeader />
        <ContentBox>
          <Outlet />
        </ContentBox>
        <Footer>
            <Typography variant="body2">
                Created By ITLabs Ghana <CopyrightIcon sx={{fontSize: 'inherit', verticalAlign: 'middle'}}/> 2025. Contact: 0248362847
            </Typography>
        </Footer>
      </Main>
    </Box>
  );
};

export default MainLayout;
