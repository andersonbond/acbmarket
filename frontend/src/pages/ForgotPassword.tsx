import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { callOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword: React.FC = () => {
  const [contactNumber, setContactNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await api.post('/api/v1/auth/forgot-password', { contact_number: contactNumber });
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.errors?.[0]?.message || 'Failed to send reset link');
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to send reset link. Please try again.');
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Forgot Password</h2>

              {success ? (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">
                    Password reset link sent! Please check your contact method.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    Enter your contact number and we'll send you a link to reset your password.
                  </p>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <IonItem className="rounded-lg mb-2" lines="none">
                        <IonLabel position="stacked">Contact Number</IonLabel>
                        <IonInput
                          type="tel"
                          value={contactNumber}
                          onIonInput={(e) => setContactNumber(e.detail.value!)}
                          placeholder="+639123456789"
                          required
                          pattern="^\+63\d{10}$"
                        />
                      </IonItem>
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-4">
                        Format: +63XXXXXXXXXX (e.g., +639123456789)
                      </p>
                    </div>

                    <IonButton
                      expand="block"
                      type="submit"
                      disabled={isLoading || !contactNumber}
                      className="mb-4 h-12 font-semibold button-primary"
                    >
                      <IonIcon icon={callOutline} slot="start" />
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;

