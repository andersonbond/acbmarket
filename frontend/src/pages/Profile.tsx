import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonButtons,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonSpinner,
} from '@ionic/react';
import { close, create, save, trophyOutline, trendingUp, statsChart, flameOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Badge, BadgeListResponse } from '../types/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const history = useHistory();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
  const [reputationHistory, setReputationHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [forecastStats, setForecastStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [leaderboardRanks, setLeaderboardRanks] = useState<any>({});
  const [isLoadingRanks, setIsLoadingRanks] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      fetchBadges();
      fetchReputationHistory();
      fetchStats();
      fetchLeaderboardRanks();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      const response = await api.get(`/api/v1/users/me`);
      if (response.data.success && response.data.data.stats) {
        setForecastStats(response.data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchLeaderboardRanks = async () => {
    if (!user) return;
    setIsLoadingRanks(true);
    try {
      const periods = ['global', 'weekly', 'monthly'];
      const ranks: any = {};
      
      for (const period of periods) {
        try {
          const response = await api.get(`/api/v1/leaderboard?period=${period}&limit=1`);
          if (response.data.success && response.data.data.user_rank) {
            ranks[period] = response.data.data.user_rank;
          }
        } catch (err) {
          // Ignore errors for individual periods
        }
      }
      
      setLeaderboardRanks(ranks);
    } catch (err) {
      console.error('Error fetching leaderboard ranks:', err);
    } finally {
      setIsLoadingRanks(false);
    }
  };

  const fetchBadges = async () => {
    if (!user) return;
    setIsLoadingBadges(true);
    try {
      const response = await api.get<BadgeListResponse>(`/api/v1/users/${user.id}/badges`);
      if (response.data.success) {
        setBadges(response.data.data.badges);
      }
    } catch (err) {
      console.error('Error fetching badges:', err);
    } finally {
      setIsLoadingBadges(false);
    }
  };

  const fetchReputationHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const response = await api.get(`/api/v1/users/${user.id}/reputation-history`);
      if (response.data.success) {
        setReputationHistory(response.data.data.history);
      }
    } catch (err) {
      console.error('Error fetching reputation history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.patch('/api/v1/users/me', {
        display_name: displayName,
        bio,
      });

      if (response.data.success) {
        updateUser(response.data.data.user);
        setIsEditModalOpen(false);
      } else {
        setError(response.data.errors?.[0]?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const chartData = reputationHistory.map((entry) => ({
    date: new Date(entry.created_at).toLocaleDateString(),
    reputation: entry.reputation,
  })).reverse(); // Show oldest to newest

  // Reputation percentage for meter
  const reputationPercentage = user ? Math.min(100, Math.max(0, user.reputation)) : 0;

  if (!user) {
    return null;
  }

  return (
    <IonPage>
      <Header />
      <IonContent>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.display_name}</h1>
                  <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <IonButton onClick={() => setIsEditModalOpen(true)} className="button-primary">
                <IonIcon icon={create} slot="start" />
                Edit Profile
              </IonButton>
            </div>

            {user.bio && (
              <p className="text-gray-700 dark:text-gray-300 mt-4">{user.bio}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <IonCard className="bg-white dark:bg-gray-800">
              <IonCardContent className="p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chips</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  ₱{user.chips.toLocaleString()}
                </div>
              </IonCardContent>
            </IonCard>
            <IonCard className="bg-white dark:bg-gray-800">
              <IonCardContent className="p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reputation</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user.reputation.toFixed(1)}
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all"
                      style={{ width: `${reputationPercentage}%` }}
                    />
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
            <IonCard className="bg-white dark:bg-gray-800">
              <IonCardContent className="p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Badges</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {badges.length}
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Reputation History Chart */}
          {reputationHistory.length > 0 && (
            <IonCard className="bg-white dark:bg-gray-800 mb-6">
              <IonCardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <IonIcon icon={trendingUp} className="text-primary text-xl" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reputation History</h2>
                </div>
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center h-64">
                    <IonSpinner name="crescent" />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-gray-700" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'var(--ion-text-color)' }}
                          stroke="var(--ion-text-color)"
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: 'var(--ion-text-color)' }}
                          stroke="var(--ion-text-color)"
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--ion-background-color)', border: 'none', borderRadius: '8px' }}
                          labelStyle={{ color: 'var(--ion-text-color)' }}
                          itemStyle={{ color: 'var(--ion-text-color)' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="reputation"
                          stroke="#f7b801"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Forecast Stats Section */}
          {forecastStats && (
            <IonCard className="bg-white dark:bg-gray-800 mb-6">
              <IonCardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <IonIcon icon={statsChart} className="text-primary text-xl" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Forecast Statistics</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {forecastStats.total_forecasts || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Forecasts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {forecastStats.won_forecasts || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Won</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {forecastStats.lost_forecasts || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Lost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {forecastStats.accuracy ? forecastStats.accuracy.toFixed(1) : '0.0'}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Accuracy</div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Leaderboard Stats Section */}
          <IonCard className="bg-white dark:bg-gray-800 mb-6">
            <IonCardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IonIcon icon={trophyOutline} className="text-primary text-xl" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leaderboard Rankings</h2>
                </div>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={() => history.push('/leaderboard')}
                  className="button-primary"
                >
                  View Leaderboard
                </IonButton>
              </div>
              {isLoadingRanks ? (
                <div className="flex justify-center py-8">
                  <IonSpinner name="crescent" />
                </div>
              ) : Object.keys(leaderboardRanks).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['global', 'weekly', 'monthly'].map((period) => {
                    const rank = leaderboardRanks[period];
                    if (!rank) return null;
                    return (
                      <div
                        key={period}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 capitalize">
                          {period} Rank
                        </div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            #{rank.rank}
                          </div>
                          {rank.rank <= 3 && (
                            <span className="text-2xl">
                              {rank.rank === 1 ? '🥇' : rank.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          Score: {rank.rank_score?.toFixed(0) || '0'}
                        </div>
                        {rank.winning_streak > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <IonIcon icon={flameOutline} />
                            <span>{rank.winning_streak} win streak</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IonIcon icon={trophyOutline} className="text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Start forecasting to appear on the leaderboard!
                  </p>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Badges Section */}
          <IonCard className="bg-white dark:bg-gray-800 mb-6">
            <IonCardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <IonIcon icon={trophyOutline} className="text-primary text-xl" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Badges</h2>
              </div>
              {isLoadingBadges ? (
                <div className="flex justify-center py-8">
                  <IonSpinner name="crescent" />
                </div>
              ) : badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                      title={badge.description}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{badge.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {badge.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IonIcon icon={trophyOutline} className="text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No badges yet. Start forecasting to earn badges!</p>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        {/* Edit Profile Modal */}
        <IonModal isOpen={isEditModalOpen} onDidDismiss={() => setIsEditModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Profile</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsEditModalOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="max-w-md mx-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-4">
                <IonItem className="rounded-lg" lines="none">
                  <IonLabel position="stacked">Display Name</IonLabel>
                  <IonInput
                    type="text"
                    value={displayName}
                    onIonInput={(e) => setDisplayName(e.detail.value!)}
                    placeholder="Display name"
                  />
                </IonItem>
              </div>

              <div className="mb-6">
                <IonItem className="rounded-lg" lines="none">
                  <IonLabel position="stacked">Bio</IonLabel>
                  <IonInput
                    type="text"
                    value={bio}
                    onIonInput={(e) => setBio(e.detail.value!)}
                    placeholder="Tell us about yourself"
                  />
                </IonItem>
              </div>

              <IonButton expand="block" onClick={handleSave} disabled={isLoading} className="button-primary">
                <IonIcon icon={save} slot="start" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Profile;

