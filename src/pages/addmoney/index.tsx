/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Pagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface User {
  id: number;
  name: string;
  mobile: string;
}

interface Transaction {
  id: number;
  user_id: number;
  transaction_type: string;
  amount: string;
  description: string;
  transaction_date: string;
  available_balance: string;
  user_name: string;
  user_mobile: string;
}

interface MoneyRequest {
  id: number;
  user_id: number;
  transaction_type: string;
  amount: string;
  description: string;
  image: string | null;
  transaction_date: string;
  available_balance: string;
  created_at: string;
  updated_at: string;
  user: User;
  confirm_payment: string;
}

const AddMoney: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New State for View/Process Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MoneyRequest | null>(null);

  const [totalPages, setTotalPages] = useState<number>(1);
  const [pendingRequests, setPendingRequests] = useState<MoneyRequest[]>([]);

  const itemsPerPage = 10;

  const getToken = (): string => localStorage.getItem('authToken') || '';

  const fetchUsers = async (query: string) => {
    try {
      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/all-users-list?query=${query}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setUsers(response.data.data);
      setError(response.data.data.length === 0 ? 'No user found with this search.' : null);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError('Failed to fetch users. Please try again.');
    }
  };

  const fetchTransactions = async (page: number) => {
    try {
      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/all-money-added-list?page=${page}&per_page=${itemsPerPage}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setTransactions(response.data.data);
      setTotalPages(response.data.pagination.total_pages);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  const addMoneyToUser = async () => {
    if (!selectedUser) {
      setError('Please select a valid user.');
      return;
    }
    const finalAmount = amount || Number(customAmount);
    if (!finalAmount || finalAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    try {
      const payload = { mobile: selectedUser.mobile, amount: finalAmount };
      await axios.post('https://liveapi.sattalives.com/api/admin/add-money-to-users', payload, {
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      setError(null);
      setSearchQuery('');
      setAmount(null);
      setCustomAmount('');
      setSelectedUser(null);
      fetchTransactions(currentPage);
    } catch (err) {
      console.error('Failed to add money to user', err);
      setError('Failed to add money to user. Please try again.');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get('https://liveapi.sattalives.com/api/admin/all-money-added-request', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      setPendingRequests(response.data.data);
    } catch (err) {
      console.error('Failed to fetch pending requests', err);
    }
  };

  const handleApproveRequest = async (request: MoneyRequest) => {
    try {
      await axios.put(`https://liveapi.sattalives.com/api/admin/payment-confirmation/${request.id}`, {
        confirm_payment: 'received_successfully'
      }, {
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      fetchPendingRequests();
      fetchTransactions(currentPage);
      setIsRequestModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Failed to approve request', err);
      setError('Failed to approve money request. Please try again.');
    }
  };

  const handleRejectRequest = async (request: MoneyRequest) => {
    try {
      await axios.put(`https://liveapi.sattalives.com/api/admin/payment-confirmation/${request.id}`, {
        confirm_payment: 'not_confirm'
      }, {
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      fetchPendingRequests();
      fetchTransactions(currentPage);
      setIsRequestModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Failed to reject request', err);
      setError('Failed to reject money request. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(
        `https://liveapi.sattalives.com/api/admin/delete-add-money?id=${deleteId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setDeleteId(null);
      setIsDialogOpen(false);
      fetchTransactions(currentPage);
    } catch (error) {
      console.error('Failed to delete transaction', error);
      setError('Failed to delete transaction. Please try again.');
    }
  };

  const handleDialogOpen = (id: number) => {
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    fetchTransactions(value);
  };

  useEffect(() => {
    fetchTransactions(currentPage);
    fetchPendingRequests();

    const intervalId = setInterval(() => {
      fetchPendingRequests();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [currentPage]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add Money to User
      </Typography>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Search by Name or Mobile Number"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value) {
              fetchUsers(e.target.value);
            } else {
              setUsers([]);
            }
          }}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        {users.map((user) => (
          <Typography
            key={user.id}
            variant="h6"
            sx={{ cursor: 'pointer', mb: 1 }}
            onClick={() => setSelectedUser(user)}
          >
            {user.name} - {user.mobile}
          </Typography>
        ))}
      </Box>

      {selectedUser && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Select Amount</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[100, 200, 300, 400, 500].map((value) => (
              <Button
                key={value}
                variant={amount === value ? 'contained' : 'outlined'}
                onClick={() => {
                  setAmount(value);
                  setCustomAmount('');
                }}
              >
                {value}
              </Button>
            ))}
          </Box>
          <Typography variant="h6" sx={{ mt: 3 }}>
            Or Enter Custom Amount
          </Typography>
          <TextField
            type="number"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setAmount(null);
            }}
            placeholder="Enter custom amount"
            fullWidth
            sx={{ mt: 1 }}
          />
          <Button
            variant="contained"
            onClick={addMoneyToUser}
            sx={{ mt: 2 }}
            disabled={!amount && !customAmount}
          >
            Add Money
          </Button>
        </Box>
      )}

      {error && <Typography color="error">{error}</Typography>}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Pending Money Requests
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User Name</TableCell>
                <TableCell>User Mobile</TableCell>
                <TableCell>Requested Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingRequests.filter(req => req.confirm_payment === 'not_confirm' || req.confirm_payment === 'pending' || req.confirm_payment === 'not_approved' || req.confirm_payment === 'not_accepted').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No pending requests found.
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests
                  .filter(req => req.confirm_payment === 'not_confirm' || req.confirm_payment === 'pending' || req.confirm_payment === 'not_approved' || req.confirm_payment === 'not_accepted')
                  .map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.user?.name}</TableCell>
                      <TableCell>{request.user?.mobile}</TableCell>
                      <TableCell>{request.amount}</TableCell>
                      <TableCell>{new Date(request.created_at || request.transaction_date).toLocaleString()}</TableCell>
                      <TableCell>{request.confirm_payment}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsRequestModalOpen(true);
                          }}
                        >
                          View & Process
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box>
        <Typography variant="h5" gutterBottom>
          Transaction History
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User Name</TableCell>
                <TableCell>User Mobile</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Available Balance</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.user_name}</TableCell>
                  <TableCell>{transaction.user_mobile}</TableCell>
                  <TableCell>{transaction.transaction_type}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{new Date(transaction.transaction_date).toLocaleString()}</TableCell>
                  <TableCell>{transaction.available_balance}</TableCell>
                  <TableCell>
                    <Button
                      color="error"
                      onClick={() => handleDialogOpen(transaction.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          sx={{ mt: 2 }}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* View/Process Request Modal */}
      <Dialog open={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payment Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1"><strong>User:</strong> {selectedRequest.user?.name} ({selectedRequest.user?.mobile})</Typography>
              <Typography variant="body1"><strong>Requested Amount:</strong> ₹{selectedRequest.amount}</Typography>
              <Typography variant="body1"><strong>Date:</strong> {new Date(selectedRequest.created_at || selectedRequest.transaction_date).toLocaleString()}</Typography>
              
              {selectedRequest.image && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" gutterBottom><strong>Payment Receipt:</strong></Typography>
                  <img 
                    src={`https://liveapi.sattalives.com/public/uploads/${selectedRequest.image}`} 
                    alt="Receipt" 
                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', border: '1px solid #ccc' }} 
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsRequestModalOpen(false)} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (selectedRequest) handleRejectRequest(selectedRequest);
            }} 
            color="error" 
            variant="contained"
          >
            Reject Request
          </Button>
          <Button 
            onClick={() => {
              if (selectedRequest) handleApproveRequest(selectedRequest);
            }} 
            color="success" 
            variant="contained"
          >
            Approve & Add Money
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddMoney;
