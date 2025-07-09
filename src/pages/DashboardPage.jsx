import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton'; // Added import
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CakeIcon from '@mui/icons-material/Cake';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add'; // Added import for QuickLinks
import PeopleIcon from '@mui/icons-material/People'; // Added import for QuickLinks
import EventNoteIcon from '@mui/icons-material/EventNote'; // Added import for QuickLinks
import { format, parseISO } from 'date-fns';

const initialSummaryStats = [
  { title: 'Total Teachers', value: 'N/A', color: 'primary.main', loading: true, key: 'totalTeachers' },
  { title: 'Active Leaves', value: 'N/A', color: 'secondary.main', loading: true, key: 'activeLeaves' },
];


const DashboardPage = () => {
  const [summaryStats, setSummaryStats] = useState(initialSummaryStats);
  const [upcomingLeaveEnds, setUpcomingLeaveEnds] = useState([]);
  const [upcomingRetirements, setUpcomingRetirements] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [errorNotifications, setErrorNotifications] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingNotifications(true);
      setErrorNotifications('');
      try {
        const { count: totalTeachersCount, error: teachersError } = await supabase
            .from('teachers')
            .select('*', { count: 'exact', head: true })
            .eq('is_deleted', false);

        const { count: activeLeavesCount, error: leavesError } = await supabase
            .from('leave_records')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Approved')
            .lte('start_date', new Date().toISOString())
            .gte('end_date', new Date().toISOString());

        if (teachersError) console.error("Error fetching total teachers:", teachersError.message);
        if (leavesError) console.error("Error fetching active leaves:", leavesError.message);

        setSummaryStats(prevStats => prevStats.map(stat => {
            if (stat.key === 'totalTeachers') return {...stat, value: totalTeachersCount ?? 'N/A', loading: false };
            if (stat.key === 'activeLeaves') return {...stat, value: activeLeavesCount ?? 'N/A', loading: false };
            return stat;
        }));


        const { data: leaveData, error: leaveError } = await supabase.rpc('get_upcoming_leave_end_dates', { days_threshold: 14 });
        if (leaveError) throw leaveError;
        setUpcomingLeaveEnds(leaveData || []);

        const { data: retirementData, error: retirementError } = await supabase.rpc('get_upcoming_retirements', { days_threshold: 180 });
        if (retirementError) throw retirementError;
        setUpcomingRetirements(retirementData || []);

      } catch (err) {
        console.error("Error fetching dashboard notifications:", err);
        setErrorNotifications('Failed to load notifications. ' + err.message);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="h1">
        District Supervisor Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryStats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.key}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                textAlign: 'center',
                color: stat.loading ? 'text.secondary' : 'white',
                backgroundColor: stat.loading ? 'grey.200' : stat.color
              }}
            >
              <Typography variant="h6">{stat.title}</Typography>
              {stat.loading ? <CircularProgress size={30} sx={{mt:1}}/> : <Typography variant="h3">{stat.value}</Typography>}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, minHeight: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Alerts & Notifications
            </Typography>
            {loadingNotifications && <CircularProgress />}
            {!loadingNotifications && errorNotifications && <Alert severity="error">{errorNotifications}</Alert>}

            {!loadingNotifications && !errorNotifications && upcomingLeaveEnds.length === 0 && upcomingRetirements.length === 0 && (
              <Typography>No current alerts.</Typography>
            )}

            {upcomingLeaveEnds.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" color="secondary.dark" gutterBottom>Upcoming Leave End Dates (next 14 days):</Typography>
                <List dense>
                  {upcomingLeaveEnds.map(item => (
                    <ListItem key={`leave-${item.teacher_id}-${item.end_date}`} disablePadding>
                      <ListItemIcon sx={{minWidth: 32}}> <EventBusyIcon color="action" fontSize="small"/> </ListItemIcon>
                      <ListItemText
                        primary={`${item.first_name} ${item.surname} (Staff ID: ${item.staff_id}) - ${item.leave_type}`}
                        secondary={`Ends: ${format(parseISO(item.end_date), 'MMMM d, yyyy')} (in ${item.days_remaining} days)`}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{my:1}}/>
              </Box>
            )}

            {upcomingRetirements.length > 0 && (
              <Box>
                <Typography variant="subtitle1" color="warning.dark" gutterBottom>Upcoming Retirements (next 6 months):</Typography>
                 <List dense>
                  {upcomingRetirements.map(item => (
                    <ListItem key={`retire-${item.teacher_id}`} disablePadding>
                       <ListItemIcon sx={{minWidth: 32}}> <CakeIcon color="action" fontSize="small"/> </ListItemIcon>
                      <ListItemText
                        primary={`${item.first_name} ${item.surname} (Staff ID: ${item.staff_id})`}
                        secondary={`Retires on: ${format(parseISO(item.retirement_date), 'MMMM d, yyyy')} (in ${item.days_to_retirement} days)`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, minHeight: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <List>
                <ListItemButton component={RouterLink} to="/teachers/add">
                    <ListItemIcon><AddIcon /></ListItemIcon>
                    <ListItemText primary="Add New Teacher" />
                </ListItemButton>
                <ListItemButton component={RouterLink} to="/teachers">
                    <ListItemIcon><PeopleIcon /></ListItemIcon>
                    <ListItemText primary="View All Teachers" />
                </ListItemButton>
                <ListItemButton component={RouterLink} to="/leave/add">
                     <ListItemIcon><EventNoteIcon /></ListItemIcon>
                    <ListItemText primary="Add Leave Record" />
                </ListItemButton>
                 <ListItemButton component={RouterLink} to="/leave">
                     <ListItemIcon><EventNoteIcon color="action" /></ListItemIcon>
                    <ListItemText primary="Manage Leave Records" />
                </ListItemButton>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
