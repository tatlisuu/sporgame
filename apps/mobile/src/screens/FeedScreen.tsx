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
} from 'react-native';
import {
  Flame,
  Bike,
  Waves,
  Heart,
  MessageSquare,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Compass,
  Radio,
} from 'lucide-react-native';
import { getFeedApi, toggleLikeApi, createActivityApi, ActivityItem } from '../api/activities';
import { useAuthStore } from '../store/authStore';
import { connectMatchmakingSocket } from '../socket/matchmakingSocket';

const sportIcons = {
  RUNNING: Flame,
  CYCLING: Bike,
  SWIMMING: Waves,
};

const sportColors = {
  RUNNING: '#F43F5E',
  CYCLING: '#38BDF8',
  SWIMMING: '#34D399',
};

export function FeedScreen() {
  const { accessToken } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSport, setSelectedSport] = useState<'RUNNING' | 'CYCLING' | 'SWIMMING'>('RUNNING');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const response = await getFeedApi(1, 20);
      setActivities(response.data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Real-time Activity Listener
  useEffect(() => {
    if (!accessToken) return;

    const socket = connectMatchmakingSocket(accessToken);

    const handleNewActivity = (newActivity: ActivityItem) => {
      setActivities((prev) => {
        if (prev.some((item) => item.id === newActivity.id)) {
          return prev;
        }
        return [newActivity, ...prev];
      });
    };

    socket.on('new_activity', handleNewActivity);

    return () => {
      socket.off('new_activity', handleNewActivity);
    };
  }, [accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handleLike = async (item: ActivityItem) => {
    const prevLiked = item.isLiked;
    const prevCount = item.likesCount;

    setActivities((prev) =>
      prev.map((act) =>
        act.id === item.id
          ? {
              ...act,
              isLiked: !prevLiked,
              likesCount: prevLiked ? prevCount - 1 : prevCount + 1,
            }
          : act
      )
    );

    try {
      const res = await toggleLikeApi(item.id);
      setActivities((prev) =>
        prev.map((act) =>
          act.id === item.id
            ? { ...act, isLiked: res.isLiked, likesCount: res.likesCount }
            : act
        )
      );
    } catch {
      setActivities((prev) =>
        prev.map((act) =>
          act.id === item.id
            ? { ...act, isLiked: prevLiked, likesCount: prevCount }
            : act
        )
      );
    }
  };

  const handleCreateActivity = async () => {
    if (!distance || !duration) return;
    setSubmitting(true);
    try {
      await createActivityApi({
        sportType: selectedSport,
        distance: parseFloat(distance) * 1000,
        duration: parseFloat(duration) * 60,
      });
      setDistance('');
      setDuration('');
      setModalVisible(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const formatDistance = (meters: number) => `${(meters / 1000).toFixed(2)} km`;
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderActivity = ({ item }: { item: ActivityItem }) => {
    const SportIcon = sportIcons[item.sportType] || Flame;
    const accentColor = sportColors[item.sportType] || '#F43F5E';
    const authorUsername = item.user.username || 'sporcu';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {authorUsername.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>@{authorUsername}</Text>
              <Text style={styles.timeText}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={[styles.sportTag, { borderColor: accentColor }]}>
            <SportIcon size={14} color={accentColor} />
            <Text style={[styles.sportTagText, { color: accentColor }]}>
              {item.sportType}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={styles.statLabelRow}>
              <Compass size={13} color="#71717A" />
              <Text style={styles.statLabel}>Mesafe</Text>
            </View>
            <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statLabelRow}>
              <Clock size={13} color="#71717A" />
              <Text style={styles.statLabel}>Süre</Text>
            </View>
            <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleLike(item)}
            activeOpacity={0.7}
          >
            <Heart
              size={18}
              color={item.isLiked ? '#F43F5E' : '#71717A'}
              fill={item.isLiked ? '#F43F5E' : 'none'}
            />
            <Text
              style={[
                styles.actionText,
                item.isLiked && { color: '#F43F5E', fontWeight: '700' },
              ]}
            >
              {item.likesCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <MessageSquare size={18} color="#71717A" />
            <Text style={styles.actionText}>{item.commentsCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>ANASAYFA</Text>
            <View style={styles.liveIndicator}>
              <Radio size={12} color="#22C55E" />
              <Text style={styles.liveIndicatorText}>CANLI</Text>
            </View>
          </View>
          <Text style={styles.screenSubtitle}>Global Aktivite Akışı</Text>
        </View>

        <TouchableOpacity
          style={styles.newPostBtn}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.newPostBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F43F5E" />
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F43F5E"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Henüz Aktivite Yok</Text>
              <Text style={styles.emptySubtitle}>
                İlk antrenmanınızı kaydedin veya sporcuları takip edin.
              </Text>
            </View>
          }
        />
      )}

      {/* New Activity Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aktivite Kaydet</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <View style={styles.sportSelectRow}>
              {(['RUNNING', 'CYCLING', 'SWIMMING'] as const).map((sport) => {
                const Icon = sportIcons[sport];
                const isSelected = selectedSport === sport;
                return (
                  <TouchableOpacity
                    key={sport}
                    style={[
                      styles.sportOption,
                      isSelected && styles.sportOptionActive,
                    ]}
                    onPress={() => setSelectedSport(sport)}
                  >
                    <Icon
                      size={16}
                      color={isSelected ? '#FFFFFF' : '#71717A'}
                    />
                    <Text
                      style={[
                        styles.sportOptionText,
                        isSelected && styles.sportOptionTextActive,
                      ]}
                    >
                      {sport}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mesafe (Kilometre)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Örn: 5.2"
                placeholderTextColor="#71717A"
                keyboardType="decimal-pad"
                value={distance}
                onChangeText={setDistance}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Süre (Dakika)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Örn: 28"
                placeholderTextColor="#71717A"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
              onPress={handleCreateActivity}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.btnRow}>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Aktiviteyi Kaydet</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#FAFAFA',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  liveIndicatorText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
    marginTop: 2,
  },
  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F43F5E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newPostBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  avatarInitials: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
  },
  authorName: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  sportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  sportTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  statBox: {
    flex: 1,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  statLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: 12,
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#71717A',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  sportSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  sportOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272A',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  sportOptionActive: {
    backgroundColor: '#F43F5E',
  },
  sportOptionText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
  },
  sportOptionTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FAFAFA',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
