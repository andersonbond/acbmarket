import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { lockClosed } from 'ionicons/icons';
import { useHistory, useParams, Link } from 'react-router-dom';
import api from '../services/api';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/api/v1/auth/reset-password', {
        token,
        new_password: password,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          history.push('/login');
        }, 2000);
      } else {
        setError(response.data.errors?.[0]?.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">ACBMarket</h1>
              <p className="text-gray-600 dark:text-gray-400">Reset your password</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">New Password</h2>

              {success ? (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">
                    Password reset successfully! Redirecting to login...
                  </p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <IonItem className="rounded-lg mb-2" lines="none">
                        <IonLabel position="stacked">New Password</IonLabel>
                        <IonInput
                          type="password"
                          value={password}
                          onIonInput={(e) => setPassword(e.detail.value!)}
                          placeholder="At least 8 characters"
                          required
                        />
                      </IonItem>
                    </div>

                    <div className="mb-6">
                      <IonItem className="rounded-lg mb-2" lines="none">
                        <IonLabel position="stacked">Confirm Password</IonLabel>
                        <IonInput
                          type="password"
                          value={confirmPassword}
                          onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                          placeholder="Confirm your password"
                          required
                        />
                      </IonItem>
                    </div>

                    <IonButton
                      expand="block"
                      type="submit"
                      disabled={isLoading}
                      className="mb-4 h-12 font-semibold button-primary"
                    >
                      <IonIcon icon={lockClosed} slot="start" />
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </IonButton>
                  </form>
                </>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;

