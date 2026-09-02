import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  User,
  Flame,
  Bike,
  Waves,
  Trophy,
  Award,
  LogOut,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Inbox,
} from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { getChallengesApi, MatchItem } from '../api/matchmaking';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getChallengesApi()
      .then((data) => {
        if (isMounted) setMatches(data);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingMatches(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const eloProfiles = user?.eloProfiles || {
    RUNNING: 1200,
    CYCLING: 1200,
    SWIMMING: 1200,
  };

  const getTier = (elo: number) => {
    if (elo >= 2000) return { name: 'USTA', color: '#A855F7' };
    if (elo >= 1600) return { name: 'ELMAS', color: '#38BDF8' };
    if (elo >= 1400) return { name: 'ALTIN', color: '#FBBF24' };
    if (elo >= 1200) return { name: 'GÜMÜŞ', color: '#94A3B8' };
    return { name: 'BRONZ', color: '#F97316' };
  };

  const completedMatches = matches.filter((m) => m.status === 'COMPLETED');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>PROFİL</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={16} color="#F43F5E" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Identity Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <User size={36} color="#FAFAFA" />
            </View>
            <View style={styles.verifiedDot}>
              <Award size={10} color="#09090B" />
            </View>
          </View>

          <Text style={styles.username}>@{user?.username || 'sporcu'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'sporcu@sporgame.com'}</Text>

          {/* Real Social Stats */}
          <View style={styles.socialRow}>
            <View style={styles.socialCol}>
              <Text style={styles.socialNum}>{user?.followersCount ?? 0}</Text>
              <Text style={styles.socialLabel}>Takipçi</Text>
            </View>
            <View style={styles.socialDivider} />
            <View style={styles.socialCol}>
              <Text style={styles.socialNum}>{user?.followingCount ?? 0}</Text>
              <Text style={styles.socialLabel}>Takip Edilen</Text>
            </View>
            <View style={styles.socialDivider} />
            <View style={styles.socialCol}>
              <Text style={styles.socialNum}>{completedMatches.length}</Text>
              <Text style={styles.socialLabel}>Toplam Maç</Text>
            </View>
          </View>
        </View>

        {/* Real Elo Ratings per Sport */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Trophy size={16} color="#FBBF24" />
            <Text style={styles.cardTitle}>Disiplin Elo Dereceleri</Text>
          </View>

          <View style={styles.eloList}>
            {(['RUNNING', 'CYCLING', 'SWIMMING'] as const).map((sport) => {
              const rating = eloProfiles[sport] ?? 1200;
              const tier = getTier(rating);
              const icons = { RUNNING: Flame, CYCLING: Bike, SWIMMING: Waves };
              const SportIcon = icons[sport];

              return (
                <View key={sport} style={styles.eloItem}>
                  <View style={styles.sportCol}>
                    <SportIcon size={16} color="#FAFAFA" />
                    <Text style={styles.sportName}>{sport}</Text>
                  </View>

                  <View style={[styles.tierTag, { borderColor: tier.color }]}>
                    <Text style={[styles.tierName, { color: tier.color }]}>
                      {tier.name}
                    </Text>
                  </View>

                  <View style={styles.scoreCol}>
                    <TrendingUp size={13} color="#F43F5E" />
                    <Text style={styles.scoreText}>{rating} Elo</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Real Match History */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Award size={16} color="#FAFAFA" />
            <Text style={styles.cardTitle}>Son Rekabetçi Maçlar</Text>
          </View>

          {loadingMatches ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#F43F5E" />
            </View>
          ) : completedMatches.length === 0 ? (
            <View style={styles.emptyStateWrap}>
              <Inbox size={24} color="#71717A" />
              <Text style={styles.emptyStateTitle}>Kayıtlı Maç Yok</Text>
              <Text style={styles.emptyStateDesc}>
                Savaş Arenası üzerinden rakiplere meydan okuyarak Elo derecenizi yükseltin.
              </Text>
            </View>
          ) : (
            completedMatches.map((m) => {
              const isWinner = m.winnerId === user?.id;
              const isChallenger = m.challengerId === user?.id;
              const opponentName = isChallenger
                ? (m as any).challengedUsername || 'Sporcu'
                : (m as any).challengerUsername || 'Sporcu';

              return (
                <View key={m.id} style={styles.matchItem}>
                  <View style={styles.matchOutcomeCol}>
                    {isWinner ? (
                      <CheckCircle2 size={16} color="#22C55E" />
                    ) : (
                      <XCircle size={16} color="#EF4444" />
                    )}
                    <View>
                      <Text style={styles.matchOpponent}>vs @{opponentName}</Text>
                      <Text style={styles.matchDate}>
                        {m.sportType} • {new Date(m.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.eloDeltaBadge,
                      {
                        backgroundColor: isWinner
                          ? 'rgba(34, 197, 94, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eloDeltaText,
                        { color: isWinner ? '#22C55E' : '#EF4444' },
                      ]}
                    >
                      {isWinner ? `+${m.eloChange || 32}` : `-${m.eloChange || 32}`} Elo
                    </Text>
                  </View>
                </View>
              );
            })
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  logoutText: {
    color: '#F43F5E',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  profileCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F43F5E',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: 14,
  },
  socialCol: {
    flex: 1,
    alignItems: 'center',
  },
  socialNum: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
  },
  socialLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  socialDivider: {
    width: 1,
    backgroundColor: '#27272A',
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
  eloList: {
    gap: 10,
  },
  eloItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111114',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sportCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sportName: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
  },
  tierTag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 12,
  },
  tierName: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '800',
  },
  centerLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyStateTitle: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyStateDesc: {
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  matchOutcomeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matchOpponent: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
  },
  matchDate: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  eloDeltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eloDeltaText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
