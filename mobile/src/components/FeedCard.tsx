import { colors, fonts, radii, spacing } from '../theme/tokens';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FeedItem } from '../types/api';
import { formatDistanceToNowStrict, intervalToDuration } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { tr } from 'date-fns/locale';
import { Megaphone, Video, FilePenLine, Calendar, Clock, ArrowRight, X, Hourglass, CircleCheck, CircleAlert } from 'lucide-react-native';

export default function FeedCard({ 
  item, 
  highlighted = false,
  compact = false,
  onDismiss
}: { 
  item: FeedItem, 
  highlighted?: boolean,
  compact?: boolean,
  onDismiss?: (id: number) => void,
  key?: string | number
}) {
  const isAnnouncement = item.type === 'ANNOUNCEMENT';
  const isSession = item.type === 'SESSION';
  const isAssignment = item.type === 'ASSIGNMENT';
  
  const [now, setNow] = useState(new Date());
  
  const startDate = new Date(item.created_at);
  const deadlineDate = item.deadline ? new Date(item.deadline) : null;
  
  const isStarted = now >= startDate;
  const isOverdue = deadlineDate ? now > deadlineDate : false;
  const isCompleted = isSession ? isOverdue : (item.status === 'SUBMITTED' || item.status === 'COMPLETED');

  useEffect(() => {
    if (isCompleted || isOverdue || isAnnouncement) return;
    
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, isOverdue, isAnnouncement]);

  let countdownStr = '';
  if (!isStarted && !isAnnouncement) {
    const duration = intervalToDuration({ start: now, end: startDate });
    if (duration.months && duration.months > 0) {
      countdownStr = `${duration.months} ay ${duration.days || 0} gün kaldı`;
    } else if (duration.days && duration.days > 0) {
      countdownStr = `${duration.days} gün ${duration.hours || 0} saat kaldı`;
    } else {
      const hours = duration.hours || 0;
      const minutes = duration.minutes || 0;
      const seconds = duration.seconds || 0;
      if (hours > 0) {
        countdownStr = `${hours} sa ${minutes} dk ${seconds} sn kaldı`;
      } else {
        countdownStr = `${minutes} dk ${seconds} sn kaldı`;
      }
    }
  }

  const getIcon = (size: number = 16, color: string = colors.submitted) => {
    if (isAnnouncement) return <Megaphone size={size} color={color} />;
    if (isSession) return <Video size={size} color={color} />;
    if (isAssignment) return <FilePenLine size={size} color={color} />;
    return <Calendar size={size} color={color} />;
  };

  // Render Announcement
  if (isAnnouncement) {
    return (
      <View style={styles.announcementCard}>
        <View style={styles.announcementTopRow}>
          <View style={styles.iconAndTitle}>
            <View style={styles.announcementIconBg}>
              {getIcon(14, colors.accent)}
            </View>
            <Text style={styles.announcementClassText}>{item.classroom_name}</Text>
          </View>
          <View style={styles.rightActions}>
            <Text style={styles.timeAgoText}>
              {formatDistanceToNowStrict(new Date(item.created_at), { addSuffix: true, locale: tr })}
            </Text>
            {onDismiss && (
              <TouchableOpacity onPress={() => onDismiss(item.id)} style={styles.dismissBtn}>
                <X size={14} color={colors.accentSoft} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <Text style={styles.announcementDesc} numberOfLines={3}>{item.content}</Text>
      </View>
    );
  }

  // Render Highlighted (Closest Event)
  if (highlighted) {
    return (
      <View style={styles.highlightedCard}>
        <View style={styles.highlightedTopRow}>
          <View style={styles.iconAndTitle}>
            <View style={styles.highlightIconBg}>
              {getIcon(16, colors.ink)}
            </View>
            <Text style={styles.highlightedClassText}>{item.classroom_name}</Text>
          </View>
          {isStarted && !isCompleted && (
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>CANLI</Text>
            </View>
          )}
        </View>

        <Text style={styles.highlightedTitle}>{item.title}</Text>
        
        <View style={styles.dateRow}>
          <Clock size={14} color={colors.accent} />
          <Text style={styles.dateText}>
            {formatInTimeZone(startDate, 'Europe/Istanbul', "d MMM HH:mm", { locale: tr })}
          </Text>
          {item.deadline && (
            <>
              <ArrowRight size={12} color={colors.inkDim} style={{ marginHorizontal: 6 }} />
              <Text style={styles.dateText}>
                {formatInTimeZone(deadlineDate!, 'Europe/Istanbul', "d MMM HH:mm", { locale: tr })}
              </Text>
            </>
          )}
        </View>

        {!isStarted && countdownStr !== '' && (
          <View style={styles.countdownContainer}>
            <Hourglass size={14} color={colors.ink} />
            <Text style={styles.countdownHighlightText}>{countdownStr}</Text>
          </View>
        )}
      </View>
    );
  }

  // Render Compact (Regular Event)
  return (
    <View style={styles.compactCard}>
      <View style={styles.compactMainContent}>
        <View style={styles.compactIconContainer}>
            {isSession ? <Video size={20} color={colors.submitted} /> : <FilePenLine size={20} color={colors.submitted} />}
        </View>
        
        <View style={styles.compactTextContainer}>
          <Text style={styles.compactTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.compactClassText}>{item.classroom_name}</Text>
          
          <View style={styles.compactDateContainer}>
            <Clock size={12} color={colors.inkDim} style={{marginRight: 4}} />
            <Text style={styles.compactDateText}>
              {formatInTimeZone(startDate, 'Europe/Istanbul', "d MMM HH:mm", { locale: tr })}
            </Text>
            {item.deadline && (
              <>
                <Text style={styles.compactDateSeparator}>-</Text>
                <Text style={styles.compactDateText}>
                  {formatInTimeZone(deadlineDate!, 'Europe/Istanbul', "HH:mm", { locale: tr })}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.compactStatusContainer}>
        {isStarted && !isCompleted ? (
           <View style={styles.liveDotCompact} />
        ) : isCompleted ? (
           <CircleCheck size={16} color={colors.submitted} />
        ) : isOverdue ? (
           <CircleAlert size={16} color={colors.overdue} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Generic
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dismissBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(251,191,36,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Announcement Card
  announcementCard: {
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    marginBottom: 8,
  },
  announcementTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementIconBg: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    padding: 6,
    borderRadius: 8,
  },
  announcementClassText: {
    color: colors.accentSoft,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeAgoText: {
    color: colors.accent,
    fontSize: 11,
    opacity: 0.8,
  },
  announcementTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  announcementDesc: {
    color: colors.accentSoft,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },

  // Highlighted Card
  highlightedCard: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    shadowColor: colors.overdue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  highlightIconBg: {
    backgroundColor: 'rgba(192,132,252,0.15)',
    padding: 8,
    borderRadius: 10,
  },
  highlightedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  highlightedClassText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  highlightedTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dateText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
    backgroundColor: 'rgba(236,72,153,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
  },
  countdownHighlightText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.overdue,
  },
  liveText: {
    color: colors.accentSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Compact Card
  compactCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.glassBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  compactClassText: {
    color: colors.submitted,
    fontSize: 12,
    marginBottom: 6,
  },
  compactDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDateText: {
    color: colors.submitted,
    fontSize: 11,
    fontWeight: '500',
  },
  compactDateSeparator: {
    color: colors.inkDim,
    fontSize: 11,
    marginHorizontal: 4,
  },
  compactStatusContainer: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDotCompact: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.overdue,
    shadowColor: colors.overdue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});
