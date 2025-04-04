import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import ChatAssistant from '../components/ChatAssistant';
import { bankingApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const AssistantScreen = () => {
  const { t, formatCurrency } = useLanguage();

  const handleAction = async (action: { type: string; params: Record<string, any> }) => {
    try {
      switch (action.type) {
        case 'CHECK_BALANCE':
          const balanceResponse = await bankingApi.get('/accounts/balance');
          Alert.alert(
            t.accounts.balance,
            formatCurrency(balanceResponse.data.balance)
          );
          break;

        case 'TRANSFER':
          const { amount, recipient, concept } = action.params;
          Alert.alert(
            t.transfers.confirm,
            `${t.transfers.amount}: ${formatCurrency(parseFloat(amount))}\n${t.transfers.recipient}: ${recipient}\n${t.transfers.concept}: ${concept}`,
            [
              {
                text: t.common.cancel,
                style: 'cancel',
              },
              {
                text: t.common.confirm,
                onPress: async () => {
                  await bankingApi.post('/transfers', {
                    amount: parseFloat(amount),
                    recipient,
                    concept,
                  });
                  Alert.alert(t.common.success, t.transfers.success);
                },
              },
            ]
          );
          break;

        case 'GET_TRANSACTIONS':
          const { count = 3, filter } = action.params;
          const transactionsResponse = await bankingApi.get('/transactions', {
            params: { limit: count, filter },
          });
          // The response will be shown in the chat interface
          break;

        case 'ANALYZE_SPENDING':
          const { category, period } = action.params;
          const analysisResponse = await bankingApi.get('/transactions/analysis', {
            params: { category, period },
          });
          // The response will be shown in the chat interface
          break;

        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      Alert.alert(t.common.error, t.errors.general);
    }
  };

  return (
    <View style={styles.container}>
      <ChatAssistant onAction={handleAction} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});

export default AssistantScreen;
