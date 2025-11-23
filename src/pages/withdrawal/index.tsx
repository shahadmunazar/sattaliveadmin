import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../custom.css';

interface WithdrawalRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_mobile: number;
  request_money: string;
  mobile_no: string;
  upi_id: string | null;
  acount_holder_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  bank_name: string | null;
  branch_name: string | null;
  qr_code_image: string | null; // relative path from API
  withdrawal_money_status: string;
  created_at: string;
  updated_at: string;
  // Removed qr_code_image_url because we will compute it
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: PaginationLink[];
  next_page_url: string | null;
  prev_page_url: string | null;
}

const WithdrawalRequestComponent = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);

  const getToken = () => {
    return localStorage.getItem('authToken') || '';
  };

  // Helper to build full URL for QR code image
  const getFullQrCodeUrl = (relativePath: string | null) => {
    if (!relativePath) return null;
    return `https://liveapi.sattalives.com/public/storage/${relativePath}`;
  };

  // Fetch data for specific page
  const fetchRequests = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://liveapi.sattalives.com/api/admin/all-withdrawal-list', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        params: {
          page,
          ...(searchTerm ? { search: searchTerm } : {}),
        },
      });

      const responseData = response.data.data;
      setRequests(responseData.data);
      setPagination({
        current_page: responseData.current_page,
        last_page: responseData.last_page,
        per_page: responseData.per_page,
        total: responseData.total,
        links: responseData.links,
        next_page_url: responseData.next_page_url,
        prev_page_url: responseData.prev_page_url,
      });
    } catch (error) {
      console.error('Failed to fetch withdrawal requests', error);
      setError('Failed to fetch withdrawal requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: number, status: string) => {
    try {
      await axios.put(
        'https://liveapi.sattalives.com/api/admin/update-withdrawal-status',
        {
          id,
          payment_status: status,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      fetchRequests(pagination?.current_page || 1); // Refresh requests on current page after update
    } catch (error) {
      console.error('Failed to update withdrawal status', error);
      setError('Failed to update withdrawal status. Please try again.');
    }
  };

  const handleStatusChange = (status: string) => {
    if (selectedRequest) {
      updateRequestStatus(selectedRequest.id, status);
      setShowModal(false);
    }
  };

  // Extract page number from url string
  const getPageNumberFromUrl = (url: string | null): number | null => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pageParam = urlObj.searchParams.get('page');
      return pageParam ? parseInt(pageParam, 10) : null;
    } catch {
      return null;
    }
  };

  // Go to specific page by URL from pagination links
  const goToPage = (url: string | null) => {
    const page = getPageNumberFromUrl(url);
    if (page) fetchRequests(page);
  };

  useEffect(() => {
    fetchRequests(1); // initial fetch page 1

    const intervalId = setInterval(() => {
      fetchRequests(pagination?.current_page || 1);
    }, 30000); // 30 sec auto-refresh

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="container">
      <h1 className="my-4">Withdrawal Requests</h1>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by user ID or mobile"
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
        />
      </div>

      {error && <div className="alert alert-danger my-3">{error}</div>}

      <div className="table-container">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile No</th>
              <th>Account Holder Name</th>
              <th>Account Number</th>
              <th>IFSC Code</th>
              <th>QR Code</th>
              <th>Request Money</th>
              <th>Withdrawal Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && requests.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center">
                  No withdrawal requests found.
                </td>
              </tr>
            )}
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td data-label="Name">{request.user_name}</td>
                  <td data-label="Mobile No">{request.mobile_no}</td>
                  <td data-label="Account Holder Name">{request.acount_holder_name || 'N/A'}</td>
                  <td data-label="Account Number">{request.account_number || 'N/A'}</td>
                  <td data-label="IFSC Code">{request.ifsc_code || 'N/A'}</td>
                  <td data-label="QR Code">
                    {request.qr_code_image ? (
                      <img
                        src={getFullQrCodeUrl(request.qr_code_image)!}
                        alt="QR Code"
                        style={{ width: 50, height: 50 }}
                      />
                    ) : (
                      'No QR Code'
                    )}
                  </td>
                  <td data-label="Request Money">{request.request_money}</td>
                  <td data-label="Withdrawal Status">{request.withdrawal_money_status}</td>
                  <td data-label="Created At">{new Date(request.created_at).toLocaleString()}</td>
                  <td data-label="Actions">
                    {request.withdrawal_money_status === 'not_accepted' ? (
                      <>
                        <button
                          className="btn btn-primary btn-sm mr-2"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowModal(true);
                            setError(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => updateRequestStatus(request.id, 'not_approved')}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-success btn-sm" disabled>
                        {request.withdrawal_money_status === 'approved' ? 'Approved' : 'Rejected'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.links && (
        <nav aria-label="Page navigation">
          <ul className="pagination justify-content-center">
            {pagination.links.map((link, idx) => {
              const labelText = link.label
                .replace(/&laquo;/g, '«')
                .replace(/&raquo;/g, '»');
              const isDisabled = link.url === null;
              const isActive = link.active;

              return (
                <li
                  key={idx}
                  className={`page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                >
                  <button
                    className="page-link"
                    onClick={() => goToPage(link.url)}
                    disabled={isDisabled}
                    dangerouslySetInnerHTML={{ __html: labelText }}
                  />
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* Edit Modal */}
      {showModal && selectedRequest && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Withdrawal Request</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label htmlFor="request_money">Request Money</label>
                  <input
                    type="text"
                    id="request_money"
                    name="request_money"
                    value={selectedRequest.request_money}
                    className="form-control"
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="qr_code_image">QR Code</label>
                  {selectedRequest.qr_code_image ? (
                    <img
                      src={getFullQrCodeUrl(selectedRequest.qr_code_image)!}
                      alt="QR Code"
                      style={{ width: 100, height: 100 }}
                    />
                  ) : (
                    'No QR Code'
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="status">Withdrawal Status</label>
                  <select
                    id="status"
                    name="status"
                    value={selectedRequest.withdrawal_money_status}
                    onChange={(e) =>
                      setSelectedRequest((prev) =>
                        prev ? { ...prev, withdrawal_money_status: e.target.value } : prev
                      )
                    }
                    className="form-control"
                  >
                    <option value="not_approved">Not Accepted</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleStatusChange(selectedRequest.withdrawal_money_status)}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
          {/* Modal backdrop */}
          <div className="modal-backdrop show"></div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalRequestComponent;
