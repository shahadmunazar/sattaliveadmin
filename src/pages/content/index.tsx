import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../custom.css';

interface HomeContent {
  id: number;
  content_name: string;
  serial_number: number;
  status: boolean;
  created_at: string;
  updated_at: string;
}

const ChangeContentRequest: React.FC = () => {
  const [contents, setContents] = useState<HomeContent[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedContent, setSelectedContent] = useState<Partial<HomeContent> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getToken = (): string => {
    return localStorage.getItem('authToken') || '';
  };

  const fetchContents = async () => {
    try {
      const response = await axios.get('https://liveapi.sattalives.com/api/admin/home-content-list', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      setContents(response.data.data);
    } catch (error) {
      console.error('Failed to fetch home contents', error);
      setError('Failed to fetch home contents. Please try again.');
    }
  };

  const fetchContentDetails = async (id: number) => {
    try {
      const response = await axios.get(`https://liveapi.sattalives.com/api/admin/home-content-details/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      setSelectedContent(response.data.data);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to fetch content details', error);
      setError('Failed to fetch content details. Please try again.');
    }
  };

  const addContent = async () => {
    if (!selectedContent) return;

    try {
      const newContent = {
        content_name: selectedContent.content_name || '',
        serial_number: selectedContent.serial_number || 0,
        status: selectedContent.status || false,
      };

      await axios.post(
        'https://liveapi.sattalives.com/api/admin/home-content-add',
        newContent,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setShowAddModal(false);
      setSelectedContent(null);
      fetchContents();
    } catch (error) {
      console.error('Failed to add content', error);
      setError('Failed to add content. Please try again.');
    }
  };

  const updateContent = async () => {
    if (!selectedContent || !selectedContent.id) return;

    try {
      await axios.put(
        `https://liveapi.sattalives.com/api/admin/home-content-update/${selectedContent.id}`,
        {
          content_name: selectedContent.content_name,
          serial_number: selectedContent.serial_number,
          status: selectedContent.status,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setShowEditModal(false);
      setSelectedContent(null);
      fetchContents();
    } catch (error) {
      console.error('Failed to update content', error);
      setError('Failed to update content. Please try again.');
    }
  };

  const deleteContent = async (id: number) => {
    try {
      await axios.delete(`https://liveapi.sattalives.com/api/admin/home-content-delete/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      fetchContents();
    } catch (error) {
      console.error('Failed to delete content', error);
      setError('Failed to delete content. Please try again.');
    }
  };

  const handleStatusChange = async (id: number, status: boolean) => {
    try {
      await axios.put(
        `https://liveapi.sattalives.com/api/admin/home-content-update/${id}`,
        { status: !status },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      fetchContents();
    } catch (error) {
      console.error('Failed to change status', error);
      setError('Failed to change status. Please try again.');
    }
  };

  useEffect(() => {
    fetchContents();

    const intervalId = setInterval(() => {
      fetchContents();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSelectedContent(prev => {
      if (prev === null) return null;

      return {
        ...prev,
        [name]: name === 'status' ? (value === 'true') : value
      };
    });
  };

  return (
    <div className="container">
      <h1 className="my-4">Home Contents</h1>
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by content name"
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
        />
        <button className="btn btn-success add-category-button" onClick={() => { setSelectedContent({} as HomeContent); setShowAddModal(true); }}>
          Add Content
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Content Name</th>
              <th>Serial Number</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contents
              .filter(content => content.content_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((content) => (
                <tr key={content.id}>
                  <td data-label="ID">{content.id}</td>
                  <td data-label="Content Name">{content.content_name}</td>
                  <td data-label="Serial Number">{content.serial_number}</td>
                  <td data-label="Status">{content.status ? 'Active' : 'Inactive'}</td>
                  <td data-label="Created At">
                    {new Date(content.created_at).toLocaleString()}
                  </td>
                  <td data-label="Actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => fetchContentDetails(content.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteContent(content.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleStatusChange(content.id, content.status)}
                    >
                      {content.status ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Add Content Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Content</h5>
                <button type="button" className="close" onClick={() => setShowAddModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label htmlFor="content_name">Content Name</label>
                  <input
                    type="text"
                    id="content_name"
                    name="content_name"
                    value={selectedContent?.content_name || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="serial_number">Serial Number</label>
                  <input
                    type="number"
                    id="serial_number"
                    name="serial_number"
                    value={selectedContent?.serial_number || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={selectedContent?.status ? 'true' : 'false'}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addContent}
                >
                  Add Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Content</h5>
                <button type="button" className="close" onClick={() => setShowEditModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label htmlFor="content_name">Content Name</label>
                  <input
                    type="text"
                    id="content_name"
                    name="content_name"
                    value={selectedContent?.content_name || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="serial_number">Serial Number</label>
                  <input
                    type="number"
                    id="serial_number"
                    name="serial_number"
                    value={selectedContent?.serial_number || ''}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={selectedContent?.status ? 'true' : 'false'}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={updateContent}
                >
                  Update Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeContentRequest;
