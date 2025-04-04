import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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

const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      const response = await bankingApi.getTransactions({
        filter,
        limit: 50,
      });
      setTransactions(response);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'transfer':
        return 'swap-horiz';
      case 'payment':
        return 'payment';
      case 'deposit':
        return 'arrow-downward';
      case 'withdrawal':
        return 'arrow-upward';
      default:
        return 'account-balance-wallet';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.transactionCard}>
      <View style={styles.transactionIcon}>
        <Icon
          name={getTransactionIcon(item.type)}
          size={24}
          color={item.amount >= 0 ? '#27AE60' : '#E74C3C'}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            { color: item.amount >= 0 ? '#27AE60' : '#E74C3C' },
          ]}
        >
          {formatCurrency(item.amount)}
        </Text>
        <Text style={[styles.status, styles[item.status]]}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ title, value }: { title: string; value: string }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <FilterButton title="All" value="all" />
        <FilterButton title="Income" value="income" />
        <FilterButton title="Expenses" value="expenses" />
        <FilterButton title="Transfers" value="transfers" />
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt-long" size={48} color="#BDC3C7" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
      />
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2C3E50',
  },
  filterButtonText: {
    color: '#2C3E50',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 15,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  category: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  completed: {
    backgroundColor: '#E8F5E9',
    color: '#27AE60',
  },
  pending: {
    backgroundColor: '#FFF3E0',
    color: '#F39C12',
  },
  failed: {
    backgroundColor: '#FFEBEE',
    color: '#E74C3C',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    color: '#95A5A6',
    fontSize: 16,
  },
});

export default TransactionsScreen;
