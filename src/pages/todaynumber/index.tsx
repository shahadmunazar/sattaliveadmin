import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../../open.css';
import '../../custom.css';

interface Category {
  id: number;
  name: string;
  open_time: string;
  last_time: string;
  no_open: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: string;
}

const TodayNumber: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState<Omit<Category, 'id' | 'created_at' | 'updated_at' | 'status'>>({
    name: '',
    open_time: '',
    last_time: '',
    no_open: 0,
    deleted_at: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);

  const getToken = () => {
    return localStorage.getItem('authToken') || '';
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://liveapi.sattalives.com/api/admin/get-all-category-list', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      setCategories(response.data.data); // Adjust based on API response structure
    } catch (error) {
      console.error('Failed to fetch categories', error);
      Swal.fire({
        icon: 'error',
        title: 'Fetch Error',
        text: 'Failed to fetch categories. Please try again.',
      });
    }
  };

  const fetchCategoryDetails = async (id: number) => {
    try {
      const response = await axios.get(`https://liveapi.sattalives.com/api/admin/get-category_details/${id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      setNewCategory(response.data.data); // Adjust based on API response structure
      setEditCategoryId(id);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to fetch category details', error);
      Swal.fire({
        icon: 'error',
        title: 'Fetch Error',
        text: 'Failed to fetch category details. Please try again.',
      });
    }
  };

  useEffect(() => {
  fetchCategories();
}, []);


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setNewCategory(prev => ({ ...prev, [name]: value }));
  };

  const validateCategory = () => {
    if (!newCategory.name) {
      return 'Name is required';
    }
    
    
    if (newCategory.no_open < 0) {
      return 'No Open must be a positive integer';
    }
    return null;
  };

  const handleSubmit = async () => {
    const errorMessage = validateCategory();
    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    try {
      if (editCategoryId !== null) {
        // Update existing category
        await axios.put(
          'https://liveapi.sattalives.com/api/admin/result_today',
          {
            id: editCategoryId,
            open_time:newCategory.open_time,
            no_open: newCategory.no_open,
            status: 'not_opened'
          },
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Category updated successfully!',
        });

      } else {
        // Handle case for adding a new category
        await axios.post(
          'https://liveapi.sattalives.com/api/admin/add-category',
          newCategory,
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Category added successfully!',
        });
      }

      setShowModal(false);
      setNewCategory({
        name: '',
        open_time: '',
        
        last_time: '',
        no_open: 0,
        deleted_at: null,
      });
      setError(null);
      fetchCategories(); // Refresh categories after adding/updating
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;

        if (status === 403) {
          Swal.fire({
            icon: 'error',
            title: 'Permission Denied',
            text: data.data || 'Close all categories first before updating.',
            footer: data.opened_category ? `Category already opened: ${data.opened_category.name}` : undefined,
          });
        } else if (status === 422 && data.errors) {
          const errors = data.errors;
          let errorMessage = '';

          for (const key in errors) {
            if (Object.prototype.hasOwnProperty.call(errors, key)) {
              errorMessage += `${errors[key].join(' ')}\n`;
            }
          }

          Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: errorMessage || 'Please check your input and try again.',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Save Error',
            text: 'Failed to save category. Please try again.',
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Save Error',
          text: 'An unexpected error occurred. Please try again.',
        });
      }
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      const category = categories.find(c => c.id === id);
      if (!category) return;
  
      // Determine new status based on the current status
      const newStatus = category.status === 'opened' ? 'not_opened' : 'opened';
  
      // Perform the status update
      await axios.put('https://liveapi.sattalives.com/api/admin/update-status', {
        id,
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
  
      setCategories(categories.map(c => c.id === id ? { ...c, status: newStatus } : c));
  
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Category status updated to ${newStatus}.`,
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
  
        if (status === 403) {
          Swal.fire({
            icon: 'error',
            title: 'Permission Denied',
            text: data.data || 'Cannot perform this action.',
            footer: data.opened_category ? `Category already opened: ${data.opened_category.name}` : undefined,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Toggle Status Error',
            text: data.message || 'Failed to toggle status. Please try again.',
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Toggle Status Error',
          text: 'An unexpected error occurred. Please try again.',
        });
      }
    }
  };

  const openResult = async (id: number) => {
    try {
      await axios.post('https://liveapi.sattalives.com/api/admin/open-current-number', {
        category_id: id
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      Swal.fire({
        icon: 'success',
        title: 'Result Opened',
        text: 'The result has been opened successfully.',
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;

        if (status === 403) {
          Swal.fire({
            icon: 'error',
            title: 'Permission Denied',
            text: data.data || 'Cannot perform this action.',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Open Result Error',
            text: data.message || 'Failed to open result. Please try again.',
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Open Result Error',
          text: 'An unexpected error occurred. Please try again.',
        });
      }
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const editCategory = (id: number) => {
    fetchCategoryDetails(id);
  };

  return (
    <div className="container">
      <h1 className="my-4">All Result Open</h1>
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
        />
        {/* <button className="btn btn-success add-category-button" onClick={() => setShowModal(true)}>Add Category</button> */}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Open Time</th>
              <th>Last Time</th>
              <th>No Open</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map(category => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.open_time}</td>
                <td>{category.last_time}</td>
                <td>{category.no_open}</td>
                <td>{category.status}</td>
                <td>
                  <button className="btn btn-warning me-2" onClick={() => editCategory(category.id)}>Edit</button>
                  <button
                    className={`btn ${category.status === 'opened' ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleStatus(category.id)}
                  >
                    {category.status === 'opened' ? 'Close' : 'Open'}
                  </button>
                  <button
                    className="btn btn-info ms-2"
                    onClick={() => openResult(category.id)}
                  >
                    Result
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editCategoryId ? 'Edit Category' : 'Add Category'}</h2>
            <div className="modal-form">
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  value={newCategory.name}
                  onChange={handleInputChange}
                />
              </label>
              
              
              // Inside the modal content, add this new field for date input
<label>
  Select Date
  <input
    type="date"
    name="open_time"
    value={newCategory.open_time}
    onChange={handleInputChange}
  />
</label>

              <label>
                No Open
                <input
                  type="number"
                  name="no_open"
                  value={newCategory.no_open}
                  onChange={handleInputChange}
                />
              </label>
              {error && <div className="error">{error}</div>}
              <button onClick={handleSubmit} className="btn btn-primary">
                {editCategoryId ? 'Update' : 'Add'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayNumber;
