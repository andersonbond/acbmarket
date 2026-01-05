import React, { useState } from 'react';
import { IonSegment, IonSegmentButton, IonLabel, IonCheckbox, IonItem, IonLabel as IonItemLabel, IonButton, IonIcon } from '@ionic/react';
import { filter } from 'ionicons/icons';

interface MarketFiltersProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  hideSports: boolean;
  hidePolitics: boolean;
  onHideSportsChange: (hide: boolean) => void;
  onHidePoliticsChange: (hide: boolean) => void;
}

const MarketFilters: React.FC<MarketFiltersProps> = ({
  sortBy,
  onSortChange,
  hideSports,
  hidePolitics,
  onHideSportsChange,
  onHidePoliticsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <IonButton
            fill="clear"
            size="small"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 dark:text-gray-300"
          >
            <IonIcon icon={filter} slot="start" />
            <span className="text-sm font-medium">Filters</span>
          </IonButton>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Sort by:
        </div>
      </div>

      {/* Sort Options - Always Visible */}
      <div className="mb-2">
        <IonSegment value={sortBy} onIonChange={(e) => onSortChange(e.detail.value as string)}>
          <IonSegmentButton value="volume">
            <IonLabel>24hr Volume</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="newest">
            <IonLabel>Newest</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="ending">
            <IonLabel>Ending Soon</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </div>

      {/* Filter Options - Toggleable */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <IonItem lines="none">
              <IonCheckbox
                checked={hideSports}
                onIonChange={(e) => onHideSportsChange(e.detail.checked)}
              />
              <IonItemLabel className="ml-2 text-gray-900 dark:text-white">Hide sports?</IonItemLabel>
            </IonItem>
            <IonItem lines="none">
              <IonCheckbox
                checked={hidePolitics}
                onIonChange={(e) => onHidePoliticsChange(e.detail.checked)}
              />
              <IonItemLabel className="ml-2 text-gray-900 dark:text-white">Hide politics?</IonItemLabel>
            </IonItem>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketFilters;

