import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import Header from '../components/Header';
import { useSEO } from '../hooks/useSEO';

const PrivacyPolicy: React.FC = () => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useSEO({
    title: 'Privacy Policy',
    description: 'Read ACBMarket\'s Privacy Policy. Learn how we collect, use, and protect your personal information on the Philippine prediction market platform.',
    keywords: 'privacy policy, data protection, ACBMarket privacy, user data, information security',
    canonical: `${baseUrl}/privacy`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'ACBMarket Privacy Policy',
      description: 'Privacy Policy for ACBMarket prediction platform',
      url: `${baseUrl}/privacy`,
    },
  });
  return (
    <IonPage>
      <Header />
      <IonContent>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Information We Collect</h2>
              <p className="mb-2">We collect the following types of information:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Account Information:</strong> Display name, contact number, email address (optional), password, and profile photo (avatar)</li>
                <li><strong>Usage Data:</strong> Your forecasts, market interactions, comments, platform activity, and purchase history</li>
                <li><strong>Reputation Data:</strong> Forecast accuracy, winning streaks, activity streaks, badges earned, and leaderboard rankings</li>
                <li><strong>Payment Data:</strong> Purchase transactions for virtual chips (processed through secure third-party payment providers)</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, usage patterns, and session data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Provide and maintain the service, including market forecasting and leaderboard features</li>
                <li>Calculate reputation scores, rank scores, and leaderboard rankings</li>
                <li>Process chip purchases and manage your virtual chip balance</li>
                <li>Send important service updates, notifications, and activity alerts</li>
                <li>Display your profile information, including avatar, badges, and statistics</li>
                <li>Moderate content and ensure compliance with our Terms of Service</li>
                <li>Improve our platform and user experience through analytics</li>
                <li>Prevent fraud, detect abuse, and ensure platform security</li>
                <li>Resolve disputes and enforce our policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist in operating the platform (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Public Information</h2>
              <p className="mb-2">
                The following information is publicly visible on ACBMarket:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Display name and profile photo (avatar)</li>
                <li>Reputation score and rank score</li>
                <li>Badges earned and achievements</li>
                <li>Leaderboard position and rankings</li>
                <li>Public forecasts on resolved markets (won/lost status)</li>
                <li>Comments posted on markets (unless deleted)</li>
                <li>Activity feed entries (forecast placements, market resolutions, etc.)</li>
              </ul>
              <p className="mt-2">
                Your contact number, email address, password, purchase history, and active (pending) forecasts are kept private 
                and never shared publicly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Data Security</h2>
              <p className="mb-2">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure password hashing (bcrypt) - passwords are never stored in plain text</li>
                <li>Secure file storage for uploaded avatars</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure payment processing through trusted third-party providers</li>
              </ul>
              <p className="mt-2">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your personal 
                information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Export your data</li>
                <li>Opt-out of non-essential communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Cookies and Tracking</h2>
              <p className="mb-2">
                We use cookies and similar technologies for the following purposes:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>Authentication:</strong> To maintain your login session and remember your authentication state</li>
                <li><strong>Preferences:</strong> To remember your theme preferences (light/dark mode) and other settings</li>
                <li><strong>Analytics:</strong> To analyze platform usage and improve user experience</li>
                <li><strong>Security:</strong> To detect and prevent fraudulent activity</li>
              </ul>
              <p className="mt-2">
                You can control cookies through your browser settings. However, disabling cookies may affect your ability 
                to use certain features of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Children's Privacy</h2>
              <p>
                ACBMarket is not intended for users under 18 years of age. We do not knowingly collect personal information 
                from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of significant changes via email 
                or platform notifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide you services. 
                If you delete your account, we will delete or anonymize your personal information, except where we are required 
                to retain it for legal, regulatory, or legitimate business purposes (such as transaction records for financial 
                compliance). Public information, such as resolved forecasts and comments, may remain visible in anonymized form 
                for historical record-keeping.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> <a href="mailto:support@acbmarket.com" className="text-primary-600 dark:text-primary-400 hover:underline">support@acbmarket.com</a>
              </p>
              <p className="mt-2">
                We will respond to your inquiry within a reasonable timeframe, typically within 7-10 business days.
              </p>
            </section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPolicy;

