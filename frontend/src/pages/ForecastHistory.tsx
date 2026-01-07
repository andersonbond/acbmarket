import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonButton, IonSpinner, IonIcon, IonCard, IonCardContent, IonSelect, IonSelectOption } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { statsChart, arrowBack, checkmarkCircle, closeCircle, time, trendingUp } from 'ionicons/icons';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Forecast } from '../types/forecast';

const ForecastHistory: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchForecasts();
    }
  }, [user, page, statusFilter]);

  const fetchForecasts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      
      if (statusFilter !== 'all') {
        params.append('status_filter', statusFilter);
      }

      const response = await api.get(`/api/v1/users/${user.id}/forecasts?${params.toString()}`);

      if (response.data.success) {
        setForecasts(response.data.data.forecasts);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      setForecasts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'text-green-600 dark:text-green-400';
      case 'lost':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return checkmarkCircle;
      case 'lost':
        return closeCircle;
      case 'pending':
        return time;
      default:
        return time;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to view forecast history.
            </p>
            <IonButton onClick={() => history.push('/login')} className="button-primary">
              Log In
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <IonIcon icon={statsChart} className="mr-2" />
                Forecast History
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View all your forecasts
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-4">
            <IonSelect
              value={statusFilter}
              placeholder="Filter by status"
              onIonChange={(e) => setStatusFilter(e.detail.value)}
              className="w-full md:w-48"
            >
              <IonSelectOption value="all">All Status</IonSelectOption>
              <IonSelectOption value="pending">Pending</IonSelectOption>
              <IonSelectOption value="won">Won</IonSelectOption>
              <IonSelectOption value="lost">Lost</IonSelectOption>
            </IonSelect>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : forecasts.length === 0 ? (
            <IonCard className="bg-white dark:bg-gray-800">
              <IonCardContent className="p-12 text-center">
                <IonIcon icon={statsChart} className="text-6xl text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Forecasts Yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You haven't placed any forecasts yet.
                </p>
                <IonButton onClick={() => history.push('/markets')} className="button-primary">
                  Browse Markets
                </IonButton>
              </IonCardContent>
            </IonCard>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {forecasts.map((forecast) => (
                  <IonCard key={forecast.id} className="bg-white dark:bg-gray-800 cursor-pointer hover:shadow-md transition-shadow" onClick={() => history.push(`/markets/${forecast.market_id}`)}>
                    <IonCardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <IonIcon
                              icon={getStatusIcon(forecast.status)}
                              className={`text-lg ${getStatusColor(forecast.status)}`}
                            />
                            <span className={`font-semibold capitalize ${getStatusColor(forecast.status)}`}>
                              {forecast.status}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                            {forecast.market_title || 'Market'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <IonIcon icon={trendingUp} className="text-primary" />
                              <span>
                                <span className="font-semibold text-gray-900 dark:text-white">{forecast.outcome_name}</span> - {forecast.points.toLocaleString()} chips
                              </span>
                            </div>
                            <span>{formatDate(forecast.created_at)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            ₱{forecast.points.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {forecast.points} chips
                          </p>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mb-4">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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

export default ForecastHistory;

