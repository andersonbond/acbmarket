import React, { useState } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonCheckbox, IonIcon } from '@ionic/react';
import { personAdd, close } from 'ionicons/icons';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [contactNumber, setContactNumber] = useState('+63');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const history = useHistory();

  const handleContactNumberChange = (value: string) => {
    // Ensure it always starts with +63
    if (!value.startsWith('+63')) {
      setContactNumber('+63');
      return;
    }
    // Only allow digits after +63, max 10 digits
    const digits = value.replace('+63', '').replace(/\D/g, '').slice(0, 10);
    setContactNumber('+63' + digits);
  };

  const validateContactNumber = (): boolean => {
    // Format: +63 followed by exactly 10 digits
    const pattern = /^\+63\d{10}$/;
    return pattern.test(contactNumber);
  };

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

    if (!validateContactNumber()) {
      setError('Contact number must be in format +63XXXXXXXXXX (10 digits after +63)');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms of Service');
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password, display_name: displayName, contact_number: contactNumber });
      history.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
          <div className="max-w-md w-full">
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <IonButton fill="clear" onClick={() => history.push('/')} className="text-gray-600 dark:text-gray-400">
                <IonIcon icon={close} />
              </IonButton>
            </div>

            {/* Logo/Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Pilimarket</h1>
              <p className="text-gray-600 dark:text-gray-400">Create your account</p>
            </div>

            {/* Register Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Sign Up</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <IonItem className="rounded-lg mb-2" lines="none">
                    <IonLabel position="stacked">Display Name</IonLabel>
                    <IonInput
                      type="text"
                      value={displayName}
                      onIonInput={(e) => setDisplayName(e.detail.value!)}
                      placeholder="Choose a display name"
                      required
                      minlength={3}
                      maxlength={50}
                      autocomplete="username"
                    />
                  </IonItem>
                </div>

                <div className="mb-4">
                  <IonItem className="rounded-lg mb-2" lines="none">
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput
                      type="email"
                      value={email}
                      onIonInput={(e) => setEmail(e.detail.value!)}
                      placeholder="Enter your email"
                      required
                      maxlength={255}
                      autocomplete="email"
                    />
                  </IonItem>
                </div>

                <div className="mb-4">
                  <IonItem className="rounded-lg mb-2" lines="none">
                    <IonLabel position="stacked">Contact Number *</IonLabel>
                    <IonInput
                      type="tel"
                      value={contactNumber}
                      onIonInput={(e) => handleContactNumberChange(e.detail.value!)}
                      placeholder="+639123456789"
                      required
                      maxlength={13}
                    />
                  </IonItem>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                    Format: +63 followed by 10 digits (e.g., +639123456789)
                  </p>
                </div>

                <div className="mb-4">
                  <IonItem className="rounded-lg mb-2" lines="none">
                    <IonLabel position="stacked">Password</IonLabel>
                    <IonInput
                      type="password"
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value!)}
                      placeholder="At least 8 characters"
                      required
                      minlength={8}
                      maxlength={100}
                      autocomplete="new-password"
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
                      minlength={8}
                      maxlength={100}
                      autocomplete="new-password"
                    />
                  </IonItem>
                </div>

                <div className="mb-6">
                  <IonItem lines="none">
                    <IonCheckbox
                      checked={acceptedTerms}
                      onIonChange={(e) => setAcceptedTerms(e.detail.checked)}
                    />
                    <IonLabel className="ml-2 text-sm">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                        Terms of Service
                      </Link>
                    </IonLabel>
                  </IonItem>
                </div>

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={isLoading}
                  className="mb-4 h-12 font-semibold button-secondary"
                >
                  <IonIcon icon={personAdd} slot="start" />
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </IonButton>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign in
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

export default Register;

