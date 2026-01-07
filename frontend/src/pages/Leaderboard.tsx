import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { trophyOutline, flameOutline, trendingUpOutline, informationCircleOutline } from 'ionicons/icons';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardUser {
  rank: number;
  user_id: string;
  display_name: string;
  reputation: number;
  rank_score: number;
  winning_streak?: number;
  activity_streak?: number;
  total_forecasts?: number;
  badges: string[];
}

interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardUser[];
    user_rank?: LeaderboardUser;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'election', label: 'Election' },
  { value: 'politics', label: 'Politics' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'economy', label: 'Economy' },
  { value: 'weather', label: 'Weather' },
];

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [category, setCategory] = useState<string>('all');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  useEffect(() => {
    fetchLeaderboard();
  }, [period, category, page]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<LeaderboardResponse>(
        `/api/v1/leaderboard?period=${period}&category=${category}&page=${page}&limit=50`
      );
      if (response.data.success) {
        setUsers(response.data.data.leaderboard || []);
        setUserRank(response.data.data.user_rank || null);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 dark:text-yellow-400';
    if (rank === 2) return 'text-gray-400 dark:text-gray-500';
    if (rank === 3) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const isCurrentUser = (userId: string) => {
    return user && user.id === userId;
  };

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <IonIcon icon={trophyOutline} className="text-primary text-3xl" />
                  Leaderboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Compete with the best forecasters</p>
              </div>
              
              {/* Prize Notice Card */}
              <IonCard className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 lg:max-w-md w-full lg:flex-shrink-0">
                <IonCardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <IonIcon icon={informationCircleOutline} className="text-yellow-600 dark:text-yellow-400 text-2xl flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-yellow-900 dark:text-yellow-200 text-sm mb-1">
                        <span>🏆 Top Forecasters May Receive Prizes!</span>
                      </p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
                        Pilimarket may award prizes to top-performing forecasters. Improve your forecasting skills, climb the leaderboard, and you could be eligible for exciting rewards!
                      </p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          </div>

          {/* User Rank Card */}
          {userRank && (
            <IonCard className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-2 border-primary mb-6">
              <IonCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{getRankIcon(userRank.rank)}</div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your Rank</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        #{userRank.rank}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Score: {userRank.rank_score.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reputation</p>
                    <p className="text-xl font-bold text-primary">{userRank.reputation.toFixed(1)}</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Period Filter */}
            <IonCard className="bg-white dark:bg-gray-800">
              <IonCardContent className="p-4">
                <IonSegment
                  value={period}
                  onIonChange={(e) => {
                    setPeriod(e.detail.value as any);
                    setPage(1);
                  }}
                >
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
              </IonCardContent>
            </IonCard>

            {/* Category Filter */}
            <IonCard className="bg-white dark:bg-gray-800">
              <IonCardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <IonButton
                      key={cat.value}
                      fill={category === cat.value ? 'solid' : 'outline'}
                      size="small"
                      onClick={() => {
                        setCategory(cat.value);
                        setPage(1);
                      }}
                      className={category === cat.value ? 'button-primary' : ''}
                    >
                      {cat.label}
                    </IonButton>
                  ))}
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Leaderboard Table */}
          <IonCard className="bg-white dark:bg-gray-800">
            <IonCardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <IonSpinner name="crescent" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <IonIcon icon={trophyOutline} className="text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No users found in this leaderboard</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Reputation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Streaks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((userEntry) => (
                        <tr
                          key={userEntry.rank}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            isCurrentUser(userEntry.user_id)
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary'
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-lg font-bold ${getRankColor(userEntry.rank)}`}>
                                {getRankIcon(userEntry.rank)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                                {userEntry.display_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {userEntry.display_name}
                                  {isCurrentUser(userEntry.user_id) && (
                                    <span className="ml-2 text-xs text-primary font-semibold">(You)</span>
                                  )}
                                </div>
                                {userEntry.badges && userEntry.badges.length > 0 && (
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {userEntry.badges.slice(0, 3).map((badge, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs"
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
                            <div className="text-sm text-gray-900 dark:text-white font-semibold">
                              {userEntry.reputation.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {userEntry.rank_score.toFixed(0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3 text-xs">
                              {userEntry.winning_streak !== undefined && userEntry.winning_streak > 0 && (
                                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                  <IonIcon icon={flameOutline} />
                                  <span>{userEntry.winning_streak}</span>
                                </div>
                              )}
                              {userEntry.activity_streak !== undefined && userEntry.activity_streak > 0 && (
                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                  <IonIcon icon={trendingUpOutline} />
                                  <span>{userEntry.activity_streak}d</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!isLoading && users.length > 0 && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <IonButton
                      fill="outline"
                      size="small"
                      disabled={pagination.page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </IonButton>
                    <IonButton
                      fill="outline"
                      size="small"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </IonButton>
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Leaderboard;
