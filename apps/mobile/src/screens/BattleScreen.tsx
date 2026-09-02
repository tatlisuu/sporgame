import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Swords,
  Trophy,
  Wifi,
  WifiOff,
  Radio,
  Flame,
  Bike,
  Waves,
  Send,
  TrendingUp,
  Check,
  X,
  Shield,
  Clock,
  User,
} from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import {
  connectMatchmakingSocket,
  disconnectMatchmakingSocket,
} from '../socket/matchmakingSocket';
import {
  getLeaderboardApi,
  getChallengesApi,
  respondChallengeApi,
  LeaderboardEntry,
  MatchItem,
} from '../api/matchmaking';

type SportType = 'RUNNING' | 'CYCLING' | 'SWIMMING';

export function BattleScreen() {
  const { user, accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'CHALLENGE' | 'LEADERBOARD'>('CHALLENGE');

  // Matchmaking State
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [targetUsername, setTargetUsername] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType>('RUNNING');
  const [sendingChallenge, setSendingChallenge] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Incoming Challenge Modal
  const [incomingChallenge, setIncomingChallenge] = useState<any | null>(null);
  const [responding, setResponding] = useState(false);

  // User's Real Challenges
  const [challenges, setChallenges] = useState<MatchItem[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  // Leaderboard State
  const [leaderboardSport, setLeaderboardSport] = useState<SportType>('RUNNING');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const fetchChallenges = useCallback(async () => {
    setLoadingChallenges(true);
    try {
      const data = await getChallengesApi();
      setChallenges(data);
    } catch {
    } finally {
      setLoadingChallenges(false);
    }
  }, []);

  // Socket Connection Lifecycle
  useEffect(() => {
    if (!accessToken) return;

    setSocketStatus('connecting');
    const socket = connectMatchmakingSocket(accessToken);

    socket.on('connect', () => {
      setSocketStatus('connected');
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setSocketStatus('disconnected');
    });

    // Real-time challenge received
    socket.on('challenge_user', (match: any) => {
      setIncomingChallenge(match);
      fetchChallenges();
    });

    socket.on('challenge_accepted', () => {
      setStatusNotice('Meydan okuma kabul edildi.');
      fetchChallenges();
    });

    socket.on('challenge_rejected', () => {
      setStatusNotice('Meydan okuma reddedildi.');
      fetchChallenges();
    });

    socket.on('match_result', () => {
      fetchChallenges();
    });

    return () => {
      disconnectMatchmakingSocket();
    };
  }, [accessToken, fetchChallenges]);

  // Leaderboard Fetch
  const fetchLeaderboard = useCallback(async (sport: SportType) => {
    setLoadingLeaderboard(true);
    try {
      const data = await getLeaderboardApi(sport);
      setLeaderboard(data);
    } catch {
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'LEADERBOARD') {
      fetchLeaderboard(leaderboardSport);
    } else {
      fetchChallenges();
    }
  }, [activeTab, leaderboardSport, fetchLeaderboard, fetchChallenges]);

  const handleSendChallenge = () => {
    const cleanUsername = targetUsername.trim().replace(/^@/, '');
    if (!cleanUsername) {
      setStatusNotice('Lütfen geçerli bir sporcu kullanıcı adı girin.');
      return;
    }

    setSendingChallenge(true);
    setStatusNotice(null);

    const socket = connectMatchmakingSocket(accessToken!);
    socket.emit(
      'challenge_user',
      {
        username: cleanUsername,
        sportType: selectedSport,
      },
      (res: any) => {
        setSendingChallenge(false);
        if (res?.success) {
          setStatusNotice(`@${cleanUsername} sporcusuna meydan okuma iletildi.`);
          setTargetUsername('');
          fetchChallenges();
        } else {
          setStatusNotice(res?.error || 'Meydan okuma başarısız oldu.');
        }
      }
    );
  };

  const handleRespondChallenge = async (action: 'ACCEPT' | 'REJECT') => {
    if (!incomingChallenge) return;
    setResponding(true);

    try {
      const socket = connectMatchmakingSocket(accessToken!);
      const eventName = action === 'ACCEPT' ? 'challenge_accepted' : 'challenge_rejected';
      socket.emit(eventName, { matchId: incomingChallenge.id });

      await respondChallengeApi(incomingChallenge.id, action);
      setIncomingChallenge(null);
      fetchChallenges();
    } catch {
      setIncomingChallenge(null);
    } finally {
      setResponding(false);
    }
  };

  const statusConfig = {
    connected: { color: '#22C55E', text: 'CANLI ARENA', Icon: Wifi },
    connecting: { color: '#EAB308', text: 'BAĞLANIYOR...', Icon: Radio },
    disconnected: { color: '#EF4444', text: 'ÇEVRİMDIŞI', Icon: WifiOff },
  };

  const currentStatus = statusConfig[socketStatus];
  const StatusIcon = currentStatus.Icon;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>SAVAŞ ARENASI</Text>
          <Text style={styles.screenSubtitle}>Rekabetçi Elo Eşleşmesi ve Sıralamalar</Text>
        </View>

        <View style={[styles.statusBadge, { borderColor: currentStatus.color }]}>
          <StatusIcon size={12} color={currentStatus.color} />
          <Text style={[styles.statusText, { color: currentStatus.color }]}>
            {currentStatus.text}
          </Text>
        </View>
      </View>

      {/* Segmented Navigation */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'CHALLENGE' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('CHALLENGE')}
        >
          <Swords size={16} color={activeTab === 'CHALLENGE' ? '#FFFFFF' : '#71717A'} />
          <Text style={[styles.segmentText, activeTab === 'CHALLENGE' && styles.segmentTextActive]}>
            Meydan Oku
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'LEADERBOARD' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('LEADERBOARD')}
        >
          <Trophy size={16} color={activeTab === 'LEADERBOARD' ? '#FFFFFF' : '#71717A'} />
          <Text style={[styles.segmentText, activeTab === 'LEADERBOARD' && styles.segmentTextActive]}>
            Liderlik Tablosu
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'CHALLENGE' ? (
          <>
            {/* Challenge Creation Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Rakibe Meydan Oku</Text>

              <Text style={styles.fieldLabel}>Spor Disiplini</Text>
              <View style={styles.sportSelector}>
                {(['RUNNING', 'CYCLING', 'SWIMMING'] as SportType[]).map((sport) => {
                  const icons = { RUNNING: Flame, CYCLING: Bike, SWIMMING: Waves };
                  const SportIcon = icons[sport];
                  const isSelected = selectedSport === sport;
                  return (
                    <TouchableOpacity
                      key={sport}
                      style={[styles.sportButton, isSelected && styles.sportButtonActive]}
                      onPress={() => setSelectedSport(sport)}
                    >
                      <SportIcon size={14} color={isSelected ? '#FFFFFF' : '#71717A'} />
                      <Text style={[styles.sportButtonText, isSelected && styles.sportButtonTextActive]}>
                        {sport}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Rakip Sporcu Kullanıcı Adı</Text>
              <TextInput
                style={styles.input}
                placeholder="@kullanici_adi"
                placeholderTextColor="#71717A"
                value={targetUsername}
                onChangeText={setTargetUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {statusNotice ? (
                <View style={styles.noticeBanner}>
                  <Text style={styles.noticeText}>{statusNotice}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.actionBtn, sendingChallenge && { opacity: 0.6 }]}
                onPress={handleSendChallenge}
                disabled={sendingChallenge}
              >
                {sendingChallenge ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Meydan Okumayı İlet</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Real Challenges List */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Clock size={16} color="#A1A1AA" />
                <Text style={styles.cardTitle}>Bekleyen ve Aktif Meydan Okumalar</Text>
              </View>

              {loadingChallenges ? (
                <View style={styles.centerLoading}>
                  <ActivityIndicator size="small" color="#F43F5E" />
                </View>
              ) : challenges.length === 0 ? (
                <Text style={styles.emptyText}>Henüz aktif bir meydan okuma bulunmuyor.</Text>
              ) : (
                challenges.map((c) => {
                  const isChallenger = c.challengerId === user?.id;
                  const opponentName = isChallenger
                    ? (c as any).challengedUsername || 'Sporcu'
                    : (c as any).challengerUsername || 'Sporcu';

                  return (
                    <View key={c.id} style={styles.challengeItem}>
                      <View style={styles.challengeLeft}>
                        <View style={styles.challengeAvatar}>
                          <User size={16} color="#FAFAFA" />
                        </View>
                        <View>
                          <Text style={styles.challengeOpponent}>@{opponentName}</Text>
                          <Text style={styles.challengeSport}>
                            {c.sportType} • {new Date(c.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.challengeStatusTag,
                          c.status === 'ACCEPTED' && styles.statusTagAccepted,
                          c.status === 'COMPLETED' && styles.statusTagCompleted,
                        ]}
                      >
                        <Text style={styles.challengeStatusText}>{c.status}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : (
          /* Leaderboard View */
          <View style={styles.card}>
            <View style={styles.sportSelector}>
              {(['RUNNING', 'CYCLING', 'SWIMMING'] as SportType[]).map((sport) => {
                const icons = { RUNNING: Flame, CYCLING: Bike, SWIMMING: Waves };
                const SportIcon = icons[sport];
                const isSelected = leaderboardSport === sport;
                return (
                  <TouchableOpacity
                    key={sport}
                    style={[styles.sportButton, isSelected && styles.sportButtonActive]}
                    onPress={() => setLeaderboardSport(sport)}
                  >
                    <SportIcon size={14} color={isSelected ? '#FFFFFF' : '#71717A'} />
                    <Text style={[styles.sportButtonText, isSelected && styles.sportButtonTextActive]}>
                      {sport}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loadingLeaderboard ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color="#F43F5E" />
              </View>
            ) : leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>Bu kategoride henüz sıralama bulunmuyor.</Text>
            ) : (
              leaderboard.map((item) => {
                const isTop3 = item.rank <= 3;
                const rankColors: Record<number, string> = {
                  1: '#FBBF24',
                  2: '#CBD5E1',
                  3: '#FB923C',
                };
                const rankColor = rankColors[item.rank] || '#71717A';

                return (
                  <View key={`rank-${item.rank}-${item.username}`} style={styles.leaderboardRow}>
                    <View style={[styles.rankBox, isTop3 && { borderColor: rankColor, borderWidth: 1 }]}>
                      <Text style={[styles.rankNumber, { color: rankColor }]}>
                        {item.rank}
                      </Text>
                    </View>

                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>@{item.username}</Text>
                    </View>

                    <View style={styles.eloBox}>
                      <TrendingUp size={12} color="#F43F5E" />
                      <Text style={styles.eloNumber}>{item.elo} Elo</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.challengeMiniBtn}
                      onPress={() => {
                        setTargetUsername(item.username);
                        setActiveTab('CHALLENGE');
                      }}
                    >
                      <Swords size={14} color="#F43F5E" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Modern Challenge Invitation Modal */}
      <Modal visible={!!incomingChallenge} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.challengeModalCard}>
            <View style={styles.modalIconWrap}>
              <Swords size={32} color="#F43F5E" />
            </View>

            <Text style={styles.modalHeading}>MEYDAN OKUMA GELDİ</Text>
            <Text style={styles.modalBody}>
              @{incomingChallenge?.challengerUsername || 'Bir sporcu'} sizi{' '}
              <Text style={styles.modalSportHighlight}>{incomingChallenge?.sportType}</Text> yarışında
              düelloya davet etti.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => handleRespondChallenge('REJECT')}
                disabled={responding}
              >
                <X size={18} color="#EF4444" />
                <Text style={styles.declineBtnText}>Reddet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleRespondChallenge('ACCEPT')}
                disabled={responding}
              >
                {responding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>Kabul Et</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
    backgroundColor: '#18181B',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#18181B',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#27272A',
  },
  segmentText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FAFAFA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
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
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  sportSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  sportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272A',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  sportButtonActive: {
    backgroundColor: '#F43F5E',
  },
  sportButtonText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
  },
  sportButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#09090B',
    color: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#3F3F46',
    marginBottom: 12,
  },
  noticeBanner: {
    backgroundColor: '#27272A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  noticeText: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F43F5E',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyText: {
    color: '#71717A',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  centerLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  challengeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111114',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeOpponent: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
  },
  challengeSport: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 1,
  },
  challengeStatusTag: {
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagAccepted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusTagCompleted: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  challengeStatusText: {
    color: '#FAFAFA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    gap: 12,
  },
  rankBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '900',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '700',
  },
  eloBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eloNumber: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '800',
  },
  challengeMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  challengeModalCard: {
    backgroundColor: '#18181B',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeading: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalBody: {
    color: '#A1A1AA',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalSportHighlight: {
    color: '#F43F5E',
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  declineBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F43F5E',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
