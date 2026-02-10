import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Header from '../components/Header';
import {
  getMarkets,
  suspendMarket,
  unsuspendMarket,
  updateMarket,
  MarketManagement,
  MarketUpdatePayload,
} from '../services/admin';
import api from '../services/api';

const CATEGORIES = [
  { value: 'election', label: 'Election' },
  { value: 'politics', label: 'Politics' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'economy', label: 'Economy' },
  { value: 'weather', label: 'Weather' },
  { value: 'local', label: 'Local' },
  { value: 'technology', label: 'Technology' },
  { value: 'world', label: 'World' },
  { value: 'culture', label: 'Culture' },
  { value: 'other', label: 'Other' },
];

interface MarketDetailForEdit {
  id: string;
  title: string;
  description: string | null;
  rules: string | null;
  image_url: string | null;
  category: string;
}

const AdminMarketManagement: React.FC = () => {
  const [markets, setMarkets] = useState<MarketManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMarket, setSelectedMarket] = useState<MarketManagement | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<MarketUpdatePayload & { description: string; rules: string }>({
    title: '',
    description: '',
    rules: '',
    image_url: '',
    category: 'other',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  useEffect(() => {
    fetchMarkets();
  }, [page, searchTerm, statusFilter, categoryFilter]);

  const fetchMarkets = async () => {
    setIsLoading(true);
    try {
      const response = await getMarkets(
        page,
        20,
        searchTerm || undefined,
        statusFilter !== 'all' ? statusFilter : undefined,
        categoryFilter !== 'all' ? categoryFilter : undefined
      );
      if (response.success) {
        setMarkets(response.data.markets);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
      setAlertMessage('Failed to fetch markets');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (market: MarketManagement) => {
    try {
      if (market.status === 'suspended') {
        await unsuspendMarket(market.id);
        setAlertMessage('Market unsuspended successfully');
      } else {
        await suspendMarket(market.id, actionReason || undefined);
        setAlertMessage('Market suspended successfully');
      }
      setShowSuspendModal(false);
      setActionReason('');
      setSelectedMarket(null);
      fetchMarkets();
      setShowAlert(true);
    } catch (error: any) {
      setAlertMessage(error.response?.data?.detail || 'Failed to suspend/unsuspend market');
      setShowAlert(true);
    }
  };

  const openEditModal = async (market: MarketManagement) => {
    setShowEditModal(true);
    setEditLoading(true);
    setEditForm({ title: '', description: '', rules: '', image_url: '', category: 'other' });
    try {
      const { data } = await api.get<{ success: boolean; data: { market: MarketDetailForEdit } }>(
        `/api/v1/markets/${market.id}`
      );
      if (data.success && data.data?.market) {
        const m = data.data.market;
        setEditForm({
          title: m.title,
          description: m.description ?? '',
          rules: m.rules ?? '',
          image_url: m.image_url ?? '',
          category: m.category,
        });
      }
    } catch (e) {
      setAlertMessage('Failed to load market details');
      setShowAlert(true);
      setShowEditModal(false);
    } finally {
      setEditLoading(false);
    }
    setSelectedMarket(market);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedMarket(null);
  };

  const handleEditField = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setAlertMessage('Image must be under 10MB');
      setShowAlert(true);
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAlertMessage('Use JPEG, PNG, GIF, or WebP');
      setShowAlert(true);
      return;
    }
    setEditUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/v1/markets/upload-image', formData);
      if (response.data?.success && response.data?.data?.image_url) {
        handleEditField('image_url', response.data.data.image_url);
      }
    } catch (err: any) {
      setAlertMessage(err.response?.data?.detail || 'Upload failed');
      setShowAlert(true);
    } finally {
      setEditUploading(false);
      if (editImageInputRef.current) editImageInputRef.current.value = '';
    }
  };

  const handleEditSave = async () => {
    if (!selectedMarket) return;
    if (!editForm.title || editForm.title.length < 5) {
      setAlertMessage('Title must be at least 5 characters');
      setShowAlert(true);
      return;
    }
    setEditSaving(true);
    try {
      await updateMarket(selectedMarket.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        rules: editForm.rules || undefined,
        image_url: editForm.image_url || undefined,
        category: editForm.category,
      });
      setAlertMessage('Market updated successfully');
      setShowAlert(true);
      closeEditModal();
      fetchMarkets();
    } catch (err: any) {
      setAlertMessage(err.response?.data?.detail || 'Failed to update market');
      setShowAlert(true);
    } finally {
      setEditSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'suspended':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'resolved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      election: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      politics: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      sports: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      entertainment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      economy: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      weather: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
      local: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      technology: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
      world: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
      culture: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
      other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[category] || colors.other;
  };

  return (
    <IonPage>
      <Header />
      <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto py-6">
          {/* Back + Title */}
          <div className="flex items-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => history.push('/admin')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Markets</h1>
          </div>

          {/* Filters card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <input
              type="search"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Status:</span>
              {['all', 'open', 'suspended', 'resolved'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Category:</span>
              {['all', ...CATEGORIES.map((c) => c.value)].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(c);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilter === c
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {c === 'all' ? 'All' : CATEGORIES.find((x) => x.value === c)?.label ?? c}
                </button>
              ))}
            </div>
          </div>

          {/* Markets list */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Markets {!isLoading && `(${markets.length})`}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-24">
                <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : markets.length === 0 ? (
              <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                No markets match your filters.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {markets.map((market) => (
                  <li
                    key={market.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{market.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                            market.category
                          )}`}
                        >
                          {market.category}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                            market.status
                          )}`}
                        >
                          {market.status}
                        </span>
                        {market.is_flagged && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            Flagged
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {market.total_forecasts} forecasts · ₱{market.total_points.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(market)}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Edit
                      </button>
                      {market.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => history.push(`/admin/markets/${market.id}/resolve`)}
                          className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      {market.status !== 'resolved' && market.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMarket(market);
                            setShowSuspendModal(true);
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            market.status === 'suspended'
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40'
                          } transition-colors`}
                        >
                          {market.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => history.push(`/markets/${market.id}`)}
                        className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Suspend / Unsuspend modal */}
        {showSuspendModal && selectedMarket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSuspendModal(false)}>
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {selectedMarket.status === 'suspended' ? 'Unsuspend Market' : 'Suspend Market'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedMarket.status === 'suspended'
                  ? `Unsuspend "${selectedMarket.title}"?`
                  : `Suspend "${selectedMarket.title}"? You can add a reason below.`}
              </p>
              <textarea
                placeholder="Reason (optional)"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSelectedMarket(null);
                    setActionReason('');
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSuspend(selectedMarket)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                    selectedMarket.status === 'suspended'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {selectedMarket.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit market modal */}
        {showEditModal && selectedMarket && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
            onClick={closeEditModal}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full my-8 p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Market</h3>

              {editLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => handleEditField('title', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Market title (min 5 characters)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                      <select
                        value={editForm.category}
                        onChange={(e) => handleEditField('category', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => handleEditField('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution rules</label>
                      <textarea
                        value={editForm.rules}
                        onChange={(e) => handleEditField('rules', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="How this market will be resolved"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
                      <div className="flex flex-col sm:flex-row gap-3 items-start">
                        {editForm.image_url ? (
                          <div className="relative shrink-0">
                            <img
                              src={editForm.image_url}
                              alt="Market"
                              className="w-32 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleEditField('image_url', '')}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : null}
                        <div className="flex flex-col gap-1">
                          <input
                            ref={editImageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleEditImageSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={editUploading}
                            onClick={() => editImageInputRef.current?.click()}
                            className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            {editUploading ? 'Uploading…' : editForm.image_url ? 'Replace image' : 'Upload image'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={editSaving}
                      onClick={handleEditSave}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editSaving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Toast-style alert */}
        {showAlert && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg bg-gray-800 dark:bg-gray-700 text-white shadow-lg flex items-center gap-3">
            <span>{alertMessage}</span>
            <button
              type="button"
              onClick={() => setShowAlert(false)}
              className="text-white/90 hover:text-white font-medium"
            >
              OK
            </button>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminMarketManagement;
