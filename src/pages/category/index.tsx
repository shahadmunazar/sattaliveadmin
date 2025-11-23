import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../custom.css';
// import './category.css';

interface Category {
  id: number;
  name: string;
  open_time: string;
  last_time: string;
  no_open: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  active: number; // Changed from status to active
}

const Category = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState<Omit<Category, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>({
    name: '',
    open_time: '',
    last_time: '',
    no_open: 0,
    active: 1, // Default active status
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
      setError('Failed to fetch category details. Please try again.');
    }
  };

  useEffect(() => {
    fetchCategories(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchCategories(); // Fetch data periodically
    }, 30000); // 30 seconds interval

    return () => clearInterval(intervalId); // Clean up interval on component unmount
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
    if (!newCategory.open_time.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      return 'Open Time must be in the format HH:MM';
    }
    if (!newCategory.last_time.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      return 'Last Time must be in the format HH:MM';
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
          `https://liveapi.sattalives.com/api/admin/update-category/${editCategoryId}`,
          newCategory,
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Add new category
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
      }
      setShowModal(false);
      setNewCategory({
        name: '',
        open_time: '',
        last_time: '',
        no_open: 0,
        active: 1, // Reset active status
      });
      setError(null);
      fetchCategories(); // Refresh categories after adding/updating
    } catch (error) {
      console.error('Failed to save category', error);
      setError('Failed to save category. Please try again.');
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await axios.delete(`https://liveapi.sattalives.com/api/admin/delete-category/${id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      fetchCategories(); // Refresh categories after deletion
    } catch (error) {
      console.error('Failed to delete category', error);
      setError('Failed to delete category. Please try again.');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (id: number) => {
    const categoryToUpdate = categories.find(category => category.id === id);
    if (!categoryToUpdate) return;

    try {
      await axios.put(
        `https://liveapi.sattalives.com/api/admin/update-active/${id}`,
        { active: categoryToUpdate.active === 1 ? 0 : 1 },
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Update local state
      setCategories(categories.map(category =>
        category.id === id ? { ...category, active: category.active === 1 ? 0 : 1 } : category
      ));
    } catch (error) {
      console.error('Failed to toggle category status', error);
      setError('Failed to toggle category status. Please try again.');
    }
  };

  const editCategory = (id: number) => {
    fetchCategoryDetails(id);
  };

  return (
    <div className="container">
      <h1 className="my-4">All Category List</h1>
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
        />
        <button className="btn btn-success add-category-button" onClick={() => setShowModal(true)}>Add Category</button>
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
                <td data-label="ID">{category.id}</td>
                <td data-label="Name">{category.name}</td>
                <td data-label="Open Time">{category.open_time}</td>
                <td data-label="Last Time">{category.last_time}</td>
                <td data-label="No Open">{category.no_open}</td>
                <td data-label="Status">{category.active === 1 ? 'Active' : 'Inactive'}</td>
                <td data-label="Actions">
                  <button onClick={() => editCategory(category.id)} className="btn btn-primary btn-sm">Edit</button>
                  <button onClick={() => deleteCategory(category.id)} className="btn btn-danger btn-sm">Delete</button>
                  <button onClick={() => toggleStatus(category.id)} className={`btn btn-sm ${category.active === 0 ? 'btn-secondary' : 'btn-success'}`}>
                    {category.active === 1 ? 'Active' : 'Deactive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editCategoryId ? 'Edit Category' : 'Add New Category'}</h5>
                <button type="button" className="close" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newCategory.name}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="open_time">Open Time</label>
                  <input
                    type="time"
                    id="open_time"
                    name="open_time"
                    value={newCategory.open_time}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_time">Last Time</label>
                  <input
                    type="time"
                    id="last_time"
                    name="last_time"
                    value={newCategory.last_time}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                {/* <div className="form-group">
                  <label htmlFor="no_open">No Open</label>
                  <input
                    type="number"
                    id="no_open"
                    name="no_open"
                    value={newCategory.no_open}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div> */}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;
