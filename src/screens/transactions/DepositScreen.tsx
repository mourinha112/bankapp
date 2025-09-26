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
import { colors, globalStyles } from '../../theme';

export default function DepositScreen() {
  const navigation = useNavigation();
  const { deposit, state } = useApp();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    const numericAmount = parseFloat(amount.replace(',', '.'));
    
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return;
    }

    if (numericAmount > 10000) {
      Alert.alert('Erro', 'O valor máximo para depósito é R$ 10.000,00');
      return;
    }

    setLoading(true);
    const success = await deposit(numericAmount);
    setLoading(false);

    if (success) {
      Alert.alert('Sucesso', 'Depósito realizado com sucesso!', [
        { text: 'OK', onPress: () => {
            // Em web, navigation.goBack() pode não funcionar se não houver histórico.
            // Nesse caso, navegar para o Dashboard (rota principal) se possível.
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
    } else {
      Alert.alert('Erro', 'Não foi possível realizar o depósito');
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

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={globalStyles.card}>
            <Text style={globalStyles.title}>Depósito</Text>
            <Text style={[globalStyles.bodyText, globalStyles.mb24]}>
              Insira o valor que deseja depositar
            </Text>

            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Saldo atual:</Text>
              <Text style={styles.balanceValue}>
                R$ {state.auth.user?.balance.toFixed(2).replace('.', ',')}
              </Text>
            </View>

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

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ Informações importantes</Text>
              <Text style={styles.infoText}>
                • Valor mínimo: R$ 1,00{'\n'}
                • Valor máximo: R$ 10.000,00{'\n'}
                • O valor será creditado imediatamente
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
              <Text style={globalStyles.buttonText}>
                {loading ? 'Processando...' : 'Confirmar Depósito'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.button, globalStyles.buttonSecondary, globalStyles.mt16]}
              onPress={() => {
                try {
                  // Primeiro: tentar voltar no histórico local
                  // @ts-ignore
                  if (navigation.canGoBack && navigation.canGoBack()) {
                    // @ts-ignore
                    navigation.goBack();
                    return;
                  }

                  // Segundo: tentar o parent (tab navigator)
                  // @ts-ignore
                  const parent = navigation.getParent && navigation.getParent();
                  if (parent && parent.navigate) {
                    parent.navigate('Dashboard');
                    return;
                  }

                  // Terceiro: tentar grandparent (em casos de nesting mais profundo)
                  // @ts-ignore
                  const grand = parent && parent.getParent && parent.getParent();
                  if (grand && grand.navigate) {
                    grand.navigate('Dashboard');
                    return;
                  }

                  // Fallback final
                  // @ts-ignore
                  if (navigation.navigate) navigation.navigate('Dashboard');
                } catch (err) {
                  // Fallback simples
                  // @ts-ignore
                  navigation.navigate && navigation.navigate('Dashboard');
                }
              }}
            >
              <Text style={[globalStyles.buttonSecondaryText, { color: colors.primary }]}>Cancelar</Text>
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
});