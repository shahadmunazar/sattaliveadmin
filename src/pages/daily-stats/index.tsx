import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
} from '@mui/material';

interface UserStat {
  user_id: number;
  user_name: string;
  user_mobile: string;
  total_won: number;
  total_loss: number;
}

interface DailyStat {
  date: string;
  total_users_won: number;
  total_users_loss: number;
  total_bet_amount: number;
  total_win_amount: number;
  total_loss_amount: number;
  top_winner_name: string | null;
  top_winner_amount: number;
  users_list?: UserStat[];
}

const DailyStats: React.FC = () => {
  const [stat, setStat] = useState<DailyStat | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const getToken = (): string => localStorage.getItem('authToken') || '';

  const fetchStats = async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/daily-win-loss-stats?date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      setStat(response.data.data);
    } catch (err) {
      console.error('Failed to fetch daily stats', err);
      setError('Failed to fetch daily stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedDate);
  }, []);

  const handleFetch = () => {
    fetchStats(selectedDate);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Daily Win & Loss Stats
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          label="Select Date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={handleFetch}>
          Fetch Stats
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ '& th': { bgcolor: 'transparent !important', fontWeight: 'bold' } }}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Total Bet Amount</TableCell>
                <TableCell>Total Win Amount</TableCell>
                <TableCell>Total Loss Amount</TableCell>
                <TableCell>Top Winner</TableCell>
                <TableCell>Top Win Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!stat ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No stats found.
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell>{stat.date}</TableCell>
                  <TableCell>₹{stat.total_bet_amount}</TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    ₹{stat.total_win_amount}
                  </TableCell>
                  <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    ₹{stat.total_loss_amount}
                  </TableCell>
                  <TableCell>
                    {stat.top_winner_name ? stat.top_winner_name : '-'}
                  </TableCell>
                  <TableCell>
                    {stat.top_winner_amount > 0 ? `₹${stat.top_winner_amount}` : '-'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {stat && stat.users_list && stat.users_list.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" gutterBottom>
            All Users Win/Loss List
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ '& th': { bgcolor: 'transparent !important', fontWeight: 'bold' } }}>
                <TableRow>
                  <TableCell>User ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Total Won</TableCell>
                  <TableCell>Total Loss</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stat.users_list.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.user_id}</TableCell>
                    <TableCell>{user.user_name}</TableCell>
                    <TableCell>{user.user_mobile}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      ₹{user.total_won}
                    </TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      ₹{user.total_loss}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default DailyStats;
