import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import Header from '../components/Header';
import api from '../services/api';

interface LeaderboardUser {
  rank: number;
  display_name: string;
  reputation: number;
  rank_score: number;
  badges: string[];
}

const Leaderboard: React.FC = () => {
  const [period, setPeriod] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [category, setCategory] = useState<string>('all');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(
          `/api/v1/leaderboard?period=${period}&category=${category}&limit=50`
        );
        if (response.data.success) {
          setUsers(response.data.data.leaderboard || []);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Mock data for now
        setUsers([
          { rank: 1, display_name: 'ForecastMaster', reputation: 95.5, rank_score: 980, badges: ['Accurate', 'Specialist'] },
          { rank: 2, display_name: 'PredictionPro', reputation: 92.3, rank_score: 965, badges: ['Accurate'] },
          { rank: 3, display_name: 'MarketGuru', reputation: 89.7, rank_score: 950, badges: ['Climber'] },
          { rank: 4, display_name: 'ElectionExpert', reputation: 87.2, rank_score: 935, badges: ['Specialist'] },
          { rank: 5, display_name: 'TrendTracker', reputation: 85.1, rank_score: 920, badges: [] },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [period, category]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <IonPage>
      <Header />
      <IonContent>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Leaderboard</h1>

          {/* Filters */}
          <div className="mb-6">
            <IonSegment value={period} onIonChange={(e) => setPeriod(e.detail.value as any)}>
              <IonSegmentButton value="global">
                <IonLabel>Global</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="weekly">
                <IonLabel>Weekly</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="monthly">
                <IonLabel>Monthly</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reputation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">
                        <div className="animate-pulse">Loading...</div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.rank} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-gray-700">
                              {getRankIcon(user.rank)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {user.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.display_name}
                              </div>
                              {user.badges.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {user.badges.map((badge, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs"
                                    >
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-semibold">
                            {user.reputation.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{user.rank_score}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Leaderboard;

