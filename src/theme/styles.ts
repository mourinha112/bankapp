import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 0, // Espaço para o tab bar
  },
  
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingBottom: 80, // Espaço para o tab bar
  },
  
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: colors.shadow.light,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow.medium,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  
  buttonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  
  buttonSecondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  input: {
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  
  inputFocused: {
    borderColor: colors.input.focus,
    borderWidth: 2,
  },
  
  label: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  
  bodyText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  mt16: {
    marginTop: 16,
  },
  
  mt24: {
    marginTop: 24,
  },
  
  mb16: {
    marginBottom: 16,
  },
  
  mb24: {
    marginBottom: 24,
  },
});