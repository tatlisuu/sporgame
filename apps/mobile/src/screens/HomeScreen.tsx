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
  SafeAreaView,
} from 'react-native';
import {
  Plus,
  X,
  Flame,
  Bike,
  Waves,
  Radio,
  Compass,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { IActivity, SportType } from '@sporgame/shared';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { connectMatchmakingSocket } from '../socket/matchmakingSocket';
import { ActivityCard } from '../components/ActivityCard';
import { CommentsModal } from '../components/CommentsModal';

const DEFAULT_ACTIVITIES: IActivity[] = [
  {
    _id: 'seed-act-1',
    id: 'seed-act-1',
    title: 'Sabah Sahil Koşusu',
    sportType: SportType.RUNNING,
    user: {
      _id: 'seed-user-1',
      username: 'can_demir',
    },
    locationString: 'Bebek Sahili, İstanbul',
    stats: {
      distance: 6.42,
      duration: 32,
      secondaryStat: '4:58 /km',
    },
    likes: ['seed-user-2'],
    likesCount: 24,
    commentsCount: 5,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    _id: 'seed-act-2',
    id: 'seed-act-2',
    title: 'Boğaz Hattı Bisiklet Turu',
    sportType: SportType.CYCLING,
    user: {
      _id: 'seed-user-2',
      username: 'selin_kaya',
    },
    locationString: 'Sarıyer - Beşiktaş',
    stats: {
      distance: 28.5,
      duration: 65,
      secondaryStat: '26.3 km/s',
    },
    likes: ['seed-user-1', 'seed-user-3'],
    likesCount: 42,
    commentsCount: 9,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    _id: 'seed-act-3',
    id: 'seed-act-3',
    title: 'Kondisyon & Dayanıklılık Yüzüşü',
    sportType: SportType.SWIMMING,
    user: {
      _id: 'seed-user-3',
      username: 'mert_yavuz',
    },
    locationString: 'Olimpik Havuz, Kadıköy',
    stats: {
      distance: 1.8,
      duration: 40,
      secondaryStat: '1:42 /100m',
    },
    likes: [],
    likesCount: 17,
    commentsCount: 2,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

export function FeedScreen() {
  const navigation = useNavigation<any>();
  const { accessToken } = useAuthStore();
  const [activities, setActivities] = useState<IActivity[]>(DEFAULT_ACTIVITIES);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);

  // Comments Modal State
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState('');
  const [activeActivityTitle, setActiveActivityTitle] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [selectedSport, setSelectedSport] = useState<'RUNNING' | 'CYCLING' | 'SWIMMING'>('RUNNING');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [locationString, setLocationString] = useState('Kadıköy, İstanbul');
  const [submitting, setSubmitting] = useState(false);

  // Data Fetching
  const fetchFeed = useCallback(async () => {
    try {
      const res = await apiClient.get('/activities');
      if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
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
      } else if (payload.type === 'COMMENT_ADDED' && payload.activity) {
        const { activityId, commentsCount } = payload.activity;
        setActivities((prev) =>
          prev.map((item) => {
            if ((item._id || item.id) === activityId) {
              return {
                ...item,
                commentsCount,
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

  const handleCommentPress = (activityId: string, activityTitle: string) => {
    setActiveActivityId(activityId);
    setActiveActivityTitle(activityTitle);
    setCommentsModalVisible(true);
  };

  const handleCommentCountUpdate = (activityId: string, newCount: number) => {
    setActivities((prev) =>
      prev.map((act) =>
        (act._id === activityId || act.id === activityId)
          ? { ...act, commentsCount: newCount }
          : act
      )
    );
  };

  const handleUserPress = (userId: string, username: string) => {
    if (userId) {
      navigation.navigate('UserProfile', { userId, username });
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

      setCreateModalVisible(false);
      setTitle('');
      setDistance('');
      setDuration('');
    } catch (error) {
      console.log('Error creating activity:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: IActivity }) => (
    <ActivityCard
      activity={item}
      onLikeToggle={handleLikeToggle}
      onCommentPress={handleCommentPress}
      onUserPress={handleUserPress}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Feed List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F43F5E" />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={renderItem}
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
        onPress={() => setCreateModalVisible(true)}
        activeOpacity={0.85}
      >
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsModalVisible}
        activityId={activeActivityId}
        activityTitle={activeActivityTitle}
        onClose={() => setCommentsModalVisible(false)}
        onCommentCountUpdate={handleCommentCountUpdate}
        onUserPress={(userId, username) => {
          setCommentsModalVisible(false);
          handleUserPress(userId, username);
        }}
      />

      {/* Activity Creation Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>YENİ AKTİVİTE</Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sport Selector */}
              <Text style={styles.fieldLabel}>BRANŞ SEÇİN</Text>
              <View style={styles.sportSelector}>
                <TouchableOpacity
                  style={[
                    styles.sportBtn,
                    selectedSport === 'RUNNING' && styles.sportBtnActive,
                  ]}
                  onPress={() => setSelectedSport('RUNNING')}
                >
                  <Flame
                    size={18}
                    color={selectedSport === 'RUNNING' ? '#F43F5E' : '#A1A1AA'}
                  />
                  <Text
                    style={[
                      styles.sportBtnText,
                      selectedSport === 'RUNNING' && styles.sportBtnTextActive,
                    ]}
                  >
                    Koşu
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sportBtn,
                    selectedSport === 'CYCLING' && styles.sportBtnActive,
                  ]}
                  onPress={() => setSelectedSport('CYCLING')}
                >
                  <Bike
                    size={18}
                    color={selectedSport === 'CYCLING' ? '#38BDF8' : '#A1A1AA'}
                  />
                  <Text
                    style={[
                      styles.sportBtnText,
                      selectedSport === 'CYCLING' && styles.sportBtnTextActive,
                    ]}
                  >
                    Bisiklet
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sportBtn,
                    selectedSport === 'SWIMMING' && styles.sportBtnActive,
                  ]}
                  onPress={() => setSelectedSport('SWIMMING')}
                >
                  <Waves
                    size={18}
                    color={selectedSport === 'SWIMMING' ? '#34D399' : '#A1A1AA'}
                  />
                  <Text
                    style={[
                      styles.sportBtnText,
                      selectedSport === 'SWIMMING' && styles.sportBtnTextActive,
                    ]}
                  >
                    Yüzme
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title Input */}
              <Text style={styles.fieldLabel}>BAŞLIK</Text>
              <TextInput
                style={styles.input}
                placeholder="örn. Sabah Sahil Koşusu"
                placeholderTextColor="#71717A"
                value={title}
                onChangeText={setTitle}
              />

              {/* Metrics Row */}
              <View style={styles.inputsRow}>
                <View style={styles.inputCol}>
                  <Text style={styles.fieldLabel}>MESAFE (KM)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.0"
                    placeholderTextColor="#71717A"
                    keyboardType="decimal-pad"
                    value={distance}
                    onChangeText={setDistance}
                  />
                </View>

                <View style={styles.inputCol}>
                  <Text style={styles.fieldLabel}>SÜRE (DK)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#71717A"
                    keyboardType="number-pad"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
              </View>

              {/* Location Input */}
              <Text style={styles.fieldLabel}>KONUM / GÜZERGAH</Text>
              <TextInput
                style={styles.input}
                placeholder="örn. Bebek Sahili, İstanbul"
                placeholderTextColor="#71717A"
                value={locationString}
                onChangeText={setLocationString}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleCreateActivity}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Aktiviteyi Kaydet</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// Re-export as HomeScreen for backward compatibility
export const HomeScreen = FeedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 18,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  liveText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  emptyTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#71717A',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
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
    fontSize: 16,
    fontWeight: '800',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  sportSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  sportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sportBtnActive: {
    borderColor: '#F43F5E',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  sportBtnText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  sportBtnTextActive: {
    color: '#FAFAFA',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputCol: {
    flex: 1,
  },
  input: {
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FAFAFA',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
