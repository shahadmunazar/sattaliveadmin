import  { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, TableHead, TableBody, TableRow, TableCell, TextField, Button, Paper, Typography } from '@mui/material';

interface ProfitLossData {
  category_id: string;
  category_name: string;
  total_entered_amount: string;
  total_won_amount: string;
  profit_loss: number;
  created_date: string;
}

const ProfitLoss = () => {
  const [data, setData] = useState<ProfitLossData[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('authToken') || '';

  const fetchProfitLossData = async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    
    try {
      const formattedDate = new Date(date).toLocaleDateString('en-GB').split('/').reverse().join('-');
      const response = await axios.post('https://liveapi.sattalives.com/api/admin/get-all-result', {
        date: formattedDate,
      }, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      
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
        Profit & Loss Report
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

      {error && <Typography color="error">{error}</Typography>}

      <Paper sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category ID</TableCell>
              <TableCell>Category Name</TableCell>
              <TableCell>Total Entered Amount</TableCell>
              <TableCell>Total Won Amount</TableCell>
              <TableCell>Profit/Loss</TableCell>
              <TableCell>Created Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.category_id}>
                <TableCell>{item.category_id}</TableCell>
                <TableCell>{item.category_name}</TableCell>
                <TableCell>{item.total_entered_amount}</TableCell>
                <TableCell>{item.total_won_amount}</TableCell>
                <TableCell style={{ color: item.profit_loss < 0 ? 'red' : 'green' }}>
                  {item.profit_loss}
                </TableCell>
                <TableCell>{item.created_date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default ProfitLoss;