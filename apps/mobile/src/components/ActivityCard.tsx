import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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
  User as UserIcon,
} from 'lucide-react-native';
import { IActivity } from '@sporgame/shared';

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
    if (id && onLikeToggle) {
      onLikeToggle(id);
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

  const formatDistance = (val?: number) => {
    if (!val || val === 0) return '0.00 km';
    if (val >= 1000) return `${(val / 1000).toFixed(2)} km`;
    return `${val.toFixed(2)} km`;
  };

  const formatDuration = (mins?: number) => {
    if (!mins || mins === 0) return '00:00';
    const totalSecs = Math.round(mins * 60);
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

  const distanceText = formatDistance(activity.stats?.distance ?? (activity as any).distance);
  const durationText = formatDuration(activity.stats?.duration ?? (activity as any).duration);
  const secondaryText =
    activity.stats?.secondaryStat ||
    (activity.sportType === 'RUNNING' ? '5:14 /km' : activity.sportType === 'CYCLING' ? '24.2 km/s' : '1:45 /100m');

  const username = activity.user?.username || 'sporcu';
  const initial = username.charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      {/* 1. Header: User Info & Sport Badge */}
      <View style={styles.headerRow}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial || 'S'}</Text>
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
            {activity.sportType === 'CYCLING' ? 'Ort. Hız' : activity.sportType === 'SWIMMING' ? 'Tempo' : 'Ort. Tempo'}
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
        <Text style={styles.socialCountText}>
          {likesCount} beğeni
        </Text>
        <Text style={styles.socialCountText}>
          {activity.commentsCount || 0} yorum
        </Text>
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

const styles = StyleSheet.create({
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
  mapGridOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
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
});
