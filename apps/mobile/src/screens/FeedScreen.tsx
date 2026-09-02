import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Plus,
  X,
  Flame,
  Bike,
  Waves,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Clock,
  Map as MapIcon,
  Navigation,
  Radio,
  Compass,
  CheckCircle2,
} from 'lucide-react-native';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { connectMatchmakingSocket } from '../socket/matchmakingSocket';

// ── Shared Types ─────────────────────────────────────────────────────────────

export interface IActivityStats {
  distance: number;
  duration: number;
  secondaryStat?: string | number;
}

export interface IActivityUser {
  _id: string;
  username: string;
  avatarUrl?: string;
  eloProfiles?: Record<string, number>;
}

export interface IActivity {
  _id: string;
  id?: string;
  user: IActivityUser;
  title: string;
  sportType: 'RUNNING' | 'CYCLING' | 'SWIMMING';
  stats: IActivityStats;
  locationString?: string;
  likes: string[];
  likesCount?: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}

// ── ActivityCard Component ───────────────────────────────────────────────────

interface ActivityCardProps {
  activity: IActivity;
  onLikeToggle?: (activityId: string) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onLikeToggle }) => {
  const [isLiked, setIsLiked] = useState<boolean>(Boolean(activity.isLiked));
  const [likesCount, setLikesCount] = useState<number>(
    activity.likesCount ?? (Array.isArray(activity.likes) ? activity.likes.length : 0)
  );

  const handleLikePress = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    const id = activity._id || activity.id;
    if (id && onLikeToggle) onLikeToggle(id);
  };

  const getSportIcon = () => {
    if (activity.sportType === 'CYCLING') return <Bike size={16} color="#38BDF8" />;
    if (activity.sportType === 'SWIMMING') return <Waves size={16} color="#34D399" />;
    return <Flame size={16} color="#F43F5E" />;
  };

  const getSportName = () => {
    if (activity.sportType === 'CYCLING') return 'Bisiklet';
    if (activity.sportType === 'SWIMMING') return 'Yüzme';
    return 'Koşu';
  };

  const formatDistance = (val?: number) => `${(val ?? 0).toFixed(2)} km`;
  const formatDuration = (mins?: number) => {
    const totalSecs = Math.round((mins ?? 0) * 60);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Yeni';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} sa önce`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} g önce`;
  };

  const username = activity.user?.username || 'sporcu';

  return (
    <View style={styles.card}>
      {/* 1. Header: User Info & Sport Badge */}
      <View style={styles.headerRow}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.username}>@{username}</Text>
            <View style={styles.locationTimeRow}>
              <View style={styles.metaItem}>
                <MapPin size={11} color="#A1A1AA" />
                <Text style={styles.metaText}>{activity.locationString || 'Kadıköy, İstanbul'}</Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.metaItem}>
                <Clock size={11} color="#A1A1AA" />
                <Text style={styles.metaText}>{formatRelativeTime(activity.createdAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sportBadge}>
          {getSportIcon()}
          <Text style={styles.sportBadgeText}>{getSportName()}</Text>
        </View>
      </View>

      {/* 2. Activity Title */}
      <Text style={styles.title}>{activity.title || 'Antrenman Seansı'}</Text>

      {/* 3. 3-Column Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Mesafe</Text>
          <Text style={styles.statValue}>{formatDistance(activity.stats?.distance)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Süre</Text>
          <Text style={styles.statValue}>{formatDuration(activity.stats?.duration)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>
            {activity.sportType === 'CYCLING' ? 'Ort. Hız' : activity.sportType === 'SWIMMING' ? 'Tempo' : 'Ort. Tempo'}
          </Text>
          <Text style={styles.statValue}>{String(activity.stats?.secondaryStat || '5:12 /km')}</Text>
        </View>
      </View>

      {/* 4. Map / Route Placeholder View */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.radarCircle} />
        <View style={styles.routeIconWrapper}>
          <Navigation size={28} color="#F43F5E" />
        </View>
        <View style={styles.mapFooterBadge}>
          <MapIcon size={12} color="#F4F4F5" />
          <Text style={styles.mapFooterText}>GPS Rotası Doğrulandı</Text>
        </View>
      </View>

      {/* 5. Social Action Bar */}
      <View style={styles.socialStats}>
        <Text style={styles.socialCountText}>{likesCount} beğeni</Text>
        <Text style={styles.socialCountText}>{activity.commentsCount || 0} yorum</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLikePress} activeOpacity={0.7}>
          <Heart size={18} color={isLiked ? '#F43F5E' : '#A1A1AA'} fill={isLiked ? '#F43F5E' : 'transparent'} />
          <Text style={[styles.actionBtnText, isLiked && styles.actionBtnTextLiked]}>Beğen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <MessageCircle size={18} color="#A1A1AA" />
          <Text style={styles.actionBtnText}>Yorum</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Share2 size={18} color="#A1A1AA" />
          <Text style={styles.actionBtnText}>Paylaş</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── FeedScreen Component ─────────────────────────────────────────────────────

export function FeedScreen() {
  const { accessToken } = useAuthStore();
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Modal Form State
  const [title, setTitle] = useState('');
  const [selectedSport, setSelectedSport] = useState<'RUNNING' | 'CYCLING' | 'SWIMMING'>('RUNNING');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [locationString, setLocationString] = useState('Kadıköy, İstanbul');
  const [submitting, setSubmitting] = useState(false);

  // Initial Data Fetching via apiClient.get('/activities')
  const fetchFeed = useCallback(async () => {
    try {
      const res = await apiClient.get('/activities');
      if (res?.data?.data) {
        setActivities(res.data.data);
      }
    } catch (err) {
      console.log('Feed fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Real-Time Socket Connection
  useEffect(() => {
    if (!accessToken) return;

    const socket = connectMatchmakingSocket(accessToken);

    const handleFeedUpdate = (payload: any) => {
      if (!payload) return;

      if (payload.type === 'CREATED' && payload.activity) {
        setActivities((prev) => {
          const exists = prev.some(
            (a) => (a._id || a.id) === (payload.activity._id || payload.activity.id)
          );
          if (exists) return prev;
          return [payload.activity, ...prev];
        });
      } else if (payload.type === 'LIKED' && payload.activity) {
        const { activityId, likesCount, isLiked } = payload.activity;
        setActivities((prev) =>
          prev.map((item) => {
            if ((item._id || item.id) === activityId) {
              return {
                ...item,
                likesCount,
                isLiked: isLiked !== undefined ? isLiked : item.isLiked,
              };
            }
            return item;
          })
        );
      }
    };

    const handleNewActivity = (newAct: any) => {
      if (!newAct) return;
      setActivities((prev) => {
        const exists = prev.some((a) => (a._id || a.id) === (newAct._id || newAct.id));
        if (exists) return prev;
        return [newAct, ...prev];
      });
    };

    socket.on('feed_update', handleFeedUpdate);
    socket.on('new_activity', handleNewActivity);

    return () => {
      socket.off('feed_update', handleFeedUpdate);
      socket.off('new_activity', handleNewActivity);
    };
  }, [accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handleLikeToggle = async (activityId: string) => {
    try {
      await apiClient.post(`/activities/${activityId}/like`);
    } catch {
      fetchFeed();
    }
  };

  const handleCreateActivity = async () => {
    const distNum = parseFloat(distance.replace(',', '.'));
    const durNum = parseFloat(duration.replace(',', '.'));

    if (isNaN(distNum) || isNaN(durNum) || distNum <= 0 || durNum <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      const paceText =
        selectedSport === 'RUNNING'
          ? `${(durNum / distNum).toFixed(2).replace('.', ':')} /km`
          : selectedSport === 'CYCLING'
          ? `${((distNum / durNum) * 60).toFixed(1)} km/s`
          : '1:45 /100m';

      const response = await apiClient.post('/activities', {
        title: title.trim() || undefined,
        sportType: selectedSport,
        distance: distNum,
        duration: durNum,
        secondaryStat: paceText,
        locationString: locationString.trim() || 'Kadıköy, İstanbul',
      });

      if (response?.data?.data) {
        setActivities((prev) => [response.data.data, ...prev]);
      }

      setModalVisible(false);
      setTitle('');
      setDistance('');
      setDuration('');
    } catch (error) {
      console.log('Error creating activity:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.feedHeader}>
        <View>
          <Text style={styles.headerTitle}>TOPLULUK AKIŞI</Text>
          <Text style={styles.headerSubtitle}>Gerçek Zamanlı Sporcu Aktiviteleri</Text>
        </View>
        <View style={styles.liveBadge}>
          <Radio size={12} color="#10B981" />
          <Text style={styles.liveText}>CANLI</Text>
        </View>
      </View>

      {/* Body: Loading or Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F43F5E" />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={({ item }) => (
            <ActivityCard activity={item} onLikeToggle={handleLikeToggle} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F43F5E"
              colors={['#F43F5E']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Compass size={44} color="#3F3F46" />
              <Text style={styles.emptyTitle}>Henüz Aktivite Yok</Text>
              <Text style={styles.emptySubtitle}>
                Aşağıdaki kırmızı artı butonuna basarak ilk antrenmanınızı kaydedin.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Activity Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>YENİ ANTRENMAN KAYDI</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sport Selector */}
              <Text style={styles.inputLabel}>SPOR BRANŞI</Text>
              <View style={styles.sportSelectRow}>
                <TouchableOpacity
                  style={[
                    styles.sportOption,
                    selectedSport === 'RUNNING' && styles.sportOptionActive,
                  ]}
                  onPress={() => setSelectedSport('RUNNING')}
                >
                  <Flame
                    size={18}
                    color={selectedSport === 'RUNNING' ? '#F43F5E' : '#71717A'}
                  />
                  <Text
                    style={[
                      styles.sportOptionText,
                      selectedSport === 'RUNNING' && styles.sportOptionTextActive,
                    ]}
                  >
                    Koşu
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sportOption,
                    selectedSport === 'CYCLING' && styles.sportOptionActive,
                  ]}
                  onPress={() => setSelectedSport('CYCLING')}
                >
                  <Bike
                    size={18}
                    color={selectedSport === 'CYCLING' ? '#F43F5E' : '#71717A'}
                  />
                  <Text
                    style={[
                      styles.sportOptionText,
                      selectedSport === 'CYCLING' && styles.sportOptionTextActive,
                    ]}
                  >
                    Bisiklet
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sportOption,
                    selectedSport === 'SWIMMING' && styles.sportOptionActive,
                  ]}
                  onPress={() => setSelectedSport('SWIMMING')}
                >
                  <Waves
                    size={18}
                    color={selectedSport === 'SWIMMING' ? '#F43F5E' : '#71717A'}
                  />
                  <Text
                    style={[
                      styles.sportOptionText,
                      selectedSport === 'SWIMMING' && styles.sportOptionTextActive,
                    ]}
                  >
                    Yüzme
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title Input */}
              <Text style={styles.inputLabel}>BAŞLIK</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Sabah Sahil Temposu"
                placeholderTextColor="#52525B"
                value={title}
                onChangeText={setTitle}
              />

              {/* Distance & Duration Inputs */}
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>MESAFE (KM)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5.25"
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    value={distance}
                    onChangeText={setDistance}
                  />
                </View>

                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>SÜRE (DK)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="28"
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
              </View>

              {/* Location Input */}
              <Text style={styles.inputLabel}>KONUM / GÜZERGAH</Text>
              <TextInput
                style={styles.input}
                placeholder="Kadıköy Sahili, İstanbul"
                placeholderTextColor="#52525B"
                value={locationString}
                onChangeText={setLocationString}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!distance || !duration || submitting) && styles.submitBtnDisabled,
                ]}
                onPress={handleCreateActivity}
                disabled={!distance || !duration || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Kaydet ve Yayınla</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  liveText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#27272A',
    borderWidth: 1.5,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#F4F4F5',
    fontSize: 16,
    fontWeight: '700',
  },
  userMeta: {
    flex: 1,
  },
  username: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  locationTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#A1A1AA',
    fontSize: 11,
  },
  metaDot: {
    color: '#52525B',
    marginHorizontal: 6,
    fontSize: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#09090B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sportBadgeText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#27272A',
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#111113',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  radarCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: '#27272A',
    borderStyle: 'dashed',
  },
  routeIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFooterBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  mapFooterText: {
    color: '#E4E4E7',
    fontSize: 10,
    fontWeight: '600',
  },
  socialStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    marginBottom: 8,
  },
  socialCountText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnTextLiked: {
    color: '#F43F5E',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#D4D4D8',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#71717A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FAFAFA',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  sportSelectRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  sportOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#121214',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sportOptionActive: {
    backgroundColor: '#27272A',
    borderColor: '#F43F5E',
  },
  sportOptionText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '600',
  },
  sportOptionTextActive: {
    color: '#FAFAFA',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    color: '#FAFAFA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F43F5E',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
