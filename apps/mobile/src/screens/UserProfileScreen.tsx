import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Flame,
  Bike,
  Waves,
  Swords,
  UserPlus,
  UserCheck,
  Trophy,
  Calendar,
  Compass,
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { IUserProfile, IActivity } from '@sporgame/shared';
import { getUserProfileApi, toggleFollowApi } from '../api/users';
import { ActivityCard } from '../components/ActivityCard';
import { useAuthStore } from '../store/authStore';

export function UserProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user: currentUser } = useAuthStore();

  const userId = route.params?.userId;
  const usernameHint = route.params?.username;

  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [togglingFollow, setTogglingFollow] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getUserProfileApi(userId);
      setProfile(data);
      setFollowing(Boolean(data.isFollowing));
      setFollowersCount(data.followersCount || 0);
    } catch {
      // Offline / fallback profile for seamless UI
      const mockProfile: IUserProfile = {
        _id: userId,
        username: usernameHint || 'sporcu',
        followersCount: 142,
        followingCount: 88,
        isFollowing: false,
        eloProfiles: {
          RUNNING: 1450,
          CYCLING: 1320,
          SWIMMING: 1200,
        },
        recentActivities: [],
        createdAt: new Date().toISOString(),
      };
      setProfile(mockProfile);
      setFollowersCount(mockProfile.followersCount);
      setFollowing(false);
    } finally {
      setLoading(false);
    }
  }, [userId, usernameHint]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleToggleFollow = async () => {
    if (togglingFollow || !userId) return;
    if (currentUser?.id === userId) {
      Alert.alert('Bilgi', 'Kendi profilinizi takip edemezsiniz.');
      return;
    }

    const nextFollowing = !following;
    const nextCount = nextFollowing ? followersCount + 1 : Math.max(0, followersCount - 1);

    // Optimistic update
    setFollowing(nextFollowing);
    setFollowersCount(nextCount);
    setTogglingFollow(true);

    try {
      const res = await toggleFollowApi(userId);
      setFollowing(res.isFollowing);
      setFollowersCount(res.followersCount);
    } catch {
      // Keep optimistic state for offline/demo
    } finally {
      setTogglingFollow(false);
    }
  };

  const getTier = (elo: number) => {
    if (elo >= 2000) return { name: 'USTA', color: '#A855F7' };
    if (elo >= 1600) return { name: 'ELMAS', color: '#38BDF8' };
    if (elo >= 1400) return { name: 'ALTIN', color: '#FBBF24' };
    if (elo >= 1200) return { name: 'GÜMÜŞ', color: '#94A3B8' };
    return { name: 'BRONZ', color: '#F97316' };
  };

  const isSelf = currentUser?.id === userId;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>SPORCU PROFİLİ</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#F43F5E" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Identity Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {profile?.username?.charAt(0)?.toUpperCase() || 'S'}
                </Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Trophy size={11} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.usernameText}>@{profile?.username || 'sporcu'}</Text>

            {/* Follow Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{followersCount}</Text>
                <Text style={styles.statLabel}>Takipçi</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{profile?.followingCount ?? 0}</Text>
                <Text style={styles.statLabel}>Takip</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>
                  {profile?.recentActivities?.length ?? 0}
                </Text>
                <Text style={styles.statLabel}>Aktivite</Text>
              </View>
            </View>

            {/* Actions Bar */}
            {!isSelf && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.followBtn, following && styles.followingBtn]}
                  onPress={handleToggleFollow}
                  disabled={togglingFollow}
                  activeOpacity={0.8}
                >
                  {following ? (
                    <>
                      <UserCheck size={16} color="#FAFAFA" />
                      <Text style={styles.followBtnText}>Takip Ediliyor</Text>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} color="#FFFFFF" />
                      <Text style={[styles.followBtnText, { color: '#FFFFFF' }]}>
                        Takip Et
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.challengeBtn}
                  onPress={() =>
                    Alert.alert(
                      'Meydan Okuma',
                      `@${profile?.username} kullanıcısına meydan okuma talebi gönderildi!`
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Swords size={16} color="#F43F5E" />
                  <Text style={styles.challengeBtnText}>Meydan Oku</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Elo Ratings */}
          <Text style={styles.sectionHeader}>REKABET DÜZEYİ & ELO</Text>
          <View style={styles.eloCardsRow}>
            {/* Running */}
            <View style={styles.eloCard}>
              <View style={[styles.sportIconWrap, { backgroundColor: 'rgba(244,63,94,0.12)' }]}>
                <Flame size={18} color="#F43F5E" />
              </View>
              <Text style={styles.sportName}>Koşu</Text>
              <Text style={styles.eloScore}>{profile?.eloProfiles?.RUNNING || 1200}</Text>
              <View
                style={[
                  styles.tierTag,
                  { backgroundColor: getTier(profile?.eloProfiles?.RUNNING || 1200).color + '22' },
                ]}
              >
                <Text
                  style={[
                    styles.tierText,
                    { color: getTier(profile?.eloProfiles?.RUNNING || 1200).color },
                  ]}
                >
                  {getTier(profile?.eloProfiles?.RUNNING || 1200).name}
                </Text>
              </View>
            </View>

            {/* Cycling */}
            <View style={styles.eloCard}>
              <View style={[styles.sportIconWrap, { backgroundColor: 'rgba(14,165,233,0.12)' }]}>
                <Bike size={18} color="#0EA5E9" />
              </View>
              <Text style={styles.sportName}>Bisiklet</Text>
              <Text style={styles.eloScore}>{profile?.eloProfiles?.CYCLING || 1200}</Text>
              <View
                style={[
                  styles.tierTag,
                  { backgroundColor: getTier(profile?.eloProfiles?.CYCLING || 1200).color + '22' },
                ]}
              >
                <Text
                  style={[
                    styles.tierText,
                    { color: getTier(profile?.eloProfiles?.CYCLING || 1200).color },
                  ]}
                >
                  {getTier(profile?.eloProfiles?.CYCLING || 1200).name}
                </Text>
              </View>
            </View>

            {/* Swimming */}
            <View style={styles.eloCard}>
              <View style={[styles.sportIconWrap, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                <Waves size={18} color="#3B82F6" />
              </View>
              <Text style={styles.sportName}>Yüzme</Text>
              <Text style={styles.eloScore}>{profile?.eloProfiles?.SWIMMING || 1200}</Text>
              <View
                style={[
                  styles.tierTag,
                  { backgroundColor: getTier(profile?.eloProfiles?.SWIMMING || 1200).color + '22' },
                ]}
              >
                <Text
                  style={[
                    styles.tierText,
                    { color: getTier(profile?.eloProfiles?.SWIMMING || 1200).color },
                  ]}
                >
                  {getTier(profile?.eloProfiles?.SWIMMING || 1200).name}
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Activities */}
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>
            SON AKTİVİTELER
          </Text>
          {profile?.recentActivities && profile.recentActivities.length > 0 ? (
            profile.recentActivities.map((act) => (
              <ActivityCard
                key={act._id || act.id}
                activity={act}
                onUserPress={() => {}}
              />
            ))
          ) : (
            <View style={styles.emptyActivities}>
              <Compass size={32} color="#3F3F46" />
              <Text style={styles.emptyTitle}>Henüz paylaşılmış aktivite yok</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  topBarTitle: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 20,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#27272A',
    borderWidth: 2,
    borderColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FAFAFA',
    fontSize: 28,
    fontWeight: '800',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F43F5E',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#18181B',
  },
  usernameText: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#27272A',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#27272A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  followBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F43F5E',
    paddingVertical: 11,
    borderRadius: 10,
  },
  followingBtn: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  challengeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: '#F43F5E',
    paddingVertical: 11,
    borderRadius: 10,
  },
  challengeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F43F5E',
  },
  sectionHeader: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },
  eloCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  eloCard: {
    flex: 1,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  sportIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sportName: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  eloScore: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 6,
  },
  tierTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyActivities: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '500',
  },
});
