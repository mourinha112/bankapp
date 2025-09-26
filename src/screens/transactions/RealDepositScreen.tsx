import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { colors, globalStyles } from '../../theme';
import BackendAsaasService from '../../services/BackendAsaasService';

export default function RealDepositScreen({ onClose }: { onClose?: () => void }) {
  const navigation = useNavigation();
  const { state, updateBalance } = useApp();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'card'>('pix');
  const [paymentId, setPaymentId] = useState('');
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Polling para verificar status do pagamento
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (showPayment && paymentId && !checkingPayment) {
      setCheckingPayment(true);
      intervalId = setInterval(async () => {
        try {
          console.log('Verificando status do pagamento:', paymentId);
          const paymentStatus = await BackendAsaasService.getPaymentStatus(paymentId);
          console.log('Status retornado:', paymentStatus);
          
          if (paymentStatus.status === 'RECEIVED') {
            clearInterval(intervalId);
            setCheckingPayment(false);
            setShowPayment(false);
            
            // Busca o saldo atualizado do usuário
            if (state.auth.user?.email) {
              const balanceResponse = await BackendAsaasService.getUserBalance(state.auth.user.email);
              if (balanceResponse.balance !== undefined) {
                // Atualiza o saldo no contexto
                updateBalance(balanceResponse.balance);
                console.log('Saldo atualizado para:', balanceResponse.balance);
              }
            }
            
            // Mostra alerta de sucesso
            Alert.alert(
              'Pagamento Aprovado!', 
              `Seu depósito foi confirmado com sucesso! Seu saldo foi atualizado.`,
              [
                {
                  text: 'Ver Saldo',
                  onPress: () => {
                    // Volta para o dashboard
                    navigation.navigate('Dashboard' as never);
                  },
                },
              ]
            );
          }
        } catch (error) {
          console.error('Erro ao verificar status:', error);
        }
      }, 3000); // Verifica a cada 3 segundos
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      setCheckingPayment(false);
    };
  }, [showPayment, paymentId, navigation, state.auth.user?.email]);

  const handleDeposit = async () => {
    const numericAmount = parseFloat(amount.replace(',', '.'));
    
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return;
    }

    if (numericAmount < 5) {
      Alert.alert('Erro', 'O valor mínimo para depósito PIX é R$ 5,00');
      return;
    }

    if (numericAmount > 10000) {
      Alert.alert('Erro', 'O valor máximo para depósito é R$ 10.000,00');
      return;
    }

    setLoading(true);

    try {
      // 👤 Dados do usuário para o Asaas
      const userData = {
        name: state.auth.user?.fullName || state.auth.user?.username || 'Usuário Teste',
        email: state.auth.user?.email || `teste${Date.now()}@exemplo.com`,
        cpfCnpj: state.auth.user?.document || '16709880745', // CPF real do usuário logado
      };

      console.log('🔍 DEBUG - Dados do usuário para PIX:', userData);
      console.log('🔍 DEBUG - CPF sendo usado:', userData.cpfCnpj);

      let response;
      if (selectedMethod === 'pix') {
        // 🔥 CRIAR PAGAMENTO PIX REAL COM ASAAS (via backend)
        // Primeiro criar/obter cliente
        const customer = await BackendAsaasService.createOrGetCustomer({
          name: userData.name,
          email: userData.email,
          cpfCnpj: userData.cpfCnpj,
        });

        if (customer.error) {
          console.error('Erro ao criar/obter cliente:', customer);
          throw new Error(customer.error || 'Erro ao criar/obter cliente');
        }

        if (!customer.id) {
          console.error('Cliente retornado sem id:', customer);
          Alert.alert('Erro', 'Não foi possível obter o ID do cliente. Tente novamente.');
          setLoading(false);
          return;
        }

        // Depois criar depósito PIX
        const deposit = await BackendAsaasService.createPixDeposit({
          customerId: customer.id,
          value: numericAmount,
          description: `Depósito no app - ${state.auth.user?.username}`,
        });
        
        response = {
          success: !deposit.error,
          pixCopyPaste: deposit.pixCopyPaste,
          pixQrCode: deposit.pixQrCode,
          error: deposit.error
        };
        
        console.log('Response processada:', response);
      } else {
        // 💳 CRIAR PAGAMENTO CARTÃO - placeholder (não implementado no backend ainda)
        response = {
          success: false,
          error: 'Pagamento por cartão ainda não implementado via backend'
        };
      }

      if (response.success && response.pixCopyPaste) {
        setPixCode(response.pixCopyPaste);
        // Save QR image/link if backend returned it
        if (response.pixQrCode) {
          let qr = response.pixQrCode;
          // If backend returned raw base64 (no data: prefix), add proper prefix so <Image> can render it
          if (typeof qr === 'string' && !qr.startsWith('http') && !qr.startsWith('data:')) {
            // trim whitespace/newlines
            const cleaned = qr.replace(/\s+/g, '');
            qr = `data:image/png;base64,${cleaned}`;
          }
          setPaymentUrl(qr);
        }
        setShowPayment(true);
      } else if (!response.success) {
        Alert.alert('Erro', response.error || 'Erro ao processar pagamento');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const formattedValue = (parseInt(numericValue || '0') / 100).toFixed(2);
    return formattedValue.replace('.', ',');
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setAmount(formatted);
  };

  const PaymentMethods = () => (
    <View style={styles.paymentMethodsContainer}>
      <Text style={[globalStyles.label, globalStyles.mb16]}>Método de pagamento</Text>
      <View style={styles.methodsRow}>
        <TouchableOpacity
          style={[
            styles.methodButton,
            selectedMethod === 'pix' && styles.methodButtonActive
          ]}
          onPress={() => setSelectedMethod('pix')}
        >
          <Text style={styles.methodIcon}>📱</Text>
          <Text style={[
            styles.methodText,
            selectedMethod === 'pix' && styles.methodTextActive
          ]}>
            PIX
          </Text>
          <Text style={styles.methodSubtext}>Instantâneo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodButton,
            selectedMethod === 'card' && styles.methodButtonActive
          ]}
          onPress={() => setSelectedMethod('card')}
        >
          <Text style={styles.methodIcon}>💳</Text>
          <Text style={[
            styles.methodText,
            selectedMethod === 'card' && styles.methodTextActive
          ]}>
            Cartão
          </Text>
          <Text style={styles.methodSubtext}>Crédito/Débito</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const PixPaymentView = () => {
    const copyToClipboard = async () => {
      try {
        // Try expo-clipboard first (native). On web, fallback to navigator.clipboard
        if (Clipboard && Clipboard.setStringAsync) {
          await Clipboard.setStringAsync(pixCode);
        } else if (typeof navigator !== 'undefined' && (navigator as any).clipboard && (navigator as any).clipboard.writeText) {
          await (navigator as any).clipboard.writeText(pixCode);
        } else {
          throw new Error('Clipboard API não disponível');
        }
        Alert.alert('✅ Copiado!', 'Código PIX copiado para a área de transferência');
      } catch (error) {
        console.error('Erro ao copiar:', error);
        Alert.alert('Erro', 'Não foi possível copiar o código');
      }
    };

    return (
      <View style={styles.pixContainer}>
        <Text style={styles.pixTitle}>🔥 Pagamento PIX Real</Text>
        <Text style={styles.pixInstructions}>
          Abra seu app do banco e faça um PIX usando o código abaixo:
        </Text>
        
        <View style={styles.pixCodeContainer}>
          {/* QR Image (if available) */}
          {paymentUrl ? (
            <View style={styles.qrContainer}>
              <Image source={{ uri: paymentUrl }} style={styles.qrImage} resizeMode="contain" />
            </View>
          ) : null}

          <Text style={styles.pixCodeLabel}>Código PIX Copia e Cola:</Text>
          <TextInput
            style={styles.pixCodeInput}
            value={pixCode}
            editable={false}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.copyButton}
            onPress={copyToClipboard}
          >
            <Text style={styles.copyButtonText}>📋 Copiar código PIX</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pixSteps}>
          <Text style={styles.pixStepsTitle}>📱 Como pagar:</Text>
          <Text style={styles.pixStepText}>1. Copie o código PIX acima</Text>
          <Text style={styles.pixStepText}>2. Abra seu app bancário</Text>
          <Text style={styles.pixStepText}>3. Escolha "PIX" → "Pagar"</Text>
          <Text style={styles.pixStepText}>4. Cole o código copiado</Text>
          <Text style={styles.pixStepText}>5. Confirme o pagamento</Text>
        </View>

        {checkingPayment && (
          <View style={styles.checkingPaymentContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.checkingPaymentText}>
              🔄 Verificando pagamento automaticamente...
            </Text>
            <Text style={styles.checkingPaymentSubtext}>
              Aguarde, estamos monitorando se o pagamento foi aprovado
            </Text>
          </View>
        )}

        <View style={styles.pixInfo}>
          <Text style={styles.pixInfoText}>
            ⚡ Após o pagamento, seu saldo será atualizado automaticamente!
          </Text>
          <Text style={styles.pixWarning}>
            ⚠️ Este é um pagamento REAL. O valor será debitado da sua conta.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          <View style={globalStyles.card}>
            <Text style={globalStyles.title}>Depósito Real</Text>
            <Text style={[globalStyles.bodyText, globalStyles.mb24]}>
              Adicione dinheiro à sua conta via PIX ou cartão
            </Text>

            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Saldo atual:</Text>
              <Text style={styles.balanceValue}>
                R$ {state.auth.user?.balance.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            <PaymentMethods />

            <View style={globalStyles.mb24}>
              <Text style={globalStyles.label}>Valor do depósito</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>R$</Text>
                <TextInput
                  style={[globalStyles.input, styles.currencyInput]}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0,00"
                  placeholderTextColor={colors.input.placeholder}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.feeInfo}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Valor do depósito:</Text>
                <Text style={styles.feeValue}>R$ {amount || '0,00'}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Taxa:</Text>
                <Text style={styles.feeValue}>
                  {selectedMethod === 'pix' ? 'Gratuito' : 'R$ 0,99'}
                </Text>
              </View>
              <View style={[styles.feeRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  R$ {selectedMethod === 'pix' 
                    ? (amount || '0,00')
                    : (parseFloat(amount.replace(',', '.') || '0') + 0.99).toFixed(2).replace('.', ',')
                  }
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ Informações importantes</Text>
              <Text style={styles.infoText}>
                • PIX: Transferência instantânea e gratuita{'\n'}
                • Cartão: Taxa de R$ 0,99 por transação{'\n'}
                • Valor mínimo PIX: R$ 5,00{'\n'}
                • Valor máximo: R$ 10.000,00{'\n'}
                • Processamento automático via Asaas
              </Text>
            </View>

            <TouchableOpacity
              style={[
                globalStyles.button,
                globalStyles.mt24,
                (!amount || loading) && styles.buttonDisabled
              ]}
              onPress={handleDeposit}
              disabled={!amount || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={globalStyles.buttonText}>
                  Depositar via {selectedMethod === 'pix' ? 'PIX' : 'Cartão'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.button, globalStyles.mt16]}
              onPress={() => {
                try {
                  // Se a tela foi aberta via Modal no Dashboard, chamar o callback onClose passado
                  if (onClose && typeof onClose === 'function') {
                    onClose();
                    return;
                  }

                  // Caso contrário, navegar para Dashboard (fallback)
                  // @ts-ignore
                  if (navigation.canGoBack && navigation.canGoBack()) {
                    // @ts-ignore
                    navigation.goBack();
                    return;
                  }

                  // @ts-ignore
                  const parent = navigation.getParent && navigation.getParent();
                  if (parent && parent.navigate) {
                    parent.navigate('Dashboard');
                    return;
                  }

                  // Fallback simples
                  // @ts-ignore
                  if (navigation.navigate) navigation.navigate('Dashboard');
                } catch (err) {
                  // Fallback final
                  // @ts-ignore
                  navigation.navigate && navigation.navigate('Dashboard');
                }
              }}
            >
              <Text style={globalStyles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal de Pagamento */}
        <Modal
          visible={showPayment}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPayment(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowPayment(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedMethod === 'pix' && pixCode ? (
              <PixPaymentView />
            ) : paymentUrl ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  Abra o link no seu navegador para completar o pagamento:
                </Text>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    Alert.alert(
                      'Link de Pagamento',
                      'Em um app real, isso abriria o navegador com o link do Mercado Pago',
                      [
                        { text: 'Cancelar' },
                        { text: 'Simular Sucesso', onPress: () => {
                          Alert.alert('Sucesso', 'Pagamento realizado com sucesso!');
                          setShowPayment(false);
                          // @ts-ignore
                          if (navigation.navigate) navigation.navigate('Dashboard');
                        }}
                      ]
                    );
                  }}
                >
                  <Text style={styles.linkButtonText}>Abrir Link de Pagamento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Preparando pagamento...</Text>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  balanceInfo: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  paymentMethodsContainer: {
    marginBottom: 24,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  methodButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  methodTextActive: {
    color: colors.primary,
  },
  methodSubtext: {
    fontSize: 12,
    color: colors.text.light,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 12,
    backgroundColor: colors.input.background,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    paddingLeft: 16,
  },
  currencyInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontSize: 18,
    fontWeight: '600',
  },
  feeInfo: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  feeValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: colors.info + '15',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  pixContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pixTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  pixInstructions: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  pixCodeContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  pixCodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  pixCodeInput: {
    backgroundColor: colors.input.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    color: colors.text.primary,
    marginBottom: 16,
    minHeight: 80,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrImage: {
    width: 180,
    height: 180,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  copyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  pixInfo: {
    backgroundColor: colors.success + '15',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    marginBottom: 16,
  },
  pixInfoText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  pixWarning: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  pixSteps: {
    backgroundColor: colors.info + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  pixStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  pixStepText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
    paddingLeft: 8,
  },
  checkPaymentButton: {
    backgroundColor: colors.info,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  checkPaymentText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  checkingPaymentContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  checkingPaymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  checkingPaymentSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  linkButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  linkButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});