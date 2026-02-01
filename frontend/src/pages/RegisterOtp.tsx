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
import { close, keypadOutline } from 'ionicons/icons';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PENDING_REGISTRATION_KEY = 'pendingRegistration';

interface PendingRegistration {
  displayName: string;
  password: string;
  contactNumber: string;
}

const RegisterOtp: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pending, setPending] = useState<PendingRegistration | null>(null);
  const { registerVerifyOtp, sendRegistrationOtp } = useAuth();
  const history = useHistory();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
      if (!raw) {
        history.replace('/register');
        return;
      }
      const data = JSON.parse(raw) as PendingRegistration;
      if (!data.contactNumber || !data.displayName || !data.password) {
        sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
        history.replace('/register');
        return;
      }
      setPending(data);
    } catch {
      sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
      history.replace('/register');
    }
  }, [history]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const maskContactNumber = (contactNumber: string) => {
    if (!contactNumber || contactNumber.length < 10) return '+63 *** *** ****';
    const digits = contactNumber.replace(/\D/g, '').slice(-10);
    const last4 = digits.slice(-4);
    return `+63 *** *** ${last4}`;
  };

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    setError('');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pending || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      await registerVerifyOtp({
        contact_number: pending.contactNumber,
        otp,
        display_name: pending.displayName,
        password: pending.password,
      });
      sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
      history.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pending || resendCooldown > 0) return;
    setError('');
    try {
      await sendRegistrationOtp(pending.contactNumber);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  if (pending === null) {
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
                Verify your phone number
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
                Enter verification code
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm md:text-base">
                We sent a 6-digit code to {maskContactNumber(pending.contactNumber)}
              </p>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg animate-fade-in">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
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
                      Verifying...
                    </>
                  ) : (
                    'Verify'
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

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Wrong number?{' '}
                  <Link
                    to="/register"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold transition-colors"
                    onClick={() => sessionStorage.removeItem(PENDING_REGISTRATION_KEY)}
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

export default RegisterOtp;
