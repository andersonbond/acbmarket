import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { callOutline } from 'ionicons/icons';
import { Link, useHistory } from 'react-router-dom';
import api from '../services/api';

const FORGOT_PASSWORD_CONTACT_KEY = 'forgotPasswordContactNumber';

const ForgotPassword: React.FC = () => {
  const [contactNumberDigits, setContactNumberDigits] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  const handleContactNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setContactNumberDigits(digits);
  };

  const validateContactNumber = () => contactNumberDigits.length === 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateContactNumber()) return;
    setIsLoading(true);
    const fullContactNumber = '+63' + contactNumberDigits;

    try {
      const response = await api.post('/api/v1/auth/send-forgot-password-otp', {
        contact_number: fullContactNumber,
      });
      if (response.data.success) {
        sessionStorage.setItem(FORGOT_PASSWORD_CONTACT_KEY, fullContactNumber);
        history.push('/forgot-password-otp');
      } else {
        setError(response.data.errors?.[0]?.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to send verification code. Please try again.');
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

              <p className="text-gray-600 mb-6">
                Enter your contact number and we'll send you a verification code to reset your password.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <style>{`
                  .contact-number-wrapper {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    gap: 0.5rem;
                  }
                  .contact-number-prefix {
                    user-select: none;
                    pointer-events: none;
                    font-weight: 500;
                  }
                `}</style>
                <div className="mb-6">
                  <IonItem className="rounded-lg mb-2" lines="none">
                    <IonLabel position="stacked">Contact Number</IonLabel>
                    <div className="contact-number-wrapper">
                      <span className="contact-number-prefix text-gray-700 dark:text-gray-300 font-medium">+63</span>
                      <IonInput
                        type="tel"
                        value={contactNumberDigits}
                        onIonInput={(e) => handleContactNumberChange(e.detail.value!)}
                        placeholder="9123456789"
                        required
                        maxlength={10}
                        className="flex-1"
                      />
                    </div>
                  </IonItem>
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-4">
                    Format: +63 followed by 10 digits (e.g., 9123456789)
                  </p>
                  {contactNumberDigits.length > 0 && !validateContactNumber() && (
                    <p className="text-xs text-red-500 px-4">Must be exactly 10 digits</p>
                  )}
                </div>

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={isLoading || !validateContactNumber()}
                  className="mb-4 h-12 font-semibold button-primary"
                >
                  <IonIcon icon={callOutline} slot="start" />
                  {isLoading ? 'Sending...' : 'Send verification code'}
                </IonButton>
              </form>

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

