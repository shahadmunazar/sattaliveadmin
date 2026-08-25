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
} from '@mui/material';

const PaymentQR: React.FC = () => {
  const [currentQR, setCurrentQR] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getToken = (): string => localStorage.getItem('authToken') || '';

  // FIXME: Update the endpoint URLs below based on your actual API documentation
  const GET_QR_ENDPOINT = 'https://liveapi.sattalives.com/api/app-settings';
  const UPLOAD_QR_ENDPOINT = 'https://liveapi.sattalives.com/api/admin/update-qr-code';

  const fetchCurrentQR = async () => {
    setLoading(true);
    try {
      const response = await axios.get(GET_QR_ENDPOINT, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      
      // Assuming the API returns something like { data: { qr_code_image: '...' } }
      // Update this according to the actual response structure
      if (response.data && response.data.data && response.data.data.qr_code_image) {
        let qrUrl = response.data.data.qr_code_image as string;
        // The backend `asset()` helper might omit `/public/` on this host
        if (qrUrl.includes('liveapi.sattalives.com/uploads/')) {
          qrUrl = qrUrl.replace('liveapi.sattalives.com/uploads/', 'liveapi.sattalives.com/public/uploads/');
        }
        setCurrentQR(qrUrl);
      }
    } catch (err) {
      console.error('Failed to fetch QR code', err);
      // We don't want to show an error message if the QR code simply hasn't been uploaded yet (like a 404),
      // but you can adjust this error handling as needed.
      if (axios.isAxiosError(err) && err.response?.status !== 404) {
        setMessage({ type: 'error', text: 'Failed to fetch the current QR code.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select an image file first.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('qr_code_image', selectedFile);

    try {
      await axios.post(UPLOAD_QR_ENDPOINT, formData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage({ type: 'success', text: 'QR Code updated successfully!' });
      
      // Clear selection
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Refresh the current QR
      fetchCurrentQR();
    } catch (err) {
      console.error('Upload failed', err);
      setMessage({ type: 'error', text: 'Failed to upload the QR code. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleCloseMessage = () => {
    setMessage(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payment QR Code Management
      </Typography>

      <Paper sx={{ p: 4, mt: 3, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Current QR Code
        </Typography>

        {loading ? (
          <CircularProgress sx={{ my: 4 }} />
        ) : currentQR ? (
          <Box sx={{ my: 3 }}>
            <img 
              src={currentQR} 
              alt="Current Payment QR" 
              style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', border: '1px solid #ddd', padding: '8px', borderRadius: '4px' }} 
            />
          </Box>
        ) : (
          <Typography color="textSecondary" sx={{ my: 4 }}>
            No QR code is currently uploaded.
          </Typography>
        )}

        <Box sx={{ mt: 5, borderTop: '1px solid #eee', pt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upload New QR Code
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
            >
              Select Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>

            {previewUrl && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Preview:
                </Typography>
                <img 
                  src={previewUrl} 
                  alt="QR Code Preview" 
                  style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', border: '1px dashed #aaa', padding: '4px' }} 
                />
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              sx={{ mt: 2 }}
            >
              {uploading ? <CircularProgress size={24} /> : 'Upload QR Code'}
            </Button>
          </Box>
        </Box>
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

export default PaymentQR;
