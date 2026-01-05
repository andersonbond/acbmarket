import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import Header from '../components/Header';

const Markets: React.FC = () => {
  return (
    <IonPage>
      <Header />
      <IonContent>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Markets</h1>
          <p className="text-gray-600">Markets page - to be implemented in Phase 3</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Markets;

