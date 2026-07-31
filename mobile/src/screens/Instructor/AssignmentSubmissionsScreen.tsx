import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState } from 'react';
import BackButton from '../../components/BackButton';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking, Animated } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '../../api/client';
import { StudentAssignment, Assignment } from '../../types/api';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CircleUser, Link as LinkIcon, Check, FilePenLine, CalendarDays, Users } from 'lucide-react-native';
import { getStatusVariant } from '../../utils/statusVariant';
import GlassInput from '../../components/GlassInput';
import { getUserFullName } from '../../utils/userHelpers';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FadeInDown } from 'react-native-reanimated';

export default function AssignmentSubmissionsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { assignmentId } = route.params;
  const queryClient = useQueryClient();
  const { myClassrooms } = useMyClassrooms();

  const [grades, setGrades] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => get<StudentAssignment[]>('/api/student-assignments/')
  });

  const { data: assignmentDetails, isLoading: isAssignmentLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => get<Assignment>(`/api/assignments/${assignmentId}/`)
  });

  const submissions = assignments?.filter(a => a.assignment === assignmentId) || [];

  const handleOpenLink = (url: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Hata', 'Bağlantı açılamadı.'));
  };

  const handleSaveGrade = async (item: StudentAssignment) => {
    const val = grades[item.id];
    if (!val || isNaN(Number(val))) return;

    setSavingId(item.id);
    try {
      await patch(`/api/student-assignments/${item.id}/`, { grade: Number(val), status: 'APPROVED' });
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      Alert.alert('Başarılı', 'Not kaydedildi ve ödev onaylandı.');
    } catch (e) {
      Alert.alert('Hata', 'İşlem başarısız.');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateStatus = async (item: StudentAssignment, newStatus: 'APPROVED' | 'REJECTED') => {
    setSavingId(item.id);
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'REJECTED') payload.grade = null; // Clear grade if rejected
      await patch(`/api/student-assignments/${item.id}/`, payload);
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      Alert.alert('Başarılı', newStatus === 'APPROVED' ? 'Ödev onaylandı.' : 'Ödev reddedildi.');
    } catch (e) {
      Alert.alert('Hata', 'İşlem başarısız.');
    } finally {
      setSavingId(null);
    }
  };

  const getStudentName = (item: StudentAssignment) => {
    const classId = item.assignment_details.classroom;
    const classroom = myClassrooms.find(c => c.id === classId);
    if (!classroom) return 'Bilinmeyen Öğrenci';
    const st = classroom.students.find(s => s.id === item.student);
    return getUserFullName(st);
  };

  return (
    <GradientBackground>
      <View style={styles.topbar}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title} numberOfLines={1}>Teslimler</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading || isAssignmentLoading ? (
        <ActivityIndicator color={colors.accentSoft} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            assignmentDetails ? (
              <View style={styles.headerCard}>
                <Text style={styles.headerTitle}>{assignmentDetails.title}</Text>
                {assignmentDetails.description ? (
                  <Text style={styles.headerDesc}>{assignmentDetails.description}</Text>
                ) : null}
                
                <View style={styles.headerInfoRow}>
                  <Users size={16} color={colors.accentSoft} style={{ marginRight: 6 }} />
                  <Text style={styles.headerInfoText}>{assignmentDetails.classroom_name}</Text>
                </View>

                <View style={styles.headerInfoRow}>
                  <CalendarDays size={16} color={colors.accentSoft} style={{ marginRight: 6 }} />
                  <Text style={styles.headerInfoText}>
                    Son Tarih: {format(new Date(assignmentDetails.deadline), "d MMMM yyyy, HH:mm", { locale: tr })}
                  </Text>
                </View>

                {assignmentDetails.attachment && (
                  <TouchableOpacity 
                    style={styles.attachmentButton}
                    onPress={() => handleOpenLink(assignmentDetails.attachment!)}
                  >
                    <FilePenLine size={16} color={colors.submitted} style={{ marginRight: 8 }} />
                    <Text style={styles.attachmentButtonText}>Ödev Dosyasını Gör</Text>
                  </TouchableOpacity>
                )}
                
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Öğrenci Teslimleri</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const variant = getStatusVariant(item.status);
            let badgeStyle: any = styles.badgeAmber;
            let badgeText: any = styles.badgeTextAmber;
            if (variant === 'mint') { badgeStyle = styles.badgeMint; badgeText = styles.badgeTextMint; }
            if (variant === 'coral') { badgeStyle = styles.badgeCoral; badgeText = styles.badgeTextCoral; }

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.studentName}>{getStudentName(item)}</Text>
                  <View style={[styles.badge, badgeStyle]}>
                    <Text style={[styles.badgeText, badgeText]}>{item.status}</Text>
                  </View>
                </View>

                {item.status === 'SUBMITTED' || item.status === 'APPROVED' || item.status === 'REJECTED' ? (
                  <View style={styles.submissionArea}>
                    {(item.submitted_file || item.file_url) && (
                      <TouchableOpacity style={styles.linkButton} onPress={() => handleOpenLink(item.submitted_file || item.file_url)}>
                        <LinkIcon size={16} color={colors.accentSoft} style={{ marginRight: 6 }} />
                        <Text style={styles.linkText} numberOfLines={1}>Teslimi Gör</Text>
                      </TouchableOpacity>
                    )}
                               
                    {item.status === 'SUBMITTED' && (
                      <View style={styles.decisionArea}>
                        <View style={styles.gradeRow}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <GlassInput
                              value={grades[item.id] !== undefined ? grades[item.id] : (item.grade !== null ? String(item.grade) : '')}
                              onChangeText={(t) => setGrades(prev => ({ ...prev, [item.id]: t }))}
                              placeholder="Not girerek onayla (0-100)"
                              keyboardType="numeric"
                              style={{ paddingVertical: 8 }}
                            />
                          </View>
                          <TouchableOpacity 
                            style={[styles.saveButton, (!grades[item.id] && item.grade === null) && styles.saveButtonDisabled]}
                            onPress={() => handleSaveGrade(item)}
                            disabled={savingId === item.id || (!grades[item.id] && item.grade === null)}
                          >
                            {savingId === item.id ? (
                              <ActivityIndicator size="small" color={colors.bg2} />
                            ) : (
                              <>
                                <Check size={16} color={colors.bg2} style={{ marginRight: 4 }} />
                                <Text style={styles.saveButtonText}>Kaydet</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                        
                        {(!grades[item.id]) && (
                          <Animated.View entering={FadeInDown.duration(200)}>
                            <View style={styles.orDivider}>
                              <View style={styles.orLine} />
                              <Text style={styles.orText}>VEYA</Text>
                              <View style={styles.orLine} />
                            </View>
                            
                            <View style={styles.actionRow}>
                              <TouchableOpacity 
                                style={styles.rejectButton}
                                onPress={() => handleUpdateStatus(item, 'REJECTED')}
                                disabled={savingId === item.id}
                              >
                                <Text style={styles.rejectButtonText}>Reddet</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.approveButton}
                                onPress={() => handleUpdateStatus(item, 'APPROVED')}
                                disabled={savingId === item.id}
                              >
                                <Text style={styles.approveButtonText}>Notsuz Kabul Et</Text>
                              </TouchableOpacity>
                            </View>
                          </Animated.View>
                        )}
                      </View>
                    )}

                    {item.status === 'APPROVED' && (
                      <View style={styles.decisionArea}>
                        {item.grade !== null ? (
                          <View style={styles.gradeRow}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                              <GlassInput
                                value={grades[item.id] !== undefined ? grades[item.id] : String(item.grade)}
                                onChangeText={(t) => setGrades(prev => ({ ...prev, [item.id]: t }))}
                                placeholder="Notu güncelle"
                                keyboardType="numeric"
                                style={{ paddingVertical: 8 }}
                              />
                            </View>
                            <TouchableOpacity 
                              style={[styles.saveButton, (!grades[item.id] && grades[item.id] !== '') ? {} : (!grades[item.id] && styles.saveButtonDisabled)]}
                              onPress={() => handleSaveGrade(item)}
                              disabled={savingId === item.id || !grades[item.id]}
                            >
                              {savingId === item.id ? (
                                <ActivityIndicator size="small" color={colors.bg2} />
                              ) : (
                                <>
                                  <Check size={16} color={colors.bg2} style={{ marginRight: 4 }} />
                                  <Text style={styles.saveButtonText}>Güncelle</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.approvedBadge}>
                            <Check size={16} color={colors.submitted} style={{ marginRight: 6 }} />
                            <Text style={styles.approvedBadgeText}>Bu ödevi not vermeden onayladınız.</Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {item.status === 'REJECTED' && (
                      <Text style={{ color: colors.coral, marginTop: 12, fontSize: 13, fontWeight: 'bold' }}>
                        Bu ödevi reddettiniz. Öğrencinin tekrar göndermesi bekleniyor.
                      </Text>
                    )}
                    
                  </View>
                ) : (
                  <Text style={styles.emptyStatus}>Henüz teslim etmedi</Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>Bu ödeve atanmış öğrenci bulunmuyor.</Text>}
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg1, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: '-10%', left: '-10%', width: 500, height: 500, backgroundColor: 'rgba(79,70,229,0.2)', ...( { filter: 'blur(120px)' } as any ) },
  orb2: { bottom: '-10%', right: '-10%', width: 600, height: 600, backgroundColor: 'rgba(147,51,234,0.2)', ...( { filter: 'blur(150px)' } as any ) },
  
  topbar: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.glassBg, zIndex: 10, backgroundColor: colors.bg2 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 20, fontWeight: 'bold', flex: 8 },
  
  headerCard: { backgroundColor: colors.glassBg, borderColor: colors.glassBorder, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  headerDesc: { color: colors.inkDim, fontSize: 14, marginBottom: 16, lineHeight: 20 },
  headerInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerInfoText: { color: colors.accentSoft, fontSize: 14, fontWeight: '500' },
  attachmentButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 12, alignSelf: 'flex-start' },
  attachmentButtonText: { color: colors.submitted, fontWeight: '600', fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: 16 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: 'bold' },

  listContent: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: colors.glassBg, borderColor: colors.glassBg, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  studentName: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeAmber: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
  badgeMint: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
  badgeCoral: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  badgeTextAmber: { color: colors.accent },
  badgeTextMint: { color: colors.submitted },
  badgeTextCoral: { color: colors.overdue },
  
  submissionArea: { marginTop: 8 },
  linkButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(129,140,248,0.2)', marginBottom: 16, alignSelf: 'flex-start' },
  linkText: { color: colors.accentSoft, fontWeight: 'bold' },
  gradeRow: { flexDirection: 'row', alignItems: 'center' },
  saveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: colors.bg2, fontWeight: 'bold' },
  emptyStatus: { color: colors.inkDim, fontStyle: 'italic', marginTop: 8 },
  emptyText: { color: colors.inkDim, textAlign: 'center', marginTop: 40 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 },
  rejectButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.coral, backgroundColor: 'rgba(239,68,68,0.1)' },
  rejectButtonText: { color: colors.coral, fontWeight: 'bold' },
  approveButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.submitted },
  approveButtonText: { color: colors.bg1, fontWeight: 'bold' },
  
  decisionArea: { marginTop: 12 },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.glassBorder },
  orText: { color: colors.inkDim, paddingHorizontal: 12, fontSize: 12, fontWeight: '600' },
  
  approvedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52,211,153,0.1)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  approvedBadgeText: { color: colors.submitted, fontSize: 13, fontWeight: 'bold' },
});
