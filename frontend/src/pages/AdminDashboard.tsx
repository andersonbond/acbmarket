import React, { useState, useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { IonPage, IonContent } from '@ionic/react';
import Header from '../components/Header';
import { getAdminStats, AdminStats } from '../services/admin';

// Generate sparkline data from a value (simulated gentle upward trend)
function sparkData(value: number, points = 7): { v: number }[] {
  const arr = [];
  let v = value * 0.7;
  const step = (value - v) / (points - 1);
  for (let i = 0; i < points; i++) {
    arr.push({ v: Math.round(v + Math.random() * step * 0.3) });
    v += step;
  }
  return arr;
}

// Platform overview chart data (mock time series)
function overviewChartData(stats: AdminStats, period: string): { name: string; revenue: number; forecasts: number }[] {
  const points = period === '1D' ? 6 : period === '5D' ? 5 : period === '1M' ? 4 : 6;
  const rev = stats.total_revenue_cents / 100;
  const f = stats.total_forecasts;
  const arr = [];
  for (let i = points; i >= 0; i--) {
    const t = i / points;
    arr.push({
      name: period === '1D' ? `H${points - i}` : period === '1Y' ? `M${i + 1}` : `D${i + 1}`,
      revenue: Math.round(rev * (0.3 + 0.7 * (1 - t))),
      forecasts: Math.round(f * (0.4 + 0.6 * (1 - t))),
    });
  }
  return arr.reverse();
}

// Radar data (e.g. activity by "month" - mock)
function radarChartData(stats: AdminStats): { subject: string; forecasts: number; markets: number; fullMark: number }[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const f = stats.total_forecasts;
  const m = stats.total_markets;
  return months.map((subject, i) => ({
    subject,
    forecasts: Math.round((f / 8) * (0.6 + 0.4 * (i / 8))),
    markets: Math.round((m / 8) * (0.5 + 0.5 * (i / 8))),
    fullMark: Math.max(Math.round(f / 8), Math.round(m / 8)),
  }));
}

// Inline SVG icons
const Icons = {
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  forecast: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  cash: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 2.31.826 1.37 1.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 2.31-1.37 1.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-2.31-.826-1.37-1.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-2.31 1.37-1.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  cart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'1D' | '5D' | '1M' | '1Y'>('1D');
  const history = useHistory();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const response = await getAdminStats();
        if (response.success) {
          setStats(response.data);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (cents: number) => {
    return `₱${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Trend helpers (mock positive trend for display)
  const trend = (value: number) => {
    const pct = 0.5 + Math.random() * 0.5;
    const delta = Math.round((value * pct) / 100);
    return { delta, pct: pct.toFixed(2) };
  };

  const overviewData = useMemo(() => (stats ? overviewChartData(stats, chartPeriod) : []), [stats, chartPeriod]);
  const radarData = useMemo(() => (stats ? radarChartData(stats) : []), [stats]);

  const quickActions = [
    { label: 'Manage Users', path: '/admin/users', icon: Icons.users },
    { label: 'Manage Markets', path: '/admin/markets', icon: Icons.chart },
    { label: 'Monitor Purchases', path: '/admin/purchases', icon: Icons.document },
    { label: 'Review Flagged', path: '/admin/flagged', icon: Icons.cart },
  ];

  const sidebarActions = [
    { path: '/admin/users', label: 'Manage Users', icon: Icons.settings, color: 'bg-emerald-500 hover:bg-emerald-600' },
    { path: '/admin/flagged', label: 'Review Flagged', icon: Icons.chat, color: 'bg-blue-500 hover:bg-blue-600' },
    { path: '/admin/purchases', label: 'Monitor Purchases', icon: Icons.document, color: 'bg-violet-500 hover:bg-violet-600' },
    { path: '/admin/markets', label: 'Manage Markets', icon: Icons.cart, color: 'bg-primary-500 hover:bg-primary-600' },
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <IonPage>
        <Header />
        <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto py-8 font-dm-sans">
            <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm h-32 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-80 bg-white dark:bg-gray-800 rounded-2xl shadow-sm animate-pulse" />
              <div className="h-80 bg-white dark:bg-gray-800 rounded-2xl shadow-sm animate-pulse" />
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <Header />
        <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto py-16">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Retry
              </button>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!stats) return null;

  const kpis = [
    { label: 'Total Users', value: stats.total_users, icon: Icons.users, color: 'text-blue-600' },
    { label: 'Total Markets', value: stats.total_markets, icon: Icons.chart, color: 'text-violet-600' },
    { label: 'Total Forecasts', value: stats.total_forecasts, icon: Icons.forecast, color: 'text-emerald-600' },
    { label: 'Total Revenue', value: formatCurrency(stats.total_revenue_cents), isCurrency: true, icon: Icons.cash, color: 'text-primary-600' },
  ];

  return (
    <IonPage>
      <Header />
      <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 font-dm-sans relative">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{today}</p>
          </header>

          {/* Top row: KPI cards with sparklines and trend */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {kpis.map((k, i) => {
              const numVal = typeof k.value === 'number' ? k.value : 0;
              const t = trend(numVal || 1000);
              const spark = sparkData(numVal || 1000);
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums truncate">
                        {k.isCurrency ? k.value : (k.value as number).toLocaleString()}
                      </p>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
                      {!k.isCurrency && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          +{t.delta.toLocaleString()} (+{t.pct}%)
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      {!k.isCurrency && (
                        <div className="w-16 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={spark}>
                              <defs>
                                <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={1.5} fill={`url(#spark-${i})`} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <span className={k.color}>{k.icon}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Middle: Overview chart + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Platform Statistics Overview */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Statistics Overview</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revenue and forecast activity over time</p>
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.total_revenue_cents)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">100% of total</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Forecasts</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total_forecasts.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">100% of total</p>
                </div>
                <div className="flex gap-1">
                  {(['1D', '5D', '1M', '1Y'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setChartPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        chartPeriod === p
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-2 mb-2">
                <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-3 h-0.5 rounded-full bg-violet-500" /> Revenue
                </span>
                <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-3 h-0.5 rounded-full bg-emerald-500" /> Forecasts
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overviewData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--ion-background-color, #fff)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="forecasts" name="Forecasts" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar: Activity by period (mock) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Distribution</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Forecasts vs markets (sample)</p>
              <div className="flex gap-4 mt-2 mb-2">
                <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> Forecasts
                </span>
                <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-violet-500" /> Markets
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} tick={{ fontSize: 10 }} />
                    <Radar name="Forecasts" dataKey="forecasts" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.3} />
                    <Radar name="Markets" dataKey="markets" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom: Secondary metrics + Quick action cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Purchases</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total_purchases.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">Active (30d)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.active_users_30d.toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => history.push('/admin/flagged')}
                className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 shadow-sm hover:border-amber-300 text-left"
              >
                <p className="text-xs text-amber-700 dark:text-amber-400">Flagged Items</p>
                <p className="text-xl font-bold text-amber-800 dark:text-amber-200">{stats.flagged_items_count.toLocaleString()}</p>
              </button>
              <div className="bg-orange-50/80 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-4 shadow-sm">
                <p className="text-xs text-orange-700 dark:text-orange-400">Suspended Markets</p>
                <p className="text-xl font-bold text-orange-800 dark:text-orange-200">{stats.suspended_markets_count.toLocaleString()}</p>
              </div>
              <div className="bg-red-50/80 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4 shadow-sm">
                <p className="text-xs text-red-700 dark:text-red-400">Banned Users</p>
                <p className="text-xl font-bold text-red-800 dark:text-red-200">{stats.banned_users_count.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                <p className="text-xs text-slate-600 dark:text-slate-400">Frozen Accounts</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{stats.frozen_accounts_count.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  type="button"
                  onClick={() => history.push(action.path)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    {action.icon}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Floating action sidebar (right) */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
            {sidebarActions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => history.push(action.path)}
                className={`w-12 h-12 rounded-full shadow-lg text-white flex items-center justify-center ${action.color} transition-colors`}
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
