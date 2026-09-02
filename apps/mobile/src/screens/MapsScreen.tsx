import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Navigation,
  Crosshair,
  Satellite,
  Compass,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react-native';

export function MapsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>HARİTALAR</Text>
        <Text style={styles.screenSubtitle}>Taktiksel GPS ve Canlı Rota Takibi</Text>
      </View>

      <View style={styles.content}>
        {/* Tactical Map HUD / Radar Visual */}
        <View style={styles.mapHud}>
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />
          <View style={styles.radarCircleOuter} />
          <View style={styles.radarCircleInner} />

          <View style={styles.hudBadgeTopLeft}>
            <Satellite size={14} color="#38BDF8" />
            <Text style={styles.hudBadgeText}>GPS: 12 UYDU AKTİF</Text>
          </View>

          <View style={styles.hudBadgeTopRight}>
            <Activity size={14} color="#22C55E" />
            <Text style={[styles.hudBadgeText, { color: '#22C55E' }]}>CANLI</Text>
          </View>

          <View style={styles.targetPin}>
            <Crosshair size={28} color="#F43F5E" />
          </View>

          <View style={styles.hudBadgeBottom}>
            <Text style={styles.hudBottomCoords}>39.9208 N, 32.8541 E</Text>
            <Text style={styles.hudBottomAlt}>Rakım: 890m | Doğruluk: 2.1m</Text>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresList}>
          <View style={styles.featureCard}>
            <View style={styles.featureIconBox}>
              <Navigation size={20} color="#F43F5E" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Gerçek Zamanlı Telemetri</Text>
              <Text style={styles.featureDesc}>
                Hız, tempo ve eğim verilerini milisaniyelik GPS sinyaliyle işleyin.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconBox}>
              <Layers size={20} color="#38BDF8" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Segment ve Isı Haritaları</Text>
              <Text style={styles.featureDesc}>
                Bölgenizdeki popüler parkurları keşfedin ve liderlik süreleriyle yarışın.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconBox}>
              <TrendingUp size={20} color="#34D399" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>GPX / TCX Senkronizasyonu</Text>
              <Text style={styles.featureDesc}>
                Garmin, Wahoo ve Apple Watch verilerinizi doğrudan içeri aktarın.
              </Text>
            </View>
          </View>
        </View>

        {/* Main Action Button */}
        <TouchableOpacity style={styles.trackButton} activeOpacity={0.8}>
          <Compass size={20} color="#FFFFFF" />
          <Text style={styles.trackButtonText}>Navigasyonu Başlat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#FAFAFA',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  mapHud: {
    height: 220,
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLineHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1F1F23',
  },
  gridLineVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#1F1F23',
  },
  radarCircleOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  radarCircleInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  targetPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudBadgeTopLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272A',
    gap: 6,
  },
  hudBadgeTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272A',
    gap: 6,
  },
  hudBadgeText: {
    color: '#D4D4D8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hudBadgeBottom: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
  },
  hudBottomCoords: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  hudBottomAlt: {
    color: '#71717A',
    fontSize: 10,
    marginTop: 2,
  },
  featuresList: {
    gap: 10,
    marginVertical: 14,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    gap: 12,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    color: '#71717A',
    fontSize: 11,
    lineHeight: 15,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F43F5E',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
