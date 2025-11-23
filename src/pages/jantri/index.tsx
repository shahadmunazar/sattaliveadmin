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

const JantriLists = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [gameNumbers, setGameNumbers] = useState<GameNumber[]>([]);
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

  const fetchGameNumbers = async (categoryId: number) => {
    try {
      const response = await axios.get(
        `https://liveapi.sattalives.com/api/admin/play-games-numbers?category_id=${categoryId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const resultsWithAmounts = response.data.data.all_results.map((result: GameNumber) => ({
        ...result,
        amount: result.total, // Initialize amount with total value
      }));
      setGameNumbers(resultsWithAmounts);
    } catch (error) {
      console.error('Failed to fetch game numbers', error);
      setError('Failed to fetch game numbers. Please try again.');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId !== null) {
      fetchGameNumbers(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // Calculate total amount
  const totalAmount = gameNumbers.reduce((sum, game) => sum + (parseFloat(game.amount || '0')), 0).toFixed(2);

  return (
    <div className="container">
      <h1 className="my-4" style={{ color: '#f5f5f5' }}>Game Numbers</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
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

      {/* Total Amount Display */}
      {selectedCategoryId && (
        <div className="total-amount" style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3 style={{ color: '#f5f5f5' }}>Total Amount for Category: ₹{totalAmount}</h3>
        </div>
      )}

      <div
        className="grid-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)', // 10 columns per row
          gap: '10px',
          marginTop: '20px',
        }}
      >
        {gameNumbers.map((game) => (
          <div key={game.number} className="grid-item" style={{ textAlign: 'center' }}>
            {/* Number Label */}
            <div
              style={{
                backgroundColor: '#2c2c2c',
                color: '#f5f5f5',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #444',
                marginBottom: '5px',
              }}
            >
              {game.number}
            </div>

            {/* Non-editable Amount Input */}
            <input
              type="number"
              value={game.amount}
              readOnly
              className="form-control"
              style={{
                backgroundColor: '#2c2c2c',
                color: '#f5f5f5',
                borderColor: '#444',
                textAlign: 'center',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default JantriLists;
