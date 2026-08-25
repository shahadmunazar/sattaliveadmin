import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';

const AppSettings: React.FC = () => {
  const [appVersion, setAppVersion] = useState<string>('');
  const [updateUrl, setUpdateUrl] = useState<string>('');
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getToken = (): string => localStorage.getItem('authToken') || '';

  const GET_SETTINGS_ENDPOINT = 'https://liveapi.sattalives.com/api/app-settings';
  const UPDATE_VERSION_ENDPOINT = 'https://liveapi.sattalives.com/api/admin/update-app-version';

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(GET_SETTINGS_ENDPOINT, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      
      if (response.data && response.data.data) {
        setAppVersion(response.data.data.app_version || '1.0.0');
        setUpdateUrl(response.data.data.update_url || '');
        
        // Handle boolean parsing if backend returns string like 'true'/'false'
        const isForce = response.data.data.force_update;
        setForceUpdate(isForce === true || isForce === 'true' || isForce === 1);
      }
    } catch (err) {
      console.error('Failed to fetch app settings', err);
      setMessage({ type: 'error', text: 'Failed to fetch the current app settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!appVersion.trim()) {
      setMessage({ type: 'error', text: 'App Version cannot be empty.' });
      return;
    }
    if (!updateUrl.trim()) {
      setMessage({ type: 'error', text: 'Update URL cannot be empty.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await axios.post(UPDATE_VERSION_ENDPOINT, {
        app_version: appVersion,
        update_url: updateUrl,
        force_update: forceUpdate ? 1 : 0, // Backend might prefer integer or boolean depending on validation
      }, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      setMessage({ type: 'success', text: 'App settings updated successfully!' });
      
      // Refresh the current settings
      fetchSettings();
    } catch (err) {
      console.error('Update failed', err);
      setMessage({ type: 'error', text: 'Failed to update app settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseMessage = () => {
    setMessage(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        App Updates Management
      </Typography>

      <Paper sx={{ p: 4, mt: 3, maxWidth: 600, mx: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configure App Version & Update Links
            </Typography>

            <TextField
              label="App Version"
              variant="outlined"
              fullWidth
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              placeholder="e.g. 1.0.5"
            />

            <TextField
              label="Update URL"
              variant="outlined"
              fullWidth
              value={updateUrl}
              onChange={(e) => setUpdateUrl(e.target.value)}
              placeholder="e.g. https://play.google.com/store/apps/details?id=..."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={forceUpdate}
                  onChange={(e) => setForceUpdate(e.target.checked)}
                  color="primary"
                />
              }
              label="Force Update (Requires user to update the app)"
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              sx={{ mt: 2 }}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Settings'}
            </Button>
          </Box>
        )}
      </Paper>

      <Snackbar 
        open={!!message} 
        autoHideDuration={6000} 
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseMessage} 
          severity={message?.type} 
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppSettings;
