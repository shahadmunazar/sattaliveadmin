import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../custom.css'; // Assuming custom styles

interface GameNumber {
  number: string;
  total: string;
  amount?: string;
}

interface Category {
  id: number;
  name: string;
}

const HarupJantriLists = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<string>(''); // Initially empty
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [bettingTotals, setBettingTotals] = useState<GameNumber[]>([]); // Changed type to GameNumber[]
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('authToken') || '';

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        'https://liveapi.sattalives.com/api/admin/get-all-category-list',
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
      setError('Failed to fetch categories. Please try again.');
    }
  };

  const fetchGameNumbers = async (categoryId: number, gameType: string) => {
    try {
      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/play-games-number-harup?category_id=${categoryId}&game_type=${gameType}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      // Directly use bettingTotals from response
      const bettingTotalsData = response.data.bettingTotals; // This will now be an array of objects
      setBettingTotals(bettingTotalsData);

      setTotalAmount(response.data.totalAmount);

    } catch (error) {
      console.error('Failed to fetch game numbers', error);
      setError('Failed to fetch game numbers. Please try again.');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId !== null && selectedGameType) { // Only call if gameType is selected
      fetchGameNumbers(selectedCategoryId, selectedGameType);
    }
  }, [selectedCategoryId, selectedGameType]);

  return (
    <div className="container">
      <h1 className="my-4" style={{ color: '#f5f5f5' }}>Game Numbers</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Flexbox container for dropdowns */}
      <div className="form-group d-flex justify-content-between mb-4">
        <div className="w-50">
          <label htmlFor="categorySelect" style={{ color: '#f5f5f5' }}>Select Category</label>
          <select
            id="categorySelect"
            className="form-control"
            style={{
              backgroundColor: '#2c2c2c',
              color: '#f5f5f5',
              borderColor: '#444',
            }}
            onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
          >
            <option value="" style={{ color: '#888' }}>Select a category</option>
            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
                style={{ backgroundColor: '#2c2c2c', color: '#f5f5f5' }}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-50 ms-3">
          <label htmlFor="gameTypeSelect" style={{ color: '#f5f5f5' }}>Select Game Type</label>
          <select
            id="gameTypeSelect"
            className="form-control"
            style={{
              backgroundColor: '#2c2c2c',
              color: '#f5f5f5',
              borderColor: '#444',
            }}
            onChange={(e) => setSelectedGameType(e.target.value)} // Update game type
            value={selectedGameType}
          >
            <option value="" style={{ backgroundColor: '#2c2c2c', color: '#f5f5f5' }}>Select a game type</option>
            <option value="bahar_harup" style={{ backgroundColor: '#2c2c2c', color: '#f5f5f5' }}>Bahar Harup</option>
            <option value="ander_harup" style={{ backgroundColor: '#2c2c2c', color: '#f5f5f5' }}>Ander Harup</option>
          </select>
        </div>
      </div>

      <div className="my-4" style={{ color: '#f5f5f5' }}>
        <h3>Total Amount: {totalAmount !== null ? totalAmount : 0}</h3>
      </div>

      {/* Betting Totals Table */}
      <div className="my-4">
        <h4 style={{ color: '#f5f5f5' }}>Betting Totals:</h4>
        <table className="table" style={{ backgroundColor: '#2c2c2c', color: '#f5f5f5' }}>
          <thead>
            <tr>
              <th style={{ color: '#f5f5f5' }}>Number</th>
              <th style={{ color: '#f5f5f5' }}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {bettingTotals.map((totalData) => (
              <tr key={totalData.number}>
                <td>{totalData.number}</td>
                <td>{totalData.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Game Numbers Table */}
      
    </div>
  );
};

export default HarupJantriLists;
