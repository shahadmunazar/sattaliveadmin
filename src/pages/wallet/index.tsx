import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../custom.css';

interface User {
  id: number;
  name: string;
  mobile: string;
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
  user: User; // Corrected user type
  confirm_payment: string;
}

const CreditList = () => {
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MoneyRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    return localStorage.getItem('authToken') || '';
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get('https://liveapi.sattalives.com/api/admin/all-money-added-request', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        params: searchTerm ? { search: searchTerm } : {},
      });
      setRequests(response.data.data); // Adjust based on API response structure
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to fetch money requests', error);
      setError('Failed to fetch money requests. Please try again.');
    }
  };

  const fetchTransactionDetails = async (id: number) => {
    try {
      const response = await axios.get(`https://liveapi.sattalives.com/api/admin/all-transaction/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const transaction = response.data.data;
      setSelectedRequest(transaction); // Set transaction details to state
      setShowModal(true);
    } catch (error) {
      console.error('Failed to fetch transaction details', error);
      setError('Failed to fetch transaction details. Please try again.');
    }
  };

  const updateRequest = async () => {
    if (!selectedRequest) return;

    try {
      await axios.put(
        `https://liveapi.sattalives.com/api/admin/transaction-update-id`,
        {
          transaction_id: selectedRequest.id,
          amount: selectedRequest.amount, // Only update the amount
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setShowModal(false);
      setSelectedRequest(null);
      fetchRequests(); // Refresh requests after update
    } catch (error) {
      console.error('Failed to update amount', error);
      setError('Failed to update amount. Please try again.');
    }
  };

  useEffect(() => {
    fetchRequests(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchRequests(); // Fetch data periodically
    }, 30000); // 30 seconds interval

    return () => clearInterval(intervalId); // Clean up interval on component unmount
  }, [searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="container">
      <h1 className="my-4">Money Added Requests</h1>
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by user ID, name, or mobile"
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User Name</th>
              <th>User Mobile</th>

              <th>Transaction Type</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Transaction Date</th>
              <th>Available Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td data-label="ID">{request.id}</td>
                <td data-label="User Name">{request.user.name}</td>
                <td data-label="User Mobile">{request.user.mobile}</td>

                <td data-label="Transaction Type">{request.transaction_type}</td>
                <td data-label="Amount">{request.amount}</td>
                <td data-label="Description">{request.description}</td>
                <td data-label="Transaction Date">
                  {new Date(request.transaction_date).toLocaleString()}
                </td>
                <td data-label="Available Balance">{request.available_balance}</td>
                <td data-label="Status">{request.confirm_payment}</td>
                <td data-label="Actions">
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => fetchTransactionDetails(request.id)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && selectedRequest && (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Money Request</h5>
                <button type="button" className="close" onClick={() => setShowModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input
                    type="text"
                    id="amount"
                    name="amount"
                    value={selectedRequest.amount}
                    onChange={(e) =>
                      setSelectedRequest((prev) =>
                        prev ? { ...prev, amount: e.target.value } : prev
                      )
                    }
                    className="form-control"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={updateRequest}>
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditList;
