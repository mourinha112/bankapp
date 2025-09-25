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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { colors, globalStyles } from '../../theme';
import BackendAsaasService from '../../services/BackendAsaasService';

export default function RealWithdrawScreen() {
  const navigation = useNavigation();
  const { state, withdraw } = useApp();
  
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>('cpf');
  const [loading, setLoading] = useState(false);

  const formatCPF = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return cleaned;
  };

  const handlePixKeyChange = (text: string) => {
    if (pixKeyType === 'cpf') {
      setPixKey(formatCPF(text));
    } else if (pixKeyType === 'phone') {
      setPixKey(formatPhone(text));
    } else {
      setPixKey(text);
    }
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    const formatted = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setAmount(formatted === '0,00' ? '' : formatted);
  };

  const getNumericAmount = () => {
    return parseFloat(amount.replace(/\./g, '').replace(',', '.'));
  };

  const validateFields = () => {
    const numericAmount = getNumericAmount();
    
    if (!amount || numericAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido para saque');
      return false;
    }

    if (numericAmount < 5) {
      Alert.alert('Erro', 'Valor mínimo para saque: R$ 5,00');
      return false;
    }

    if (numericAmount > state.auth.user!.balance) {
      Alert.alert('Saldo Insuficiente', 'Você não possui saldo suficiente para este saque');
      return false;
    }

    if (!pixKey.trim()) {
      Alert.alert('Erro', 'Digite sua chave PIX para receber o saque');
      return false;
    }

    // Validação básica da chave PIX
    if (pixKeyType === 'cpf' && pixKey.replace(/\D/g, '').length !== 11) {
      Alert.alert('Erro', 'Digite um CPF válido');
      return false;
    }

    if (pixKeyType === 'email' && !pixKey.includes('@')) {
      Alert.alert('Erro', 'Digite um email válido');
      return false;
    }

    if (pixKeyType === 'phone' && pixKey.replace(/\D/g, '').length < 10) {
      Alert.alert('Erro', 'Digite um telefone válido');
      return false;
    }

    return true;
  };

  const handleWithdraw = async () => {
    if (!validateFields()) return;
    
    if (!state.auth.user?.email) {
      Alert.alert('Erro', 'Usuário não encontrado. Faça login novamente.');
      return;
    }

    setLoading(true);
    
    try {
      const numericAmount = getNumericAmount();
      
      // 🔥 SAQUE REAL COM BACKEND - PIX AUTOMÁTICO
      const pixKeyToUse = pixKeyType === 'cpf' || pixKeyType === 'phone' 
        ? pixKey.replace(/\D/g, '') // Remove formatação
        : pixKey; // Email e chave aleatória mantém como está
      
      const requestData = {
        email: state.auth.user.email,
        amount: numericAmount,
        pixKey: pixKeyToUse.trim(),
        description: `Saque do app - ${state.auth.user?.username}`
      };

      console.log('📤 [RealWithdrawScreen] Dados da requisição:', requestData);
      
      const response = await BackendAsaasService.requestWithdraw(requestData);
      
      console.log('📥 [RealWithdrawScreen] Resposta do backend:', response);

      if (response.success) {
        // Só debita se o saque foi criado com sucesso
        await withdraw(numericAmount);
        
        Alert.alert(
          '✅ Saque Processado!',
          `Transferência PIX de R$ ${amount} enviada com sucesso!\n\n🔄 Status: ${response.status || 'Processando'}\n📅 Previsão: ${response.expectedTransferDate || 'Imediato'}\n🆔 ID: ${response.transferId || response.id}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          '❌ Erro no Saque',
          response.error || 'Não foi possível processar o saque. Tente novamente.'
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na comunicação. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getPixKeyPlaceholder = () => {
    switch (pixKeyType) {
      case 'cpf': return '000.000.000-00';
      case 'email': return 'seu@email.com';
      case 'phone': return '(11) 99999-9999';
      case 'random': return 'chave-aleatoria-uuid';
      default: return '';
    }
  };

  const getPixKeyMaxLength = () => {
    switch (pixKeyType) {
      case 'cpf': return 14;
      case 'phone': return 15;
      default: return 50;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Saldo Disponível</Text>
            <Text style={styles.balanceValue}>
              R$ {state.auth.user!.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={globalStyles.mb24}>
            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Valor do Saque *</Text>
              <TextInput
                style={globalStyles.input}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0,00"
                keyboardType="numeric"
                placeholderTextColor={colors.text.light}
              />
              <Text style={styles.minValueText}>💡 Valor mínimo: R$ 5,00</Text>
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Tipo de Chave PIX *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pixTypeSelector}>
                <View style={styles.pixTypeGrid}>
                  {[
                    { key: 'cpf', label: 'CPF', icon: '📄' },
                    { key: 'email', label: 'Email', icon: '📧' },
                    { key: 'phone', label: 'Telefone', icon: '📱' },
                    { key: 'random', label: 'Aleatória', icon: '🔑' },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.pixTypeButton,
                        pixKeyType === type.key && styles.pixTypeButtonActive
                      ]}
                      onPress={() => {
                        setPixKeyType(type.key as any);
                        setPixKey(''); // Limpa ao trocar tipo
                      }}
                    >
                      <Text style={styles.pixTypeIcon}>{type.icon}</Text>
                      <Text style={[
                        styles.pixTypeText,
                        pixKeyType === type.key && styles.pixTypeTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Sua Chave PIX *</Text>
              <TextInput
                style={globalStyles.input}
                value={pixKey}
                onChangeText={handlePixKeyChange}
                placeholder={getPixKeyPlaceholder()}
                keyboardType={pixKeyType === 'email' ? 'email-address' : pixKeyType === 'phone' ? 'phone-pad' : 'default'}
                maxLength={getPixKeyMaxLength()}
                placeholderTextColor={colors.text.light}
              />
              <Text style={styles.pixHelpText}>
                {pixKeyType === 'cpf' && '💡 Digite seu CPF cadastrado no PIX'}
                {pixKeyType === 'email' && '💡 Digite seu email cadastrado no PIX'}
                {pixKeyType === 'phone' && '💡 Digite seu telefone cadastrado no PIX'}
                {pixKeyType === 'random' && '💡 Cole sua chave aleatória do PIX'}
              </Text>
            </View>
          </View>

          <View style={styles.pixInfo}>
            <Text style={styles.pixInfoTitle}>🚀 Saque Automático via PIX</Text>
            <Text style={styles.pixInfoText}>
              • Transferência automática e instantânea{'\n'}
              • Processamento via Asaas{'\n'}
              • Sem taxas adicionais{'\n'}
              • Disponível 24h por dia
            </Text>
          </View>

          <TouchableOpacity
            style={[
              globalStyles.button,
              (!amount || !pixKey || loading) && styles.buttonDisabled
            ]}
            onPress={handleWithdraw}
            disabled={!amount || !pixKey || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={globalStyles.buttonText}>🔥 Sacar via PIX</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            ⚠️ Este é um saque REAL. O valor será transferido para a chave PIX informada via Asaas.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  balanceInfo: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  minValueText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  pixTypeSelector: {
    marginTop: 8,
  },
  pixTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  pixTypeButton: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
    alignItems: 'center',
  },
  pixTypeButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pixTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  pixTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  pixTypeTextActive: {
    color: colors.primary,
  },
  pixHelpText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  pixInfo: {
    backgroundColor: colors.success + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  pixInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  pixInfoText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  buttonDisabled: {
    backgroundColor: colors.text.secondary,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
});