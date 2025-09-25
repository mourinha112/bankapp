import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, globalStyles } from '../../theme';
import { useApp } from '../../context/AppContext';

// Tela placeholder para futura funcionalidade de cartão
export default function CardScreen() {
  const shimmer = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current; // 0 = frente, 1 = verso
  const { state } = useApp();
  const fullName = state.auth.user?.fullName || state.auth.user?.username || 'USUÁRIO';
  const [cardType, setCardType] = useState<'physical' | 'virtual'>('physical');
  const isFront = useRef(true);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 320],
  });

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg']
  });

  const flipCard = () => {
    Animated.timing(flipAnim, {
      toValue: isFront.current ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      isFront.current = !isFront.current;
    });
  };

  const toggleType = () => {
    setCardType(prev => prev === 'physical' ? 'virtual' : 'physical');
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.wrapper}>
        <View style={styles.cardShadowContainer}>
          <TouchableOpacity activeOpacity={0.9} onPress={flipCard} style={styles.flipContainer}>
            {/* Frente */}
            <Animated.View style={[styles.flipCard, { transform: [{ rotateY: frontInterpolate }] }]}> 
              <LinearGradient
                colors={cardType === 'physical' ? [colors.primary, '#3a66ff', '#6c3aff'] : ['#6c3aff', '#3a66ff', colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.brand}>BANK APP</Text>
                  <View style={styles.chip} />
                </View>
                <Text style={styles.number}>{cardType === 'physical' ? '**** **** **** 1234' : 'VIRTUAL PIX'}</Text>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.label}>NOME</Text>
                    <Text style={styles.value}>{fullName.toUpperCase().slice(0, 24)}</Text>
                  </View>
                  <View>
                    <Text style={styles.label}>VALIDADE</Text>
                    <Text style={styles.value}>{cardType === 'physical' ? 'MM/AA' : '--/--'}</Text>
                  </View>
                </View>
                {/* Shimmer overlay */}
                <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
                <View style={styles.typeBadge}> 
                  <Text style={styles.typeBadgeText}>{cardType === 'physical' ? 'FÍSICO' : 'VIRTUAL'}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
            {/* Verso */}
            <Animated.View style={[styles.flipCard, styles.flipCardBack, { transform: [{ rotateY: backInterpolate }] }]}> 
              <LinearGradient
                colors={['#1e1e28', '#26263a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { paddingTop: 30 }]}
              >
                <View style={styles.blackStrip} />
                <View style={styles.signatureBox}>
                  <Text style={styles.signatureLabel}>ASSINATURA</Text>
                  <View style={styles.signatureLine} />
                </View>
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.backHint}>Segurança e dados do cartão serão exibidos quando a função estiver ativa.</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleType} activeOpacity={0.8}>
          <Ionicons name="swap-horizontal" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.toggleButtonText}>
            {cardType === 'physical' ? 'Ver cartão virtual' : 'Ver cartão físico'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.subtitle}>Em breve essa função</Text>
        <Text style={styles.helper}>Estamos preparando seu cartão virtual e físico. Fique de olho nas próximas atualizações!</Text>
        <TouchableOpacity disabled style={styles.disabledButton} activeOpacity={1}>
          <Ionicons name="lock-closed" size={18} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.disabledButtonText}>Solicitar cartão</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardShadowContainer: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 16 / 9.5,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderRadius: 24,
  },
  flipContainer: {
    width: '100%',
    height: '100%',
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.primary,
    overflow: 'hidden'
  },
  flipCard: {
    backfaceVisibility: 'hidden',
    width: '100%',
    height: '100%',
  },
  flipCardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: [{ rotateY: '180deg' }],
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(255,255,255,0.22)',
    opacity: 0.6,
    transform: [{ rotate: '15deg' }]
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brand: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5
  },
  chip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.5)'
  },
  number: {
    marginTop: 32,
    color: colors.white,
    fontSize: 22,
    letterSpacing: 3,
    fontWeight: '600'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 28
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4
  },
  value: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600'
  },
  typeBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: colors.white,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8
  },
  helper: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 360
  },
  disabledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.light,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 32,
    opacity: 0.6
  },
  disabledButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40'
  },
  toggleButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  blackStrip: {
    height: 44,
    backgroundColor: '#111',
    borderRadius: 4,
  },
  signatureBox: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#555',
    marginBottom: 4,
    fontWeight: '600'
  },
  signatureLine: {
    height: 18,
    borderTopWidth: 1,
    borderColor: '#999'
  },
  backHint: {
    color: '#ccc',
    fontSize: 10,
    lineHeight: 14
  }
});
