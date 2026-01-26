import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonInput, IonItem, IonSpinner, IonAlert, IonModal, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  WalletIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  TrophyIcon,
  XMarkIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PurchaseCreate, type Purchase as PurchaseType } from '../types/purchase';

const Purchase: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  
  // Get return URL and required chips from query params
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('return');
  const requiredChips = searchParams.get('required');
  
  // Set initial amount to required chips if provided, otherwise default to 100
  const [chipsAmount, setChipsAmount] = useState<number>(
    requiredChips ? Math.max(parseInt(requiredChips, 10), 20) : 100
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Purchase history state
  const [purchases, setPurchases] = useState<PurchaseType[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Predefined chip amounts
  const quickAmounts = [20, 50, 100, 200, 500, 1000];

  // Fetch purchase history
  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    setIsLoadingHistory(true);
    try {
      const limit = isMobile ? 3 : 5;
      const response = await api.get('/api/v1/purchases', {
        params: {
          page: 1,
          limit,
        },
      });

      if (response.data.success) {
        setPurchases(response.data.data.purchases);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleQuickSelect = (amount: number) => {
    setChipsAmount(amount);
  };

  const validateAmount = (): string | null => {
    if (!chipsAmount || chipsAmount < 20) {
      return 'Minimum purchase is 20 chips (₱20)';
    }
    if (chipsAmount > 100000) {
      return 'Maximum purchase is 100,000 chips (₱100,000)';
    }
    return null;
  };

  const handlePurchase = async () => {
    const validationError = validateAmount();
    if (validationError) {
      setAlertHeader('Validation Error');
      setAlertMessage(validationError);
      setIsSuccess(false);
      setShowAlert(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const purchaseData: PurchaseCreate = {
        chips_added: chipsAmount,
      };

      const response = await api.post('/api/v1/purchases/checkout', purchaseData);

      if (response.data.success) {
        const { purchase, new_balance } = response.data.data;
        
        // Update user chips in context
        if (user) {
          updateUser({ chips: new_balance });
        }

        setAlertHeader('Purchase Successful!');
        setAlertMessage(
          `You successfully purchased ${purchase.chips_added.toLocaleString()} chips (₱${purchase.chips_added.toLocaleString()}). Your new balance is ₱${new_balance.toLocaleString()}.`
        );
        setIsSuccess(true);
        setShowAlert(true);
        
        // Refresh purchase history
        fetchPurchases();
        
        // If there's a return URL, redirect back after a short delay
        if (returnUrl) {
          setTimeout(() => {
            history.push(returnUrl);
          }, 2000);
        } else {
          // Reset form after success if no return URL
          setTimeout(() => {
            setChipsAmount(100);
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Error purchasing chips:', error);
      setAlertHeader('Purchase Failed');
      setAlertMessage(
        error.response?.data?.detail || error.response?.data?.errors?.[0]?.message || 'Failed to purchase chips. Please try again.'
      );
      setIsSuccess(false);
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (!user) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-base">
              Please log in to purchase chips.
            </p>
            <button
              onClick={() => history.push('/login')}
              className="w-full md:w-auto px-6 py-3 md:py-2.5 bg-[#fcdb6f] hover:bg-[#fbcf3f] active:scale-[0.98] text-black font-semibold rounded-lg transition-all duration-150 text-base"
            >
              Log In
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 md:py-6 max-w-3xl">
          {/* Back Button */}
          {returnUrl && (
            <button
              onClick={() => history.push(returnUrl)}
              className="mb-3 -ml-1 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors min-h-[44px]"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-1" />
              <span className="text-base">Back to Market</span>
            </button>
          )}
          
          {/* Header and Balance */}
          <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <WalletIcon className="w-6 h-6 md:w-7 md:h-7 mr-2 text-[#f7b801]" />
                Purchase Chips
              </h1>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                ₱{user.chips.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Redirect Message */}
          {returnUrl && requiredChips && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 md:mb-6">
              <div className="flex items-start">
                <InformationCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm md:text-base text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">You need chips to place your forecast</p>
                  <p>
                    You need at least <span className="font-bold">₱20</span> chips to place your forecast (minimum purchase). 
                    {parseInt(requiredChips, 10) > 20 && (
                      <> Your forecast requires <span className="font-bold">₱{parseInt(requiredChips, 10).toLocaleString()}</span> chips.</>
                    )}
                    {' '}After purchasing, you'll be redirected back to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Form Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
            <div className="space-y-4 md:space-y-6">
              {/* Quick Select and Custom Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Quick Select */}
                <div>
                  <label className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleQuickSelect(amount)}
                        className={`min-h-[48px] md:min-h-[44px] px-3 py-2.5 md:py-2 rounded-lg font-medium text-sm md:text-base transition-all duration-150 active:scale-[0.98] ${
                          chipsAmount === amount
                            ? 'bg-[#fcdb6f] hover:bg-[#fbcf3f] text-black font-semibold shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        ₱{amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Input */}
                <div>
                  <label className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Custom Amount
                  </label>
                  <IonItem className="ion-no-padding rounded-lg border border-gray-300 dark:border-gray-600" lines="none">
                    <IonInput
                      type="number"
                      value={chipsAmount}
                      onIonInput={(e) => setChipsAmount(parseInt(e.detail.value!) || 0)}
                      placeholder="Enter amount"
                      min={20}
                      max={100000}
                      className="px-4 py-3 md:py-2.5 text-base"
                    />
                  </IonItem>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Min: ₱20 | Max: ₱100,000
                  </p>
                </div>
              </div>

              {/* Purchase Summary */}
              <div className="bg-gradient-to-r from-[#fcdb6f]/20 to-[#f18701]/20 dark:from-[#fcdb6f]/10 dark:to-[#f18701]/10 rounded-lg p-4 md:p-5 border border-[#fcdb6f]/30 dark:border-[#fcdb6f]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Purchase Amount</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      ₱{chipsAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Chips</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      {chipsAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={isSubmitting || !chipsAmount || chipsAmount < 20 || chipsAmount > 100000}
                className="w-full min-h-[56px] md:min-h-[48px] bg-[#fcdb6f] hover:bg-[#fbcf3f] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-black font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 text-base md:text-lg shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <IonSpinner name="crescent" className="w-5 h-5" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <WalletIcon className="w-5 h-5 md:w-6 md:h-6" />
                    <span>Purchase {chipsAmount.toLocaleString()} Chips</span>
                  </>
                )}
              </button>

              {/* Winning Chips Notice */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 md:p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <WalletIcon className="w-6 h-6 md:w-7 md:h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2">
                      💰 Win Chips When Your Forecasts Are Correct!
                    </h3>
                    <p className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                      <strong>Winning users receive chips as rewards!</strong> When markets resolve, you get your original bet back 
                      <strong> plus a proportional share of chips from losing forecasts</strong> (90% of losing chips are distributed to winners). 
                      The more you bet, the larger your share of the rewards. Make accurate forecasts to earn more chips!
                    </p>
                  </div>
                </div>
              </div>

              {/* Prize Notice */}
              <div className="bg-gradient-to-r from-[#fcdb6f]/20 via-[#f18701]/20 to-[#fcdb6f]/20 dark:from-[#fcdb6f]/10 dark:via-[#f18701]/10 dark:to-[#fcdb6f]/10 border-2 border-[#fcdb6f]/40 dark:border-[#fcdb6f]/30 rounded-lg p-4 md:p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <TrophyIcon className="w-6 h-6 md:w-7 md:h-7 text-[#f7b801]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-extrabold text-gray-900 dark:text-white mb-2">
                      🏆 Monthly Top Forecasters Receive Digital Certificates!
                    </h3>
                    <p className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 leading-relaxed mb-2">
                      Top-performing forecasters at the end of each month will receive a prestigious digital certificate recognizing their forecasting excellence.{' '}
                      <button
                        onClick={() => setShowCertificateModal(true)}
                        className="text-[#f7b801] dark:text-[#fcdb6f] hover:text-[#c59301] dark:hover:text-[#fbcf3f] underline font-bold"
                      >
                        Click here for more info...
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact Disclaimer */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-xs md:text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">Test Mode - No Payment Required</p>
                    <p>
                      Chips are virtual, non-redeemable tokens (1 chip = ₱1.00 for reference only). 
                      They cannot be converted to cash or withdrawn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase History Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* History Header */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`w-full flex items-center justify-between p-4 md:p-5 ${isMobile ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors' : ''}`}
              disabled={!isMobile}
            >
              <div className="flex items-center gap-3">
                <WalletIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Recent Purchases
                </h2>
              </div>
              {isMobile && (
                <div className="flex items-center">
                  {showHistory ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
              )}
            </button>

            {/* History Content */}
            {(showHistory || !isMobile) && (
              <div className="px-4 md:px-5 pb-4 md:pb-5">
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <IonSpinner name="crescent" color="primary" />
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-8">
                    <WalletIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-2">
                      No purchases yet
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500">
                      Your purchase history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${getStatusColor(purchase.status)}`}>
                              {getStatusIcon(purchase.status)}
                            </div>
                            <span className={`text-xs md:text-sm font-semibold capitalize ${getStatusColor(purchase.status).split(' ')[0]}`}>
                              {purchase.status}
                            </span>
                            {purchase.provider === 'test' && (
                              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                                Test
                              </span>
                            )}
                            {purchase.provider === 'admin' && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(purchase.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Chips Added</p>
                            <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                              {purchase.chips_added.toLocaleString()} chips
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Amount</p>
                            <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                              ₱{(purchase.amount_cents / 100).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => history.push('/purchase/history')}
                      className="w-full min-h-[44px] mt-2 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 active:scale-[0.98] bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg transition-all duration-150 text-sm md:text-base"
                    >
                      View All Purchase History
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* About Chips Info Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mt-4 md:mt-6 p-4 md:p-5">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <InformationCircleIcon className="w-5 h-5 md:w-6 md:h-6 mr-2 text-gray-600 dark:text-gray-400" />
              About Chips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 flex-shrink-0" />
                <span>1 Chip = ₱1.00 (reference only)</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 flex-shrink-0" />
                <span>Virtual tokens for forecasting</span>
              </div>
              <div className="flex items-center">
                <XCircleIcon className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 flex-shrink-0" />
                <span>Non-redeemable, no cash value</span>
              </div>
              <div className="flex items-center">
                <XCircleIcon className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 flex-shrink-0" />
                <span>All purchases are final</span>
              </div>
            </div>
          </div>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertHeader}
          message={alertMessage}
          buttons={['OK']}
          cssClass={isSuccess ? 'alert-success' : ''}
        />

        {/* Certificate Info Modal */}
        <IonModal isOpen={showCertificateModal} onDidDismiss={() => setShowCertificateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Digital Certificate</IonTitle>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding bg-gray-50 dark:bg-gray-900">
            <div className="max-w-3xl mx-auto py-6">
              {/* Sample Certificate Preview */}
              <div className="bg-white dark:bg-gray-800 border-2 border-[#fcdb6f]/60 dark:border-[#fcdb6f]/40 rounded-lg p-6 md:p-8 shadow-lg mb-6">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="inline-block bg-gradient-to-r from-[#f7b801] to-[#f18701] text-white px-6 md:px-8 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold mb-2">
                      ACBMARKET CERTIFICATE OF EXCELLENCE
                    </div>
                  </div>
                  <h4 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Top Forecaster
                  </h4>
                  <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6">
                    <span className="font-semibold">January 2026</span> Cycle
                  </p>
                  <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-6 mt-6">
                    <p className="text-base text-gray-600 dark:text-gray-400 italic mb-3">
                      This certificate recognizes exceptional ability to analyze trends, interpret data signals, and make accurate predictions in complex, real-world scenarios.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Demonstrates mastery in pattern recognition, statistical reasoning, and strategic thinking—skills essential for navigating uncertain futures.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">About the Certificate</h3>
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Recognition Criteria</h4>
                    <p className="text-sm leading-relaxed">
                      This certificate is awarded to forecasters who achieve top rankings in the monthly leaderboard, demonstrating consistent accuracy and superior analytical capabilities across multiple prediction markets.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What It Represents</h4>
                    <p className="text-sm leading-relaxed">
                      Earning this certificate showcases your ability to synthesize information, identify key indicators, and make well-reasoned predictions—the same skills valued in political analysis, market research, strategic planning, and data-driven decision making.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Professional Value</h4>
                    <p className="text-sm leading-relaxed">
                      This achievement demonstrates your proficiency in quantitative reasoning, risk assessment, and probabilistic thinking. These competencies are highly sought after in fields requiring analytical rigor and strategic foresight.
                    </p>
                  </div>
                </div>
              </div>

              {/* How to Earn Section */}
              <div className="bg-gradient-to-br from-[#fcdb6f]/10 to-[#f18701]/10 dark:from-[#fcdb6f]/20 dark:to-[#f18701]/20 rounded-lg p-4 md:p-6 border border-[#fcdb6f]/30 dark:border-[#fcdb6f]/40">
                <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 md:w-6 md:h-6 text-[#f7b801]" />
                  How to Earn This Certificate
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#f7b801] font-bold mt-0.5">•</span>
                    <span>Climb to the top of the monthly leaderboard by making accurate forecasts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#f7b801] font-bold mt-0.5">•</span>
                    <span>Maintain high accuracy rates across multiple markets and categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#f7b801] font-bold mt-0.5">•</span>
                    <span>Build your reputation score through consistent, well-reasoned predictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#f7b801] font-bold mt-0.5">•</span>
                    <span>Stay active and engaged throughout the month to maximize your ranking</span>
                  </li>
                </ul>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Purchase;
