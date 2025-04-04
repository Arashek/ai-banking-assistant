import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { bankingApi } from '../services/api';

interface Account {
  id: string;
  accountType: string;
  accountNumber: string;
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  category: string;
}

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsData, transactionsData] = await Promise.all([
        bankingApi.getAccounts(),
        bankingApi.getTransactions(5) // Get last 5 transactions
      ]);
      setAccounts(accountsData);
      setRecentTransactions(transactionsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Chat')}
        >
          <Icon name="chat" size={24} color="#2C3E50" />
          <Text style={styles.actionText}>AI Assistant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Transfer')}
        >
          <Icon name="swap-horiz" size={24} color="#2C3E50" />
          <Text style={styles.actionText}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Payments')}
        >
          <Icon name="payment" size={24} color="#2C3E50" />
          <Text style={styles.actionText}>Payments</Text>
        </TouchableOpacity>
      </View>

      {/* Accounts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Accounts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {accounts.map(account => (
          <TouchableOpacity
            key={account.id}
            style={styles.accountCard}
            onPress={() => navigation.navigate('AccountDetails', { accountId: account.id })}
          >
            <View>
              <Text style={styles.accountType}>{account.accountType}</Text>
              <Text style={styles.accountNumber}>{account.accountNumber}</Text>
            </View>
            <Text style={styles.accountBalance}>
              {formatCurrency(account.balance, account.currency)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.map(transaction => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Icon
                name={transaction.type === 'incoming' ? 'arrow-downward' : 'arrow-upward'}
                size={24}
                color={transaction.type === 'incoming' ? '#27AE60' : '#E74C3C'}
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
              <Text style={styles.transactionCategory}>{transaction.category}</Text>
            </View>
            <View style={styles.transactionAmount}>
              <Text
                style={[
                  styles.amount,
                  { color: transaction.type === 'incoming' ? '#27AE60' : '#E74C3C' }
                ]}
              >
                {formatCurrency(transaction.amount)}
              </Text>
              <Text style={styles.transactionDate}>
                {formatDate(transaction.createdAt)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#2C3E50',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 16,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 5,
    color: '#2C3E50',
    fontSize: 12,
  },
  section: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  seeAll: {
    color: '#3498DB',
    fontSize: 14,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 10,
  },
  accountType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textTransform: 'capitalize',
  },
  accountNumber: {
    color: '#7F8C8D',
    fontSize: 12,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#2C3E50',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
});

export default HomeScreen;
