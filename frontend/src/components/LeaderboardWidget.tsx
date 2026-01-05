import React, { useEffect, useState } from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import api from '../services/api';

interface LeaderboardUser {
  rank: number;
  display_name: string;
  reputation: number;
  rank_score: number;
  badges: string[];
}

const LeaderboardWidget: React.FC = () => {
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/api/v1/leaderboard?period=global&limit=10');
        if (response.data.success) {
          setTopUsers(response.data.data.leaderboard || []);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Set mock data for now since backend isn't ready
        setTopUsers([
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
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <IonCard className="shadow-sm bg-white dark:bg-gray-800">
      <IonCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <IonCardTitle className="text-lg font-bold text-gray-900 dark:text-white">Top Forecasters</IonCardTitle>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => history.push('/leaderboard')}
            className="text-primary-600 text-sm"
          >
            View All
          </IonButton>
        </div>
      </IonCardHeader>
      <IonCardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {topUsers.map((user) => (
              <div
                key={user.rank}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => history.push(`/profile/${user.display_name}`)}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 text-sm flex-shrink-0">
                    {getRankIcon(user.rank)}
                  </div>
                  {/* User Avatar */}
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{user.display_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rep: {user.reputation.toFixed(1)}</p>
                  </div>
                </div>
                {user.badges.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium flex-shrink-0 ml-2">
                    {user.badges[0]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default LeaderboardWidget;

