import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Button,
    Snackbar,
    Alert,
    
} from '@mui/material';
import Swal from 'sweetalert2';
// import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import './user.css'; // Ensure your styles are applied
interface User {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  referral_code: string;
  referrer_id: number | null;
  created_at: string;
  updated_at: string;
  earnings: string;
  balance: string;
  role: string;
  status: string; // Ensure status is a number (0 or 1)
  password?: string; // Add these optional fields
  confirm_password?: string;
}
interface GameHistory {
  // Define the fields based on your API response
  id: number;
  user_id: number;
  category_id: string;
  Playing_Name: string;
  play_type: string | null;
  ander_harup: string | null;
  bahar_harup: string | null;
  play_game_id: string;
  playinge_type:string | null;
  today_number: string | null;
  after_open_number_block: string;
  open_time_number: string | null;
  loss_amount: string;
  won_amount: string | null;
  entered_number: number;
  entered_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
}
interface UserHistory {
  id: number;
  user_id: number;
  transaction_type: string; // 'credit', 'debit', 'bonus', 'won', 'loss', 'withdrawal', etc.
  amount: string;
  description: string;
  image: string | null;
  transaction_date: string;
  available_balance: string;
  created_at: string;
  updated_at: string;
  confirm_payment: string; // e.g., "not_confirm"
}
interface ReferralData {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  referral_code: string;
  referrer_id: number;
  created_at: string;
  updated_at: string;
  earnings: string;
  balance: string;
  role: string;
}
const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGameHistoryModal, setShowGameHistoryModal] = useState(false);
  const [showUserHistoryModal, setShowUserHistoryModal] = useState(false);
  // const [isBlocked, setIsBlocked] = useState(false); // or get from an API response
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({});
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [useHistory, setUserHistory] = useState<UserHistory[]>([]);
  const [referralData, setReferralData] = useState<ReferralData[] | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedReferralCode, setSelectedReferralCode] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');    
  const [snackbarOpen, setSnackbarOpen] = useState(false);


  const [selectedTab, setSelectedTab] = useState('All'); // Default tab is 'All'
  const [filteredData, setFilteredData] = useState(useHistory); // State to store filtered data
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
};
const handleCloseSnackbar = () => {
  setSnackbarOpen(false);
};
  useEffect(() => {
    if (showUserHistoryModal) {
      setSelectedTab('All');
      setFilteredData(useHistory);
    }
  }, [showUserHistoryModal, useHistory]);
  // Update filtered data whenever selectedTab changes
  useEffect(() => {
    if (selectedTab === 'All') {
      setFilteredData(useHistory);
    } else {
      const filtered = useHistory.filter((game) => game.transaction_type === selectedTab);
      setFilteredData(filtered);
    }
  }, [selectedTab, useHistory]);
  const getToken = () => localStorage.getItem('authToken') || '';
  const fetchUsers = async () => {
    try {
      const response = await axios.get('https://liveapi.sattalives.com/api/admin/all-users-list', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setUsers(response.data.data); // Adjust based on API response structure
    } catch (error) {
      console.error('Failed to fetch users', error);
      setError('Failed to fetch users. Please try again.');
    }
  };
  const fetchUserDetailsLogut = async (id: number) => {
    try {
        const response = await axios.post(
            "https://liveapi.sattalives.com/api/admin/update-token",
            { user_id: id }, // Sending user_id in the request body
            {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        setSelectedUser(response.data.data);
        showSnackbar('User Logout updated successfully.', 'success');

        // setShowModal(true);
    } catch (error) {
        console.error("Failed to fetch user details", error);
        showSnackbar("Failed to fetch user details. Please try again.", "error");
    }
};
  const fetchUserDetails = async (id: number) => {
    try {
      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/user-details?id=${id}`,
        {
          headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
        }
      );
      setSelectedUser(response.data.data); // Adjust based on API response structure
      setShowModal(true);
    } catch (error) {
      console.error('Failed to fetch user details', error);
      setError('Failed to fetch user details. Please try again.');
    }
  };
  const changeStatus = async (id: number, status: number) => {
    try {
        // Create the URLSearchParams object for form-urlencoded data
        const formData = new URLSearchParams();
        formData.append('user_id', id.toString());
        formData.append('user_status', status.toString());

        // API call to change the status
        const response = await axios.put(
            'https://liveapi.sattalives.com/api/admin/user-status',
            formData, // URLSearchParams is automatically converted to form-urlencoded
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded', // Required header for URL-encoded data
                    Authorization: `Bearer ${getToken()}`, // Include the token in the request
                },
            }
        );

        // If API call is successful, show success alert
        if (response.status === 200) {
            setError(null); // Reset any previous error messages
            Swal.fire({
                title: 'Success!',
                text: 'User status updated successfully.',
                icon: 'success',
                confirmButtonText: 'OK',
            });
        } else {
            setError('Failed to update user status');
            Swal.fire({
                title: 'Error!',
                text: 'Failed to update user status.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    } catch (error) {
        console.error('Failed to update user status', error);
        setError('Failed to update user status. Please try again.');
        Swal.fire({
            title: 'Error!',
            text: 'Failed to update user status. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
        });
    }
};
  const fetchGameHistory = async (userId: number) => {
    try {
      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/play-game-history-user/${userId}`,
        {
          headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
        }
      );
      setGameHistory(response.data.data); // Adjust based on API response structure
      setShowGameHistoryModal(true);
    } catch (error) {
      console.error('Failed to fetch game history', error);
      setError('Failed to fetch game history. Please try again.');
    }
  };
  const fetchUserHistory = async (userId: number, datatabs: string | null = null) => {
    try {
      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/get-user-statement`,
        {
          params: {
            user_id: userId,
            datatabs: datatabs, // If datatabs is null, fetch 'All' data
          },
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Handle response based on selected tab
      console.log('skhfns',selectedTab);
      if (selectedTab == 'All Referall Join') {
        console.log('Referral tab selected', selectedTab);
        setUserHistory(response.data.data.All_bonus || []);
      } else {
        setUserHistory(response.data.data.all_transaction || []); // Default to empty array if no data
      }
      setShowUserHistoryModal(true);
    } catch (error) {
      console.error('Failed to fetch user history', error);
      setError('Failed to fetch user history. Please try again.');
    }
  };
  const addUser = async () => {
    try {
      await axios.post(
        'https://liveapi.sattalives.com/api/admin/add-new-users',
        newUser,
        {
          headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
        }
      );
      Swal.fire('Success', 'User added successfully!', 'success');
      setShowAddModal(false);
      setNewUser({});
      fetchUsers(); // Refresh users after addition
    } catch (error) {
      console.error('Failed to add user', error);
      setError('Failed to add user. Please try again.');
    }
  };
  const deleteGame = (gameId: number) => {
    // Retrieve the token from localStorage or wherever you're storing it
    const token = localStorage.getItem('authToken');
  
    if (!token) {
      console.error('No auth token found');
      return;
    }
  
    // Perform the delete action here (e.g., make an API call to delete the game)
    console.log('Deleting game with ID:', gameId);
  
    // Send a DELETE request to the API with the token
    axios.delete(`https://liveapi.sattalives.com/api/admin/game-delete-by-admin/${gameId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        console.log('Game deleted:', response.data);
      })
      .catch(error => {
        console.error('Error deleting game:', error);
      });
  };
  const deleteUser = async (id: number) => {
    try {
      await axios.delete(
        'https://liveapi.sattalives.com/api/admin/delete-users',
        {
          data: { id },
          headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
        }
      );
      Swal.fire('Success', 'User deleted successfully!', 'success');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user', error);
      setError('Failed to delete user. Please try again.');
    }
  };
  const changePassword = async () => {
    if (!selectedUser || password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await axios.put(
        'https://liveapi.sattalives.com/api/admin/change-password-admin',
        {
          id: selectedUser.id,
          password,
          password_confirmation: confirmPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      Swal.fire('Success', 'Password changed successfully!', 'success');
      setShowPasswordModal(false);
      setPassword('');
      setConfirmPassword('');
      setError(''); // Clear any previous error messages
    } catch (error) {
      console.error('Failed to change password', error);
      setError('Failed to change password. Please try again.');
    }
  };
  useEffect(() => {
    fetchUsers(); // Initial fetch
    const intervalId = setInterval(() => fetchUsers(), 30000); // 30 seconds interval
    return () => clearInterval(intervalId); // Clean up interval on component unmount
  }, []);
  const token = localStorage.getItem('authToken');
  const handleOpenReferralModal = async (userId: string, referralCode: string) => {
    setSelectedReferralCode(referralCode); // Set the referral code
    setShowReferralModal(true); // Show modal
    try {
      const response = await fetch(`https://liveapi.sattalives.com/api/admin/get-referal_code?user_id=${userId}`, {
        method: 'GET', // Or use POST if needed
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // If required
        },
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setReferralData(data.data.All_bonus); // Store all referral data  
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    }
  };
  const handleCloseReferralModal = () => {
    setShowReferralModal(false);
    setReferralData(null); // Reset referral data when modal closes
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobile.includes(searchTerm)
  );
  return (
    <div className="container">
      <h1 className="my-4">All Users List</h1>
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
        />
        <button className="btn btn-success add-category-button" onClick={() => setShowAddModal(true)}>Add User</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Referral Code</th>
              <th>Referrer ID</th>
              <th>Created At</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.mobile}</td>
                <td>
                <span
  onClick={() => handleOpenReferralModal(user.id.toString(), user.referral_code)} // Convert user.id to string
  style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
>
  {user.referral_code}
</span>


              </td>                <td>{user.referrer_id}</td>
                <td>{new Date(user.created_at).toLocaleString()}</td>
                <td>{user.balance}</td>
                
               

                <td>
                <button
                        className={`btn ${user.status === '1' ? 'btn-success' : 'btn-danger'}`} // Apply classes conditionally
                        onClick={() => changeStatus(user.id, user.status === '1' ? 0 : 1)} // Toggle status on click
                    >
                        {user.status === '1' ? 'Unblock' : 'Block'} {/* Toggle text based on status */}
                    </button>
                    <Button
                                        variant="contained"
                                        color="info"
                                        onClick={() => fetchUserDetailsLogut(user.id)}
                                        style={{ marginLeft: '8px' }}
                                    >
                                        Logout
                                    </Button>

                  
                  
                                   <button
                    className="btn btn-primary"
                    onClick={() => fetchUserDetails(user.id)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-secondary mx-2"
                    onClick={() => fetchGameHistory(user.id)}
                  >
                    Game History
                  </button>
                  
                  <button
                    className="btn btn-secondary mx-2"
                    onClick={() => fetchUserHistory(user.id)}
                  >
                    User History
                  </button>

                  <button
                    className="btn btn-warning mx-2"
                    onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}
                  >
                    Change Password
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteUser(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <h2>User Details</h2>
            <p><strong>ID:</strong> {selectedUser.id}</p>
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Mobile:</strong> {selectedUser.mobile}</p>
            <p><strong>Referral Code:</strong> {selectedUser.referral_code}</p>
            <p><strong>Referrer ID:</strong> {selectedUser.referrer_id}</p>
            <p><strong>Created At:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
            <p><strong>Balance:</strong> {selectedUser.balance}</p>
            {/* Add more details if necessary */}
            <button className="btn btn-primary" onClick={() => { setShowPasswordModal(true); setShowModal(false); }}>
              Change Password
            </button>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

{showReferralModal && (
      <div className="modal">
        <div className="modal-content">
          <span className="close" onClick={handleCloseReferralModal}>
            &times;
          </span>
          <h2>Referral Code Details</h2>
          <p><strong>Referral Code:</strong> {selectedReferralCode}</p>
          
          {/* Table displaying referral data */}
          {referralData ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Referral Code</th>
                  <th>Referrer ID</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Earnings</th>
                  <th>Balance</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
              {referralData?.map((item: ReferralData) => (
  <tr key={item.id}>
    <td>{item.name}</td>
    <td>{item.email || 'Not available'}</td>
    <td>{item.mobile}</td>
    <td>{item.referral_code}</td>
    <td>{item.referrer_id}</td>
    <td>{new Date(item.created_at).toLocaleString()}</td>
    <td>{new Date(item.updated_at).toLocaleString()}</td>
    <td>{item.earnings}</td>
    <td>{item.balance}</td>
    <td>{item.role}</td>
  </tr>
))}
              </tbody>
            </table>
          ) : (
            <p>Loading referral details...</p>
          )}

          <button className="btn btn-secondary" onClick={handleCloseReferralModal}>
            Close
          </button>
        </div>
      </div>
    )}

{showGameHistoryModal && (
  <div className="modal">
    <div className="modal-content">
      <span className="close" onClick={() => setShowGameHistoryModal(false)}>&times;</span>
      <h2>Game History</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Playing Name</th>
            <th>Play Type</th>
            <th>Harup type</th>
            <th>Playing Number</th>
            <th>Amount</th>
            <th>Entry Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {gameHistory.map(game => (
            <tr key={game.id}>
              <td>{game.id}</td>
              <td>{game.Playing_Name}</td>
              <td>{game.play_type}</td>
              <td>{game.playinge_type ? game.playinge_type : 'No Harup game'}</td>
              <td>{game.entered_number}</td>
              <td>{game.entered_amount}</td>
              <td>{game.created_at}</td>
              <td>{game.status}</td>
              <td><button
                onClick={() => deleteGame(game.id)} // Send game.id to deleteGame function
                style={{
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
              </td>            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-secondary" onClick={() => setShowGameHistoryModal(false)}>
        Close
      </button>
    </div>
  </div>
)}
<Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>


{showUserHistoryModal && (
    <div className="modal">
    <div className="modal-content">
      <span className="close" onClick={() => setShowUserHistoryModal(false)}>
        &times;
      </span>
      <h2>User Details</h2>

      {/* Tabs for different transaction types */}
      <div className="tabs">
        {['All', 'credit', 'debit', 'bonus', 'won', 'loss', 'withdrawal', 'All Referall Join'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedTab(type)}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              backgroundColor: selectedTab === type ? '#007bff' : '#f1f1f1',
              border: '1px solid #ddd',
              borderRadius: '20px',
              color: selectedTab === type ? '#fff' : '#333',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease, color 0.3s ease',
              marginRight: '10px',
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Content based on selected tab */}
      <div>
        <h2>
          {selectedTab === 'All'
            ? 'All Transactions'
            : `${selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Transactions`}
        </h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Transaction Type</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Transaction Date</th>
              <th>Available Balance</th>
              <th>Confirm Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((game) => (
              <tr key={game.id}>
                <td>{game.id}</td>
                <td>{game.transaction_type}</td>
                <td>{game.amount}</td>
                <td>{game.description}</td>
                <td>{new Date(game.transaction_date).toLocaleString()}</td>
                <td>{game.available_balance}</td>
                <td>{game.confirm_payment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-secondary" onClick={() => setShowUserHistoryModal(false)}>
        Close
      </button>
    </div>
  </div>
  
)}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowAddModal(false)}>&times;</span>
            <h2>Add New User</h2>
            <form onSubmit={(e) => { e.preventDefault(); addUser(); }}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={newUser.name || ''}
                onChange={handleInputChange}
                required
              />
              
              <input
                type="text"
                name="mobile"
                placeholder="Mobile"
                value={newUser.mobile || ''}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="referral_code"
                placeholder="Referral Code"
                value={newUser.referral_code || ''}
                onChange={handleInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={newUser.password || ''}
                onChange={handleInputChange}
              />
              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm Password"
                value={newUser.confirm_password || ''}
                onChange={handleInputChange}
              />
              
              <button type="submit" className="btn btn-primary">Add User</button>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowPasswordModal(false)}>&times;</span>
            <h2>Change Password</h2>
            <form onSubmit={(e) => { e.preventDefault(); changePassword(); }}>
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">Change Password</button>
              {error && <p className="error">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
