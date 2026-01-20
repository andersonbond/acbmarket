import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import MarketCard from '../components/MarketCard';
import MarketFilters from '../components/MarketFilters';
import CategoriesBar from '../components/CategoriesBar';
import api from '../services/api';
import { Market, MarketListResponse } from '../types/market';
import { useSEO } from '../hooks/useSEO';

const MARKETS_PER_PAGE = 25;

const Markets: React.FC = () => {
  const location = useLocation();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('volume');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hideSports, setHideSports] = useState(false);
  const [hidePolitics, setHidePolitics] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // SEO
  useSEO({
    title: 'Markets',
    description: 'Browse all active prediction markets on ACBMarket. Make forecasts on politics, sports, entertainment, economy, and more using virtual chips.',
    keywords: 'prediction markets, active markets, Philippines, forecasting, virtual chips, market predictions',
    canonical: currentUrl,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'ACBMarket - All Markets',
      description: 'Browse all active prediction markets',
      url: `${baseUrl}/markets`,
    },
  });

  // Get search query from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [location.search]);

  // Process markets helper function
  const processMarkets = useCallback((marketsData: Market[]): Market[] => {
    return marketsData.map((market: Market) => {
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
  }, []);

  // Fetch markets function
  const fetchMarkets = useCallback(async (pageNum: number, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.append('status', 'open');
      params.append('page', pageNum.toString());
      params.append('limit', MARKETS_PER_PAGE.toString());

      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory.toLowerCase());
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await api.get<MarketListResponse>(`/api/v1/markets?${params.toString()}`);
      
      if (response.data.success) {
        const processedMarkets = processMarkets(response.data.data.markets);
        
        if (append) {
          setMarkets((prev) => [...prev, ...processedMarkets]);
        } else {
          setMarkets(processedMarkets);
        }
        
        // Check if there are more pages
        const totalPages = response.data.data.pagination.pages;
        setHasMore(pageNum < totalPages);
        if (!append) {
          setTotalMarkets(response.data.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
      if (!append) {
        setMarkets([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory, searchQuery, processMarkets]);

  // Initial load and when filters change
  useEffect(() => {
    setPage(1);
    setMarkets([]);
    setHasMore(true);
    setTotalMarkets(0);
    fetchMarkets(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, sortBy]); // Removed hideSports, hidePolitics from deps - they're client-side filters

  // Load more when page changes (for infinite scroll)
  useEffect(() => {
    if (page > 1 && hasMore && !isLoading && !isLoadingMore) {
      fetchMarkets(page, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, isLoadingMore]);

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
                  {totalMarkets > 0 ? (
                    <>
                      {filteredMarkets.length} of {totalMarkets} {totalMarkets === 1 ? 'market' : 'markets'}
                      {filteredMarkets.length !== totalMarkets && ' (filtered)'}
                    </>
                  ) : (
                    <>
                      {filteredMarkets.length} {filteredMarkets.length === 1 ? 'market' : 'markets'} found
                    </>
                  )}
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

              {/* Infinite Scroll Trigger & Loading Indicator */}
              <div ref={observerTarget} className="h-10 flex justify-center items-center py-4">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <IonSpinner name="crescent" />
                    <span className="text-sm">Loading more markets...</span>
                  </div>
                )}
                {!hasMore && filteredMarkets.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No more markets to load
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Markets;
