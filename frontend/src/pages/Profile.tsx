import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonButtons,
  IonIcon,
} from '@ionic/react';
import { close, create, save } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.patch('/api/v1/users/me', {
        display_name: displayName,
        bio,
      });

      if (response.data.success) {
        updateUser(response.data.data.user);
        setIsEditModalOpen(false);
      } else {
        setError(response.data.errors?.[0]?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.display_name}</h1>
                  <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <IonButton onClick={() => setIsEditModalOpen(true)} className="button-primary">
                <IonIcon icon={create} slot="start" />
                Edit Profile
              </IonButton>
            </div>

            {user.bio && (
              <p className="text-gray-700 dark:text-gray-300 mt-4">{user.bio}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chips</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.chips.toLocaleString()}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reputation</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.reputation.toFixed(1)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Badges</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{user.badges.length}</div>
            </div>
          </div>

          {/* Badges Section */}
          {user.badges.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Badges</h2>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        <IonModal isOpen={isEditModalOpen} onDidDismiss={() => setIsEditModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Profile</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsEditModalOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="max-w-md mx-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-4">
                <IonItem className="rounded-lg" lines="none">
                  <IonLabel position="stacked">Display Name</IonLabel>
                  <IonInput
                    type="text"
                    value={displayName}
                    onIonInput={(e) => setDisplayName(e.detail.value!)}
                    placeholder="Display name"
                  />
                </IonItem>
              </div>

              <div className="mb-6">
                <IonItem className="rounded-lg" lines="none">
                  <IonLabel position="stacked">Bio</IonLabel>
                  <IonInput
                    type="text"
                    value={bio}
                    onIonInput={(e) => setBio(e.detail.value!)}
                    placeholder="Tell us about yourself"
                  />
                </IonItem>
              </div>

              <IonButton expand="block" onClick={handleSave} disabled={isLoading} className="button-primary">
                <IonIcon icon={save} slot="start" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Profile;

