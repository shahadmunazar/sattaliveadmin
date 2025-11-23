import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';

interface ProfitLossData {
  total_debit: string;
  total_credit: string;
  profit_loss: number;
  created_date: string;
}

const AddProfitLoss = () => {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('authToken') || '';

  const fetchProfitLossData = async () => {
    if (!date) return;

    setLoading(true);
    setError(null);

    try {
      const formattedDate = new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
      const response = await axios.post(
        'https://liveapi.sattalives.com/api/admin/get-all-add-result',
        { date: formattedDate },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch profit/loss data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date) fetchProfitLossData();
  }, [date]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Add & Withdrawal Report
      </Typography>

      <TextField
        type="date"
        label="Select Date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        fullWidth
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={fetchProfitLossData}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Fetch Data'}
      </Button>

      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

      {data && (
        <Paper sx={{ mt: 4, p: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Total Debit</TableCell>
                <TableCell>Total Credit</TableCell>
                <TableCell>Profit/Loss</TableCell>
                <TableCell>Created Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{data.total_debit}</TableCell>
                <TableCell>{data.total_credit}</TableCell>
                <TableCell
                  sx={{ color: data.profit_loss < 0 ? 'red' : 'green', fontWeight: 'bold' }}
                >
                  {data.profit_loss}
                </TableCell>
                <TableCell>{data.created_date}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
};

export default AddProfitLoss;
