import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Header from '../components/Header';
import { useSEO } from '../hooks/useSEO';

const TermsOfService: React.FC = () => {
  const history = useHistory();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useSEO({
    title: 'Terms of Service',
    description: 'Read ACBMarket\'s Terms of Service. Learn about user responsibilities, account policies, virtual chips, and platform rules for the Philippine prediction market.',
    keywords: 'terms of service, ACBMarket terms, user agreement, platform rules, virtual chips policy',
    canonical: `${baseUrl}/terms`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'ACBMarket Terms of Service',
      description: 'Terms of Service for ACBMarket prediction platform',
      url: `${baseUrl}/terms`,
    },
  });

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
              <p className="mb-2">
                By accessing, browsing, or using ACBMarket ("the Platform", "the Service", "we", "us", or "our"), you acknowledge 
                that you have read, understood, and agree to be bound by these Terms of Service ("Terms") and all applicable laws 
                and regulations. If you do not agree with any part of these Terms, you must not access or use the Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and ACBMarket. By creating an account or using the 
                Service, you represent that you have the legal capacity to enter into this agreement. If you are using the Service 
                on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
              <p className="mb-2">
                ACBMarket is a Philippine prediction market platform that allows users to make forecasts on various events 
                using virtual, non-redeemable chips. This service is provided for entertainment and educational purposes only.
              </p>
              <p className="mb-2">The Platform provides the following features:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Market forecasting on various events across multiple categories (politics, sports, entertainment, economy, etc.)</li>
                <li>Virtual chip-based trading system for making predictions</li>
                <li>Reputation and leaderboard system based on forecast accuracy</li>
                <li>User profiles with badges, statistics, and activity tracking</li>
                <li>Social features including comments, activity feeds, and user interactions</li>
                <li>Market resolution based on verifiable real-world outcomes</li>
                <li>Administrative tools for market creation and management (for authorized users)</li>
              </ul>
              <p className="mt-2">
                ACBMarket reserves the right to modify, suspend, or discontinue any aspect of the Service at any time, with or 
                without notice. We do not guarantee that the Service will be available at all times or that it will be error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Eligibility and Age Requirements</h2>
              <p className="mb-2">
                To use ACBMarket, you must:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain only one account per person</li>
                <li>Comply with all applicable laws and regulations in your jurisdiction</li>
              </ul>
              <p className="mt-2">
                If you are under 18, you may not use the Service. If we discover that a user is underage, we will immediately 
                terminate their account and delete all associated data. By using the Service, you represent and warrant that 
                you meet all eligibility requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Virtual Chips</h2>
              <p className="mb-2">
                All chips used on ACBMarket are virtual and non-redeemable. They cannot be converted to real money, 
                cryptocurrency, or any other form of currency. Chips have no monetary value and are solely for use 
                within the platform.
              </p>
              <p className="mb-2">Important points regarding virtual chips:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Chips are virtual tokens with no real-world monetary value</li>
                <li>Chips cannot be transferred, sold, or exchanged outside the platform</li>
                <li>Chips may be earned through accurate forecasts or purchased through the platform</li>
                <li>ACBMarket reserves the right to adjust chip balances in cases of errors, fraud, or policy violations</li>
                <li>All chip transactions are final and non-reversible</li>
                <li>Chips may be forfeited upon account suspension or termination</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. User Accounts and Registration</h2>
              <p className="mb-2">
                To use certain features of the Service, you must create an account by providing accurate, current, and complete 
                information, including:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>A valid display name (minimum 3 characters)</li>
                <li>A valid contact number (Philippine mobile number format)</li>
                <li>A secure password (minimum 8 characters)</li>
                <li>Optional: Email address and profile photo</li>
              </ul>
              <p className="mb-2">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use or security breach</li>
                <li>Ensuring your account information remains accurate and up-to-date</li>
                <li>Using a strong, unique password and not sharing it with others</li>
              </ul>
              <p>
                You may not create multiple accounts, use another user's account, or allow others to use your account. Each 
                person is limited to one account. Violation of this policy may result in immediate account termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Use the service for any illegal purpose</li>
                <li>Attempt to manipulate market outcomes</li>
                <li>Create multiple accounts to gain unfair advantages</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Post offensive, defamatory, or inappropriate content in comments</li>
                <li>Attempt to hack, exploit, or compromise the platform's security</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. User Content and Comments</h2>
              <p className="mb-2">
                The Platform allows users to post comments, interact with markets, and share content. By posting content, you grant 
                ACBMarket a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the Platform.
              </p>
              <p className="mb-2">You agree that all content you post:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>Is accurate and not misleading</li>
                <li>Does not violate any third-party rights (copyright, trademark, privacy, etc.)</li>
                <li>Is not defamatory, harassing, threatening, or abusive</li>
                <li>Does not contain spam, malware, or malicious code</li>
                <li>Complies with all applicable laws and regulations</li>
                <li>Does not contain personal information of others without consent</li>
              </ul>
              <p>
                ACBMarket reserves the right to review, edit, delete, or remove any user content at any time, for any reason, 
                without prior notice. We are not obligated to monitor user content but may do so to ensure compliance with these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Account Suspension and Termination</h2>
              <p className="mb-3">
                ACBMarket reserves the right to suspend or permanently ban accounts that violate these Terms of Service. 
                We may take action, including but not limited to account suspension or termination, if we determine that a user has:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>Used the service for any illegal purpose</li>
                <li>Attempted to manipulate market outcomes</li>
                <li>Created multiple accounts to gain unfair advantages</li>
                <li>Harassed, abused, or harmed other users</li>
                <li>Violated any applicable laws or regulations</li>
                <li>Engaged in fraudulent activities or attempted to exploit the platform</li>
                <li>Shared account credentials or allowed unauthorized access</li>
                <li>Posted content that is offensive, defamatory, or violates community standards</li>
              </ul>
              <p>
                Suspended or banned accounts will lose access to the platform. All virtual chips, reputation points, badges, 
                and other account data associated with a banned account may be forfeited. Decisions regarding account suspension 
                or termination are at the sole discretion of ACBMarket and are final.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Market Resolution</h2>
              <p>
                Markets are resolved based on verifiable real-world outcomes. ACBMarket reserves the right to determine 
                market resolution based on objective criteria. Market moderators and administrators review each market 
                and determine outcomes using evidence, official sources, and objective criteria. All resolution decisions are final.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Virtual Chips and Purchases</h2>
              <p className="mb-2">
                Virtual chips can be purchased through the platform using approved payment methods. All chip purchases are final 
                and non-refundable. Chips remain virtual and non-redeemable regardless of how they were obtained. ACBMarket 
                reserves the right to modify chip pricing, availability, and purchase limits at any time.
              </p>
              <p className="mb-2">Payment Terms:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>All purchases are processed through secure third-party payment providers</li>
                <li>You must use a valid payment method that you are authorized to use</li>
                <li>All prices are displayed in Philippine Peso (₱) and are subject to change without notice</li>
                <li>Refunds are only available in cases of technical errors or duplicate charges, at our sole discretion</li>
                <li>ACBMarket is not responsible for payment processing fees charged by payment providers</li>
                <li>Failed payments may result in transaction cancellation</li>
              </ul>
              <p className="mb-2">Purchase Limits:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>ACBMarket may impose daily, weekly, or monthly purchase limits</li>
                <li>Limits may vary based on account status, verification level, or other factors</li>
                <li>We reserve the right to refuse or cancel any purchase at our discretion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Termination by User</h2>
              <p className="mb-2">
                You may terminate your account at any time by contacting support at support@acbmarket.com or through your account 
                settings (if available). Upon termination:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>Your account will be deactivated and you will lose access to the Service</li>
                <li>All virtual chips, reputation points, badges, and other account data will be permanently deleted</li>
                <li>Your public content (comments, resolved forecasts) may remain visible in anonymized form</li>
                <li>You will not be entitled to any refund for purchased chips or services</li>
                <li>Provisions of these Terms that by their nature should survive termination will remain in effect</li>
              </ul>
              <p>
                Account deletion is permanent and irreversible. Please ensure you have exported any data you wish to keep before 
                requesting account deletion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">12. Intellectual Property</h2>
              <p className="mb-2">
                All content on ACBMarket, including but not limited to text, graphics, logos, images, software, market data, 
                and platform design, is the property of ACBMarket or its content suppliers and is protected by copyright, 
                trademark, and other intellectual property laws.
              </p>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>Reproduce, distribute, or create derivative works from any ACBMarket content without express written permission</li>
                <li>Use ACBMarket's trademarks, logos, or branding without authorization</li>
                <li>Reverse engineer, decompile, or disassemble any software or technology used by the Platform</li>
                <li>Scrape, crawl, or use automated tools to extract data from the Platform</li>
                <li>Use ACBMarket content for commercial purposes without a license</li>
              </ul>
              <p>
                You retain ownership of content you post on the Platform, but grant ACBMarket a license to use, display, and 
                distribute such content as described in Section 7 (User Content and Comments).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">13. Disclaimers and Warranties</h2>
              <p className="mb-2">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
                <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
                <li>Warranties regarding the accuracy, reliability, or completeness of market information</li>
                <li>Warranties that defects will be corrected</li>
              </ul>
              <p>
                ACBMarket does not guarantee that market outcomes will be resolved correctly, that the Service will be available 
                at all times, or that it will meet your specific requirements. You use the Service at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">14. Limitation of Liability</h2>
              <p className="mb-2">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ACBMARKET AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT 
                BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>Loss of data, reputation points, virtual chips, or account access</li>
                <li>Loss of profits, revenue, or business opportunities</li>
                <li>Loss of goodwill or reputation</li>
                <li>Cost of substitute services</li>
                <li>Damages resulting from unauthorized access to your account</li>
                <li>Damages resulting from errors, bugs, or technical failures</li>
              </ul>
              <p className="mb-2">
                Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid 
                for chips in the 12 months preceding the claim, or ₱1,000 (Philippine Peso), whichever is greater.
              </p>
              <p>
                Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so some of the 
                above limitations may not apply to you. In such cases, our liability will be limited to the maximum extent 
                permitted by applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">15. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless ACBMarket and its officers, directors, employees, and agents 
                from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) 
                arising out of or related to: (a) your use of the Service, (b) your violation of these Terms, (c) your violation 
                of any rights of another party, (d) your user content, or (e) your violation of any applicable laws or regulations. 
                This indemnification obligation will survive termination of these Terms and your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">16. Third-Party Services</h2>
              <p className="mb-2">
                The Service may integrate with or link to third-party services, including payment processors, analytics providers, 
                and other services. Your use of third-party services is subject to their respective terms of service and privacy 
                policies. ACBMarket is not responsible for:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>The availability, accuracy, or reliability of third-party services</li>
                <li>Any transactions or interactions between you and third-party service providers</li>
                <li>Any damages or losses resulting from your use of third-party services</li>
                <li>The privacy practices or data handling of third-party services</li>
              </ul>
              <p>
                We encourage you to review the terms and privacy policies of any third-party services you use in connection 
                with ACBMarket.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">17. Dispute Resolution</h2>
              <p className="mb-2">
                If you have a dispute with ACBMarket, you agree to first contact us at support@acbmarket.com to attempt to 
                resolve the dispute informally. If we cannot resolve the dispute within 30 days, you agree to resolve the 
                dispute through binding arbitration in accordance with the rules of the Philippine Dispute Resolution Center, 
                or as otherwise agreed upon by both parties.
              </p>
              <p className="mb-2">
                You agree that any dispute will be resolved individually, and you will not participate in any class action, 
                collective action, or representative proceeding against ACBMarket.
              </p>
              <p>
                Notwithstanding the above, either party may seek injunctive relief in any court of competent jurisdiction to 
                protect intellectual property rights or to prevent irreparable harm.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">18. Geographic Restrictions</h2>
              <p>
                ACBMarket is designed for users in the Philippines. While we may allow access from other jurisdictions, we make 
                no representation that the Service is appropriate or available for use in all locations. You are responsible for 
                ensuring that your use of the Service complies with all applicable laws and regulations in your jurisdiction. 
                If you access the Service from outside the Philippines, you do so at your own risk and are responsible for 
                compliance with local laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">19. Force Majeure</h2>
              <p>
                ACBMarket shall not be liable for any failure or delay in performance under these Terms that is due to causes 
                beyond our reasonable control, including but not limited to: natural disasters, war, terrorism, labor disputes, 
                government actions, internet failures, cyber attacks, or any other force majeure event. In such cases, we will 
                make reasonable efforts to resume normal operations as soon as practicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">20. Changes to Terms</h2>
              <p className="mb-2">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes via email 
                or platform notifications at least 30 days before the changes take effect. Material changes may include:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 mb-3">
                <li>Changes to payment terms or chip pricing</li>
                <li>Changes to account suspension or termination policies</li>
                <li>Changes to dispute resolution procedures</li>
                <li>Changes that affect your rights or obligations</li>
              </ul>
              <p>
                Continued use of the Service after changes take effect constitutes acceptance of the new Terms. If you do not 
                agree to the modified Terms, you must stop using the Service and may request account deletion. Your continued 
                use of the Service after the effective date of any changes will be deemed acceptance of those changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">21. Governing Law and Jurisdiction</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines, 
                without regard to its conflict of law provisions. Any legal action or proceeding arising out of or related to 
                these Terms or the Service shall be brought exclusively in the courts of the Philippines, and you consent to 
                the jurisdiction of such courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">22. Severability</h2>
              <p>
                If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent 
                jurisdiction, the remaining provisions shall remain in full force and effect. The invalid provision shall be 
                modified to the minimum extent necessary to make it valid and enforceable, or if modification is not possible, 
                it shall be severed from these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">23. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy and any other legal notices published on the Platform, constitute 
                the entire agreement between you and ACBMarket regarding the Service and supersede all prior agreements, 
                understandings, or communications, whether written or oral, relating to the subject matter of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">24. Waiver</h2>
              <p>
                The failure of ACBMarket to enforce any right or provision of these Terms shall not constitute a waiver of 
                such right or provision. Any waiver of any provision of these Terms must be in writing and signed by an 
                authorized representative of ACBMarket.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">25. Assignment</h2>
              <p>
                You may not assign or transfer these Terms or your account without ACBMarket's prior written consent. ACBMarket 
                may assign or transfer these Terms or any rights or obligations hereunder, in whole or in part, without your 
                consent, including in connection with a merger, acquisition, or sale of assets.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">26. Contact Information</h2>
              <p className="mb-2">
                If you have any questions, concerns, or complaints about these Terms of Service, please contact us at:
              </p>
              <p className="mt-2 mb-2">
                <strong>Email:</strong> <a href="mailto:support@acbmarket.com" className="text-primary-600 dark:text-primary-400 hover:underline">support@acbmarket.com</a>
              </p>
              <p>
                We will make reasonable efforts to respond to your inquiry within 7-10 business days. For account-related 
                issues or disputes, please include your account information and a detailed description of your concern.
              </p>
            </section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TermsOfService;

