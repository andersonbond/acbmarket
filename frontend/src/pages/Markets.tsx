import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import MarketCard from '../components/MarketCard';
import MarketFilters from '../components/MarketFilters';
import CategoriesBar from '../components/CategoriesBar';
import api from '../services/api';
import { Market, MarketListResponse } from '../types/market';

const Markets: React.FC = () => {
  const location = useLocation();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('volume');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hideSports, setHideSports] = useState(false);
  const [hidePolitics, setHidePolitics] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Get search query from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchMarkets = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('status', 'open');
        params.append('page', page.toString());
        params.append('limit', '20');

        if (selectedCategory !== 'All') {
          params.append('category', selectedCategory.toLowerCase());
        }

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        // Map sortBy to API sort (if needed)
        if (sortBy === 'newest') {
          // API should sort by created_at desc by default
        } else if (sortBy === 'ending') {
          // This would need resolution_time, but for now we'll use created_at
        }

        const response = await api.get<MarketListResponse>(`/api/v1/markets?${params.toString()}`);
        
        if (response.data.success) {
          // Process markets to calculate percentages from consensus or outcomes
          const processedMarkets = response.data.data.markets.map((market: Market) => {
            // Calculate percentages from outcomes if consensus not available
            const totalPoints = market.outcomes.reduce((sum, outcome) => sum + outcome.total_points, 0);
            const outcomesWithPercentage = market.outcomes.map((outcome) => ({
              ...outcome,
              percentage: totalPoints > 0 ? (outcome.total_points / totalPoints) * 100 : 0,
            }));

            // Use consensus if available, otherwise calculate from outcomes
            let consensus = market.consensus;
            if (!consensus && totalPoints > 0) {
              consensus = {};
              outcomesWithPercentage.forEach((outcome) => {
                consensus![outcome.name] = outcome.percentage || 0;
              });
            }

            return {
              ...market,
              outcomes: outcomesWithPercentage,
              consensus: consensus,
              total_volume: market.total_volume || totalPoints,
            };
          });

          setMarkets(processedMarkets);
          setTotalPages(response.data.data.pagination.pages);
        }
      } catch (error) {
        console.error('Error fetching markets:', error);
        setMarkets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
  }, [selectedCategory, hideSports, hidePolitics, sortBy, page, searchQuery]);

  // Filter markets client-side for hideSports and hidePolitics
  const filteredMarkets = markets.filter((market) => {
    if (hideSports && market.category.toLowerCase() === 'sports') {
      return false;
    }
    if (hidePolitics && market.category.toLowerCase() === 'politics') {
      return false;
    }
    return true;
  });

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        {/* Compact Header Section */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 max-w-7xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Markets</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {filteredMarkets.length} {filteredMarkets.length === 1 ? 'market' : 'markets'} found
                </p>
              </div>
            </div>
            
            {/* Categories Bar - Compact */}
            <div className="mb-2">
              <CategoriesBar
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
            </div>

            {/* Filters - Compact */}
            <MarketFilters
              sortBy={sortBy}
              onSortChange={setSortBy}
              hideSports={hideSports}
              hidePolitics={hidePolitics}
              onHideSportsChange={setHideSports}
              onHidePoliticsChange={setHidePolitics}
            />
          </div>
        </div>

        {/* Markets Grid */}
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <IonSpinner name="crescent" />
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No markets found. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filteredMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>

              {/* Compact Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mb-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Markets;
