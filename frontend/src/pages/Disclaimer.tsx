import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import Header from '../components/Header';

const Disclaimer: React.FC = () => {
  return (
    <IonPage>
      <Header />
      <IonContent>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Disclaimer</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-red-900 dark:text-red-300 mb-3">Important Notice</h2>
              <p className="text-red-800 dark:text-red-200">
                ACBMarket is a virtual forecasting platform for entertainment and educational purposes only. 
                All chips are non-redeemable and have no monetary value.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">No Real Money Involved</h2>
              <p>
                ACBMarket operates using virtual, non-redeemable chips that cannot be converted to real money, 
                cryptocurrency, or any other form of currency. The platform is not a gambling site, betting platform, 
                or financial trading service. All chips are purely virtual and have no monetary value.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Not Financial Advice</h2>
              <p>
                The information, forecasts, and market data provided on ACBMarket are for entertainment purposes only 
                and should not be construed as financial, investment, or trading advice. We do not provide recommendations 
                or guidance on real-world financial decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Market Outcomes</h2>
              <p>
                Market outcomes are determined based on verifiable real-world events. However, ACBMarket makes no 
                guarantees about the accuracy, completeness, or timeliness of market resolutions. Past performance 
                does not guarantee future results.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">No Guarantees</h2>
              <p>
                ACBMarket is provided "as is" without any warranties, express or implied. We do not guarantee that 
                the service will be uninterrupted, error-free, or secure. Your use of the platform is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, ACBMarket and its operators shall not be liable for any direct, 
                indirect, incidental, special, or consequential damages arising from your use of the platform, including 
                but not limited to loss of data, reputation points, virtual chips, or any other losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Age Restrictions</h2>
              <p>
                ACBMarket is intended for users who are 18 years of age or older. By using the platform, you represent 
                and warrant that you are at least 18 years old and have the legal capacity to enter into this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Compliance with Laws</h2>
              <p>
                Users are responsible for ensuring their use of ACBMarket complies with all applicable local, state, 
                national, and international laws and regulations. ACBMarket operates in accordance with Philippine laws 
                and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Changes to Platform</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any aspect of ACBMarket at any time without 
                prior notice. This includes changes to features, market availability, or platform rules.
              </p>
            </section>

            <section className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-yellow-900 dark:text-yellow-300 mb-3">Acknowledgment</h2>
              <p className="text-yellow-800 dark:text-yellow-200">
                By using ACBMarket, you acknowledge that you have read, understood, and agree to be bound by this 
                disclaimer. If you do not agree with any part of this disclaimer, you must not use the platform.
              </p>
            </section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Disclaimer;

