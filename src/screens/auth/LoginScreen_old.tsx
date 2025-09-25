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

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { loginWithUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Tentando login:', email);
      const loginResponse = await BackendAsaasService.loginUser({ email, password });
      
      if (loginResponse.error) {
        Alert.alert('Erro', loginResponse.error);
        return;
      }

      if (loginResponse.success && loginResponse.user) {
        console.log('✅ Login realizado:', loginResponse.user);
        
        // Atualizar contexto com usuário do backend
        const user = {
          id: loginResponse.user.id,
          email: loginResponse.user.email,
          username: loginResponse.user.username,
          balance: parseFloat(loginResponse.user.balance || '0'),
          createdAt: new Date(),
        };

        // Usar a nova função para fazer login
        loginWithUser(user);

        Alert.alert('Sucesso!', `Bem-vindo, ${loginResponse.user.username}!`);
      } else {
        Alert.alert('Erro', 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      Alert.alert('Erro', 'Erro ao fazer login. Tente novamente.');
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
        <Text style={styles.headerTitle}>Bank App</Text>
        <Text style={styles.headerSubtitle}>Bem-vindo de volta</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <Text style={globalStyles.title}>Entrar</Text>
            <Text style={[globalStyles.bodyText, globalStyles.mb24]}>
              Entre na sua conta para continuar
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
              style={[globalStyles.button, globalStyles.mb16, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={globalStyles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.buttonSecondary, globalStyles.button]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={globalStyles.buttonSecondaryText}>
                Criar conta
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
  disabledButton: {
    opacity: 0.6,
  },
});