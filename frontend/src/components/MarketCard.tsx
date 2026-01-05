import React from 'react';
import { useHistory } from 'react-router-dom';
import { IonCard, IonCardContent } from '@ionic/react';

interface MarketCardProps {
  market: {
    id: string;
    title: string;
    category: string;
    status: string;
    outcomes: Array<{
      name: string;
      total_points: number;
      percentage?: number;
    }>;
    total_volume?: number;
  };
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const history = useHistory();
  const yesOutcome = market.outcomes.find((o) => o.name.toLowerCase() === 'yes');
  const noOutcome = market.outcomes.find((o) => o.name.toLowerCase() === 'no');
  
  const yesPercentage = yesOutcome?.percentage || 0;
  const noPercentage = noOutcome?.percentage || 0;
  const totalPoints = (yesOutcome?.total_points || 0) + (noOutcome?.total_points || 0);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      election: 'bg-blue-100 text-blue-700',
      politics: 'bg-red-100 text-red-700',
      crypto: 'bg-yellow-100 text-yellow-700',
      sports: 'bg-green-100 text-green-700',
      entertainment: 'bg-purple-100 text-purple-700',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  // Generate placeholder image URL based on category
  const getPlaceholderImage = (category: string) => {
    const categoryLower = category.toLowerCase();
    // Using placeholder.com service with category-specific images
    const imageId = categoryLower === 'election' ? 400 : 
                    categoryLower === 'politics' ? 401 :
                    categoryLower === 'sports' ? 402 :
                    categoryLower === 'entertainment' ? 403 :
                    categoryLower === 'economy' ? 404 :
                    categoryLower === 'weather' ? 405 :
                    categoryLower === 'world' ? 406 :
                    categoryLower === 'local' ? 407 :
                    categoryLower === 'technology' ? 408 :
                    categoryLower === 'culture' ? 409 : 400;
    return `https://picsum.photos/seed/${market.id}/400/200`;
  };

  return (
    <IonCard 
      className="cursor-pointer hover:shadow-xl transition-shadow overflow-hidden bg-white dark:bg-gray-800"
      onClick={() => history.push(`/markets/${market.id}`)}
    >
      {/* Placeholder Image */}
      <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
        <img
          src={getPlaceholderImage(market.category)}
          alt={market.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
      
      <IonCardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {market.title}
            </h3>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(market.category)}`}>
              {market.category}
            </span>
          </div>
        </div>

        {/* Probability Bars */}
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-green-500 flex items-center justify-end pr-2"
                style={{ width: `${yesPercentage}%` }}
              >
                {yesPercentage > 10 && (
                  <span className="text-white text-xs font-semibold">{yesPercentage.toFixed(0)}%</span>
                )}
              </div>
              <div
                className="h-full bg-red-500 flex items-center pl-2 absolute right-0"
                style={{ width: `${noPercentage}%` }}
              >
                {noPercentage > 10 && (
                  <span className="text-white text-xs font-semibold">{noPercentage.toFixed(0)}%</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Yes {yesPercentage.toFixed(1)}%</span>
            <span>No {noPercentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Volume */}
        {market.total_volume !== undefined && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {market.total_volume > 0 ? (
              <span>${(market.total_volume / 100).toLocaleString()} Vol.</span>
            ) : (
              <span>No volume yet</span>
            )}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default MarketCard;

