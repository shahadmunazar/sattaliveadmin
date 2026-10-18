/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  TextField,
  TablePagination,
  TableSortLabel,
  Tooltip,
  Switch,
  FormControlLabel,
  InputAdornment,
} from "@mui/material";

interface AuditLogItem {
  id: number;
  user_id: number | null;
  user_name: string;
  user_mobile: string;
  event: string;
  model: string;
  auditable_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

type OrderDirection = "asc" | "desc";

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Yajra DataTables toggle mode
  const [useYajraServerSide, setUseYajraServerSide] = useState<boolean>(false);
  const [yajraTotalRecords, setYajraTotalRecords] = useState<number>(0);

  // Filters & Search
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");

  // Sorting
  const [orderBy, setOrderBy] = useState<keyof AuditLogItem>("id");
  const [order, setOrder] = useState<OrderDirection>("desc");

  // Pagination (0-indexed for MUI TablePagination)
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  // Detail Dialog
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const getToken = (): string => localStorage.getItem("authToken") || "";

  // Fetch logic: by default fetch all, or query Yajra server-side
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (useYajraServerSide) {
        // Yajra DataTables protocol parameters
        params.append("datatable", "1");
        params.append("draw", (page + 1).toString());
        params.append("start", (page * rowsPerPage).toString());
        params.append("length", rowsPerPage.toString());
        if (globalSearch) params.append("search[value]", globalSearch);
        if (eventFilter) params.append("event", eventFilter);
        if (modelFilter) params.append("model", modelFilter);
      } else {
        // By default fetch all records into client DataTable
        params.append("all", "true");
        if (eventFilter) params.append("event", eventFilter);
        if (modelFilter) params.append("model", modelFilter);
      }

      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/audit-logs?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      if (useYajraServerSide) {
        // Parse Yajra DataTables response structure: { draw, recordsTotal, recordsFiltered, data }
        if (response.data && Array.isArray(response.data.data)) {
          const mappedLogs: AuditLogItem[] = response.data.data.map((item: Record<string, unknown>) => ({
            id: Number(item.id),
            user_id: item.user_id ? Number(item.user_id) : null,
            user_name: String(item.user_name || "System/Admin"),
            user_mobile: String(item.user_mobile || "N/A"),
            event: String(item.event || "updated"),
            model: String(item.model || "Audit"),
            auditable_id: Number(item.auditable_id || 0),
            old_values: (item.old_values as Record<string, unknown>) || null,
            new_values: (item.new_values as Record<string, unknown>) || null,
            url: item.url ? String(item.url) : null,
            ip_address: item.ip_address ? String(item.ip_address) : null,
            user_agent: item.user_agent ? String(item.user_agent) : null,
            created_at: String(item.created_at || ""),
          }));
          setLogs(mappedLogs);
          setYajraTotalRecords(response.data.recordsFiltered ?? response.data.recordsTotal ?? 0);
        }
      } else {
        // Standard full list
        if (response.data.status === "success" && Array.isArray(response.data.data)) {
          setLogs(response.data.data);
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to load audit logs. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [useYajraServerSide, page, rowsPerPage, globalSearch, eventFilter, modelFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleOpenDetail = (log: AuditLogItem) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedLog(null);
    setIsDetailOpen(false);
  };

  const handleSort = (property: keyof AuditLogItem) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const getEventBadge = (event: string) => {
    switch (event.toLowerCase()) {
      case "created":
        return <Chip label="CREATED" size="small" color="success" sx={{ fontWeight: 600 }} />;
      case "updated":
        return <Chip label="UPDATED" size="small" color="primary" sx={{ fontWeight: 600 }} />;
      case "deleted":
        return <Chip label="DELETED" size="small" color="error" sx={{ fontWeight: 600 }} />;
      case "restored":
        return <Chip label="RESTORED" size="small" color="warning" sx={{ fontWeight: 600 }} />;
      default:
        return <Chip label={event.toUpperCase()} size="small" color="default" sx={{ fontWeight: 600 }} />;
    }
  };

  const getChangedKeys = (oldVals: Record<string, unknown> | null, newVals: Record<string, unknown> | null): string[] => {
    const keys = new Set<string>();
    if (oldVals) Object.keys(oldVals).forEach((k) => keys.add(k));
    if (newVals) Object.keys(newVals).forEach((k) => keys.add(k));
    return Array.from(keys);
  };

  const renderValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  // Client-side filtering and sorting when in "fetch all by default" mode
  const filteredAndSortedLogs = useMemo(() => {
    if (useYajraServerSide) {
      return logs;
    }

    let list = [...logs];

    // Global Search filter
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      list = list.filter((item) => {
        const idMatch = item.id.toString().includes(q);
        const nameMatch = item.user_name.toLowerCase().includes(q);
        const mobileMatch = item.user_mobile.toLowerCase().includes(q);
        const modelMatch = item.model.toLowerCase().includes(q);
        const eventMatch = item.event.toLowerCase().includes(q);
        const ipMatch = (item.ip_address || "").toLowerCase().includes(q);
        const urlMatch = (item.url || "").toLowerCase().includes(q);
        const keysMatch = getChangedKeys(item.old_values, item.new_values).some((k) => k.toLowerCase().includes(q));
        return idMatch || nameMatch || mobileMatch || modelMatch || eventMatch || ipMatch || urlMatch || keysMatch;
      });
    }

    // Action Filter
    if (eventFilter) {
      list = list.filter((item) => item.event.toLowerCase() === eventFilter.toLowerCase());
    }

    // Model Filter
    if (modelFilter) {
      list = list.filter((item) => item.model.toLowerCase().includes(modelFilter.toLowerCase()));
    }

    // Sort
    list.sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }

      return order === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return list;
  }, [logs, useYajraServerSide, globalSearch, eventFilter, modelFilter, orderBy, order]);

  // Paginated slice when in client-side all mode
  const displayedLogs = useMemo(() => {
    if (useYajraServerSide) {
      return logs;
    }
    if (rowsPerPage === -1) {
      return filteredAndSortedLogs;
    }
    const start = page * rowsPerPage;
    return filteredAndSortedLogs.slice(start, start + rowsPerPage);
  }, [filteredAndSortedLogs, logs, useYajraServerSide, page, rowsPerPage]);

  const totalRecordCount = useYajraServerSide ? yajraTotalRecords : filteredAndSortedLogs.length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Audit Logs & Activity Trail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Full accountability log powered by Laravel Auditing and Yajra DataTables. By default, all records are loaded with real-time search, sorting, and diff inspection.
          </Typography>
        </Box>

        {/* Engine Switcher */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "background.paper", p: 1, borderRadius: 2, border: "1px solid #e0e0e0" }}>
          <FormControlLabel
            control={
              <Switch
                checked={useYajraServerSide}
                onChange={(e) => {
                  setUseYajraServerSide(e.target.checked);
                  setPage(0);
                }}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {useYajraServerSide ? "Yajra Server-Side DataTable" : "All Records Loaded (Default)"}
              </Typography>
            }
          />
          <Chip
            size="small"
            label={useYajraServerSide ? "Yajra Engine" : "Full Cache"}
            color={useYajraServerSide ? "secondary" : "success"}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Main Container Card */}
      <Card sx={{ boxShadow: 2 }}>
        <CardContent>
          {/* DataTable Search & Filter Controls */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search across all columns (Action, User, Entity, IP, Keys)..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setPage(0);
              }}
              sx={{ flexGrow: 1, minWidth: 260 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    🔍
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="event-filter-label">Action</InputLabel>
              <Select
                labelId="event-filter-label"
                value={eventFilter}
                label="Action"
                onChange={(e) => {
                  setEventFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="created">Created</MenuItem>
                <MenuItem value="updated">Updated</MenuItem>
                <MenuItem value="deleted">Deleted</MenuItem>
                <MenuItem value="restored">Restored</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="model-filter-label">Entity Model</InputLabel>
              <Select
                labelId="model-filter-label"
                value={modelFilter}
                label="Entity Model"
                onChange={(e) => {
                  setModelFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Entities</MenuItem>
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="PlayGame">PlayGame (Bet)</MenuItem>
                <MenuItem value="AdminAddedMoney">AdminAddedMoney</MenuItem>
                <MenuItem value="AddMoneyRequest">AddMoneyRequest</MenuItem>
                <MenuItem value="WithdrawalMoney">WithdrawalMoney</MenuItem>
                <MenuItem value="Transaction">Transaction</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              size="medium"
              onClick={() => {
                setGlobalSearch("");
                setEventFilter("");
                setModelFilter("");
                setPage(0);
              }}
            >
              Reset
            </Button>

            <Button variant="contained" size="medium" onClick={fetchLogs}>
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Yajra-styled Interactive DataTable */}
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === "id"}
                          direction={orderBy === "id" ? order : "asc"}
                          onClick={() => handleSort("id")}
                        >
                          <strong>ID</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === "event"}
                          direction={orderBy === "event" ? order : "asc"}
                          onClick={() => handleSort("event")}
                        >
                          <strong>Action</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === "user_name"}
                          direction={orderBy === "user_name" ? order : "asc"}
                          onClick={() => handleSort("user_name")}
                        >
                          <strong>Performed By</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === "model"}
                          direction={orderBy === "model" ? order : "asc"}
                          onClick={() => handleSort("model")}
                        >
                          <strong>Target Entity</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell><strong>Modified Fields</strong></TableCell>
                      <TableCell><strong>IP & Route</strong></TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === "created_at"}
                          direction={orderBy === "created_at" ? order : "asc"}
                          onClick={() => handleSort("created_at")}
                        >
                          <strong>Timestamp</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center"><strong>Inspect</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No matching audit records found.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedLogs.map((log) => {
                        const changedKeys = getChangedKeys(log.old_values, log.new_values);
                        return (
                          <TableRow key={log.id} hover>
                            <TableCell>#{log.id}</TableCell>
                            <TableCell>{getEventBadge(log.event)}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {log.user_name}
                              </Typography>
                              {log.user_mobile && log.user_mobile !== "N/A" && (
                                <Typography variant="caption" color="text.secondary">
                                  {log.user_mobile}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={`${log.model} #${log.auditable_id}`}
                                variant="outlined"
                                color="info"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", maxWidth: 220 }}>
                                {changedKeys.length === 0 ? (
                                  <Typography variant="caption" color="text.secondary">
                                    No value diff
                                  </Typography>
                                ) : (
                                  changedKeys.slice(0, 3).map((k) => (
                                    <Chip key={k} label={k} size="small" variant="filled" sx={{ fontSize: "0.7rem" }} />
                                  ))
                                )}
                                {changedKeys.length > 3 && (
                                  <Tooltip title={changedKeys.slice(3).join(", ")}>
                                    <Chip
                                      label={`+${changedKeys.length - 3}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: "0.7rem" }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" display="block" sx={{ fontFamily: "monospace" }}>
                                {log.ip_address || "127.0.0.1"}
                              </Typography>
                              {log.url && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: "block",
                                    maxWidth: 160,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={log.url}
                                >
                                  {log.url.replace(/^https?:\/\/[^/]+/, "")}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{log.created_at}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleOpenDetail(log)}
                              >
                                View Diff
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Yajra DataTable Pagination Controls */}
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100, { label: "All", value: -1 }]}
                component="div"
                count={totalRecordCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Entries per page:"
                showFirstButton
                showLastButton
                sx={{ borderTop: "1px solid #e0e0e0", mt: 1 }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Changes Comparison Detail Dialog */}
      <Dialog
        open={isDetailOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: "bold" }}>
              Audit Log Details #{selectedLog?.id}
            </Typography>
            {selectedLog && (
              <Box sx={{ mt: 0.5, display: "flex", gap: 1, alignItems: "center" }}>
                {getEventBadge(selectedLog.event)}
                <Chip
                  size="small"
                  label={`${selectedLog.model} #${selectedLog.auditable_id}`}
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
          <IconButton onClick={handleCloseDetail} size="small">
            ✕
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box>
              {/* Metadata Box */}
              <Grid container spacing={2} sx={{ mb: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Performed By
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedLog.user_name} ({selectedLog.user_mobile || "System"})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Timestamp
                  </Typography>
                  <Typography variant="body2">
                    {selectedLog.created_at}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    IP Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {selectedLog.ip_address || "127.0.0.1"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Request URL
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {selectedLog.url || "N/A"}
                  </Typography>
                </Grid>
                {selectedLog.user_agent && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Client User Agent
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                      {selectedLog.user_agent}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Differential Comparison Table */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Field Differences (Old vs New)
              </Typography>
              {getChangedKeys(selectedLog.old_values, selectedLog.new_values).length === 0 ? (
                <Alert severity="info">No differential attributes recorded for this event.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell sx={{ width: "30%" }}><strong>Field / Attribute</strong></TableCell>
                        <TableCell sx={{ width: "35%", bgcolor: "#ffebee" }}><strong>Old Value (Previous)</strong></TableCell>
                        <TableCell sx={{ width: "35%", bgcolor: "#e8f5e9" }}><strong>New Value (Updated)</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getChangedKeys(selectedLog.old_values, selectedLog.new_values).map((key) => {
                        const oldVal = selectedLog.old_values ? selectedLog.old_values[key] : undefined;
                        const newVal = selectedLog.new_values ? selectedLog.new_values[key] : undefined;
                        return (
                          <TableRow key={key} hover>
                            <TableCell sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                              {key}
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#fff5f5", color: "error.dark", wordBreak: "break-all" }}>
                              {renderValue(oldVal)}
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#f6fff6", color: "success.dark", wordBreak: "break-all" }}>
                              {renderValue(newVal)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogs;
