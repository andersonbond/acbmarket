import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonButton, IonInput, IonItem, IonLabel, IonSpinner, IonAlert, IonIcon, IonCard, IonCardContent, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { wallet, informationCircle, checkmarkCircle, closeCircle, arrowBack, search, person, close, shield } from 'ionicons/icons';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, sendChipsToUser, UserManagement, SendChipsRequest } from '../services/admin';

const AdminPurchase: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  
  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserManagement[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Chip sending state
  const [chipsAmount, setChipsAmount] = useState<number>(100);
  const [reason, setReason] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Predefined chip amounts
  const quickAmounts = [20, 50, 100, 200, 500, 1000];

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowUserDropdown(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await getUsers(1, 10, searchQuery);
        if (response.success) {
          setSearchResults(response.data.users);
          setShowUserDropdown(true);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleQuickSelect = (amount: number) => {
    setChipsAmount(amount);
  };

  const handleUserSelect = (user: UserManagement) => {
    setSelectedUser(user);
    setSearchQuery(user.display_name);
    setShowUserDropdown(false);
    setSearchResults([]);
  };

  const validateForm = (): string | null => {
    if (!selectedUser) {
      return 'Please select a user';
    }
    if (!chipsAmount || chipsAmount < 1) {
      return 'Chips amount must be at least 1';
    }
    if (chipsAmount > 1000000) {
      return 'Maximum chips amount is 1,000,000';
    }
    return null;
  };

  const handleSendChips = async () => {
    const validationError = validateForm();
    if (validationError) {
      setAlertHeader('Validation Error');
      setAlertMessage(validationError);
      setIsSuccess(false);
      setShowAlert(true);
      return;
    }

    if (!password.trim()) {
      setAlertHeader('Password Required');
      setAlertMessage('Please enter your password to confirm');
      setIsSuccess(false);
      setShowAlert(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const request: SendChipsRequest = {
        user_id: selectedUser!.id,
        chips_added: chipsAmount,
        password: password,
        reason: reason.trim() || undefined,
      };

      const response = await sendChipsToUser(request);

      if (response.success) {
        setAlertHeader('Chips Sent Successfully!');
        setAlertMessage(
          `Successfully sent ${response.data.chips_added.toLocaleString()} chips to ${response.data.target_user.display_name}. ` +
          `Their new balance is ₱${response.data.new_balance.toLocaleString()}.`
        );
        setIsSuccess(true);
        setShowAlert(true);
        setShowConfirmModal(false);
        
        // Reset form
        setSelectedUser(null);
        setSearchQuery('');
        setChipsAmount(100);
        setReason('');
        setPassword('');
      }
    } catch (error: any) {
      console.error('Error sending chips:', error);
      setAlertHeader('Failed to Send Chips');
      setAlertMessage(
        error.response?.data?.detail || 'Failed to send chips. Please try again.'
      );
      setIsSuccess(false);
      setShowAlert(true);
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmClick = () => {
    const validationError = validateForm();
    if (validationError) {
      setAlertHeader('Validation Error');
      setAlertMessage(validationError);
      setIsSuccess(false);
      setShowAlert(true);
      return;
    }
    setShowConfirmModal(true);
  };

  if (!user) {
    return (
      <IonPage>
        <Header />
        <IonContent className="bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to access this page.
            </p>
            <IonButton onClick={() => history.push('/login')} className="button-primary">
              Log In
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Header />
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          {/* Back Button */}
          <IonButton 
            fill="clear" 
            onClick={() => history.push('/admin')} 
            className="mb-3 -ml-2"
          >
            <IonIcon icon={arrowBack} slot="start" />
            Back to Admin
          </IonButton>
          
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <IonIcon icon={shield} className="mr-2 text-red-600" />
              Admin: Send Chips
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Send chips to any user in the system
            </p>
          </div>

          {/* Admin Notice */}
          <IonCard className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
            <IonCardContent className="p-4">
              <div className="flex items-start">
                <IonIcon icon={informationCircle} className="text-red-600 dark:text-red-400 text-xl mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-300">
                  <p className="font-semibold mb-1">Admin Only Feature</p>
                  <p>
                    This page allows you to send chips to any user. All transactions are logged and require password confirmation.
                  </p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Send Chips Form Card */}
          <IonCard className="bg-white dark:bg-gray-800">
            <IonCardContent className="p-4">
              <div className="space-y-4">
                {/* User Search */}
                <div>
                  <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Select User
                  </IonLabel>
                  <div className="relative">
                    <IonItem className="ion-no-padding" lines="none">
                      <IonIcon icon={search} slot="start" className="text-gray-400" />
                      <IonInput
                        type="text"
                        value={searchQuery}
                        onIonInput={(e) => setSearchQuery(e.detail.value!)}
                        placeholder="Search by name, email, or contact number"
                        className="px-4 py-2"
                        onFocus={() => {
                          if (searchResults.length > 0) {
                            setShowUserDropdown(true);
                          }
                        }}
                      />
                      {selectedUser && (
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => {
                            setSelectedUser(null);
                            setSearchQuery('');
                          }}
                        >
                          <IonIcon icon={close} />
                        </IonButton>
                      )}
                    </IonItem>
                    
                    {/* Search Results Dropdown */}
                    {showUserDropdown && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <IonIcon icon={person} className="mr-2 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {user.display_name}
                                  </p>
                                  {user.email && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {user.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  ₱{user.chips.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Current balance
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <IonSpinner name="crescent" />
                      </div>
                    )}
                  </div>
                  
                  {/* Selected User Display */}
                  {selectedUser && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedUser.display_name}
                          </p>
                          {selectedUser.email && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {selectedUser.email}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Current: ₱{selectedUser.chips.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Select and Custom Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quick Select */}
                  <div>
                    <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Quick Select
                    </IonLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map((amount) => (
                        <IonButton
                          key={amount}
                          fill={chipsAmount === amount ? 'solid' : 'outline'}
                          onClick={() => handleQuickSelect(amount)}
                          className={chipsAmount === amount ? 'button-primary' : 'text-gray-900 dark:text-white'}
                          size="small"
                        >
                          ₱{amount.toLocaleString()}
                        </IonButton>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount Input */}
                  <div>
                    <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Custom Amount
                    </IonLabel>
                    <IonItem className="ion-no-padding" lines="none">
                      <IonInput
                        type="number"
                        value={chipsAmount}
                        onIonInput={(e) => setChipsAmount(parseInt(e.detail.value!) || 0)}
                        placeholder="Enter amount"
                        min={1}
                        max={1000000}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </IonItem>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Min: ₱1 | Max: ₱1,000,000
                    </p>
                  </div>
                </div>

                {/* Reason/Note Input */}
                <div>
                  <IonLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Reason/Note (Optional)
                  </IonLabel>
                  <IonItem className="ion-no-padding" lines="none">
                    <IonInput
                      type="text"
                      value={reason}
                      onIonInput={(e) => setReason(e.detail.value!)}
                      placeholder="Optional reason for sending chips"
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                  </IonItem>
                </div>

                {/* Summary */}
                {selectedUser && chipsAmount > 0 && (
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-lg p-3 border border-primary/20">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Chips to Send</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {chipsAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Current Balance</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ₱{selectedUser.chips.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-primary/20 pt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">New Balance</p>
                        <p className="text-lg font-bold text-primary dark:text-primary-400">
                          ₱{(selectedUser.chips + chipsAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Send Button */}
                <IonButton
                  expand="block"
                  onClick={handleConfirmClick}
                  disabled={isSubmitting || !selectedUser || !chipsAmount || chipsAmount < 1}
                  className="button-primary"
                >
                  {isSubmitting ? (
                    <>
                      <IonSpinner name="crescent" slot="start" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={wallet} slot="start" />
                      Send {chipsAmount.toLocaleString()} Chips
                    </>
                  )}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Confirmation Modal */}
        <IonModal isOpen={showConfirmModal} onDidDismiss={() => setShowConfirmModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Confirm Send Chips</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowConfirmModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="max-w-md mx-auto py-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Transaction Summary
                </h3>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Recipient:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedUser?.display_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Chips Amount:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {chipsAmount.toLocaleString()}
                    </span>
                  </div>
                  {reason && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{reason}</p>
                    </div>
                  )}
                </div>
                
                <IonItem className="ion-no-padding mb-4">
                  <IonLabel position="stacked">Enter your password to confirm</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    placeholder="Enter your admin password"
                    className="mt-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && password.trim()) {
                        handleSendChips();
                      }
                    }}
                  />
                </IonItem>
              </div>
              
              <div className="flex gap-2">
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPassword('');
                  }}
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  onClick={handleSendChips}
                  disabled={isSubmitting || !password.trim()}
                  className="button-primary"
                >
                  {isSubmitting ? (
                    <>
                      <IonSpinner name="crescent" slot="start" />
                      Sending...
                    </>
                  ) : (
                    'Confirm & Send'
                  )}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertHeader}
          message={alertMessage}
          buttons={['OK']}
          cssClass={isSuccess ? 'alert-success' : ''}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminPurchase;
