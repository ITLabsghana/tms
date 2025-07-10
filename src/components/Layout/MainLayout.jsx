import React, { useState, useEffect } from 'react'; // Added useEffect
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
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import { styled, useTheme } from '@mui/material/styles';
import CopyrightIcon from '@mui/icons-material/Copyright';
import useMediaQuery from '@mui/material/useMediaQuery'; // For responsive drawer

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open, isMobile }) => ({ // Added isMobile prop
    flexGrow: 1,
    padding: 0,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: isMobile ? 0 : `-${drawerWidth}px`, // No margin shift for mobile if drawer is temporary
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    ...(open && !isMobile && { // Only apply margin shift if drawer is persistent (not mobile)
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const StyledAppBar = styled(AppBarMui, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile', // Add isMobile
})(({ theme, open, isMobile }) => ({ // Added isMobile prop
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && !isMobile && { // Only adjust width if drawer is persistent
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
    width: '100%', // Ensure ContentBox tries to take full width
    boxSizing: 'border-box', // Include padding and border in the element's total width and height
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Use 'md' breakpoint for tablets and below
  const [mobileOpen, setMobileOpen] = useState(false); // For temporary drawer on mobile
  const [desktopOpen, setDesktopOpen] = useState(true); // For persistent drawer on desktop

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

  // Close mobile drawer when a menu item is clicked
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

  const drawerContent = (
    <div>
      <DrawerHeader>
        <Typography variant="h6" sx={{ mr: 'auto', ml: 1 }}>Menu</Typography>
        <IconButton onClick={handleDrawerToggle}> {/* Use handleDrawerToggle for desktop too */}
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {displayedMenuItems.map((item) => (
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
  );

  // Determine current drawer open state based on screen size
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
            sx={{ mr: 2, ...(currentDrawerOpen && !isMobile && { display: 'none' }) }} // Hide on desktop if drawer is open & persistent
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
        onClose={isMobile ? handleDrawerToggle : undefined} // Close on backdrop click for temporary drawer
        ModalProps={{
            keepMounted: true, // Better open performance on mobile.
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
        {drawerContent}
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
