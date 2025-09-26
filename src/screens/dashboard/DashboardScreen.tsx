import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useApp } from '../../context/AppContext';
import { colors, globalStyles } from '../../theme';
import { DepositScreen, WithdrawScreen, TransferScreen } from '../transactions';
import RealDepositScreen from '../transactions/RealDepositScreen';
import RealWithdrawScreen from '../transactions/RealWithdrawScreen';
import { useBalanceUpdater } from '../../hooks/useBalanceUpdater';
import BackendAsaasService from '../../services/BackendAsaasService';

const TransactionStack = createStackNavigator();

function TransactionStackNavigator() {
  return (
    <TransactionStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <TransactionStack.Screen 
        name="Deposit" 
        component={DepositScreen}
        options={{ title: 'Depósito' }}
      />
      <TransactionStack.Screen 
        name="Withdraw" 
        component={WithdrawScreen}
        options={{ title: 'Saque' }}
      />
      <TransactionStack.Screen 
        name="Transfer" 
        component={TransferScreen}
        options={{ title: 'Transferência' }}
      />
    </TransactionStack.Navigator>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { state, logout, updateBalance } = useApp();
  const { user } = state.auth;
  const [showTransactionModal, setShowTransactionModal] = React.useState(false);
  const [transactionType, setTransactionType] = React.useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [recentTransactions, setRecentTransactions] = React.useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = React.useState(false);
  const [showBalance, setShowBalance] = React.useState(true);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [userDetails, setUserDetails] = React.useState<any>(null);

  // Buscar transações do backend
  const loadRecentTransactions = async () => {
    if (!user?.email) return;
    
    console.log('🔄 [Dashboard] Carregando transações recentes para:', user.email);
    setLoadingTransactions(true);
    try {
      const response = await BackendAsaasService.getUserTransactions(user.email);
      console.log('📦 [Dashboard] Resposta do backend:', response);
      
      if (response.transactions) {
        // Pegar apenas as 3 transações mais recentes
        const formatted = response.transactions
          .slice(0, 3)
          .map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: parseFloat(t.amount),
            description: t.description || `${t.type.charAt(0).toUpperCase() + t.type.slice(1)} via PIX`,
            createdAt: new Date(t.created_at),
            status: t.status || 'completed',
          }));
        console.log('✅ [Dashboard] Transações formatadas:', formatted.length, 'encontradas');
        setRecentTransactions(formatted);
      } else {
        console.log('⚠️ [Dashboard] Nenhuma transação encontrada');
        setRecentTransactions([]);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Erro ao carregar transações recentes:', error);
      setRecentTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Buscar saldo atualizado do backend ao carregar
  const fetchUserBalance = async () => {
    if (user?.email) {
      try {
        const balanceResponse = await BackendAsaasService.getUserBalance(user.email);
        if (balanceResponse.balance !== undefined) {
          updateBalance(balanceResponse.balance);
          console.log('Saldo carregado do backend:', balanceResponse.balance);
        }
      } catch (error) {
        console.error('Erro ao buscar saldo do backend:', error);
      }
    }
  };

  // Buscar dados completos do usuário do backend
  const fetchUserDetails = async () => {
    if (user?.email) {
      try {
        console.log('🔍 Buscando dados completos do usuário:', user.email);
        const response = await BackendAsaasService.getUserProfile(user.email);
        
        console.log('📋 Resposta completa do getUserProfile:', response);
        
        if (response.user && !response.error) {
          console.log('✅ Definindo userDetails com:', response.user);
          console.log('🔑 Código do usuário na resposta:', response.user.userCode);
          setUserDetails(response.user);
          console.log('👤 Dados do usuário carregados:', response.user);
        } else {
          console.error('❌ Erro ao buscar perfil:', response.error);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados do usuário:', error);
      }
    }
  };

  useEffect(() => {
    fetchUserBalance();
    loadRecentTransactions();
  }, [user?.email]); // Remover updateBalance das dependências para evitar loop

  // Atualizar saldo quando a tela fica em foco (útil após transferências)
  useFocusEffect(
    React.useCallback(() => {
      fetchUserBalance();
      loadRecentTransactions();
    }, [user?.email])
  );

  // Recarregar transações quando a tela for focada
  useFocusEffect(
    React.useCallback(() => {
      if (user?.email) {
        console.log('🎯 [Dashboard] Tela focada, recarregando transações');
        loadRecentTransactions();
      }
    }, [user?.email])
  );

  // 🔄 Hook para atualizar saldo automaticamente via webhook
  // Temporariamente desabilitado para evitar erros de network
  const { checkBalanceNow } = {
    checkBalanceNow: async () => {
      console.log('🔄 Verificação de saldo desabilitada temporariamente');
    }
  };
  
  // useBalanceUpdater(
  //   user?.email,
  //   (amount: number, type: 'deposit' | 'withdraw') => {
  //     if (type === 'deposit') {
  //       // Incrementar saldo atual com o novo valor
  //       const currentBalance = user?.balance || 0;
  //       updateBalance(currentBalance + amount);
  //       console.log(`💰 Saldo atualizado automaticamente: +R$ ${amount}`);
        
  //       // Recarregar transações após receber pagamento
  //       console.log('🔄 [Dashboard] Recarregando transações após pagamento recebido');
  //       loadRecentTransactions();
  //     }
  //   }
  // );

  const handleTransaction = (type: 'deposit' | 'withdraw' | 'transfer') => {
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  const renderTransactionScreen = () => {
    switch (transactionType) {
      case 'deposit':
        return <RealDepositScreen onClose={() => setShowTransactionModal(false)} />;
      case 'withdraw':
        return <RealWithdrawScreen onClose={() => setShowTransactionModal(false)} />;
      case 'transfer':
        return <TransferScreen onClose={() => setShowTransactionModal(false)} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header estilo Nubank */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.profileContainer}>
                <TouchableOpacity onPress={async () => {
                  console.log('🔘 Avatar clicado - abrindo modal');
                  console.log('📊 userDetails antes do fetch:', userDetails);
                  setShowProfileModal(true);
                  
                  // Se ainda não temos os dados detalhados, buscar
                  if (!userDetails) {
                    console.log('🔄 Buscando dados pois userDetails está vazio');
                    await fetchUserDetails();
                  } else {
                    console.log('✅ Dados já carregados, reutilizando:', userDetails.userCode);
                  }
                }}>
                  <View style={styles.profileIcon}>
                    <Text style={styles.profileInitial}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View>
                  <Text style={styles.greeting}>
                    {(() => {
                      const raw = userDetails?.fullName || user?.fullName || user?.username || user?.email || '';
                      if (!raw) return 'Olá';

                      let first = '';
                      // If it's an email, use the local-part
                      if (raw.includes('@')) {
                        first = raw.split('@')[0];
                      } else {
                        const tokens = raw.trim().split(/\s+/);
                        first = tokens[0] || raw;
                      }

                      // Capitalize first letter
                      first = first.charAt(0).toUpperCase() + first.slice(1);
                      return `Olá, ${first}`;
                    })()}
                  </Text>
                  {/* Removed Bank App subtitle as requested */}
                </View>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => setShowBalance(!showBalance)}
              >
                <Ionicons 
                  name={showBalance ? "eye-outline" : "eye-off-outline"} 
                  size={24} 
                  color={colors.white} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconButton}>
                <Ionicons name="help-circle-outline" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={logout} style={styles.headerIconButton}>
                <Ionicons name="log-out-outline" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Conta</Text>
            <View style={styles.balanceRow}>
              {showBalance ? (
                <Text style={styles.balance}>
                  R$ {(user?.balance || 0).toFixed(2).replace('.', ',')}
                </Text>
              ) : (
                <Text style={styles.balance}>
                  R$ ••••••
                </Text>
              )}

              <TouchableOpacity
                onPress={async () => { await fetchUserBalance(); await loadRecentTransactions(); }}
                style={styles.smallRefreshButton}
                accessibilityLabel="Atualizar saldo"
              >
                <Ionicons name="refresh" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Card de ações rápidas estilo Nubank */}
        <View style={styles.quickActionsCard}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => handleTransaction('deposit')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="add" size={24} color={colors.success} />
              </View>
              <Text style={styles.quickActionLabel}>Depositar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => handleTransaction('withdraw')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="remove" size={24} color={colors.error} />
              </View>
              <Text style={styles.quickActionLabel}>Sacar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => handleTransaction('transfer')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="send" size={24} color={colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Transferir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => (navigation as any).navigate('Card')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="card" size={24} color={colors.info} />
              </View>
              <Text style={styles.quickActionLabel}>Cartão</Text>
            </TouchableOpacity>
          </View>
        </View>        {/* Transações recentes */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[globalStyles.subtitle, styles.sectionTitle]}>
              Transações Recentes
            </Text>
            <TouchableOpacity 
              onPress={loadRecentTransactions}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {loadingTransactions ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color: transaction.type === 'withdraw' || transaction.type === 'transfer_sent'
                          ? colors.error
                          : colors.success,
                      },
                    ]}
                  >
                    {transaction.type === 'withdraw' || transaction.type === 'transfer_sent' ? '-' : '+'}
                    R$ {(transaction.amount || 0).toFixed(2).replace('.', ',')}
                  </Text>
                  <View style={styles.pixBadge}>
                    <Text style={styles.pixBadgeText}>PIX</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Nenhuma transação encontrada
              </Text>
              <Text style={styles.emptyStateSubText}>
                Faça seu primeiro depósito PIX!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal para transações */}
      <Modal
        visible={showTransactionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowTransactionModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          {renderTransactionScreen()}
        </View>
      </Modal>

      {/* Modal de perfil */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header do modal */}
          <View style={styles.profileModalHeader}>
            <TouchableOpacity
              onPress={() => setShowProfileModal(false)}
              style={styles.profileCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.profileModalTitle}>Meu Perfil</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.profileModalContent} showsVerticalScrollIndicator={false}>
            {/* Avatar e nome */}
            <View style={styles.profileHeaderSection}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarText}>
                  {(userDetails?.username || user?.username)?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.profileName}>
                {userDetails?.fullName || userDetails?.username || user?.username}
              </Text>
              <Text style={styles.profileEmail}>
                {userDetails?.email || user?.email}
              </Text>
            </View>

            {/* Card do saldo */}
            <View style={styles.profileBalanceCard}>
              <View style={styles.profileBalanceHeader}>
                <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                <Text style={styles.profileBalanceTitle}>Saldo Atual</Text>
              </View>
              <Text style={styles.profileBalanceValue}>
                R$ {((userDetails?.balance || user?.balance) || 0).toFixed(2).replace('.', ',')}
              </Text>
            </View>

            {/* Código para compartilhar */}
            <View style={styles.profileCodeCard}>
              <View style={styles.profileCodeHeader}>
                <Ionicons name="person-outline" size={24} color={colors.primary} />
                <Text style={styles.profileCodeTitle}>Meu ID do Usuário</Text>
              </View>
              <Text style={styles.profileCodeDescription}>
                Compartilhe seu ID para receber transferências
              </Text>
              
              <View style={styles.profileCodeContainer}>
                <View style={styles.profileCodeBox}>
                  <Text style={styles.profileCodeValue}>
                    {(() => {
                      console.log('🔍 Debug - userDetails completo:', userDetails);
                      console.log('🔍 Debug - userDetails?.userCode:', userDetails?.userCode);
                      const code = userDetails?.userCode || 'CARREGANDO...';
                      return code.toUpperCase();
                    })()}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.profileCodeCopyButton}
                  onPress={() => {
                    if (userDetails?.userCode) {
                      Alert.alert(
                        'ID copiado! 📋', 
                        `Seu nome de usuário ${userDetails.userCode.toUpperCase()} foi copiado para a área de transferência.\n\nCompartilhe com quem quiser te enviar dinheiro!`
                      );
                    }
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.white} />
                  <Text style={styles.profileCodeCopyText}>Copiar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Informações da conta */}
            <View style={styles.profileInfoCard}>
              <Text style={styles.profileInfoTitle}>
                <Ionicons name="person-outline" size={18} color={colors.primary} /> 
                {' '}Informações da Conta
              </Text>
              
              <View style={styles.profileInfoItem}>
                <Text style={styles.profileInfoLabel}>ID do usuário</Text>
                <Text style={styles.profileInfoValue}>
                  {userDetails?.username || user?.username}
                </Text>
              </View>
              
              <View style={styles.profileInfoItem}>
                <Text style={styles.profileInfoLabel}>Email</Text>
                <Text style={styles.profileInfoValue}>
                  {userDetails?.email || user?.email}
                </Text>
              </View>
              
              <View style={styles.profileInfoItem}>
                <Text style={styles.profileInfoLabel}>Nome completo</Text>
                <Text style={styles.profileInfoValue}>
                  {userDetails?.fullName || 'Não informado'}
                </Text>
              </View>
              
              <View style={styles.profileInfoItem}>
                <Text style={styles.profileInfoLabel}>Membro desde</Text>
                <Text style={styles.profileInfoValue}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Não informado'}
                </Text>
              </View>
            </View>

            {/* Espaço extra no final */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginRight: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  balance: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  quickActionsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow.medium,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: colors.shadow.medium,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  transactionsContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    paddingBottom: 100,
  },
  transactionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow.light,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
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
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: colors.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
  },
  loadingContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  pixBadge: {
    backgroundColor: colors.primary + '15',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  pixBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: 4,
  },
  // Estilos do modal de perfil
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  placeholder: {
    width: 36,
  },
  profileModalContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeaderSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  profileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  profileAvatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  profileBalanceCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileBalanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  profileBalanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  smallRefreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  profileCodeCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileCodeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  profileCodeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  profileCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileCodeBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  profileCodeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 3,
    textAlign: 'center',
  },
  profileCodeCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  profileCodeCopyText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 16,
  },
  profileInfoCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 20,
  },
  profileInfoItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileInfoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  profileInfoValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
});