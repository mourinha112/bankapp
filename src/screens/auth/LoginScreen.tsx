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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/RootNavigator';
import { useApp } from '../../context/AppContext';
import { colors, globalStyles } from '../../theme';
import BackendAsaasService from '../../services/BackendAsaasService';
import CustomAlert from '../../components/CustomAlert';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { loginWithUser } = useApp();
  const [step, setStep] = useState<'username' | 'password'>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('error');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertConfirm, setAlertConfirm] = useState('OK');

  const handleUsernameNext = async () => {
    if (!username || username.trim().length < 3) {
      Alert.alert('Erro', 'Por favor, digite um ID válido');
      return;
    }

    setLoading(true);

    try {
      const cleanUsername = username.trim();
      console.log('🔍 Verificando usuário:', cleanUsername);
      
      const userResponse = await BackendAsaasService.getUserByUsername(cleanUsername);
      
      if (userResponse.error) {
        if (userResponse.error === 'Usuário não encontrado') {
          // show custom alert
          setAlertType('info');
          setAlertTitle('ID não encontrado');
          setAlertMessage('Este ID não está cadastrado. Deseja criar uma conta?');
          setAlertConfirm('Criar Conta');
          setAlertVisible(true);
        } else {
          setAlertType('error');
          setAlertTitle('Erro');
          setAlertMessage(String(userResponse.error));
          setAlertConfirm('OK');
          setAlertVisible(true);
        }
        return;
      }

      if (userResponse.success && userResponse.user) {
        setUserEmail(userResponse.user.email);
        setStep('password');
        console.log('✅ Usuário encontrado:', userResponse.user.email);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar usuário:', error);
      Alert.alert('Erro', 'Erro ao verificar usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) {
      Alert.alert('Erro', 'Por favor, digite sua senha');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Tentando login por username:', username);
      const loginResponse = await BackendAsaasService.loginByUsername(username, password);
      
      if (loginResponse.error) {
        if (loginResponse.error.includes('Senha incorreta')) {
          setAlertType('error');
          setAlertTitle('Senha incorreta');
          setAlertMessage('A senha digitada está incorreta. Tente novamente.');
          setAlertConfirm('OK');
          setAlertVisible(true);
        } else if (loginResponse.error.includes('Nome de usuário não encontrado')) {
          setAlertType('info');
          setAlertTitle('Usuário não encontrado');
          setAlertMessage('Este nome de usuário não está cadastrado. Deseja criar uma conta?');
          setAlertConfirm('Criar Conta');
          setAlertVisible(true);
        } else {
          setAlertType('error');
          setAlertTitle('Erro');
          setAlertMessage(String(loginResponse.error));
          setAlertConfirm('OK');
          setAlertVisible(true);
        }
        return;
      }

      if (loginResponse.success && loginResponse.user) {
        console.log('✅ Login realizado:', loginResponse.user);
        
        const user = {
          id: loginResponse.user.id,
          email: loginResponse.user.email,
          username: loginResponse.user.username,
          balance: parseFloat(loginResponse.user.balance || '0'),
          createdAt: new Date(),
        };

        loginWithUser(user);
        Alert.alert('Bem-vindo!', `Olá, ${loginResponse.user.username}!`);
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      Alert.alert('Erro', 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('username');
    setPassword('');
  };

  return (
    <>
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header compacto estilo Nubank */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.header}
          >
            <Text style={styles.logo}>Bank App</Text>
          </LinearGradient>

          {/* Formulário */}
          <View style={styles.formContainer}>
            {step === 'username' ? (
              <>
                <Text style={styles.title}>Olá! 👋</Text>
                <Text style={styles.subtitle}>
                  Digite seu ID para continuar
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ID</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={(text) => setUsername(text.toUpperCase())}
                    placeholder="Seu ID (ex: MOURINHA)"
                    placeholderTextColor={colors.input.placeholder}
                    autoCapitalize="characters"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleUsernameNext}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continuar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.secondaryButtonText}>
                    Não tenho conta
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>← Voltar</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Digite sua senha</Text>
                <Text style={styles.subtitle}>
                  Usuário: {username}
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Digite sua senha"
                    placeholderTextColor={colors.input.placeholder}
                    secureTextEntry
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handlePasswordLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Entrar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.forgotButton}>
                  <Text style={styles.forgotButtonText}>
                    Esqueci minha senha
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    {/* Custom alert modal */}
    <CustomAlert
      visible={alertVisible}
      type={alertType}
      title={alertTitle}
      message={alertMessage}
      confirmText={alertConfirm}
      onClose={() => {
        // X button or backdrop: only hide the alert
        setAlertVisible(false);
      }}
      onConfirm={() => {
        // Confirm button pressed: if it's the Create flow, navigate
        setAlertVisible(false);
        if (alertConfirm === 'Criar Conta') {
          navigation.navigate('Register');
        }
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
});