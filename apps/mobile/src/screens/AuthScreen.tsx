import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Zap } from 'lucide-react-native';

export function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, register, loginAsDemo, isLoading, error, clearError } = useAuthStore();

  const handleToggleMode = () => {
    clearError();
    setIsRegister(!isRegister);
  };

  const handleSubmit = async () => {
    if (isRegister) {
      if (!username || !email || !password) return;
      await register(username.trim(), email.trim(), password);
    } else {
      if (!email || !password) return;
      await login(email.trim(), password);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>SPORGAME</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Create an account to start playing' : 'Sign in to challenge players'}
          </Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, !isRegister && styles.activeTab]}
              onPress={() => !isLoading && isRegister && handleToggleMode()}
            >
              <Text style={[styles.tabText, !isRegister && styles.activeTabText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, isRegister && styles.activeTab]}
              onPress={() => !isLoading && !isRegister && handleToggleMode()}
            >
              <Text style={[styles.tabText, isRegister && styles.activeTabText]}>Register</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="athletename"
                placeholderTextColor="#71717A"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="athlete@example.com"
              placeholderTextColor="#71717A"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#71717A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{isRegister ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={loginAsDemo}
            activeOpacity={0.8}
          >
            <Zap size={16} color="#FBBF24" />
            <Text style={styles.demoButtonText}>Hızlı Önizleme (Demo Giriş)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F43F5E',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#27272A',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#09090B',
  },
  tabText: {
    color: '#A1A1AA',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#D4D4D8',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#27272A',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  submitButton: {
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272A',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3F3F46',
    gap: 8,
  },
  demoButtonText: {
    color: '#FBBF24',
    fontWeight: '700',
    fontSize: 14,
  },
});
