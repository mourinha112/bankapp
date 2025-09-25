import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { Transaction } from '../../types';
import { colors, globalStyles } from '../../theme';
import BackendAsaasService from '../../services/BackendAsaasService';
import { useFocusEffect } from '@react-navigation/native';

export default function HistoryScreen() {
  const { state } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'deposit' | 'withdraw' | 'transfer'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = async () => {
    if (!state.auth.user?.email) return;
    
    try {
      const response = await BackendAsaasService.getUserTransactions(state.auth.user.email);
      if (response.transactions) {
        // Converter transações do backend para o formato do frontend
        const formattedTransactions: Transaction[] = response.transactions.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount),
          description: t.description || `${t.type.charAt(0).toUpperCase() + t.type.slice(1)} via PIX`,
          createdAt: new Date(t.created_at),
          status: t.status || 'completed',
          paymentMethod: 'pix',
          paymentId: t.asaas_payment_id,
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (state.auth.user?.email) {
      loadTransactions();
    }
  }, []); // Remove dependency para não recarregar constantemente

  // Recarregar quando a tela for focada
  useFocusEffect(
    React.useCallback(() => {
      if (state.auth.user?.email) {
        loadTransactions();
      }
    }, [state.auth.user?.email])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const filters = [
    { key: 'all', label: 'Todas' },
    { key: 'deposit', label: 'Depósitos' },
    { key: 'withdraw', label: 'Saques' },
    { key: 'transfer', label: 'Transferências' },
  ];

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'transfer') {
      return transaction.type === 'transfer_sent' || transaction.type === 'transfer_received';
    }
    return transaction.type === selectedFilter;
  });

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'add-circle';
      case 'withdraw':
        return 'remove-circle';
      case 'transfer_sent':
        return 'send';
      case 'transfer_received':
        return 'download';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'transfer_received':
        return colors.success;
      case 'withdraw':
      case 'transfer_sent':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };

  const getAmountPrefix = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'transfer_received':
        return '+';
      case 'withdraw':
      case 'transfer_sent':
        return '-';
      default:
        return '';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Hoje às ' + date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Ontem às ' + date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days < 7) {
      return `${days} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + '15' }]}>
          <Ionicons 
            name={getTransactionIcon(item.type) as any} 
            size={20} 
            color={getTransactionColor(item.type)} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.createdAt)}
          </Text>
          {item.paymentMethod === 'pix' && (
            <View style={styles.pixBadge}>
              <Text style={styles.pixBadgeText}>PIX</Text>
            </View>
          )}
          {item.paymentId && (
            <Text style={styles.transactionId}>
              ID: {item.paymentId.slice(-8)}
            </Text>
          )}
          {(item.toUserEmail || item.fromUserEmail) && (
            <Text style={styles.transactionUser}>
              {item.type === 'transfer_sent' ? `Para: ${item.toUserEmail}` : `De: ${item.fromUserEmail}`}
            </Text>
          )}
        </View>
        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.amountText,
              { color: getTransactionColor(item.type) }
            ]}
          >
            {getAmountPrefix(item.type)}R$ {item.amount.toFixed(2).replace('.', ',')}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
            <Text style={[styles.statusText, { color: colors.success }]}>
              {item.status === 'completed' ? 'Concluído' : 
               item.status === 'pending' ? 'Pendente' :
               item.status === 'processing' ? 'Processando' : item.status}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Histórico</Text>
            <Text style={styles.headerSubtitle}>
              {filteredTransactions.length} transação{filteredTransactions.length !== 1 ? 'ões' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="search" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersRow}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter.key && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedFilter(filter.key as any)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter === filter.key && styles.filterButtonTextActive
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lista de transações */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando transações...</Text>
          </View>
        ) : filteredTransactions.length > 0 ? (
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transactionsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.text.light} />
            <Text style={styles.emptyStateTitle}>Nenhuma transação encontrada</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'all'
                ? 'Você ainda não realizou nenhuma transação.'
                : `Você ainda não possui ${filters.find(f => f.key === selectedFilter)?.label.toLowerCase()}.`}
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={styles.refreshButtonText}>Atualizar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filtersContainer: {
    paddingVertical: 20,
    paddingLeft: 20,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  transactionsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  transactionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow.light,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  transactionUser: {
    fontSize: 12,
    color: colors.text.light,
    fontStyle: 'italic',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
  },
  refreshButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  pixBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pixBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  transactionId: {
    fontSize: 12,
    color: colors.text.light,
    marginTop: 2,
    fontFamily: 'monospace',
  },
});