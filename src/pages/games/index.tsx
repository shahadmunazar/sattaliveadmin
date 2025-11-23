import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../custom.css';

interface Game {
  id: number;
  user_id: number;
  user_name: string;
  category_id: string;
  Playing_Name: string;
  play_type: string | null;
  ander_harup: string | null;
  bahar_harup: string | null;
  play_game_id: string;
  today_number: string | null;
  after_open_number_block: string;
  open_time_number: string | null;
  loss_amount: string | null;
  won_amount: string | null;
  entered_number: number;
  entered_amount: string;
  status: string;
  created_at: string;
  updated_at: string;

  category_name:string;
}

const GamesList: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // Default to 'all'
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('authToken') || '';

  const fetchGames = async () => {
    try {
      const response = await axios.get('https://liveapi.sattalives.com/api/admin/all-play-games', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        params: {
          plan_game: selectedStatus, // Send 'all' if it's the default value
          page: currentPage,
        },
      });

      if (response.data) {
        setGames(response.data.data);
        setTotalPages(response.data.total_pages || 1);
        setTotalRecords(response.data.total_records || 0); // Assuming `total_records` is available in the API response
      } else {
        setGames([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Failed to fetch games', error);
      setError('Failed to fetch games. Please try again.');
    }
  };

  useEffect(() => {
    fetchGames();
  }, [selectedStatus, currentPage]);

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1); // Reset to first page when status changes
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container">
      <h1 className="my-4">Games List</h1>
      
      <div className="search-bar-container">
        <select
          value={selectedStatus}
          onChange={handleStatusChange}
          className="status-filter"
        >
          <option value="all">All Statuses</option>
          <option value="waiting">Waiting</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div className="records-info">
        <p>Total Records: {totalRecords}</p>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User Name</th>
              <th>Playing Name</th>
              <th>Game Name</th>
              <th>Entered Number</th>
              <th>Entered Amount</th>
              <th>Play Time Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id}>
                <td>{game.id}</td>
                <td>{game.user_name}</td>
                <td>{game.Playing_Name}</td>
                <td>{game.category_name}</td>
                <td>{game.entered_number}</td>
                <td>{game.entered_amount}</td>
                <td>{new Date(game.created_at).toLocaleString()}</td>
                <td>{game.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          className="btn btn-secondary"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default GamesList;
