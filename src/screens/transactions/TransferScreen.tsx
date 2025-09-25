import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { globalStyles, colors } from '../../theme';

const BASE_BACKEND_URL = 'http://192.168.1.122:3000';

interface User {
  id: number;
  name: string;
  email: string;
  cpf: string;
  balance: number;
}

export default function TransferScreen() {
  const navigation = useNavigation();
  const { state } = useApp();
  const [userCode, setUserCode] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recipient, setRecipient] = useState<User | null>(null);

  const searchUser = async () => {
    if (!userCode.trim()) {
      Alert.alert('Erro', 'Digite um nome de usuário válido');
      return;
    }
    setSearchLoading(true);
    try {
      const response = await fetch(`${BASE_BACKEND_URL}/api/users/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: userCode.trim() })
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setRecipient(data.user);
      } else {
        Alert.alert('Usuário não encontrado', 'Verifique o nome de usuário e tente novamente');
      }
    } catch (error) {
      Alert.alert('Erro de conexão', 'Verifique sua internet e tente novamente');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleTransfer = async () => {
    const numericAmount = parseFloat(amount);
    if (!recipient || !amount || numericAmount <= 0) {
      Alert.alert('Erro', 'Preencha todos os campos corretamente');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BASE_BACKEND_URL}/api/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: state.auth.user?.email,
          recipientEmail: recipient.email,
          amount: numericAmount
        })
      });
      const data = await response.json();
      if (response.ok) {
        // Atualiza saldo local (se existir) para feedback imediato
        if (state.auth.user) {
          // @ts-ignore (dependendo da tipagem atual do contexto)
          state.auth.user.balance = (state.auth.user.balance || 0) - numericAmount;
        }
        Alert.alert(
          'Transferência realizada!',
          `R$ ${numericAmount.toFixed(2)} enviados para ${recipient.name}`,
          [ { text: 'OK', onPress: () => navigation.goBack() } ]
        );
      } else {
        Alert.alert('Erro na transferência', data.message || 'Tente novamente');
      }
    } catch (error) {
      Alert.alert('Erro de conexão', 'Verifique sua internet e tente novamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}> Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Transferir</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Seu saldo disponível</Text>
          <Text style={styles.balanceValue}>R$ {(state.auth.user?.balance ?? 0).toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinatário</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome de usuário (ex: MOURINHA)"
              placeholderTextColor="#999"
              value={userCode}
              onChangeText={(text) => setUserCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity 
              style={[styles.searchButton, searchLoading && styles.buttonDisabled]} 
              onPress={searchUser} 
              disabled={searchLoading}
            >
              {searchLoading ? 
                <ActivityIndicator color="#fff" size="small" /> : 
                <Text style={styles.buttonText}>Buscar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {recipient && (
          <View style={styles.recipientCard}>
            <View style={styles.recipientInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {recipient.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.recipientDetails}>
                <Text style={styles.recipientName}>{recipient.name}</Text>
                <Text style={styles.recipientEmail}>{recipient.email}</Text>
              </View>
            </View>
          </View>
        )}

        {recipient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valor da transferência</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0,00"
                placeholderTextColor="#999"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {recipient && amount && (
          <TouchableOpacity 
            style={[styles.transferButton, loading && styles.buttonDisabled]} 
            onPress={handleTransfer} 
            disabled={loading}
          >
            {loading ? 
              <ActivityIndicator color="#fff" size="small" /> : 
              <Text style={styles.transferText}>Transferir R$ {parseFloat(amount || '0').toFixed(2)}</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 5,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  recipientCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  recipientEmail: {
    fontSize: 14,
    color: '#666',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  transferButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  transferText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
