import React, { useState, useEffect } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonSpinner, IonAlert } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { verifyAdminPassword } from '../services/admin';

interface AdminPurchaseProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const VERIFICATION_STORAGE_KEY = 'admin_purchase_verified';
const VERIFICATION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const AdminPurchaseProtectedRoute: React.FC<AdminPurchaseProtectedRouteProps> = ({ component: Component, ...rest }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if password was already verified in this session
    const checkVerification = () => {
      if (!isAuthenticated || !user?.is_admin) {
        setIsCheckingVerification(false);
        return;
      }

      const stored = sessionStorage.getItem(VERIFICATION_STORAGE_KEY);
      if (stored) {
        try {
          const { timestamp } = JSON.parse(stored);
          const now = Date.now();
          if (now - timestamp < VERIFICATION_EXPIRY_MS) {
            setIsPasswordVerified(true);
            setIsCheckingVerification(false);
            return;
          } else {
            // Expired, remove it
            sessionStorage.removeItem(VERIFICATION_STORAGE_KEY);
          }
        } catch (e) {
          sessionStorage.removeItem(VERIFICATION_STORAGE_KEY);
        }
      }

      setIsCheckingVerification(false);
      setShowPasswordModal(true);
    };

    if (!isLoading) {
      checkVerification();
    }
  }, [isAuthenticated, isLoading, user]);

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const response = await verifyAdminPassword(password);
      if (response.success) {
        // Store verification state
        sessionStorage.setItem(
          VERIFICATION_STORAGE_KEY,
          JSON.stringify({ timestamp: Date.now() })
        );
        setIsPasswordVerified(true);
        setShowPasswordModal(false);
        setPassword('');
      } else {
        setErrorMessage('Incorrect password. Please try again.');
      }
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.detail || 'Failed to verify password. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading || isCheckingVerification) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={{ pathname: '/login', state: { from: rest.location } }} />;
  }

  if (!user?.is_admin) {
    return <Redirect to={{ pathname: '/', state: { from: rest.location } }} />;
  }

  return (
    <>
      <IonModal isOpen={showPasswordModal && !isPasswordVerified} backdropDismiss={false}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Admin Password Required</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="max-w-md mx-auto py-6">
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Please enter your admin password to access the Admin Purchase page.
              </p>
              <IonItem className="ion-no-padding mb-4">
                <IonLabel position="stacked">Password</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                  placeholder="Enter your password"
                  className="mt-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit();
                    }
                  }}
                />
              </IonItem>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300">{errorMessage}</p>
                </div>
              )}
            </div>
            <IonButton
              expand="block"
              onClick={handlePasswordSubmit}
              disabled={isVerifying || !password.trim()}
              className="button-primary"
            >
              {isVerifying ? (
                <>
                  <IonSpinner name="crescent" slot="start" />
                  Verifying...
                </>
              ) : (
                'Verify Password'
              )}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {isPasswordVerified && <Route {...rest} render={(props) => <Component {...props} />} />}
    </>
  );
};

export default AdminPurchaseProtectedRoute;
