import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/RootNavigator';
import { useApp } from '../../context/AppContext';
import { colors, globalStyles } from '../../theme';
import BackendAsaasService from '../../services/BackendAsaasService';
import { useCustomAlert } from '../../hooks/useCustomAlert';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register } = useApp();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCPF = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return text;
  };

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return text;
  };

  const handleRegister = async () => {
    if (!email || !confirmEmail || !username || !fullName || !cpf || !phone || !referralCode || !password || !confirmPassword) {
      showAlert({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha todos os campos para continuar.'
      });
      return;
    }

    if (email !== confirmEmail) {
      showAlert({
        type: 'error',
        title: 'Emails não coincidem',
        message: 'Verifique se os emails digitados são idênticos.'
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({
        type: 'error',
        title: 'Senhas não coincidem',
        message: 'Verifique se as senhas digitadas são idênticas.'
      });
      return;
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
      showAlert({
        type: 'error',
        title: 'CPF inválido',
        message: 'O CPF deve conter exatamente 11 dígitos.'
      });
      return;
    }

    if (phone.replace(/\D/g, '').length !== 11) {
      showAlert({
        type: 'error',
        title: 'Telefone inválido',
        message: 'O telefone deve conter exatamente 11 dígitos.'
      });
      return;
    }

    setLoading(true);

    try {
      // Registrar usuário completo no backend
      const registerData = {
        name: fullName,
        email: email,
        cpfCnpj: cpf.replace(/\D/g, ''),
        phone: phone.replace(/\D/g, ''),
        username: username,
        password: password,
        referralCode: referralCode
      };

      console.log('📝 Registrando usuário completo:', registerData);
      const registerResponse = await BackendAsaasService.registerUser(registerData);
      
      if (registerResponse.error) {
        showAlert({
          type: 'error',
          title: registerResponse.error.includes('Código de usuário não encontrado') 
            ? 'Usuário não encontrado 🔍'
            : 'Erro no cadastro',
          message: registerResponse.error.includes('Código de usuário não encontrado')
            ? 'O nome de usuário digitado não foi encontrado. Verifique se está correto ou peça para quem te indicou confirmar o nome de usuário.'
            : registerResponse.error
        });
        return;
      }

      console.log('✅ Usuário registrado:', registerResponse);
      showAlert({
        type: 'success',
        title: 'Bem-vindo! 🎉',
        message: 'Sua conta foi criada com sucesso! Agora você já pode fazer login e aproveitar todos os recursos do app.',
        confirmText: 'Continuar'
      });
      
      // Aguardar um pouco antes de navegar para dar tempo do usuário ver o sucesso
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      showAlert({
        type: 'error',
        title: 'Erro inesperado',
        message: 'Ocorreu um erro ao criar sua conta. Verifique sua conexão e tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.header}
          >
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Preencha seus dados para criar sua conta no Bank App
            </Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Nome Completo</Text>
              <TextInput
                style={globalStyles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Digite seu nome completo"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>CPF</Text>
              <TextInput
                style={globalStyles.input}
                value={cpf}
                onChangeText={(text) => setCpf(formatCPF(text))}
                placeholder="000.000.000-00"
                placeholderTextColor={colors.input.placeholder}
                keyboardType="numeric"
                maxLength={14}
              />
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Telefone</Text>
              <TextInput
                style={globalStyles.input}
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                placeholder="(00) 00000-0000"
                placeholderTextColor={colors.input.placeholder}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Nome de usuário de referência</Text>
              <TextInput
                style={globalStyles.input}
                value={referralCode}
                onChangeText={(text) => setReferralCode(text.toUpperCase())}
                placeholder="Digite o nome de usuário de quem te indicou (ex: MOURINHA)"
                placeholderTextColor={colors.input.placeholder}
                autoCapitalize="characters"
                maxLength={6}
              />
              <Text style={styles.hint}>
                Para se cadastrar, você precisa do nome de usuário de alguém já registrado no app
              </Text>
            </View>

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
              />
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Confirmar Email</Text>
              <TextInput
                style={globalStyles.input}
                value={confirmEmail}
                onChangeText={setConfirmEmail}
                placeholder="Digite novamente seu email"
                placeholderTextColor={colors.input.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Nome de Usuário</Text>
              <TextInput
                style={globalStyles.input}
                value={username}
                onChangeText={(text) => setUsername(text.toUpperCase())}
                placeholder="Digite um nome de usuário (máx 6 caracteres)"
                placeholderTextColor={colors.input.placeholder}
                autoCapitalize="characters"
                maxLength={6}
              />
              <Text style={styles.hint}>
                Este será seu código para receber transferências
              </Text>
            </View>

            <View style={globalStyles.mb16}>
              <Text style={globalStyles.label}>Senha</Text>
              <TextInput
                style={globalStyles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.input.placeholder}
                secureTextEntry
              />
            </View>

            <View style={globalStyles.mb24}>
              <Text style={globalStyles.label}>Confirmar Senha</Text>
              <TextInput
                style={globalStyles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Digite novamente sua senha"
                placeholderTextColor={colors.input.placeholder}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.registerButtonText}>Criar Conta</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backButtonText}>
                Já tem uma conta? Fazer login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Custom Alert */}
      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});