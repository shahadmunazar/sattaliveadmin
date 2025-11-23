import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './number.css';

// Define interfaces for the data and details
interface Record {
  id: number;
  category_id: number;
  category_name: string;
  open_number: string;
  open_time: string;
  created_at: string;
  updated_at: string;
}

const UpdateTodayNumb: React.FC = () => {
  const [data, setData] = useState<Record[]>([]);
  const [filteredData, setFilteredData] = useState<Record[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const token = localStorage.getItem('authToken'); // Retrieve the token from localStorage

  // Fetch all records
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://liveapi.sattalives.com/api/admin/all-open-number', {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the headers
          }
        });
        // Check if the response contains a data property with an array
        if (response.data && Array.isArray(response.data.data)) {
          setData(response.data.data); // Access the data property
          setFilteredData(response.data.data); // Initialize filteredData
        } else {
          console.error('Unexpected response format:', response.data);
          setData([]); // Default to empty array if response is not an array
          setFilteredData([]); // Default to empty array if response is not an array
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Filter data based on search query
  useEffect(() => {
    const results = data.filter(record =>
      record.category_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(results);
  }, [searchQuery, data]);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete('https://liveapi.sattalives.com/api/admin/delete-number', {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the headers
        },
        data: { id }
      });
      // Optionally, refetch the data to update the UI
      const response = await axios.get('https://liveapi.sattalives.com/api/admin/all-open-number', {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the headers
        }
      });
      if (response.data && Array.isArray(response.data.data)) {
        setData(response.data.data); // Access the data property
        setFilteredData(response.data.data); // Update filteredData as well
      } else {
        console.error('Unexpected response format:', response.data);
        setData([]); // Default to empty array if response is not an array
        setFilteredData([]); // Default to empty array if response is not an array
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Update Today Numbers</h1>
      
      {/* Search input */}
      <input
        type="text"
        placeholder="Search by category name..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-input"
      />
      
      {/* Display all records in a table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Category Name</th>
            <th>Open Number</th>
            <th>Open Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(record => (
            <tr key={record.id}>
              <td>{record.id}</td>
              <td>{record.category_name}</td>
              <td>{record.open_number}</td>
              <td>{record.open_time}</td>
              <td>
                <button onClick={() => handleDelete(record.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UpdateTodayNumb;
