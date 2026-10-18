/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Pagination,
  Chip,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import Swal from "sweetalert2";

interface DeletedCounts {
  users: number;
  games: number;
  admin_money: number;
  add_money_requests: number;
  withdrawals: number;
}

interface DeletedUser {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  balance?: string | number;
  deposit_balance?: string | number;
  winning_balance?: string | number;
  deleted_at: string;
  transactions_count?: number;
  play_games_count?: number;
  withdrawals_count?: number;
}

interface DeletedGame {
  id: number;
  user_id: number;
  user_name?: string;
  Playing_Name?: string;
  play_type?: string;
  entered_number?: string;
  entered_amount?: number | string;
  deleted_at: string;
  user?: {
    id: number;
    name: string;
    mobile: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

interface DeletedAdminMoney {
  id: number;
  user_id: number;
  admin_id: number;
  amount: number | string;
  previous_balance: number | string;
  current_balance: number | string;
  reason?: string;
  deleted_at: string;
  user?: {
    id: number;
    name: string;
    mobile: string;
  };
  admin?: {
    id: number;
    name: string;
  };
}

interface DeletedRequest {
  id: number;
  user_id: number;
  amount: number | string;
  payment_method?: string;
  status?: string;
  deleted_at: string;
  user?: {
    id: number;
    name: string;
    mobile: string;
  };
}

interface DeletedWithdrawal {
  id: number;
  user_id: number;
  amount: number | string;
  status?: string;
  account_number?: string;
  ifsc?: string;
  deleted_at: string;
  user?: {
    id: number;
    name: string;
    mobile: string;
  };
}

type RecordType = "users" | "games" | "admin_money" | "add_money_requests" | "withdrawals";

const DeletedRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RecordType>("users");
  const [counts, setCounts] = useState<DeletedCounts>({
    users: 0,
    games: 0,
    admin_money: 0,
    add_money_requests: 0,
    withdrawals: 0,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Tab Data
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [games, setGames] = useState<DeletedGame[]>([]);
  const [adminMoney, setAdminMoney] = useState<DeletedAdminMoney[]>([]);
  const [requests, setRequests] = useState<DeletedRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<DeletedWithdrawal[]>([]);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const getToken = (): string => localStorage.getItem("authToken") || "";

  const fetchRecords = useCallback(
    async (type: RecordType, pageNum: number, search: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `https://liveapi.sattalives.com/api/admin/deleted-records?type=${type}&page=${pageNum}&per_page=15&search=${encodeURIComponent(
            search
          )}`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );

        if (response.data.status === "success") {
          setCounts(response.data.counts);
          setTotalPages(response.data.pagination?.total_pages || 1);
          setTotalItems(response.data.pagination?.total_items || 0);

          if (type === "users") {
            setUsers(response.data.data);
          } else if (type === "games") {
            setGames(response.data.data);
          } else if (type === "admin_money") {
            setAdminMoney(response.data.data);
          } else if (type === "add_money_requests") {
            setRequests(response.data.data);
          } else if (type === "withdrawals") {
            setWithdrawals(response.data.data);
          }
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Failed to load deleted records. Please check your connection.");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRecords(activeTab, page, searchQuery);
  }, [activeTab, page, fetchRecords]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: RecordType) => {
    setActiveTab(newValue);
    setPage(1);
    setSearchQuery("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords(activeTab, 1, searchQuery);
  };

  const handleRestore = async (type: string, id: number, label: string) => {
    const result = await Swal.fire({
      title: "Restore this record?",
      text: `Are you sure you want to restore ${label}? It will be reactivated immediately.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Restore it!",
    });

    if (result.isConfirmed) {
      setActionLoading(id);
      try {
        const response = await axios.post(
          "https://liveapi.sattalives.com/api/admin/restore-record",
          { type, id },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        if (response.data.status === 200) {
          Swal.fire({
            icon: "success",
            title: "Restored!",
            text: response.data.message || "Record successfully restored.",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchRecords(activeTab, page, searchQuery);
        }
      } catch (err) {
        let msg = "Failed to restore record.";
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          msg = err.response.data.message;
        }
        Swal.fire({
          icon: "error",
          title: "Restore Failed",
          text: msg,
        });
      } finally {
        setActionLoading(null);
      }
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Recycle Bin & Deleted Records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse all soft-deleted records across Users, Games, and Money transactions. You can restore any record without any historical data loss.
        </Typography>
      </Box>

      {/* Top Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              cursor: "pointer",
              border: activeTab === "users" ? "2px solid #1976d2" : "1px solid #e0e0e0",
              bgcolor: activeTab === "users" ? "action.selected" : "background.paper",
            }}
            onClick={() => handleTabChange({} as React.SyntheticEvent, "users")}
          >
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "error.main" }}>
                {counts.users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deleted Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              cursor: "pointer",
              border: activeTab === "games" ? "2px solid #1976d2" : "1px solid #e0e0e0",
              bgcolor: activeTab === "games" ? "action.selected" : "background.paper",
            }}
            onClick={() => handleTabChange({} as React.SyntheticEvent, "games")}
          >
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "warning.main" }}>
                {counts.games}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deleted Games
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              cursor: "pointer",
              border: activeTab === "admin_money" ? "2px solid #1976d2" : "1px solid #e0e0e0",
              bgcolor: activeTab === "admin_money" ? "action.selected" : "background.paper",
            }}
            onClick={() => handleTabChange({} as React.SyntheticEvent, "admin_money")}
          >
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "info.main" }}>
                {counts.admin_money}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deleted Added Money
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              cursor: "pointer",
              border: activeTab === "add_money_requests" ? "2px solid #1976d2" : "1px solid #e0e0e0",
              bgcolor: activeTab === "add_money_requests" ? "action.selected" : "background.paper",
            }}
            onClick={() => handleTabChange({} as React.SyntheticEvent, "add_money_requests")}
          >
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                {counts.add_money_requests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deleted Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              cursor: "pointer",
              border: activeTab === "withdrawals" ? "2px solid #1976d2" : "1px solid #e0e0e0",
              bgcolor: activeTab === "withdrawals" ? "action.selected" : "background.paper",
            }}
            onClick={() => handleTabChange({} as React.SyntheticEvent, "withdrawals")}
          >
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "text.primary" }}>
                {counts.withdrawals}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deleted Withdrawals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Container Card */}
      <Card sx={{ boxShadow: 2 }}>
        <CardContent>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={`Deleted Users (${counts.users})`} value="users" />
              <Tab label={`Deleted Games (${counts.games})`} value="games" />
              <Tab label={`Deleted Added Money (${counts.admin_money})`} value="admin_money" />
              <Tab label={`Deleted Requests (${counts.add_money_requests})`} value="add_money_requests" />
              <Tab label={`Deleted Withdrawals (${counts.withdrawals})`} value="withdrawals" />
            </Tabs>
          </Box>

          {/* Search Bar */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}
          >
            <TextField
              size="small"
              placeholder={`Search deleted ${activeTab.replace("_", " ")}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: 400 }}
            />
            <Button variant="contained" type="submit" size="medium">
              Search
            </Button>
            {searchQuery && (
              <Button
                variant="outlined"
                color="secondary"
                size="medium"
                onClick={() => {
                  setSearchQuery("");
                  fetchRecords(activeTab, 1, "");
                }}
              >
                Clear
              </Button>
            )}
            <Button
              variant="outlined"
              size="medium"
              onClick={() => fetchRecords(activeTab, page, searchQuery)}
            >
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Table for Deleted Users */}
              {activeTab === "users" && (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>User Name</strong></TableCell>
                        <TableCell><strong>Mobile</strong></TableCell>
                        <TableCell><strong>Preserved Data</strong></TableCell>
                        <TableCell><strong>Deleted At</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No deleted users found.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => (
                          <TableRow key={u.id} hover>
                            <TableCell>#{u.id}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                            <TableCell>{u.mobile}</TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                <Chip
                                  size="small"
                                  label={`${u.transactions_count ?? 0} Txns`}
                                  variant="outlined"
                                  color="info"
                                />
                                <Chip
                                  size="small"
                                  label={`${u.play_games_count ?? 0} Bets`}
                                  variant="outlined"
                                  color="warning"
                                />
                                <Chip
                                  size="small"
                                  label={`${u.withdrawals_count ?? 0} W/D`}
                                  variant="outlined"
                                  color="default"
                                />
                              </Box>
                            </TableCell>
                            <TableCell>{formatDate(u.deleted_at)}</TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disabled={actionLoading === u.id}
                                onClick={() => handleRestore("user", u.id, `User "${u.name}"`)}
                              >
                                {actionLoading === u.id ? "Restoring..." : "Restore User"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Table for Deleted Games */}
              {activeTab === "games" && (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>User</strong></TableCell>
                        <TableCell><strong>Category / Game</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Entered No.</strong></TableCell>
                        <TableCell><strong>Amount</strong></TableCell>
                        <TableCell><strong>Deleted At</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {games.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No deleted games found.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        games.map((g) => (
                          <TableRow key={g.id} hover>
                            <TableCell>#{g.id}</TableCell>
                            <TableCell>
                              {g.user ? (
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {g.user.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {g.user.mobile}
                                  </Typography>
                                </>
                              ) : (
                                g.user_name || "N/A"
                              )}
                            </TableCell>
                            <TableCell>{g.category?.name || g.Playing_Name || "N/A"}</TableCell>
                            <TableCell>
                              <Chip size="small" label={g.play_type || "Standard"} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{g.entered_number ?? "N/A"}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                              ₹{g.entered_amount}
                            </TableCell>
                            <TableCell>{formatDate(g.deleted_at)}</TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disabled={actionLoading === g.id}
                                onClick={() => handleRestore("game", g.id, `Game #${g.id}`)}
                              >
                                {actionLoading === g.id ? "Restoring..." : "Restore"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Table for Deleted Admin Added Money */}
              {activeTab === "admin_money" && (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>User</strong></TableCell>
                        <TableCell><strong>Amount</strong></TableCell>
                        <TableCell><strong>Balance Shift</strong></TableCell>
                        <TableCell><strong>Reason / Note</strong></TableCell>
                        <TableCell><strong>Deleted At</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adminMoney.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No deleted admin money records found.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        adminMoney.map((m) => (
                          <TableRow key={m.id} hover>
                            <TableCell>#{m.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {m.user?.name || `User #${m.user_id}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {m.user?.mobile || ""}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: "success.main" }}>
                              ₹{m.amount}
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                ₹{m.previous_balance} → ₹{m.current_balance}
                              </Typography>
                            </TableCell>
                            <TableCell>{m.reason || "Admin Added Money"}</TableCell>
                            <TableCell>{formatDate(m.deleted_at)}</TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disabled={actionLoading === m.id}
                                onClick={() => handleRestore("admin_money", m.id, `Added Money Record #${m.id}`)}
                              >
                                {actionLoading === m.id ? "Restoring..." : "Restore"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Table for Deleted Deposit Requests */}
              {activeTab === "add_money_requests" && (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>User</strong></TableCell>
                        <TableCell><strong>Amount</strong></TableCell>
                        <TableCell><strong>Payment Method</strong></TableCell>
                        <TableCell><strong>Deleted At</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No deleted deposit requests found.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        requests.map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell>#{r.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {r.user?.name || `User #${r.user_id}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {r.user?.mobile || ""}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                              ₹{r.amount}
                            </TableCell>
                            <TableCell>{r.payment_method || "Online / QR"}</TableCell>
                            <TableCell>{formatDate(r.deleted_at)}</TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disabled={actionLoading === r.id}
                                onClick={() => handleRestore("add_money_request", r.id, `Deposit Request #${r.id}`)}
                              >
                                {actionLoading === r.id ? "Restoring..." : "Restore"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Table for Deleted Withdrawals */}
              {activeTab === "withdrawals" && (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>User</strong></TableCell>
                        <TableCell><strong>Amount</strong></TableCell>
                        <TableCell><strong>Account / IFSC</strong></TableCell>
                        <TableCell><strong>Deleted At</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {withdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No deleted withdrawals found.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals.map((w) => (
                          <TableRow key={w.id} hover>
                            <TableCell>#{w.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {w.user?.name || `User #${w.user_id}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {w.user?.mobile || ""}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: "error.main" }}>
                              ₹{w.amount}
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {w.account_number ? `A/C: ${w.account_number}` : ""} {w.ifsc ? `(${w.ifsc})` : ""}
                              </Typography>
                            </TableCell>
                            <TableCell>{formatDate(w.deleted_at)}</TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disabled={actionLoading === w.id}
                                onClick={() => handleRestore("withdrawal", w.id, `Withdrawal #${w.id}`)}
                              >
                                {actionLoading === w.id ? "Restoring..." : "Restore"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total: {totalItems} records
                  </Typography>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_e, val) => setPage(val)}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DeletedRecords;
