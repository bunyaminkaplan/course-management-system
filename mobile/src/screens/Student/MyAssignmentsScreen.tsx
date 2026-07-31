import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState, useMemo } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch, patchFormData } from '../../api/client';
import { StudentAssignment } from '../../types/api';
import { CircleUser } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import GlassTopBar from '../../components/GlassTopBar';
import SkeletonCard from '../../components/SkeletonCard';
import GradientBackground from '../../components/GradientBackground';
import { Clock as ClockIcon, FilePenLine, CircleCheck, Link as LinkIcon, Send, X, CircleAlert, FilePlus, Trash2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function MyAssignmentsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SUBMITTED' | 'OVERDUE'>('PENDING');
  
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => get<StudentAssignment[]>('/api/student-assignments/')
  });

  const myAssignments = useMemo(() => {
    if (!assignments || !user) return [];
    return assignments.filter(a => a.student === user.id);
  }, [assignments, user]);

  const filteredAssignments = useMemo(() => {
    return myAssignments.filter(a => {
      if (activeTab === 'PENDING') return a.status === 'PENDING' || a.status === 'REJECTED';
      if (activeTab === 'SUBMITTED') return a.status === 'SUBMITTED' || a.status === 'APPROVED' || a.status === 'GRADED';
      return a.status === 'OVERDUE';
    });
  }, [myAssignments, activeTab]);

  const submitMutation = useMutation({
    mutationFn: async (data: { id: number; file_url?: string; file?: DocumentPicker.DocumentPickerAsset }) => {
      if (data.file) {
        const formData = new FormData();
        formData.append('status', 'SUBMITTED');
        formData.append('submitted_at', new Date().toISOString());
        formData.append('file_url', data.file_url || ''); // clear link if file is provided
        formData.append('submitted_file', {
          uri: data.file.uri,
          name: data.file.name,
          type: data.file.mimeType || 'application/octet-stream',
        } as any);
        return patchFormData(`/api/student-assignments/${data.id}/`, formData);
      } else {
        return patch(`/api/student-assignments/${data.id}/`, {
          file_url: data.file_url || '',
          submitted_file: null, // clear file if link is provided
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      closeModal();
      Alert.alert('Başarılı', 'Ödev başarıyla teslim edildi/güncellendi.');
    },
    onError: () => {
      setIsSubmitting(false);
      Alert.alert('Hata', 'Ödev teslim edilirken bir sorun oluştu.');
    }
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types (PDF, DOCX, etc.)
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setLinkInput(''); // clear link if file is chosen
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const closeModal = () => {
    setSelectedAssignment(null);
    setLinkInput('');
    setSelectedFile(null);
    setIsSubmitting(false);
    setIsEditing(false);
  };

  const handleSubmit = () => {
    if (!linkInput.trim() && !selectedFile) {
      Alert.alert('Uyarı', 'Lütfen bir bağlantı yapıştırın veya cihazdan dosya seçin.');
      return;
    }
    
    if (selectedAssignment) {
      setIsSubmitting(true);
      submitMutation.mutate({ 
        id: selectedAssignment.id, 
        file_url: linkInput.trim(), 
        file: selectedFile || undefined 
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <View style={{ padding: 13, gap: 8 }}>{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</View>
      </View>
    );
  }

  return (
    <GradientBackground>
      <GlassTopBar 
        title="Ödevlerim" 
        rightElement={
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile') || navigation.navigate('Profile')}>
            <CircleUser size={24} color={colors.accentSoft} />
          </TouchableOpacity>
        }
      />

      <View style={styles.tabsContainer}>
        {(['PENDING', 'SUBMITTED', 'OVERDUE'] as const).map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'PENDING' ? 'Bekleyen' : tab === 'SUBMITTED' ? 'Tamamlanan' : 'Süresi Dolan'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredAssignments}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (<TouchableOpacity 
            style={styles.card}
            onPress={() => setSelectedAssignment(item)}
          >
            <View style={styles.cardMain}>
                <View style={styles.cardIconContainer}>
                   {item.status === 'SUBMITTED' || item.status === 'APPROVED' || item.status === 'GRADED' ? (
                       <CircleCheck size={20} color={colors.submitted} />
                   ) : item.status === 'OVERDUE' || item.status === 'REJECTED' ? (
                       <CircleAlert size={20} color={colors.coral} />
                   ) : (
                       <FilePenLine size={20} color={colors.submitted} />
                   )}
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.title} numberOfLines={1}>{item.assignment_details.title}</Text>
                    <Text style={styles.className}>{item.assignment_details.classroom_name}</Text>
                    <View style={styles.dateRow}>
                        <Text style={styles.dateValue}>
                           <ClockIcon size={12} color={colors.inkDim} /> Son tarih: {format(new Date(item.assignment_details.deadline), "d MMMM HH:mm", { locale: tr })}
                        </Text>
                    </View>
                </View>
            </View>
            
            {(item.status === 'SUBMITTED' || item.status === 'APPROVED' || item.status === 'GRADED') && item.grade !== null && (
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>{item.grade}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bu kategoride ödev yok.</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedAssignment}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAssignment && (
              <>
                <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalClass}>{selectedAssignment.assignment_details.classroom_name}</Text>
                    <TouchableOpacity onPress={closeModal}>
                        <X size={24} color={colors.submitted} />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.modalTitle}>{selectedAssignment.assignment_details.title}</Text>
                
                <View style={styles.modalDescContainer}>
                  <Text style={styles.modalDesc}>{selectedAssignment.assignment_details.description}</Text>
                  {selectedAssignment.assignment_details.attachment && (
                    <TouchableOpacity 
                      style={styles.teacherAttachmentBtn}
                      onPress={() => {
                        Linking.openURL(selectedAssignment.assignment_details.attachment);
                      }}
                    >
                      <FilePenLine size={16} color={colors.submitted} />
                      <Text style={styles.teacherAttachmentText} numberOfLines={1}>
                        Ekteki Dosyayı Görüntüle
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {selectedAssignment.status === 'PENDING' || selectedAssignment.status === 'REJECTED' || isEditing ? (
                  <View style={styles.submitSection}>
                    {selectedAssignment.status === 'REJECTED' && !isEditing && (
                      <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                        <Text style={{ color: colors.coral, fontWeight: 'bold' }}>Ödeviniz yetersiz bulundu / reddedildi. Lütfen güncelleyerek tekrar gönderin.</Text>
                      </View>
                    )}
                    <Text style={styles.inputLabel}>Cihazdan Dosya Seç VEYA Bağlantı (Drive, WeTransfer vb.)</Text>

                    {selectedFile ? (
                      <View style={styles.fileSelectedContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <FilePenLine size={20} color={colors.submitted} style={{ marginRight: 8 }} />
                          <Text style={styles.fileNameText} numberOfLines={1}>{selectedFile.name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedFile(null)}>
                          <Trash2 size={20} color={colors.overdue} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity style={styles.filePickBtn} onPress={pickDocument}>
                          <FilePlus size={20} color={colors.submitted} />
                          <Text style={styles.filePickBtnText}>Cihazdan Dosya Seç (PDF, DOC vb.)</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.orDivider}>
                          <View style={styles.orLine} />
                          <Text style={styles.orText}>VEYA</Text>
                          <View style={styles.orLine} />
                        </View>

                        <View style={styles.inputWrapper}>
                            <LinkIcon size={18} color={colors.inkDim} style={styles.inputIcon} />
                            <TextInput
                              style={styles.input}
                              placeholder="https://..."
                              placeholderTextColor={colors.inkDim}
                              value={linkInput}
                              onChangeText={setLinkInput}
                              autoCapitalize="none"
                            />
                        </View>
                      </>
                    )}

                    <TouchableOpacity 
                      style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color={colors.bg1} size="small" />
                      ) : (
                        <>
                           <Send size={18} color={colors.bg1} />
                           <Text style={styles.submitBtnText}>{isEditing ? 'Teslimi Güncelle' : 'Teslim Et'}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    {isEditing && (
                      <TouchableOpacity 
                        style={styles.cancelEditBtn}
                        onPress={() => setIsEditing(false)}
                      >
                        <Text style={styles.cancelEditBtnText}>İptal Et</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.submittedInfoSection}>
                    <View style={styles.submittedRow}>
                        <CircleCheck size={18} color={colors.submitted} />
                        <Text style={styles.submittedTitle}>
                          {selectedAssignment.status === 'APPROVED' ? 'Öğretmen Onayladı' : 'Teslim Edildi'}
                        </Text>
                    </View>
                    <Text style={styles.infoLabel}>Gönderilen Bağlantı / Dosya Yolu:</Text>
                    <Text style={styles.infoValue}>{selectedAssignment.file_url || '-'}</Text>
                    
                    {selectedAssignment.grade !== null ? (
                      <View style={styles.gradeResult}>
                        <Text style={styles.gradeResultLabel}>Öğretmen Notu:</Text>
                        <Text style={styles.gradeResultValue}>{selectedAssignment.grade}</Text>
                      </View>
                    ) : (
                      selectedAssignment.status !== 'APPROVED' && (
                        <TouchableOpacity 
                          style={styles.editButton} 
                          onPress={() => setIsEditing(true)}
                        >
                          <FilePenLine size={18} color={colors.submitted} style={{marginRight: 6}} />
                          <Text style={styles.editButtonText}>Teslimi Düzenle / Güncelle</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                )}
              </>
            )}
          </View>
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
  orb1: { top: '10%', right: '-20%', width: 400, height: 400, backgroundColor: 'rgba(56,189,248,0.15)', ...( { filter: 'blur(120px)' } as any ) },
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(56,189,248,0.1)',
  },
  tabText: {
    color: colors.inkDim,
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.submitted,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBg,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.glassBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  className: {
    color: colors.submitted,
    fontSize: 12,
    marginBottom: 6,
  },
  gradeBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  gradeText: {
    color: colors.submitted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateValue: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.inkDim,
    fontSize: 14,
  },
  
  // Modal Styles
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
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalClass: {
    color: colors.submitted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalDescContainer: {
    backgroundColor: colors.glassBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.glassBg,
  },
  modalDesc: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
  },
  teacherAttachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
    gap: 8,
  },
  teacherAttachmentText: {
    color: colors.submitted,
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  submitSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: colors.submitted,
    fontSize: 13,
    marginBottom: 16,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.3)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
  },
  submitBtn: { flexDirection: 'row', backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: colors.bg1, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  cancelEditBtn: { paddingVertical: 14, marginTop: 4, alignItems: 'center' },
  cancelEditBtnText: { color: colors.inkDim, fontSize: 15, fontWeight: '600' },
  
  submittedInfoSection: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 16, padding: 16, marginTop: 16 },
  submittedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  submittedTitle: { color: colors.submitted, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  infoLabel: { color: colors.inkDim, fontSize: 13, marginBottom: 4 },
  infoValue: { color: colors.accentSoft, fontSize: 14, fontWeight: '500', marginBottom: 16 },
  
  gradeResult: { backgroundColor: 'rgba(52,211,153,0.1)', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  gradeResultLabel: { color: colors.submitted, fontSize: 14, fontWeight: '600' },
  gradeResultValue: { color: colors.submitted, fontSize: 18, fontWeight: 'bold' },
  
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: colors.submitted, borderRadius: 12, backgroundColor: 'rgba(52,211,153,0.05)' },
  editButtonText: { color: colors.submitted, fontWeight: 'bold', fontSize: 15 },
  filePickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
    gap: 8,
  },
  filePickBtnText: {
    color: colors.submitted,
    fontWeight: '600',
    fontSize: 14,
  },
  fileSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    marginBottom: 24,
  },
  fileNameText: {
    color: colors.ink,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.glassBorder,
  },
  orText: {
    color: colors.inkDim,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
