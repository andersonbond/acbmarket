import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { close, keypadOutline, lockClosedOutline } from 'ionicons/icons';
import { useHistory, Link } from 'react-router-dom';
import api from '../services/api';

const FORGOT_PASSWORD_CONTACT_KEY = 'forgotPasswordContactNumber';

const ForgotPasswordOtp: React.FC = () => {
  const [contactNumber, setContactNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const history = useHistory();

  useEffect(() => {
    const stored = sessionStorage.getItem(FORGOT_PASSWORD_CONTACT_KEY);
    if (!stored) {
      history.replace('/forgot-password');
      return;
    }
    setContactNumber(stored);
  }, [history]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const maskContactNumber = (cn: string) => {
    if (!cn || cn.length < 10) return '+63 *** *** ****';
    const digits = cn.replace(/\D/g, '').slice(-10);
    const last4 = digits.slice(-4);
    return `+63 *** *** ${last4}`;
  };

  const handleOtpChange = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, 6));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!contactNumber || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/api/v1/auth/reset-password-with-otp', {
        contact_number: contactNumber,
        otp,
        new_password: password,
      });
      if (response.data.success) {
        setSuccess(true);
        sessionStorage.removeItem(FORGOT_PASSWORD_CONTACT_KEY);
        setTimeout(() => history.push('/login'), 2000);
      } else {
        setError(response.data.errors?.[0]?.message || 'Invalid or expired code');
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!contactNumber || resendCooldown > 0) return;
    setError('');
    try {
      await api.post('/api/v1/auth/send-forgot-password-otp', {
        contact_number: contactNumber,
      });
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to resend code.');
    }
  };

  if (!contactNumber) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="min-h-screen flex items-center justify-center">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-4 md:py-8">
          <div className="max-w-md w-full">
            <div className="flex justify-end mb-1 md:mb-2">
              <IonButton
                fill="clear"
                onClick={() => history.push('/')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                size="default"
              >
                <IonIcon icon={close} slot="icon-only" className="text-xl md:text-2xl" />
              </IonButton>
            </div>

            <div className="text-center mb-4 md:mb-8">
              <div className="flex justify-center mb-2 md:mb-4">
                <img
                  src="/logo.png"
                  alt="ACBMarket"
                  className="h-12 md:h-16 w-auto rounded-lg shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-dm-sans font-extrabold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-1 md:mb-2">
                ACBMarket
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-lg">
                Reset your password
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
                Enter code and new password
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm md:text-base">
                We sent a 6-digit code to {maskContactNumber(contactNumber)}
              </p>

              {success ? (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    Password reset successfully! Redirecting to login...
                  </p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg animate-fade-in">
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <IonItem
                      className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors w-full"
                      lines="none"
                    >
                      <IonIcon
                        icon={keypadOutline}
                        slot="start"
                        className="text-gray-400 dark:text-gray-500 text-xl"
                      />
                      <IonLabel
                        position="stacked"
                        className="text-gray-700 dark:text-gray-300 font-medium text-sm md:text-base"
                      >
                        Verification code
                      </IonLabel>
                      <IonInput
                        type="tel"
                        inputMode="numeric"
                        value={otp}
                        onIonInput={(e) => handleOtpChange(e.detail.value ?? '')}
                        placeholder="000000"
                        maxlength={6}
                        autocomplete="one-time-code"
                        className="w-full text-center text-xl tracking-widest"
                      />
                    </IonItem>

                    <IonItem
                      className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors w-full"
                      lines="none"
                    >
                      <IonIcon
                        icon={lockClosedOutline}
                        slot="start"
                        className="text-gray-400 dark:text-gray-500 text-xl"
                      />
                      <IonLabel
                        position="stacked"
                        className="text-gray-700 dark:text-gray-300 font-medium text-sm md:text-base"
                      >
                        New password
                      </IonLabel>
                      <IonInput
                        type="password"
                        value={password}
                        onIonInput={(e) => setPassword(e.detail.value ?? '')}
                        placeholder="At least 8 characters"
                        minlength={8}
                        autocomplete="new-password"
                        className="w-full"
                      />
                    </IonItem>

                    <IonItem
                      className="rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors w-full"
                      lines="none"
                    >
                      <IonIcon
                        icon={lockClosedOutline}
                        slot="start"
                        className="text-gray-400 dark:text-gray-500 text-xl"
                      />
                      <IonLabel
                        position="stacked"
                        className="text-gray-700 dark:text-gray-300 font-medium text-sm md:text-base"
                      >
                        Confirm password
                      </IonLabel>
                      <IonInput
                        type="password"
                        value={confirmPassword}
                        onIonInput={(e) => setConfirmPassword(e.detail.value ?? '')}
                        placeholder="Confirm your password"
                        minlength={8}
                        autocomplete="new-password"
                        className="w-full"
                      />
                    </IonItem>

                    <button
                      type="submit"
                      disabled={isLoading || otp.length !== 6 || password.length < 8 || password !== confirmPassword}
                      className="w-full text-white text-center uppercase border-none rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-150 ease-in-out hover:-translate-y-0.5 disabled:hover:translate-y-0 mt-4"
                      style={{
                        padding: '12px 0',
                        background: '#1d4ed8',
                        fontSize: '16px',
                        fontWeight: 700,
                      }}
                    >
                      {isLoading ? (
                        <>
                          <IonSpinner name="crescent" />
                          Resetting...
                        </>
                      ) : (
                        'Reset password'
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendCooldown > 0}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendCooldown > 0
                          ? `Resend code in ${resendCooldown}s`
                          : 'Resend code'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Wrong number?{' '}
                  <Link
                    to="/forgot-password"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold transition-colors"
                    onClick={() => sessionStorage.removeItem(FORGOT_PASSWORD_CONTACT_KEY)}
                  >
                    Start over
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPasswordOtp;
