import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonButton, IonSpinner } from '@ionic/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface MarketGraphProps {
  marketId: string;
  outcomes: Array<{ id: string; name: string }>;
}

interface HistoryDataPoint {
  timestamp: string;
  consensus: Record<string, number>;
}

interface MarketHistoryResponse {
  success: boolean;
  data: {
    market_id: string;
    time_range: string;
    history: HistoryDataPoint[];
    outcomes: Array<{ id: string; name: string }>;
  };
}

const MarketGraph: React.FC<MarketGraphProps> = ({ marketId, outcomes }) => {
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (range: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<MarketHistoryResponse>(
        `/api/v1/markets/${marketId}/history?time_range=${range}`
      );
      
      if (response.data.success) {
        setHistory(response.data.data.history);
      } else {
        setError('Failed to load history');
      }
    } catch (err: any) {
      console.error('Error fetching market history:', err);
      setError('Could not load market history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (marketId) {
      fetchHistory(timeRange);
    }
  }, [marketId, timeRange]);

  // Transform data for Recharts
  const chartData = history.map((point) => {
    const data: any = {
      timestamp: new Date(point.timestamp).getTime(),
      time: new Date(point.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
    
    // Add each outcome's percentage
    outcomes.forEach((outcome) => {
      data[outcome.name] = point.consensus[outcome.name] || 0;
    });
    
    return data;
  });

  // Generate colors for each outcome
  const getOutcomeColor = (index: number, outcomeName: string) => {
    const name = outcomeName.toLowerCase();
    if (name === 'yes') return '#10b981'; // green
    if (name === 'no') return '#ef4444'; // red
    
    const colors = [
      '#f7b801', // primary yellow
      '#f18701', // secondary orange
      '#0d47a1', // blue
      '#d00000', // red
      '#10b981', // green
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#ec4899', // pink
    ];
    return colors[index % colors.length];
  };

  const timeRangeButtons = [
    { label: '1H', value: '1h' },
    { label: '6H', value: '6h' },
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
    { label: 'ALL', value: 'all' },
  ];

  if (error) {
    return (
      <IonCard className="bg-white dark:bg-gray-800">
        <IonCardContent className="p-4">
          <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
        </IonCardContent>
      </IonCard>
    );
  }

  if (isLoading) {
    return (
      <IonCard className="bg-white dark:bg-gray-800">
        <IonCardContent className="p-4">
          <div className="flex justify-center items-center h-64">
            <IonSpinner name="crescent" />
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <IonCard className="bg-white dark:bg-gray-800">
        <IonCardContent className="p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
            No historical data available yet. Make forecasts to see trends!
          </p>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="bg-white dark:bg-gray-800">
      <IonCardContent className="p-4">
        {/* Time Range Selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {timeRangeButtons.map((btn) => (
            <IonButton
              key={btn.value}
              size="small"
              fill={timeRange === btn.value ? 'solid' : 'outline'}
              onClick={() => setTimeRange(btn.value)}
              className={timeRange === btn.value ? 'button-primary' : ''}
            >
              {btn.label}
            </IonButton>
          ))}
        </div>

        {/* Chart */}
        <div className="w-full" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#9ca3af' }}
                label={{ value: '% Chance', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
              />
              <Legend
                wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
                iconType="line"
              />
              {outcomes.map((outcome, index) => (
                <Line
                  key={outcome.id}
                  type="monotone"
                  dataKey={outcome.name}
                  stroke={getOutcomeColor(index, outcome.name)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default MarketGraph;

