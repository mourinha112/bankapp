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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/RootNavigator';
import { useApp } from '../../context/AppContext';
import { colors, globalStyles } from '../../theme';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/RootNavigator';
import { useApp } from '../../context/AppContext';
import { colors, globalStyles } from '../../theme';
import BackendAsaasService from '../../services/BackendAsaasService';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, state } = useApp();
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCPF = (text: string) => {
    // Remove caracteres não numéricos
    const cleaned = text.replace(/\D/g, '');
    
    // Aplica máscara XXX.XXX.XXX-XX
    if (cleaned.length <= 11) {
      const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      return formatted;
    }
    return text;
  };

  const formatPhone = (text: string) => {
    // Remove caracteres não numéricos
    const cleaned = text.replace(/\D/g, '');
    
    // Aplica máscara (XX) XXXXX-XXXX
    if (cleaned.length <= 11) {
      const formatted = cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      return formatted;
    }
    return text;
  };

  const handleRegister = async () => {
    if (!email || !confirmEmail || !username || !fullName || !cpf || !phone || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (email !== confirmEmail) {
      Alert.alert('Erro', 'Os emails não coincidem');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
      Alert.alert('Erro', 'CPF deve ter 11 dígitos');
      return;
    }

    if (phone.replace(/\D/g, '').length !== 11) {
      Alert.alert('Erro', 'Telefone deve ter 11 dígitos');
      return;
    }

    setLoading(true);

    try {
      // Criar cliente no Asaas via backend
      const customerData = {
        name: fullName,
        email: email,
        cpfCnpj: cpf.replace(/\D/g, ''),
        phone: phone.replace(/\D/g, '')
      };

      console.log('📝 Criando usuário:', customerData);
      const customerResponse = await BackendAsaasService.createOrGetCustomer(customerData);
      
      if (customerResponse.error) {
        Alert.alert('Erro', customerResponse.error);
        return;
      }

      console.log('✅ Usuário criado no backend:', customerResponse);
      
      // Registrar no sistema local (AppContext)
      const success = await register(email, confirmEmail, 'BANK2025', username, password);
      if (success) {
        Alert.alert('Sucesso!', 'Conta criada com sucesso! Você já pode fazer login.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Erro', 'Erro ao criar conta no sistema local');
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      Alert.alert('Erro', 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Criar Conta</Text>
        <Text style={styles.headerSubtitle}>Junte-se ao Bank App</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <Text style={globalStyles.title}>Registro</Text>
            <Text style={[globalStyles.bodyText, globalStyles.mb24]}>
              Preencha os dados para criar sua conta
            </Text>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Email</Text>
              <TextInput
                style={globalStyles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu email"
                placeholderTextColor={colors.input.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Confirmar Email</Text>
              <TextInput
                style={globalStyles.input}
                value={confirmEmail}
                onChangeText={setConfirmEmail}
                placeholder="Confirme seu email"
                placeholderTextColor={colors.input.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Código de Convite</Text>
              <TextInput
                style={globalStyles.input}
                value={code}
                onChangeText={setCode}
                placeholder="Digite o código (BANK2025)"
                placeholderTextColor={colors.input.placeholder}
                autoCapitalize="characters"
              />
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Nome de Usuário</Text>
              <TextInput
                style={globalStyles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Digite seu nome de usuário"
                placeholderTextColor={colors.input.placeholder}
                autoCapitalize="none"
                autoComplete="username"
              />
            </View>

            <View style={globalStyles.mb24}>
              <Text style={globalStyles.label}>Senha</Text>
              <TextInput
                style={globalStyles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.input.placeholder}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[globalStyles.button, globalStyles.mb16]}
              onPress={handleRegister}
              disabled={state.auth.loading}
            >
              <Text style={globalStyles.buttonText}>
                {state.auth.loading ? 'Criando conta...' : 'Criar Conta'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.buttonSecondary, globalStyles.button]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={globalStyles.buttonSecondaryText}>
                Já tenho conta
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginTop: -40,
    shadowColor: colors.shadow.medium,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
});