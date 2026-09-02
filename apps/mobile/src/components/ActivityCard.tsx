import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import {
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
} from 'lucide-react-native';
import { IActivity } from '@sporgame/shared';

interface ActivityCardProps {
  activity: IActivity;
  onLikeToggle?: (activityId: string) => void;
  onCommentPress?: (activityId: string, activityTitle: string) => void;
  onUserPress?: (userId: string, username: string) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onLikeToggle,
  onCommentPress,
  onUserPress,
}) => {
  const [isLiked, setIsLiked] = useState<boolean>(Boolean(activity.isLiked));
  const [likesCount, setLikesCount] = useState<number>(
    activity.likesCount ?? (Array.isArray(activity.likes) ? activity.likes.length : 0)
  );

  const handleLikePress = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    const id = activity._id || activity.id;
    if (id && onLikeToggle) {
      onLikeToggle(id);
    }
  };

  const handleSharePress = async () => {
    try {
      const username = activity.user?.username || 'sporcu';
      const sportName = getSportName();
      const distance = activity.stats?.distance ? `${activity.stats.distance} km` : '';
      const duration = activity.stats?.duration ? `${activity.stats.duration} dk` : '';
      const message = `@${username}, Sporgame'de ${sportName} antrenmanını tamamladı: ${activity.title}!\n${distance} • ${duration}\nSporgame'e katıl ve rekabete dahil ol!`;

      await Share.share({
        title: activity.title,
        message,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const getSportIcon = () => {
    switch (activity.sportType) {
      case 'CYCLING':
        return <Bike size={16} color="#38BDF8" />;
      case 'SWIMMING':
        return <Waves size={16} color="#34D399" />;
      case 'RUNNING':
      default:
        return <Flame size={16} color="#F43F5E" />;
    }
  };

  const getSportName = () => {
    switch (activity.sportType) {
      case 'CYCLING':
        return 'Bisiklet';
      case 'SWIMMING':
        return 'Yüzme';
      case 'RUNNING':
      default:
        return 'Koşu';
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Az önce';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Az önce';
      if (mins < 60) return `${mins} dk önce`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} sa önce`;
      const days = Math.floor(hours / 24);
      return `${days} gün önce`;
    } catch {
      return 'Az önce';
    }
  };

  const username = activity.user?.username || 'sporcu';
  const userId = activity.user?._id || '';
  const initial = username.charAt(0).toUpperCase();

  const distanceText = activity.stats?.distance ? `${activity.stats.distance} km` : '--';
  const durationText = activity.stats?.duration ? `${activity.stats.duration} dk` : '--';
  const secondaryText =
    activity.stats?.secondaryStat !== undefined
      ? activity.stats.secondaryStat
      : activity.sportType === 'CYCLING'
      ? '24.5 km/s'
      : activity.sportType === 'SWIMMING'
      ? '1:45 /100m'
      : '5:12 /km';

  return (
    <View style={styles.card}>
      {/* 1. Header: User Info & Sport Badge */}
      <View style={styles.headerRow}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => onUserPress?.(userId, username)}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>{initial || 'S'}</Text>
          </TouchableOpacity>

          <View style={styles.userMeta}>
            <TouchableOpacity
              onPress={() => onUserPress?.(userId, username)}
              activeOpacity={0.7}
            >
              <Text style={styles.username}>@{username}</Text>
            </TouchableOpacity>

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
          <Text style={styles.statValue}>{distanceText}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Süre</Text>
          <Text style={styles.statValue}>{durationText}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>
            {activity.sportType === 'CYCLING'
              ? 'Ort. Hız'
              : activity.sportType === 'SWIMMING'
              ? 'Tempo'
              : 'Ort. Tempo'}
          </Text>
          <Text style={styles.statValue}>{String(secondaryText)}</Text>
        </View>
      </View>

      {/* 4. Map / Route Placeholder View */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGridOverlay}>
          <View style={styles.radarCircle} />
          <View style={styles.routeIconWrapper}>
            <Navigation size={28} color="#F43F5E" />
          </View>
        </View>
        <View style={styles.mapFooterBadge}>
          <MapIcon size={12} color="#F4F4F5" />
          <Text style={styles.mapFooterText}>GPS Rotası Doğrulandı</Text>
        </View>
      </View>

      {/* 5. Social Bar */}
      <View style={styles.socialStats}>
        <Text style={styles.socialCountText}>{likesCount} beğeni</Text>
        <TouchableOpacity
          onPress={() => onCommentPress?.(activity._id || activity.id || '', activity.title)}
          activeOpacity={0.7}
        >
          <Text style={styles.socialCountText}>{activity.commentsCount || 0} yorum</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleLikePress}
          activeOpacity={0.7}
        >
          <Heart
            size={18}
            color={isLiked ? '#F43F5E' : '#A1A1AA'}
            fill={isLiked ? '#F43F5E' : 'transparent'}
          />
          <Text style={[styles.actionBtnText, isLiked && styles.actionBtnTextLiked]}>
            Beğen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onCommentPress?.(activity._id || activity.id || '', activity.title)}
          activeOpacity={0.7}
        >
          <MessageCircle size={18} color="#A1A1AA" />
          <Text style={styles.actionBtnText}>Yorum</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleSharePress}
          activeOpacity={0.7}
        >
          <Share2 size={18} color="#A1A1AA" />
          <Text style={styles.actionBtnText}>Paylaş</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
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
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '700',
  },
  userMeta: {
    justifyContent: 'center',
  },
  username: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '700',
  },
  locationTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: '#A1A1AA',
    fontSize: 11,
  },
  metaDot: {
    color: '#52525B',
    fontSize: 10,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  sportBadgeText: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#09090B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#27272A',
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: '#09090B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapGridOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    backgroundColor: 'rgba(244, 63, 94, 0.03)',
  },
  routeIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  mapFooterBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  mapFooterText: {
    color: '#D4D4D8',
    fontSize: 10,
    fontWeight: '500',
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
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnTextLiked: {
    color: '#F43F5E',
  },
});
