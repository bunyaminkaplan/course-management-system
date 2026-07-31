import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState, useMemo } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '../../api/client';
import { ClassRoom, Thread, Comment as CommentType } from '../../types/api';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { MessageSquare, ArrowUp, ArrowDown, Send, CircleUser, X } from 'lucide-react-native';
import GlassTopBar from '../../components/GlassTopBar';
import SkeletonCard from '../../components/SkeletonCard';
import GradientBackground from '../../components/GradientBackground';
import { getUserFullName } from '../../utils/userHelpers';

export default function ForumScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  
  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => get<ClassRoom[]>('/api/classrooms/')
  });

  const myClassrooms = useMemo(() => {
    if (!classrooms || !user) return [];
    return classrooms.filter(c => c.students.some(s => s.id === user.id));
  }, [classrooms, user]);

  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);
  const activeClassroomId = selectedClassroomId || (myClassrooms.length > 0 ? myClassrooms[0].id : null);

  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ['threads', activeClassroomId],
    queryFn: () => get<Thread[]>(`/api/discussion/threads/by_classroom/?classroom_id=${activeClassroomId}`),
    enabled: !!activeClassroomId,
  });

  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState<CommentType | null>(null);

  const createThreadMutation = useMutation({
    mutationFn: (data: { classroom: number, title: string, content: string }) => 
      post('/api/discussion/threads/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads', activeClassroomId] });
      setIsCreatingThread(false);
      setNewThreadTitle('');
      setNewThreadContent('');
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: (data: { thread: number, content: string, parent?: number }) => 
      post('/api/discussion/comments/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads', activeClassroomId] });
      setCommentContent('');
      setReplyTo(null);
    }
  });

  const voteMutation = useMutation({
    mutationFn: (data: { threadId: number, value: 1 | -1 }) => 
      post(`/api/discussion/threads/${data.threadId}/vote/`, { value: data.value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads', activeClassroomId] });
    }
  });

  const handleVote = (threadId: number, value: 1 | -1) => {
    voteMutation.mutate({ threadId, value });
  };

  const handleCreateThread = () => {
    if (activeClassroomId && newThreadTitle.trim() && newThreadContent.trim()) {
      createThreadMutation.mutate({
        classroom: activeClassroomId,
        title: newThreadTitle.trim(),
        content: newThreadContent.trim()
      });
    }
  };

  const handleCreateComment = () => {
    if (selectedThread && commentContent.trim()) {
      createCommentMutation.mutate({
        thread: selectedThread.id,
        content: commentContent.trim(),
        parent: replyTo?.id
      });
    }
  };

  const renderComment = (comment: CommentType, depth = 0) => (
    <View key={comment.id} style={[styles.commentContainer, { marginLeft: depth * 16 }]}>
      <View style={styles.commentHeader}>
        <CircleUser size={16} color={colors.submitted} />
        <Text style={styles.commentAuthor}>{getUserFullName(comment.author)}</Text>
        <Text style={styles.commentTime}>
          {formatDistanceToNowStrict(new Date(comment.created_at), { addSuffix: true, locale: tr })}
        </Text>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <TouchableOpacity onPress={() => setReplyTo(comment)} style={styles.replyBtn}>
        <Text style={styles.replyBtnText}>Yanıtla</Text>
      </TouchableOpacity>
      {comment.replies && comment.replies.map(reply => renderComment(reply, depth + 1))}
    </View>
  );

  const activeThread = useMemo(() => {
    if (!selectedThread || !threads) return null;
    return threads.find(t => t.id === selectedThread.id) || selectedThread;
  }, [selectedThread, threads]);

  if (classroomsLoading) {
    return (
      <View style={styles.centerContainer}>
        <View style={{ padding: 13, gap: 8 }}>{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</View>
      </View>
    );
  }

  return (
    <GradientBackground>
      <GlassTopBar 
        title="Forum" 
        rightElement={
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile') || navigation.navigate('Profile')}>
            <CircleUser size={24} color={colors.accentSoft} />
          </TouchableOpacity>
        }
      />

      {myClassrooms.length > 0 ? (
        <View style={styles.classSelector}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={myClassrooms}
            keyExtractor={c => c.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item, index }) => (<TouchableOpacity
                style={[styles.classChip, activeClassroomId === item.id && styles.classChipActive]}
                onPress={() => setSelectedClassroomId(item.id)}
              >
                <Text style={[styles.classChipText, activeClassroomId === item.id && styles.classChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz bir sınıfa kayıtlı değilsiniz.</Text>
        </View>
      )}

      {activeClassroomId && (
        <View style={styles.threadsContainer}>
          <TouchableOpacity 
            style={styles.newThreadBtn}
            onPress={() => setIsCreatingThread(true)}
          >
            <MessageSquare size={18} color={colors.ink} />
            <Text style={styles.newThreadBtnText}>Yeni Tartışma Başlat</Text>
          </TouchableOpacity>

          {threadsLoading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={colors.ink} />
          ) : (
            <FlatList
              data={threads}
              keyExtractor={t => t.id.toString()}
              contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (<TouchableOpacity 
                  style={styles.threadCard}
                  onPress={() => setSelectedThread(item)}
                >
                  <View style={styles.voteColumn}>
                    <TouchableOpacity onPress={() => handleVote(item.id, 1)}>
                      <ArrowUp size={20} color={item.user_vote === 1 ? colors.submitted : colors.inkDim} />
                    </TouchableOpacity>
                    <Text style={[styles.scoreText, item.user_vote === 1 && {color:colors.submitted}, item.user_vote === -1 && {color:colors.overdue}]}>{item.score}</Text>
                    <TouchableOpacity onPress={() => handleVote(item.id, -1)}>
                      <ArrowDown size={20} color={item.user_vote === -1 ? colors.overdue : colors.inkDim} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.threadContent}>
                    <Text style={styles.threadTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.threadPreview} numberOfLines={2}>{item.content}</Text>
                    
                    <View style={styles.threadMetaRow}>
                        <View style={styles.threadMeta}>
                        <CircleUser size={14} color={colors.submitted} />
                        <Text style={styles.threadAuthor}>{getUserFullName(item.author)}</Text>
                        <Text style={styles.threadTime}>
                            • {formatDistanceToNowStrict(new Date(item.created_at), { addSuffix: true, locale: tr })}
                        </Text>
                        </View>
                        <View style={styles.commentCountBadge}>
                            <MessageSquare size={12} color={colors.ink} />
                            <Text style={styles.commentCountText}>{item.comments.length}</Text>
                        </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Bu sınıfta henüz tartışma yok.</Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* New Thread Modal */}
      <Modal visible={isCreatingThread} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Tartışma</Text>
              <TouchableOpacity onPress={() => setIsCreatingThread(false)}>
                <X size={24} color={colors.submitted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Başlık"
              placeholderTextColor={colors.inkDim}
              value={newThreadTitle}
              onChangeText={setNewThreadTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="İçerik..."
              placeholderTextColor={colors.inkDim}
              multiline
              textAlignVertical="top"
              value={newThreadContent}
              onChangeText={setNewThreadContent}
            />
            <TouchableOpacity 
              style={[styles.submitBtn, createThreadMutation.isPending && styles.disabledBtn]}
              onPress={handleCreateThread}
              disabled={createThreadMutation.isPending}
            >
              {createThreadMutation.isPending ? (
                  <ActivityIndicator color={colors.ink} />
              ) : (
                  <Text style={styles.submitBtnText}>Gönder</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Thread Details Modal */}
      <Modal visible={!!selectedThread} animationType="fade" transparent>
        <View style={styles.fullModalOverlay}>
          {activeThread && (
            <View style={styles.fullModalContent}>
              <View style={styles.detailHeaderRow}>
                <TouchableOpacity onPress={() => { setSelectedThread(null); setReplyTo(null); }} style={styles.backBtn}>
                  <X size={24} color={colors.ink} />
                </TouchableOpacity>
                <Text style={styles.detailHeaderTitle} numberOfLines={1}>Tartışma Detayı</Text>
              </View>

              <FlatList
                data={activeThread.comments}
                keyExtractor={c => c.id.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                ListHeaderComponent={
                  <View style={styles.detailThreadCard}>
                    <Text style={styles.detailTitle}>{activeThread.title}</Text>
                    <View style={styles.detailMeta}>
                      <CircleUser size={16} color={colors.submitted} />
                      <Text style={styles.detailAuthor}>{getUserFullName(activeThread.author)}</Text>
                      <Text style={styles.detailTime}>
                        • {formatDistanceToNowStrict(new Date(activeThread.created_at), { addSuffix: true, locale: tr })}
                      </Text>
                    </View>
                    <Text style={styles.detailBody}>{activeThread.content}</Text>
                    
                    <View style={styles.commentsHeaderRow}>
                        <Text style={styles.commentsSectionTitle}>Yorumlar ({activeThread.comments.length})</Text>
                    </View>
                  </View>
                }
                renderItem={({ item }) => renderComment(item)}
                ListEmptyComponent={
                  <Text style={styles.emptyTextCenter}>İlk yorumu siz yapın.</Text>
                }
              />

              <View style={styles.commentInputContainer}>
                {replyTo && (
                  <View style={styles.replyingToRow}>
                    <Text style={styles.replyingToText}>
                      <Text style={{fontWeight: 'bold'}}>{getUserFullName(replyTo.author)}</Text> kullanıcısına yanıt veriliyor
                    </Text>
                    <TouchableOpacity onPress={() => setReplyTo(null)}>
                      <X size={16} color={colors.overdue} />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.commentInputRow}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Bir yorum yaz..."
                    placeholderTextColor={colors.inkDim}
                    value={commentContent}
                    onChangeText={setCommentContent}
                    multiline
                  />
                  <TouchableOpacity 
                    style={[styles.sendBtn, (!commentContent.trim() || createCommentMutation.isPending) && styles.disabledBtn]}
                    onPress={handleCreateComment}
                    disabled={createCommentMutation.isPending || !commentContent.trim()}
                  >
                    <Send size={18} color={colors.ink} style={{marginLeft: 2}} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg1,
  },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '20%', right: '-10%', width: 300, height: 300, backgroundColor: 'rgba(192,132,252,0.15)', ...( { filter: 'blur(100px)' } as any ) },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.glassBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: 'bold',
  },
  classSelector: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBg,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.glassBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.glassBg,
  },
  classChipActive: {
    backgroundColor: 'rgba(192,132,252,0.15)',
    borderColor: 'rgba(192,132,252,0.3)',
  },
  classChipText: {
    color: colors.submitted,
    fontSize: 14,
    fontWeight: '500',
  },
  classChipTextActive: {
    color: colors.ink,
    fontWeight: 'bold',
  },
  threadsContainer: {
    flex: 1,
  },
  newThreadBtn: {
    margin: 16,
    backgroundColor: 'rgba(192,132,252,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.3)',
    gap: 8,
  },
  newThreadBtnText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.inkDim,
    fontSize: 14,
  },
  threadCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.glassBg,
  },
  voteColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 16,
  },
  scoreText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  threadContent: {
    flex: 1,
  },
  threadTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  threadPreview: {
    color: colors.submitted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  threadMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  threadAuthor: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '500',
  },
  threadTime: {
    color: colors.inkDim,
    fontSize: 11,
  },
  commentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(192,132,252,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  commentCountText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    padding: 16,
    color: colors.ink,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
  },
  submitBtn: {
    backgroundColor: colors.ink,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: colors.bg1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.5,
  },

  // Full Screen Modal for Thread Detail
  fullModalOverlay: {
    flex: 1,
    backgroundColor: colors.bg1,
  },
  fullModalContent: {
    flex: 1,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.glassBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBg,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  detailHeaderTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  detailThreadCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBg,
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBg,
  },
  detailAuthor: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  detailTime: {
    color: colors.inkDim,
    fontSize: 13,
  },
  detailBody: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 32,
  },
  commentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsSectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContainer: {
    backgroundColor: colors.glassBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(192,132,252,0.4)',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  commentTime: {
    color: colors.inkDim,
    fontSize: 11,
  },
  commentContent: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  replyBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(192,132,252,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  replyBtnText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTextCenter: {
    color: colors.inkDim,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  commentInputContainer: {
    backgroundColor: 'rgba(2,6,23,0.9)',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.glassBg,
  },
  replyingToRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(192,132,252,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyingToText: {
    color: colors.ink,
    fontSize: 13,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    color: colors.ink,
    maxHeight: 120,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: colors.ink,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  }
});
