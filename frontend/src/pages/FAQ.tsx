import React, { useState } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { chevronDown, chevronUp } from 'ionicons/icons';
import Header from '../components/Header';
import { useSEO } from '../hooks/useSEO';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'What is ACBMarket?',
    answer: 'ACBMarket is a Philippine prediction market platform where users can forecast events using virtual chips. It\'s a fun way to test your prediction skills and compete with others on the leaderboard.'
  },
  {
    question: 'Are the chips real money?',
    answer: 'No, all chips are virtual and non-redeemable. They cannot be converted to real money, cryptocurrency, or any other form of currency. Chips have no monetary value and are solely for use within the platform.'
  },
  {
    question: 'How do I earn reputation?',
    answer: 'You earn reputation points when your forecasts are correct after markets resolve. The more accurate your predictions, the higher your reputation score will be. Reputation helps you climb the leaderboard and unlock badges.'
  },
  {
    question: 'How are markets resolved?',
    answer: 'Markets are resolved based on verifiable real-world outcomes. Our team reviews each market and determines the outcome using objective criteria. All resolution decisions are final.'
  },
  {
    question: 'Can I create my own markets?',
    answer: 'Market creation features may be available in the future. Currently, markets are created by the platform administrators. Stay tuned for updates!'
  },
  {
    question: 'What happens if I lose all my chips?',
    answer: 'You can continue to participate in markets and earn more chips through accurate forecasts. Chips may also be awarded through special events or promotions.'
  },
  {
    question: 'How do badges work?',
    answer: 'Badges are earned by achieving specific milestones, such as making accurate predictions, reaching reputation thresholds, or participating in special events. Badges are displayed on your profile and leaderboard entry.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we implement industry-standard security measures including encryption and secure password hashing. Your email and password are never shared publicly. Only your display name, reputation, and badges are visible to other users.'
  },
  {
    question: 'Can I delete my account?',
    answer: 'Yes, you can request account deletion through the platform settings or by contacting support. Please note that this action is irreversible and will delete all your data, including reputation and badges.'
  },
  {
    question: 'Is ACBMarket legal?',
    answer: 'Yes, ACBMarket operates as a virtual forecasting platform using non-redeemable chips. Since chips have no monetary value and cannot be converted to real money, the platform is designed for entertainment and educational purposes only.'
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useSEO({
    title: 'FAQ',
    description: 'Frequently Asked Questions about ACBMarket. Learn about virtual chips, how to make forecasts, reputation system, and more about the Philippine prediction market platform.',
    keywords: 'FAQ, frequently asked questions, ACBMarket help, virtual chips, how to use, prediction market guide',
    canonical: `${baseUrl}/faq`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqData.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  });

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <IonPage>
      <Header />
      <IonContent>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h1>

          <div className="space-y-4">
            {faqData.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-semibold text-gray-900 dark:text-white pr-4">{item.question}</span>
                  <IonIcon
                    icon={openIndex === index ? chevronUp : chevronDown}
                    className="text-gray-600 dark:text-gray-400 flex-shrink-0"
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4 text-gray-700 dark:text-gray-300">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Still have questions?</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              If you can't find the answer you're looking for, please contact our support team:
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Email:</strong> <a href="mailto:support@acbmarket.com" className="text-primary-600 dark:text-primary-400 hover:underline">support@acbmarket.com</a>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FAQ;

