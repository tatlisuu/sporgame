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
  Radio,
  Compass,
  CheckCircle2,
} from 'lucide-react-native';
import { getFeedApi, toggleLikeApi, createActivityApi } from '../api/activities';
import { ActivityCard } from '../components/ActivityCard';
import { useAuthStore } from '../store/authStore';
import { connectMatchmakingSocket } from '../socket/matchmakingSocket';
import { IActivity, SportType } from '@sporgame/shared';

export function FeedScreen() {
  const { accessToken } = useAuthStore();
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType>(SportType.RUNNING);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [locationString, setLocationString] = useState('Kadıköy, İstanbul');
  const [submitting, setSubmitting] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const response = await getFeedApi(1, 30);
      setActivities(response.data);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Real-Time Socket Connection & Feed Listeners
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
      await toggleLikeApi(activityId);
    } catch {
      // Revert if error
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
        selectedSport === SportType.RUNNING
          ? `${(durNum / distNum).toFixed(2).replace('.', ':')} /km`
          : selectedSport === SportType.CYCLING
          ? `${((distNum / durNum) * 60).toFixed(1)} km/s`
          : '1:45 /100m';

      const newAct = await createActivityApi({
        title: title.trim() || undefined,
        sportType: selectedSport,
        distance: distNum,
        duration: durNum,
        secondaryStat: paceText,
        locationString: locationString.trim() || 'Kadıköy, İstanbul',
      });

      setActivities((prev) => [newAct, ...prev]);
      setModalVisible(false);
      setTitle('');
      setDistance('');
      setDuration('');
    } catch {
      // Handled silently
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TOPLULUK AKIŞI</Text>
          <Text style={styles.headerSubtitle}>Gerçek Zamanlı Sporcu Aktiviteleri</Text>
        </View>
        <View style={styles.liveIndicator}>
          <Radio size={12} color="#10B981" />
          <Text style={styles.liveText}>CANLI</Text>
        </View>
      </View>

      {/* Feed List */}
      {loading ? (
        <View style={styles.centerContainer}>
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
                Aşağıdaki kırmızı artı butonuna basarak ilk Strava antrenmanınızı kaydedin.
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
                    selectedSport === SportType.RUNNING && styles.sportOptionActive,
                  ]}
                  onPress={() => setSelectedSport(SportType.RUNNING)}
                >
                  <Flame
                    size={18}
                    color={selectedSport === SportType.RUNNING ? '#F43F5E' : '#71717A'}
                  />
                  <Text
                    style={[
                      styles.sportOptionText,
                      selectedSport === SportType.RUNNING && styles.sportOptionTextActive,
                    ]}
                  >
                    Koşu
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sportOption,
                    selectedSport === SportType.CYCLING && styles.sportOptionActive,
                  ]}
                  onPress={() => setSelectedSport(SportType.CYCLING)}
                >
                  <Bike
                    size={18}
                    color={selectedSport === SportType.CYCLING ? '#F43F5E' : '#71717A'}
                  />
                  <Text
                    style={[
                      styles.sportOptionText,
                      selectedSport === SportType.CYCLING && styles.sportOptionTextActive,
                    ]}
                  >
                    Bisiklet
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sportOption,
                    selectedSport === SportType.SWIMMING && styles.sportOptionActive,
                  ]}
                  onPress={() => setSelectedSport(SportType.SWIMMING)}
                >
                  <Waves
                    size={18}
                    color={selectedSport === SportType.SWIMMING ? '#F43F5E' : '#71717A'}
                  />
                  <Text
                    style={[
                      styles.sportOptionText,
                      selectedSport === SportType.SWIMMING && styles.sportOptionTextActive,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
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
  liveIndicator: {
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
