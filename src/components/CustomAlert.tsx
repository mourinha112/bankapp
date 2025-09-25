import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface CustomAlertProps {
  visible: boolean;
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

const { width } = Dimensions.get('window');

export default function CustomAlert({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK'
}: CustomAlertProps) {
  
  const getTypeConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'close-circle',
          iconColor: '#FF6B6B',
          gradientColors: ['#FF6B6B', '#FF5252'],
        };
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#4CAF50',
          gradientColors: ['#4CAF50', '#66BB6A'],
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#FF9800',
          gradientColors: ['#FF9800', '#FFB74D'],
        };
      case 'info':
        return {
          icon: 'information-circle',
          iconColor: colors.primary,
          gradientColors: [colors.primary, colors.primaryDark],
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: colors.primary,
          gradientColors: [colors.primary, colors.primaryDark],
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Close X button */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose} accessibilityLabel="Fechar">
            <Ionicons name="close" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
          {/* Ícone */}
          <View style={[styles.iconContainer, { backgroundColor: config.iconColor + '20' }]}>
            <Ionicons 
              name={config.icon as any} 
              size={48} 
              color={config.iconColor} 
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Mensagem */}
          <Text style={styles.message}>{message}</Text>

          {/* Botão */}
          <TouchableOpacity 
            style={styles.buttonContainer}
            onPress={() => {
              if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
              } else {
                onClose();
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={config.gradientColors as [string, string]}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>{confirmText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});