import React from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon } from '@ionic/react';
import { close } from 'ionicons/icons';
import {
  UserPlusIcon,
  Squares2X2Icon,
  ChartBarIcon,
  TrophyIcon,
  StarIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

interface HowItWorksModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const steps = [
  {
    number: 1,
    title: 'Get started',
    icon: UserPlusIcon,
    content: 'Create an account and buy virtual chips (1 chip = ₱1.00 reference). Chips are non-redeemable and used only for forecasting.',
  },
  {
    number: 2,
    title: 'Browse markets',
    icon: Squares2X2Icon,
    content: 'Explore prediction markets: Elections, Politics, Sports, Entertainment, Economy, Weather, and more. Each market has a Yes/No question and an end date.',
  },
  {
    number: 3,
    title: 'Make forecasts',
    icon: ChartBarIcon,
    content: 'Allocate chips to Yes or No based on your prediction. You can update your forecast before the market closes. Once placed, chips are committed until resolution.',
  },
  {
    number: 4,
    title: 'Win chips & earn rewards',
    icon: TrophyIcon,
    content: 'When a market resolves, winning forecasters get their bet back plus a proportional share of 90% of losing chips. The more you bet and win, the larger your reward.',
  },
  {
    number: 5,
    title: 'Build reputation & badges',
    icon: StarIcon,
    content: 'Accurate forecasts earn reputation points. Unlock badges and maintain streaks as you improve.',
  },
  {
    number: 6,
    title: 'Compete on leaderboards',
    icon: ClipboardDocumentListIcon,
    content: 'Rankings are based on reputation, streaks, and activity. Top forecasters earn recognition and monthly certificates.',
  },
];

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onDismiss }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader className="ion-no-border">
        <IonToolbar className="border-b border-gray-200 dark:border-gray-700">
          <IonTitle className="font-dm-sans font-bold">How it works</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss} className="font-dm-sans" aria-label="Close">
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="max-w-2xl mx-auto pb-8">
          {/* Intro */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-500/15 via-primary-400/10 to-secondary-500/15 dark:from-primary-600/20 dark:via-primary-500/10 dark:to-secondary-600/20 border border-primary-200/50 dark:border-primary-700/50 p-5 md:p-6 mb-6">
            <h2 className="text-xl md:text-2xl font-dm-sans font-bold text-gray-900 dark:text-white mb-2">
              Welcome to ACBMarket
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
              A Philippine prediction market where you forecast real-world events using virtual chips. Test your judgment, compete with others, and climb the leaderboard.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="rounded-xl bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-4 p-4 md:p-5">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500 text-gray-900 font-dm-sans font-bold flex items-center justify-center text-sm">
                      {step.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                        <h3 className="text-base md:text-lg font-dm-sans font-semibold text-gray-900 dark:text-white capitalize">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                        {step.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Important notes (compact) */}
          <div className="mt-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 md:p-5">
            <h3 className="text-sm font-dm-sans font-semibold text-amber-900 dark:text-amber-200 mb-3">
              Important
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex gap-2">
                <span className="text-amber-500 dark:text-amber-400 flex-shrink-0">•</span>
                <span>Chips are virtual and non-redeemable (reference: 1 chip = ₱1.00).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 dark:text-amber-400 flex-shrink-0">•</span>
                <span>Platform is for entertainment and education. Markets are resolved by admins using verifiable outcomes.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 dark:text-amber-400 flex-shrink-0">•</span>
                <span>Winners receive chips back plus 90% of losing chips; 10% is the house edge.</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={onDismiss}
              className="px-6 py-3 rounded-xl font-dm-sans font-semibold text-white bg-primary-600 hover:bg-primary-700 active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default HowItWorksModal;
