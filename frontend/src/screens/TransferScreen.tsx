import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bankingApi } from '../services/api';

interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
}

interface Recipient {
  id: string;
  name: string;
  accountNumber: string;
}

const TransferScreen = ({ navigation }: any) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);

  useEffect(() => {
    loadAccounts();
    loadRecipients();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await bankingApi.getAccounts();
      setAccounts(response);
      if (response.length > 0) {
        setSelectedAccount(response[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load accounts');
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await bankingApi.getRecipients();
      setRecipients(response);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipients');
    }
  };

  const handleTransfer = async () => {
    if (!selectedAccount || !selectedRecipient) {
      Alert.alert('Error', 'Please select account and recipient');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await bankingApi.transfer(
        selectedAccount.id,
        selectedRecipient.id,
        parseFloat(amount),
        description
      );

      Alert.alert(
        'Success',
        'Transfer completed successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>From Account</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {accounts.map(account => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountCard,
                selectedAccount?.id === account.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedAccount(account)}
            >
              <Text style={styles.accountNumber}>{account.accountNumber}</Text>
              <Text style={styles.accountBalance}>
                {formatCurrency(account.balance)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>To Recipient</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recipientsList}
        >
          {recipients.map(recipient => (
            <TouchableOpacity
              key={recipient.id}
              style={[
                styles.recipientCard,
                selectedRecipient?.id === recipient.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedRecipient(recipient)}
            >
              <View style={styles.recipientIcon}>
                <Text style={styles.recipientInitial}>
                  {recipient.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.recipientName}>{recipient.name}</Text>
              <Text style={styles.recipientAccount}>{recipient.accountNumber}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencySymbol}>€</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add a note"
          multiline
        />
      </View>

      <TouchableOpacity
        style={[
          styles.transferButton,
          (!selectedAccount || !selectedRecipient || !amount) &&
            styles.transferButtonDisabled,
        ]}
        onPress={handleTransfer}
        disabled={!selectedAccount || !selectedRecipient || !amount || loading}
      >
        <Text style={styles.transferButtonText}>Transfer Money</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#2C3E50',
  },
  accountNumber: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  recipientsList: {
    flexGrow: 0,
  },
  recipientCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    width: 150,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipientIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ECF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  recipientInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 5,
  },
  recipientAccount: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 24,
    color: '#2C3E50',
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 5,
    fontSize: 16,
    color: '#2C3E50',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  transferButton: {
    backgroundColor: '#2C3E50',
    margin: 20,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  transferButtonDisabled: {
    backgroundColor: '#95A5A6',
  },
  transferButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransferScreen;
