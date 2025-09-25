import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import BackendAsaasService from '../../services/BackendAsaasService';
import { colors, globalStyles } from '../../theme';

export default function WithdrawScreen() {
  const navigation = useNavigation();
  const { withdraw, state } = useApp();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixKey, setPixKey] = useState('');

  const handleWithdraw = async () => {
    console.log('🚀 [WithdrawScreen] Iniciando saque...');
    console.log('📊 [WithdrawScreen] Dados:', { amount, pixKey: pixKey.trim() });
    console.log('👤 [WithdrawScreen] Usuário:', state.auth.user?.email);
    console.log('💰 [WithdrawScreen] Saldo atual:', state.auth.user?.balance);
    
    const numericAmount = parseFloat(amount.replace(',', '.'));
    console.log('🔢 [WithdrawScreen] Valor numérico:', numericAmount);
    
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      console.log('❌ [WithdrawScreen] Valor inválido');
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return;
    }
    if (!pixKey.trim()) {
      console.log('❌ [WithdrawScreen] PIX key vazia');
      Alert.alert('Erro', 'Informe uma chave PIX para o saque');
      return;
    }
    if (numericAmount > (state.auth.user?.balance || 0)) {
      console.log('❌ [WithdrawScreen] Saldo insuficiente');
      Alert.alert('Erro', 'Saldo insuficiente para realizar o saque');
      return;
    }
    if (numericAmount > 5000) {
      console.log('❌ [WithdrawScreen] Valor muito alto');
      Alert.alert('Erro', 'O valor máximo para saque é R$ 5.000,00');
      return;
    }
    
    console.log('✅ [WithdrawScreen] Validações passaram, chamando backend...');
    setLoading(true);
    
    try {
      const requestData = {
        email: state.auth.user?.email || '',
        amount: numericAmount,
        pixKey: pixKey.trim(),
        description: `Saque de R$ ${numericAmount.toFixed(2)}`
      };
      console.log('📤 [WithdrawScreen] Dados da requisição:', requestData);
      
      const response = await BackendAsaasService.requestWithdraw(requestData);
      console.log('📥 [WithdrawScreen] Resposta do backend:', response);
      
      setLoading(false);
      if ((response as any).code === 'ASAAS_ACCOUNT_NOT_APPROVED') {
        Alert.alert(
          'Conta Asaas não liberada',
          'Sua conta ainda não está aprovada para usar PIX (saques). Entre no painel Asaas e conclua a verificação/KYC. Após a aprovação você poderá repetir o saque.'
        );
        return;
      }
      if (response.error) {
        Alert.alert('Erro', response.error);
        return;
      }
      // Atualiza saldo local rapidamente
      if (state.auth.user) {
        state.auth.user.balance = response.balance;
      }
      Alert.alert('Sucesso', 'Saque solicitado!', [
        { text: 'OK', onPress: () => {
            // fallback para web quando não há histórico
            // @ts-ignore
            if (navigation.canGoBack && navigation.canGoBack()) {
              // @ts-ignore
              navigation.goBack();
            } else {
              // @ts-ignore
              navigation.navigate && navigation.navigate('Dashboard');
            }
          }
        }
      ]);
    } catch (e) {
      setLoading(false);
      Alert.alert('Erro', 'Falha ao comunicar com o servidor');
    }
  };

  const formatCurrency = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Converte para formato de moeda
    const formattedValue = (parseInt(numericValue || '0') / 100).toFixed(2);
    
    return formattedValue.replace('.', ',');
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setAmount(formatted);
  };

  const quickAmounts = [50, 100, 200, 500];

  const handleQuickAmount = (value: number) => {
    if (value <= (state.auth.user?.balance || 0)) {
      setAmount(value.toFixed(2).replace('.', ','));
    } else {
      Alert.alert('Erro', 'Saldo insuficiente para este valor');
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={globalStyles.card}>
            <Text style={globalStyles.title}>Saque</Text>
            <Text style={[globalStyles.bodyText, globalStyles.mb24]}>
              Insira o valor que deseja sacar
            </Text>

            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Saldo disponível:</Text>
              <Text style={styles.balanceValue}>
                R$ {state.auth.user?.balance.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Valor do saque</Text>
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

            {/* Campo chave PIX */}
            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Chave PIX para receber</Text>
              <TextInput
                style={globalStyles.input}
                value={pixKey}
                onChangeText={setPixKey}
                placeholder="Informe sua chave PIX"
                placeholderTextColor={colors.input.placeholder}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.quickAmountsContainer}>
              <Text style={[globalStyles.label, globalStyles.mb16]}>Valores rápidos</Text>
              <View style={styles.quickAmountsGrid}>
                {quickAmounts.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickAmountButton,
                      value > (state.auth.user?.balance || 0) && styles.quickAmountButtonDisabled
                    ]}
                    onPress={() => handleQuickAmount(value)}
                    disabled={value > (state.auth.user?.balance || 0)}
                  >
                    <Text style={[
                      styles.quickAmountText,
                      value > (state.auth.user?.balance || 0) && styles.quickAmountTextDisabled
                    ]}>
                      R$ {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>⚠️ Informações importantes</Text>
              <Text style={styles.infoText}>
                • Valor mínimo: R$ 1,00{'\n'}
                • Valor máximo: R$ 5.000,00{'\n'}
                • Verifique se possui saldo suficiente{'\n'}
                • O valor será debitado imediatamente
              </Text>
            </View>

            <TouchableOpacity
              style={[
                globalStyles.button,
                globalStyles.mt24,
                (!amount || !pixKey || loading) && styles.buttonDisabled
              ]}
              onPress={handleWithdraw}
              disabled={!amount || !pixKey || loading}
            >
              <Text style={globalStyles.buttonText}>
                {loading ? 'Processando...' : 'Confirmar Saque'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.buttonSecondary, globalStyles.button, globalStyles.mt16]}
              onPress={() => {
                // fallback para web
                // @ts-ignore
                if (navigation.canGoBack && navigation.canGoBack()) {
                  // @ts-ignore
                  navigation.goBack();
                } else {
                  // @ts-ignore
                  navigation.navigate && navigation.navigate('Dashboard');
                }
              }}
            >
              <Text style={globalStyles.buttonSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  quickAmountsContainer: {
    marginBottom: 24,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAmountButton: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  quickAmountButtonDisabled: {
    backgroundColor: colors.text.light + '15',
    borderColor: colors.text.light,
  },
  quickAmountText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  quickAmountTextDisabled: {
    color: colors.text.light,
  },
  infoBox: {
    backgroundColor: colors.warning + '15',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
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
});