import { useEffect, useState } from 'react';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TopCard from './TopCard';

interface CardData {
  id: number;
  title: string;
  value: string;
  rate: string;
  isUp: boolean;
  icon: string;
}

const TopCards = () => {
  const [cardsData, setCardsData] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('authToken') || '';

  useEffect(() => {
    const fetchCardsData = async () => {
      try {
        const response = await axios.get('https://liveapi.sattalives.com/api/admin/admin-dashboard', {
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        const { data } = response.data;

        // Mapping API response data to TopCard props
        const mappedData: CardData[] = [
          
          {
            id: 2,
            title: 'Today Request Money',
            value: data.today_request_money.toString(),
            rate: `No: ${data.today_transaction_count}`,
            isUp: data.today_transaction_count >= 0,
            icon: 'mdi:currency-inr',
          },
          
          {
            id: 4,
            title: 'Today Add Money',
            value: data.today_credit_money.toString(),
            rate: `No: ${data.today_count_credit_transaction}`,
            isUp: data.today_count_credit_transaction >= 0,
            icon: 'mdi:currency-inr',
          },
          
          {
            id: 8,
            title: 'Today Total Loss',
            value: data.today_total_loss_amount.toString(),
            rate: `${data.today_total_loss_count}`,
            isUp: data.today_total_loss_count >= 0,
            icon: 'mdi:currency-inr',
          },
          {
            id: 9,
            title: 'Total Users',
            value: data.total_user.toString(),
            rate: `${data.total_user}`,
            isUp: data.total_user >= 0,
            icon: 'mdi:currency-inr',
          },
          {
            id: 9,
            title: 'Today Users',
            value: data.total_user_today.toString(),
            rate: `${data.total_user_today}`,
            isUp: data.total_user_today >= 0,
            icon: 'mdi:currency-inr',
          },
          {
            id: 10,
            title: 'Today Play Games',
            value: data.play_today_game.toString(),
            rate: `${data.play_today_count}`,
            isUp: data.play_today_count >= 0,
            icon: 'mdi:currency-inr',
          },
          {
            id: 11,
            title: 'Bonus Amount Today',
            value: data.total_bonus_amount.toString(),
            rate: `${data.total_bonus_count}`,
            isUp: data.total_bonus_count >= 0,
            icon: 'mdi:currency-inr',
          },
          {
            id: 12,
            title: 'Amount Total',
            value: data.total_amount_transaction.toString(),
            rate: `${data.total_count_transaction}`,
            isUp: data.total_count_transaction >= 0,
            icon: 'mdi:currency-inr',
          },
        ];

        setCardsData(mappedData);
      } catch (error) {
        console.error('Failed to fetch card data', error);
        setError('Failed to fetch card data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCardsData();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Grid container spacing={{ xs: 2.5, sm: 3, lg: 3.75 }}>
      {cardsData.map((item) => (
        <TopCard
          key={item.id}
          title={item.title}
          value={item.value}
          rate={item.rate}
          isUp={item.isUp}
          icon={item.icon}
        />
      ))}
    </Grid>
  );
};

export default TopCards;
