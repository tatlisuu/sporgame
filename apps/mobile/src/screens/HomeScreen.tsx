import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import {
  connectMatchmakingSocket,
  disconnectMatchmakingSocket,
} from '../socket/matchmakingSocket';

type SportType = 'RUNNING' | 'CYCLING' | 'SWIMMING';

interface LogEntry {
  id: string;
  event: string;
  payload: any;
  timestamp: string;
}

export function HomeScreen() {
  const { user, accessToken, logout } = useAuthStore();
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [challengedId, setChallengedId] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType>('RUNNING');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (event: string, payload: any) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        event,
        payload,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 19),
    ]);
  };

  useEffect(() => {
    if (!accessToken) return;

    setSocketStatus('connecting');
    const socket = connectMatchmakingSocket(accessToken);

    socket.on('connect', () => {
      setSocketStatus('connected');
      addLog('Socket Connected', { socketId: socket.id });
    });

    socket.on('disconnect', (reason) => {
      setSocketStatus('disconnected');
      addLog('Socket Disconnected', { reason });
    });

    socket.on('connect_error', (err) => {
      setSocketStatus('disconnected');
      addLog('Connect Error', { message: err.message });
    });

    socket.on('challenge_user', (match) => {
      addLog('challenge_user', match);
      Alert.alert('New Challenge!', `Challenge received from ${match.challengerId} for ${match.sportType}`);
    });

    socket.on('challenge_accepted', (match) => {
      addLog('challenge_accepted', match);
    });

    socket.on('challenge_rejected', (match) => {
      addLog('challenge_rejected', match);
    });

    socket.on('match_result', (match) => {
      addLog('match_result', match);
    });

    socket.on('matchmaking_error', (err) => {
      addLog('matchmaking_error', err);
    });

    return () => {
      disconnectMatchmakingSocket();
    };
  }, [accessToken]);

  const handleSendChallenge = () => {
    if (!challengedId.trim()) {
      Alert.alert('Validation', 'Please enter a target User ID');
      return;
    }

    const socket = connectMatchmakingSocket(accessToken!);
    socket.emit(
      'challenge_user',
      {
        challengedId: challengedId.trim(),
        sportType: selectedSport,
      },
      (res: any) => {
        addLog('challenge_user_ack', res);
        if (res?.success) {
          Alert.alert('Challenge Sent', `Challenged user ID: ${challengedId.trim()}`);
        } else {
          Alert.alert('Error', res?.error || 'Challenge emission failed');
        }
      }
    );
  };

  const statusColors = {
    connected: '#22C55E',
    connecting: '#EAB308',
    disconnected: '#EF4444',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Athlete Dashboard</Text>
            <Text style={styles.usernameText}>@{user?.username || 'user'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Socket Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColors[socketStatus] }]} />
            <Text style={styles.statusLabel}>
              Socket.io: <Text style={styles.statusValue}>{socketStatus.toUpperCase()}</Text>
            </Text>
          </View>
          <Text style={styles.namespaceText}>Namespace: /matchmaking</Text>
        </View>

        {/* Elo Stats */}
        {user?.eloProfiles && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Elo Ratings</Text>
            <View style={styles.eloRow}>
              {Object.entries(user.eloProfiles).map(([sport, rating]) => (
                <View key={sport} style={styles.eloBadge}>
                  <Text style={styles.eloSport}>{sport}</Text>
                  <Text style={styles.eloScore}>{rating}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Matchmaking Test Emitter */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emit Matchmaking Challenge</Text>

          <Text style={styles.fieldLabel}>Sport Discipline</Text>
          <View style={styles.sportSelector}>
            {(['RUNNING', 'CYCLING', 'SWIMMING'] as SportType[]).map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[styles.sportButton, selectedSport === sport && styles.activeSportButton]}
                onPress={() => setSelectedSport(sport)}
              >
                <Text
                  style={[styles.sportButtonText, selectedSport === sport && styles.activeSportButtonText]}
                >
                  {sport}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Target Opponent User ID</Text>
          <TextInput
            style={styles.input}
            placeholder="64e9a8f... (MongoDB ObjectId)"
            placeholderTextColor="#71717A"
            value={challengedId}
            onChangeText={setChallengedId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.actionButton} onPress={handleSendChallenge}>
            <Text style={styles.actionButtonText}>Send Challenge</Text>
          </TouchableOpacity>
        </View>

        {/* Real-time Socket Event Log */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Event Feed ({logs.length})</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No socket events received yet.</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={styles.logEvent}>{log.event}</Text>
                  <Text style={styles.logTime}>{log.timestamp}</Text>
                </View>
                <Text style={styles.logPayload} numberOfLines={3}>
                  {JSON.stringify(log.payload)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  welcomeText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  usernameText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#27272A',
    borderRadius: 8,
  },
  logoutText: {
    color: '#F43F5E',
    fontWeight: '600',
    fontSize: 13,
  },
  statusCard: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusLabel: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontWeight: '700',
  },
  namespaceText: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  eloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eloBadge: {
    flex: 1,
    backgroundColor: '#27272A',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  eloSport: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  eloScore: {
    color: '#F43F5E',
    fontSize: 18,
    fontWeight: '800',
  },
  fieldLabel: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  sportSelector: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  sportButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderRadius: 8,
    marginHorizontal: 3,
  },
  activeSportButton: {
    backgroundColor: '#F43F5E',
  },
  sportButtonText: {
    color: '#A1A1AA',
    fontWeight: '600',
    fontSize: 12,
  },
  activeSportButtonText: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#27272A',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#3F3F46',
    marginBottom: 14,
  },
  actionButton: {
    backgroundColor: '#F43F5E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    color: '#71717A',
    fontSize: 13,
    fontStyle: 'italic',
  },
  logItem: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logEvent: {
    color: '#38BDF8',
    fontWeight: '600',
    fontSize: 12,
  },
  logTime: {
    color: '#71717A',
    fontSize: 11,
  },
  logPayload: {
    color: '#D4D4D8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
