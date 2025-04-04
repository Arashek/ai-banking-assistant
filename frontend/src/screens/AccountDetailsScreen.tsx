import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { bankingApi } from '../services/api';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  createdAt: string;
  status: string;
}

interface AccountDetails {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
  type: string;
  status: string;
  balanceHistory: {
    date: string;
    balance: number;
  }[];
}

const AccountDetailsScreen = ({ route, navigation }: any) => {
  const { accountId } = route.params;
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('1W'); // 1D, 1W, 1M, 3M, 1Y

  useEffect(() => {
    loadAccountData();
  }, [accountId, timeRange]);

  const loadAccountData = async () => {
    try {
      const [accountDetails, accountTransactions] = await Promise.all([
        bankingApi.getAccountDetails(accountId),
        bankingApi.getTransactions({ filter: 'all', limit: 10 }),
      ]);
      setAccount(accountDetails);
      setTransactions(accountTransactions);
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccountData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
      </View>
    );
  }

  if (!account) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#E74C3C" />
        <Text style={styles.errorText}>Account not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.accountNumber}>{account.accountNumber}</Text>
        <Text style={styles.balance}>{formatCurrency(account.balance)}</Text>
        <View style={styles.accountInfo}>
          <Text style={styles.accountType}>{account.type}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: account.status === 'active' ? '#27AE60' : '#E74C3C' },
            ]}
          >
            <Text style={styles.statusText}>{account.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.timeRangeButtons}>
          {['1D', '1W', '1M', '3M', '1Y'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <LineChart
          data={{
            labels: account.balanceHistory.map((h) => formatDate(h.date)),
            datasets: [
              {
                data: account.balanceHistory.map((h) => h.balance),
              },
            ],
          }}
          width={Dimensions.get('window').width - 30}
          height={220}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('Transfer', { fromAccountId: account.id })
          }
        >
          <Icon name="swap-horiz" size={24} color="#2C3E50" />
          <Text style={styles.actionText}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="receipt-long" size={24} color="#2C3E50" />
          <Text style={styles.actionText}>Statement</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share" size={24} color="#2C3E50" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Icon
                name={transaction.type === 'credit' ? 'arrow-downward' : 'arrow-upward'}
                size={24}
                color={transaction.type === 'credit' ? '#27AE60' : '#E74C3C'}
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription}>
                {transaction.description}
              </Text>
              <Text style={styles.transactionDate}>
                {formatDate(transaction.createdAt)}
              </Text>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                {
                  color: transaction.type === 'credit' ? '#27AE60' : '#E74C3C',
                },
              ]}
            >
              {formatCurrency(transaction.amount)}
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#E74C3C',
  },
  header: {
    backgroundColor: '#2C3E50',
    padding: 20,
    alignItems: 'center',
  },
  accountNumber: {
    fontSize: 14,
    color: '#ECF0F1',
    marginBottom: 5,
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountType: {
    fontSize: 14,
    color: '#ECF0F1',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
  },
  timeRangeButtonActive: {
    backgroundColor: '#2C3E50',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#2C3E50',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#2C3E50',
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3498DB',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AccountDetailsScreen;
