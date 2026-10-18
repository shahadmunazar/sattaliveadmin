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
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import Swal from 'sweetalert2';

interface User {
  id: number;
  name: string;
  mobile: string;
  balance?: string | number;
  deposit_balance?: string | number;
  winning_balance?: string | number;
}

interface AdminAddedMoneyRecord {
  id: number;
  user_id: number;
  user_name: string;
  user_mobile: string;
  amount: string;
  previous_balance: string;
  current_balance: string;
  available_balance?: string;
  user_live_balance?: string;
  user_deposit_balance?: string;
  user_winning_balance?: string;
  is_used?: boolean;
  can_delete?: boolean;
  user?: User;
  description: string;
  status: string;
  created_at: string;
  transaction_date: string;
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
  user_live_balance?: string;
  user_deposit_balance?: string;
  user_winning_balance?: string;
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshingUser, setRefreshingUser] = useState<boolean>(false);

  const refreshSelectedUser = async (userId: number) => {
    setRefreshingUser(true);
    try {
      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/user-details?id=${userId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (response.data && response.data.data) {
        setSelectedUser(response.data.data);
      }
    } catch (err) {
      console.error('Failed to refresh user live balance', err);
    } finally {
      setRefreshingUser(false);
    }
  };

  // Dedicated Admin Added Money Table state (Separate Table)
  const [addedMoneyRecords, setAddedMoneyRecords] = useState<AdminAddedMoneyRecord[]>([]);
  const [totalAddedAmount, setTotalAddedAmount] = useState<number | string>(0);
  const [currentAddedPage, setCurrentAddedPage] = useState<number>(1);
  const [totalAddedPages, setTotalAddedPages] = useState<number>(1);
  const [loadingAddedMoney, setLoadingAddedMoney] = useState<boolean>(false);

  // Delete Dialog state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<AdminAddedMoneyRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pending Deposit Requests state
  const [pendingRequests, setPendingRequests] = useState<MoneyRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MoneyRequest | null>(null);

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

  // Fetch dedicated Admin Added Money records (Separate Table)
  const fetchAddedMoneyRecords = async (page: number) => {
    setLoadingAddedMoney(true);
    try {
      let res;
      try {
        res = await axios.get(
          `https://liveapi.sattalives.com/api/admin/admin-added-money-list?page=${page}&per_page=${itemsPerPage}`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      } catch {
        // Fallback to all-money-added-list if endpoint not yet deployed
        res = await axios.get(
          `https://liveapi.sattalives.com/api/admin/all-money-added-list?page=${page}&per_page=${itemsPerPage}`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      }

      if (res && res.data) {
        setAddedMoneyRecords(res.data.data || []);
        if (res.data.pagination) {
          setTotalAddedPages(res.data.pagination.total_pages || 1);
        }
        if (res.data.total_added_amount !== undefined) {
          setTotalAddedAmount(res.data.total_added_amount);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin added money records', err);
    } finally {
      setLoadingAddedMoney(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get('https://liveapi.sattalives.com/api/admin/all-money-added-request', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      setPendingRequests(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch pending requests', err);
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

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = { mobile: selectedUser.mobile, amount: finalAmount };
      await axios.post('https://liveapi.sattalives.com/api/admin/add-money-to-users', payload, {
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `₹${finalAmount} successfully added to ${selectedUser.name}'s wallet.`,
        timer: 3000,
        showConfirmButton: false,
      });

      setSearchQuery('');
      setAmount(null);
      setCustomAmount('');
      if (selectedUser?.id) {
        refreshSelectedUser(selectedUser.id);
      }
      setSelectedUser(null);
      fetchAddedMoneyRecords(1);
      setCurrentAddedPage(1);
    } catch (err) {
      console.error('Failed to add money to user', err);
      let errMsg = 'Failed to add money to user. Please try again.';
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as { message?: string; error?: string };
        errMsg = data.message || data.error || errMsg;
      }
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddedPageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentAddedPage(value);
  };

  const handleApproveRequest = async (request: MoneyRequest) => {
    try {
      await axios.post(
        `https://liveapi.sattalives.com/api/admin/approve-add-money`,
        { id: request.id },
        { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }
      );
      fetchPendingRequests();
      fetchAddedMoneyRecords(currentAddedPage);
      setIsRequestModalOpen(false);
      Swal.fire('Approved!', `₹${request.amount} has been added to the user's wallet.`, 'success');
    } catch (err) {
      console.error('Failed to approve request', err);
      Swal.fire('Error', 'Failed to approve money request. Please try again.', 'error');
    }
  };

  const handleRejectRequest = async (request: MoneyRequest) => {
    try {
      await axios.post(
        `https://liveapi.sattalives.com/api/admin/reject-add-money`,
        { id: request.id },
        { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }
      );
      fetchPendingRequests();
      fetchAddedMoneyRecords(currentAddedPage);
      setIsRequestModalOpen(false);
      Swal.fire('Rejected', 'Money request was rejected.', 'info');
    } catch (err) {
      console.error('Failed to reject request', err);
      Swal.fire('Error', 'Failed to reject money request. Please try again.', 'error');
    }
  };

  const handleOpenDelete = (record: AdminAddedMoneyRecord) => {
    setDeleteId(record.id);
    setDeleteRecord(record);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `https://liveapi.sattalives.com/api/admin/delete-add-money?id=${deleteId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setIsDialogOpen(false);
      setDeleteId(null);
      setDeleteRecord(null);

      Swal.fire({
        icon: 'success',
        title: 'Deleted & Reverted',
        text: response.data?.message || 'Added money was successfully deleted and deducted from the user balance.',
        timer: 3000,
        showConfirmButton: false,
      });

      fetchAddedMoneyRecords(currentAddedPage);
    } catch (error) {
      console.error('Failed to delete added money', error);
      setIsDialogOpen(false);
      let errorMsg = 'Failed to delete added money. Please try again.';
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as { message?: string; error?: string };
        errorMsg = data.message || data.error || errorMsg;
      }
      Swal.fire({
        icon: 'error',
        title: 'Cannot Delete Record',
        text: errorMsg,
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isMoneyUsed = (record: AdminAddedMoneyRecord) => {
    return (
      record.is_used === true ||
      record.can_delete === false ||
      (record.user_deposit_balance !== undefined &&
        parseFloat(String(record.user_deposit_balance)) < parseFloat(String(record.amount))) ||
      (record.user_live_balance !== undefined &&
        parseFloat(String(record.user_live_balance)) < parseFloat(String(record.amount))) ||
      (record.current_balance !== undefined &&
        record.user_deposit_balance !== undefined &&
        parseFloat(String(record.user_deposit_balance)) < parseFloat(String(record.current_balance)))
    );
  };

  useEffect(() => {
    fetchAddedMoneyRecords(currentAddedPage);
  }, [currentAddedPage]);

  useEffect(() => {
    fetchPendingRequests();
    const intervalId = setInterval(() => {
      fetchPendingRequests();
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const pendingList = pendingRequests.filter(
    (req) =>
      req.confirm_payment === 'not_confirm' ||
      req.confirm_payment === 'pending' ||
      req.confirm_payment === 'not_approved' ||
      req.confirm_payment === 'not_accepted'
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' },
            lineHeight: 1.2,
            mb: 0.5,
          }}
        >
          Add Money to User
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Direct wallet credit, real-time balance tracking, and user deposit approval management
        </Typography>
      </Box>

      {/* Card 1: Add Money Form */}
      <Card sx={{ mb: { xs: 3, sm: 4 }, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' }, mb: 2 }}
          >
            Search User & Deposit Money
          </Typography>

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
            size="medium"
            sx={{ mb: 2 }}
            placeholder="Type user's mobile or name..."
          />

          {users.length > 0 && (
            <Box
              sx={{
                maxHeight: 220,
                overflowY: 'auto',
                mb: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                p: 1,
                bgcolor: 'background.paper',
              }}
            >
              {users.map((user) => (
                <Box
                  key={user.id}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1.5,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1,
                    mb: 0.5,
                    bgcolor: selectedUser?.id === user.id ? 'action.selected' : 'transparent',
                    border: selectedUser?.id === user.id ? '1px solid #1976d2' : '1px solid transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setSelectedUser(user)}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      📱 {user.mobile}
                    </Typography>
                  </Box>
                  <Chip
                    label={`Bal: ₹${user.balance ?? 0}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {selectedUser && (
            <Box
              sx={{
                mt: 2,
                p: { xs: 2, sm: 2.5 },
                bgcolor: 'background.default',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
              }}
            >
              {/* Selected User Header */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  mb: 2,
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                    👤 {selectedUser.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mobile: <strong>{selectedUser.mobile}</strong>
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => refreshSelectedUser(selectedUser.id)}
                  disabled={refreshingUser}
                  startIcon={refreshingUser ? <CircularProgress size={16} /> : null}
                  sx={{ py: { xs: 1, sm: 0.5 }, fontWeight: 600 }}
                >
                  {refreshingUser ? 'Checking...' : '🔄 Check Live Balance'}
                </Button>
              </Box>

              {/* Real-time Balances Responsive Summary Cards */}
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={4}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', fontWeight: 500 }}>
                      Total Live Balance
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.25 }}>
                      ₹{selectedUser.balance ?? '0.00'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      borderColor: 'info.main',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
                      Deposit Balance
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'info.main', mt: 0.25 }}>
                      ₹{selectedUser.deposit_balance ?? '0.00'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      borderColor: 'success.main',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
                      Winning Balance
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main', mt: 0.25 }}>
                      ₹{selectedUser.winning_balance ?? '0.00'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Quick Amount Selection */}
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Select Quick Amount:
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(4, 1fr)', sm: 'repeat(7, 1fr)' },
                  gap: 1,
                  mb: 2,
                }}
              >
                {[100, 200, 300, 500, 1000, 2000, 5000].map((value) => (
                  <Button
                    key={value}
                    size="small"
                    variant={amount === value ? 'contained' : 'outlined'}
                    sx={{
                      minWidth: 0,
                      py: 1,
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    }}
                    onClick={() => {
                      setAmount(value);
                      setCustomAmount('');
                    }}
                  >
                    ₹{value}
                  </Button>
                ))}
              </Box>

              <TextField
                type="number"
                label="Or Enter Custom Amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount(null);
                }}
                placeholder="Enter amount (e.g. 250)"
                fullWidth
                size="medium"
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={addMoneyToUser}
                disabled={(!amount && !customAmount) || isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                fullWidth
                sx={{ py: 1.4, fontWeight: 'bold', fontSize: '1rem' }}
              >
                {isSubmitting ? 'Adding Money...' : `Add Money (₹${amount || customAmount || 0})`}
              </Button>
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>

      {/* Card 2: Dedicated Admin Added Money History */}
      <Card sx={{ mb: { xs: 3, sm: 4 }, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                Admin Added Money History
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Direct administrator credits (soft delete enabled if unused)
              </Typography>
            </Box>
            {totalAddedAmount ? (
              <Chip
                label={`Total Added: ₹${totalAddedAmount}`}
                color="success"
                variant="filled"
                sx={{ fontWeight: 'bold', alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            ) : null}
          </Box>

          {/* Desktop Table View (>= md screens) */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
              <Table sx={{ minWidth: 850 }}>
                <TableHead sx={{ '& th': { bgcolor: 'action.hover', fontWeight: 'bold' } }}>
                  <TableRow>
                    <TableCell>User Name</TableCell>
                    <TableCell>User Mobile</TableCell>
                    <TableCell>Added Amount</TableCell>
                    <TableCell>Previous Bal</TableCell>
                    <TableCell>Bal After Credit</TableCell>
                    <TableCell>Current Live Balance</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingAddedMoney ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : addedMoneyRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        No added money records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    addedMoneyRecords.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{record.user_name}</TableCell>
                        <TableCell>{record.user_mobile}</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                          +₹{record.amount}
                        </TableCell>
                        <TableCell>₹{record.previous_balance ?? '0.00'}</TableCell>
                        <TableCell>₹{record.current_balance ?? record.available_balance ?? '0.00'}</TableCell>
                        <TableCell>
                          <Chip
                            label={`₹${record.user_live_balance ?? record.user?.balance ?? record.current_balance ?? '0.00'}`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>{new Date(record.created_at || record.transaction_date).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.status || 'Completed'}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {isMoneyUsed(record) ? (
                            <Chip
                              label="Used (Locked)"
                              size="small"
                              variant="outlined"
                              sx={{ color: 'text.secondary', borderColor: '#ccc', fontSize: '0.75rem' }}
                            />
                          ) : (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleOpenDelete(record)}
                            >
                              Delete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile Optimized Card View (< md screens) */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {loadingAddedMoney ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : addedMoneyRecords.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No added money records found.
              </Box>
            ) : (
              addedMoneyRecords.map((record) => (
                <Paper
                  key={record.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {record.user_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        📱 {record.user_mobile}
                      </Typography>
                    </Box>
                    <Chip
                      label={`+₹${record.amount}`}
                      color="success"
                      sx={{ fontWeight: 800, fontSize: '0.95rem' }}
                    />
                  </Box>

                  <Divider />

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 1,
                      bgcolor: 'action.hover',
                      p: 1.5,
                      borderRadius: 1.5,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Live User Bal:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ₹{record.user_live_balance ?? record.user?.balance ?? record.current_balance ?? '0.00'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Deposit Bal:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'info.main' }}>
                        ₹{record.user_deposit_balance ?? '0.00'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Previous Bal:
                      </Typography>
                      <Typography variant="body2">
                        ₹{record.previous_balance ?? '0.00'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Bal After Credit:
                      </Typography>
                      <Typography variant="body2">
                        ₹{record.current_balance ?? record.available_balance ?? '0.00'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 0.5,
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        📅 {new Date(record.created_at || record.transaction_date).toLocaleString()}
                      </Typography>
                      <Chip
                        label={record.status || 'Completed'}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }}
                      />
                    </Box>

                    <Box>
                      {isMoneyUsed(record) ? (
                        <Chip
                          label="Used (Locked)"
                          size="small"
                          variant="outlined"
                          sx={{ color: 'text.secondary', borderColor: '#ccc', fontSize: '0.75rem' }}
                        />
                      ) : (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleOpenDelete(record)}
                        >
                          Delete
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))
            )}
          </Box>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalAddedPages}
              page={currentAddedPage}
              onChange={handleAddedPageChange}
              color="primary"
              size="medium"
              siblingCount={0}
              sx={{
                '& .MuiPaginationItem-root': {
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Card 3: Pending Deposit Requests */}
      <Card sx={{ mb: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                Pending Deposit Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User uploaded UPI/payment screenshots requiring manual review & approval
              </Typography>
            </Box>
            <Chip
              label={`${pendingList.length} Pending`}
              color={pendingList.length > 0 ? 'warning' : 'default'}
              variant="filled"
              sx={{ fontWeight: 'bold', alignSelf: { xs: 'flex-start', sm: 'center' } }}
            />
          </Box>

          {/* Desktop Table View (>= md screens) */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
              <Table sx={{ minWidth: 750 }}>
                <TableHead sx={{ '& th': { bgcolor: 'action.hover', fontWeight: 'bold' } }}>
                  <TableRow>
                    <TableCell>User Name</TableCell>
                    <TableCell>User Mobile</TableCell>
                    <TableCell>Requested Amount</TableCell>
                    <TableCell>Current Live Balance</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        No pending requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingList.map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{request.user?.name}</TableCell>
                        <TableCell>{request.user?.mobile}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>₹{request.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={`₹${request.user_live_balance ?? request.user?.balance ?? request.available_balance ?? '0.00'}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>{new Date(request.created_at || request.transaction_date).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip label={request.confirm_payment} size="small" color="warning" />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
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

          {/* Mobile Optimized Card View (< md screens) */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {pendingList.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No pending requests found.
              </Box>
            ) : (
              pendingList.map((request) => (
                <Paper
                  key={request.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {request.user?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        📱 {request.user?.mobile}
                      </Typography>
                    </Box>
                    <Chip
                      label={`₹${request.amount}`}
                      color="warning"
                      sx={{ fontWeight: 800, fontSize: '0.95rem' }}
                    />
                  </Box>

                  <Divider />

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'action.hover',
                      p: 1.25,
                      borderRadius: 1.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Current User Balance:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ₹{request.user_live_balance ?? request.user?.balance ?? request.available_balance ?? '0.00'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      📅 {new Date(request.created_at || request.transaction_date).toLocaleString()}
                    </Typography>
                    <Chip label={request.confirm_payment} size="small" color="warning" sx={{ height: 22 }} />
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="medium"
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsRequestModalOpen(true);
                    }}
                    sx={{ mt: 0.5, fontWeight: 600 }}
                  >
                    View & Process Request
                  </Button>
                </Paper>
              ))
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => !isDeleting && setIsDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { m: { xs: 2, sm: 3 }, borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main', pb: 1 }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1.5 }}>
            Are you sure you want to delete this added money record?
          </DialogContentText>
          {deleteRecord && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1.5 }}>
              <Typography variant="body2">
                <strong>User:</strong> {deleteRecord.user_name} ({deleteRecord.user_mobile})
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>Amount:</strong> ₹{deleteRecord.amount}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                * Note: Record will be soft-deleted. The amount can ONLY be deleted if the user has not yet spent or used it.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 2.5 },
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            gap: 1,
          }}
        >
          <Button
            onClick={() => setIsDialogOpen(false)}
            color="inherit"
            disabled={isDeleting}
            fullWidth
            sx={{ m: 0 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
            fullWidth
            sx={{ m: 0 }}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View/Process Request Modal */}
      <Dialog
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { m: { xs: 1.5, sm: 3 }, borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Process Payment Request
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>User:</strong> {selectedRequest.user?.name} ({selectedRequest.user?.mobile})
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Requested Amount:</strong> ₹{selectedRequest.amount}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(selectedRequest.created_at || selectedRequest.transaction_date).toLocaleString()}
                </Typography>
              </Box>

              {selectedRequest.image && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Payment Receipt / Screenshot:
                  </Typography>
                  <img
                    src={`https://liveapi.sattalives.com/public/uploads/${selectedRequest.image}`}
                    alt="Receipt"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '380px',
                      objectFit: 'contain',
                      border: '1px solid #ccc',
                      borderRadius: 8,
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 2.5 },
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            gap: 1,
          }}
        >
          <Button
            onClick={() => setIsRequestModalOpen(false)}
            color="inherit"
            variant="outlined"
            fullWidth
            sx={{ m: 0 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedRequest) handleRejectRequest(selectedRequest);
            }}
            color="error"
            variant="contained"
            fullWidth
            sx={{ m: 0 }}
          >
            Reject Request
          </Button>
          <Button
            onClick={() => {
              if (selectedRequest) handleApproveRequest(selectedRequest);
            }}
            color="success"
            variant="contained"
            fullWidth
            sx={{ m: 0 }}
          >
            Approve & Add Money
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddMoney;
