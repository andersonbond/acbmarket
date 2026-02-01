import React, { useState, useEffect, useRef } from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonSearchbar, IonIcon, IonModal, IonContent } from '@ionic/react';
import { person, statsChart, trophy, logOut, logIn, personAdd, moon, sunny, helpCircle, add, wallet, settingsOutline } from 'ionicons/icons';
import {
  UserGroupIcon,
  QuestionMarkCircleIcon,
  WalletIcon,
  UserIcon,
  ChartBarIcon,
  TrophyIcon,
  Cog6ToothIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  XMarkIcon,
  Bars3Icon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from './NotificationBell';
import HowItWorksModal from './HowItWorksModal';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const history = useHistory();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync search query with URL parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
    } else if (location.pathname !== '/markets') {
      // Only clear if we're not on the markets page (to preserve search when navigating away and back)
      setSearchQuery('');
    }
  }, [location.search, location.pathname]);

  // Debounced navigation function
  const debouncedNavigate = (query: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        history.push(`/markets?search=${encodeURIComponent(query)}`);
      } else {
        history.push('/markets');
      }
    }, 500); // 500ms delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <IonHeader>
      <IonToolbar>
        {/* Mobile: Logo/Title and Menu */}
        <div slot="start" className="flex items-center md:hidden">
          <div onClick={() => history.push('/')} className="cursor-pointer flex items-center gap-2 py-2">
            <img 
              src="/logo.png" 
              alt="ACBMarket" 
              className="h-6 w-auto rounded ml-2"
            />
            <IonTitle 
              className="flex-shrink-0 text-lg pl-0 font-dm-sans font-extrabold my-0 leading-none" 
              style={{ 
                paddingTop: '0', 
                paddingBottom: '0', 
                lineHeight: '1.2'
              }}
            >
              ACBMarket
            </IonTitle>
          </div>
        </div>

        {/* Desktop: Logo/Title and Search */}
        <div slot="start" className="hidden md:flex items-center">
          <div onClick={() => history.push('/')} className="cursor-pointer flex items-center gap-2 mr-4">
            <img src="/logo.png" alt="ACBMarket" className="h-8 w-auto rounded ml-2" />
            <IonTitle className="flex-shrink-0 pl-0 font-dm-sans font-extrabold">ACBMarket</IonTitle>
          </div>
          <div className="flex">
            <IonSearchbar
              value={searchQuery}
              onIonInput={(e) => {
                const value = e.detail.value || '';
                setSearchQuery(value);
                // Debounce navigation to prevent losing focus
                debouncedNavigate(value);
              }}
              onIonClear={() => {
                setSearchQuery('');
                // Clear timeout and navigate immediately on clear
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                history.push('/markets');
              }}
              placeholder="Search ACBMarket..."
              className="searchbar-custom searchbar-compact"
            />
          </div>
        </div>

        {/* Mobile: Right side buttons (How it Works, theme, notifications and menu) */}
        <IonButtons slot="end" className="md:hidden">
          <button
            onClick={() => setIsHowItWorksOpen(true)}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 rounded-lg transition-colors relative z-10"
            aria-label="How it Works"
            type="button"
          >
            <QuestionMarkCircleIcon className="w-6 h-6 pointer-events-none" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 rounded-lg transition-colors relative z-10"
            aria-label="Toggle theme"
            type="button"
          >
            {isDark ? <SunIcon className="w-6 h-6 pointer-events-none" /> : <MoonIcon className="w-6 h-6 pointer-events-none" />}
          </button>
          {isAuthenticated && <NotificationBell />}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 rounded-lg transition-colors relative z-10"
            aria-label="Open menu"
            type="button"
          >
            <Bars3Icon className="w-6 h-6 pointer-events-none" />
          </button>
        </IonButtons>

        {/* Desktop: All buttons */}
        <IonButtons slot="end" className="hidden md:flex header-buttons">
          <IonButton onClick={() => setIsHowItWorksOpen(true)} fill="clear" className="text-gray-700 dark:text-gray-300 font-dm-sans">
            <IonIcon icon={helpCircle} slot="start" />
            <span className="text-xs">How it Works</span>
          </IonButton>
          <IonButton onClick={toggleTheme} fill="clear" className="theme-toggle font-dm-sans">
            <IonIcon icon={isDark ? sunny : moon} />
          </IonButton>
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <IonButton onClick={() => history.push('/purchase')} className="bg-primary-600 text-white rounded-md font-dm-sans">
                <IonIcon icon={wallet} slot="start" />
                <span className="hidden lg:inline text-xs">₱{user?.chips?.toLocaleString() || '0'}</span>
                <span className="lg:hidden text-xs">₱{user?.chips?.toLocaleString() || '0'}</span>
              </IonButton>
              <IonButton onClick={() => history.push('/profile')} className="button-primary font-dm-sans">
                <IonIcon icon={person} slot="start" />
                <span className="hidden lg:inline text-xs">{user?.display_name || 'Profile'}</span>
              </IonButton>
              <IonButton onClick={() => history.push('/markets')} className="button-primary font-dm-sans">
                <IonIcon icon={statsChart} slot="start" />
                <span className="hidden lg:inline text-xs">Markets</span>
              </IonButton>
              <IonButton onClick={() => history.push('/leaderboard')} className="button-primary font-dm-sans">
                <IonIcon icon={trophy} slot="start" />
                <span className="hidden lg:inline text-xs">Leaderboard</span>
              </IonButton>
              {user?.is_admin && (
                <IonButton onClick={() => history.push('/admin')} className="bg-gray-200 text-black rounded-md font-dm-sans">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline text-xs">Admin</span>
                </IonButton>
              )}
              {(user?.is_admin || user?.is_market_moderator) && (
                <>
                  <IonButton onClick={() => history.push('/admin/markets')} className="bg-gray-200 text-black rounded-md font-dm-sans">
                    <IonIcon icon={settingsOutline} slot="start" />
                    <span className="hidden lg:inline text-xs">Manage Markets</span>
                  </IonButton>
                  <IonButton onClick={() => history.push('/admin/markets/create')} className="bg-gray-200 text-black rounded-md font-dm-sans">
                    <IonIcon icon={add} slot="start" />
                    <span className="hidden lg:inline text-xs">Create Market</span>
                  </IonButton>
                </>
              )}
              <IonButton 
                onClick={() => {
                  logout();
                  history.push('/');
                }} 
                className="bg-gray-100 text-black rounded-md font-dm-sans"
              >
                <IonIcon icon={logOut} slot="start" />
                <span className="hidden lg:inline text-xs">Logout</span>
              </IonButton>
            </>
          ) : (
            <>
              <IonButton onClick={() => history.push('/login')} className="button-primary font-dm-sans">
                <IonIcon icon={logIn} slot="start" />
                <span className="hidden lg:inline text-xs">Log In</span>
              </IonButton>
              <IonButton onClick={() => history.push('/register')} className="bg-primary-600 text-white rounded-md font-dm-sans">
                <IonIcon icon={personAdd} slot="start" />
                <span className="hidden lg:inline text-xs">Sign Up</span>
              </IonButton>
            </>
          )}
        </IonButtons>
      </IonToolbar>

      {/* Mobile Search Bar - Below header */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => {
            const value = e.detail.value || '';
            setSearchQuery(value);
            // Debounce navigation to prevent losing focus
            debouncedNavigate(value);
          }}
          onIonClear={() => {
            setSearchQuery('');
            // Clear timeout and navigate immediately on clear
            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }
            history.push('/markets');
          }}
          placeholder="Search ACBMarket..."
          className="searchbar-custom"
        />
      </div>

      {/* Mobile Menu Modal */}
      <IonModal isOpen={isMobileMenuOpen} onDidDismiss={() => setIsMobileMenuOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Menu</IonTitle>
            <div slot="end" className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="space-y-2 py-2">
            <button
              onClick={() => {
                setIsHowItWorksOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-dm-sans active:scale-[0.98]"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-base">How it Works</span>
            </button>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    history.push('/purchase');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 bg-[#f7b801] hover:bg-[#e0a600] active:scale-[0.98] text-black font-semibold rounded-lg transition-all duration-150 font-dm-sans"
                >
                  <WalletIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base">Buy Chips (₱{user?.chips?.toLocaleString() || '0'})</span>
                </button>
                <button
                  onClick={() => {
                    history.push('/profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-dm-sans active:scale-[0.98]"
                >
                  <UserIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base">Profile</span>
                </button>
                <button
                  onClick={() => {
                    history.push('/markets');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-dm-sans active:scale-[0.98]"
                >
                  <ChartBarIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base">Markets</span>
                </button>
                <button
                  onClick={() => {
                    history.push('/leaderboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-dm-sans active:scale-[0.98]"
                >
                  <TrophyIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base">Leaderboard</span>
                </button>
                {user?.is_admin && (
                  <button
                    onClick={() => {
                      history.push('/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-dm-sans active:scale-[0.98]"
                  >
                    <UserGroupIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-base">Admin Panel</span>
                  </button>
                )}
                {(user?.is_admin || user?.is_market_moderator) && (
                  <>
                    <button
                      onClick={() => {
                        history.push('/admin/markets');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-dm-sans active:scale-[0.98]"
                    >
                      <Cog6ToothIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-base">Manage Markets</span>
                    </button>
                    <button
                      onClick={() => {
                        history.push('/admin/markets/create');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-dm-sans active:scale-[0.98]"
                    >
                      <PlusIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-base">Create Market</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    history.push('/');
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-dm-sans active:scale-[0.98]"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    history.push('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 bg-[#f7b801] hover:bg-[#e0a600] active:scale-[0.98] text-black font-semibold rounded-lg transition-all duration-150 font-dm-sans"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base">Log In</span>
                </button>
                <button
                  onClick={() => {
                    history.push('/register');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 border-2 border-[#f7b801] hover:bg-[#f7b801]/10 active:scale-[0.98] text-[#f7b801] font-semibold rounded-lg transition-all duration-150 font-dm-sans"
                >
                  <UserPlusIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base">Sign Up</span>
                </button>
              </>
            )}
          </div>
        </IonContent>
      </IonModal>

      <HowItWorksModal isOpen={isHowItWorksOpen} onDismiss={() => setIsHowItWorksOpen(false)} />
    </IonHeader>
  );
};

export default Header;

