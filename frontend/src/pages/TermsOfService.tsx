import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Header from '../components/Header';

const TermsOfService: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <Header />
      <IonContent>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using ACBMarket, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
              <p>
                ACBMarket is a Philippine prediction market platform that allows users to make forecasts on various events 
                using virtual, non-redeemable chips. This service is provided for entertainment and educational purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Virtual Chips</h2>
              <p>
                All chips used on ACBMarket are virtual and non-redeemable. They cannot be converted to real money, 
                cryptocurrency, or any other form of currency. Chips have no monetary value and are solely for use 
                within the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You agree to notify 
                us immediately of any unauthorized use of your account. You are responsible for all activities that occur 
                under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Use the service for any illegal purpose</li>
                <li>Attempt to manipulate market outcomes</li>
                <li>Create multiple accounts to gain unfair advantages</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Market Resolution</h2>
              <p>
                Markets are resolved based on verifiable real-world outcomes. ACBMarket reserves the right to determine 
                market resolution based on objective criteria. All resolution decisions are final.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Limitation of Liability</h2>
              <p>
                ACBMarket is provided "as is" without warranties of any kind. We are not liable for any damages arising 
                from your use of the service. This includes but is not limited to loss of data, reputation points, or virtual chips.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes 
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us through the platform's support channels.
              </p>
            </section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TermsOfService;

