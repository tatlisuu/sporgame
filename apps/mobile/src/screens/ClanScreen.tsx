import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import {
  Shield,
  Users,
  Swords,
  Trophy,
  Zap,
  Inbox,
  Lock,
} from 'lucide-react-native';

export function ClanScreen() {
  const [hasClan] = useState(false);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>CLAN MERKEZİ</Text>
        <Text style={styles.screenSubtitle}>E-Spor Takım Sistemi ve Klan Savaşları</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Clan Status Card */}
        {!hasClan ? (
          <View style={styles.emptyClanCard}>
            <View style={styles.emblemContainer}>
              <Shield size={36} color="#71717A" />
            </View>
            <Text style={styles.emptyTitle}>Henüz Bir Klana Üye Değilsiniz</Text>
            <Text style={styles.emptyDesc}>
              Klan sistemi ile arkadaşlarınızla takım kurabilir, global klan savaşlarında mücadele
              edebilir ve takım Elo sıralamasında yükselebilirsiniz.
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  Alert.alert('Bilgi', 'Klan oluşturma özelliği Sezon 1 başlangıcında açılacaktır.')
                }
              >
                <Users size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Klan Oluştur</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  Alert.alert('Bilgi', 'Klan arama özelliği Sezon 1 başlangıcında açılacaktır.')
                }
              >
                <Shield size={16} color="#FAFAFA" />
                <Text style={styles.secondaryBtnText}>Klan Bul</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Clan Wars Live Status */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Swords size={16} color="#F43F5E" />
            <Text style={styles.cardTitle}>Aktif Klan Savaşları</Text>
          </View>

          <View style={styles.emptyStateWrap}>
            <Inbox size={24} color="#71717A" />
            <Text style={styles.emptyStateTitle}>Aktif Savaş Bulunmuyor</Text>
            <Text style={styles.emptyStateDesc}>
              Klan savaşları haftalık turnuva takvimine göre başlatılacaktır.
            </Text>
          </View>
        </View>

        {/* Clan Roadmap Features */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Trophy size={16} color="#FBBF24" />
            <Text style={styles.cardTitle}>Gelecek Klan Avantajları</Text>
          </View>

          <View style={styles.perkItem}>
            <Zap size={18} color="#FBBF24" />
            <View style={styles.perkTextWrap}>
              <Text style={styles.perkTitle}>Takım Elo ve Sezonluk Ligler</Text>
              <Text style={styles.perkDesc}>
                Klan üyelerinin bireysel müsabakalarından toplanan puanlarla klan liginde yükselin.
              </Text>
            </View>
            <Lock size={14} color="#71717A" />
          </View>

          <View style={styles.perkItem}>
            <Shield size={18} color="#38BDF8" />
            <View style={styles.perkTextWrap}>
              <Text style={styles.perkTitle}>Özel Takım Arması ve Tag</Text>
              <Text style={styles.perkDesc}>
                Liderlik tablosunda sporcu adınızın yanında özel klan etiketi taşır.
              </Text>
            </View>
            <Lock size={14} color="#71717A" />
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  emptyClanCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
  },
  emblemContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  emptyTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    color: '#71717A',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F43F5E',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  secondaryBtnText: {
    color: '#FAFAFA',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyStateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyStateTitle: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyStateDesc: {
    color: '#71717A',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 240,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  perkTextWrap: {
    flex: 1,
  },
  perkTitle: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
  },
  perkDesc: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});
