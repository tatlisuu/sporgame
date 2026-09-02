import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { X, Send, MessageCircle, User, Clock } from 'lucide-react-native';
import { IComment } from '@sporgame/shared';
import { getCommentsApi, addCommentApi } from '../api/activities';

interface CommentsModalProps {
  visible: boolean;
  activityId: string;
  activityTitle?: string;
  initialCommentsCount?: number;
  onClose: () => void;
  onCommentCountUpdate?: (activityId: string, count: number) => void;
  onUserPress?: (userId: string, username: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  activityId,
  activityTitle,
  initialCommentsCount = 0,
  onClose,
  onCommentCountUpdate,
  onUserPress,
}) => {
  const [comments, setComments] = useState<IComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputText, setInputText] = useState('');

  const fetchComments = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    try {
      const data = await getCommentsApi(activityId);
      if (Array.isArray(data)) {
        setComments(data);
      }
    } catch {
      // Fallback empty if error
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (visible && activityId) {
      fetchComments();
    } else {
      setComments([]);
      setInputText('');
    }
  }, [visible, activityId, fetchComments]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const newComment = await addCommentApi(activityId, trimmed);
      setComments((prev) => [...prev, newComment]);
      setInputText('');
      const updatedCount = comments.length + 1;
      onCommentCountUpdate?.(activityId, updatedCount);
    } catch {
      // If API fails (e.g. offline/demo), add optimistic comment
      const mockComment: IComment = {
        _id: 'temp-' + Date.now(),
        activityId,
        user: {
          _id: 'current-user',
          username: 'sen',
        },
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, mockComment]);
      setInputText('');
      const updatedCount = comments.length + 1;
      onCommentCountUpdate?.(activityId, updatedCount);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'şimdi';
    if (mins < 60) return `${mins} dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} sa`;
    const days = Math.floor(hours / 24);
    return `${days} g`;
  };

  const renderItem = ({ item }: { item: IComment }) => (
    <View style={styles.commentRow}>
      <TouchableOpacity
        style={styles.avatarCircle}
        onPress={() => onUserPress?.(item.user._id, item.user.username)}
        activeOpacity={0.7}
      >
        <Text style={styles.avatarLetter}>
          {item.user.username?.charAt(0)?.toUpperCase() || 'S'}
        </Text>
      </TouchableOpacity>

      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <TouchableOpacity
            onPress={() => onUserPress?.(item.user._id, item.user.username)}
            activeOpacity={0.7}
          >
            <Text style={styles.username}>@{item.user.username}</Text>
          </TouchableOpacity>
          <View style={styles.timeWrap}>
            <Clock size={11} color="#71717A" />
            <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
        </View>
        <Text style={styles.contentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerInfo}>
              <View style={styles.iconCircle}>
                <MessageCircle size={18} color="#F43F5E" />
              </View>
              <View>
                <Text style={styles.headerTitle}>YORUMLAR</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {activityTitle || 'Aktivite Yorumları'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {/* Comment List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#F43F5E" />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item._id || item.id || Math.random().toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MessageCircle size={32} color="#3F3F46" />
                  <Text style={styles.emptyTitle}>Henüz yorum yok</Text>
                  <Text style={styles.emptySubtitle}>İlk tebriği veya yorumu sen yaz!</Text>
                </View>
              }
            />
          )}

          {/* Input Bar */}
          <View style={styles.inputSafeArea}>
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Bir yorum yaz..."
                placeholderTextColor="#71717A"
                value={inputText}
                onChangeText={setInputText}
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!inputText.trim() || submitting) && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheetContainer: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    maxHeight: '80%',
    minHeight: '50%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    maxWidth: 220,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#F43F5E',
    fontSize: 14,
    fontWeight: '700',
  },
  commentBody: {
    flex: 1,
    backgroundColor: '#27272A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    color: '#F43F5E',
    fontSize: 13,
    fontWeight: '700',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: '#71717A',
    fontSize: 11,
  },
  contentText: {
    color: '#E4E4E7',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 6,
  },
  emptyTitle: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  emptySubtitle: {
    color: '#52525B',
    fontSize: 12,
  },
  inputSafeArea: {
    backgroundColor: '#18181B',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#09090B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FAFAFA',
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#3F3F46',
    opacity: 0.5,
  },
});
