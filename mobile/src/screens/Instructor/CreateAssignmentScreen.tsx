import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState } from 'react';
import BackButton from '../../components/BackButton';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Keyboard } from 'react-native';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { post, postFormData } from '../../api/client';
import GlassInput from '../../components/GlassInput';
import DateTimePicker from '../../mocks/datetimepicker';
import ClassroomSelectModal from '../../components/ClassroomSelectModal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, CircleUser, Calendar as CalendarIcon, Clock as ClockIcon, Paperclip, Hourglass } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function CreateAssignmentScreen() {
  const { myClassrooms } = useMyClassrooms();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const [selectedClassrooms, setSelectedClassrooms] = useState<number[]>([]);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [deadlineType, setDeadlineType] = useState<'duration' | 'custom' | null>(null);
  const [durationDays, setDurationDays] = useState<number>(1);
  
  const [combinedDate, setCombinedDate] = useState<Date | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDateTimeChange = (event: any, selectedDate?: Date) => {
    setShowDateTimePicker(false);
    if (event.type === 'set' && selectedDate) {
      setCombinedDate(selectedDate);
    }
  };

  const calculatedDeadline = () => {
    if (deadlineType === 'custom') {
      return combinedDate;
    }
    if (deadlineType === 'duration' && durationDays > 0) {
      const d = new Date();
      d.setDate(d.getDate() + durationDays);
      return d;
    }
    return null;
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.warn("Dosya seçilirken hata oluştu", err);
    }
  };

  const handleCreate = async () => {
    if (!title || selectedClassrooms.length === 0) return;
    
    let finalDeadline = '';
    if (deadlineType === 'custom') {
      if (!combinedDate) return;
      finalDeadline = combinedDate.toISOString();
    } else {
      const d = new Date();
      d.setDate(d.getDate() + durationDays);
      finalDeadline = d.toISOString();
    }
    
    setIsSubmitting(true);
    
    try {
      for (const classroomId of selectedClassrooms) {
        if (selectedFile) {
          const formData = new FormData();
          formData.append('classroom', classroomId.toString());
          formData.append('title', title);
          formData.append('description', description);
          formData.append('deadline', finalDeadline);
          formData.append('attachment', {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.mimeType || 'application/octet-stream',
          } as any);
          await postFormData('/api/assignments/', formData);
        } else {
          await post('/api/assignments/', {
            classroom: classroomId,
            title,
            description,
            deadline: finalDeadline,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Hata', 'Ödev oluşturulurken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground>
<View style={styles.topbar}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title} numberOfLines={1}>Yeni Ödev Oluştur</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Sınıf Seçimi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer} keyboardShouldPersistTaps="handled">
          {selectedClassrooms.length > 0 ? (
            myClassrooms.filter(c => selectedClassrooms.includes(c.id)).map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, styles.chipSelected]}
                onPress={() => setShowClassroomModal(true)}
              >
                <Text style={[styles.chipText, styles.chipTextSelected]}>{c.name}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              style={[styles.chip, { borderStyle: 'dashed' }]}
              onPress={() => setShowClassroomModal(true)}
            >
              <Text style={styles.chipText}>+ Sınıf Ekle</Text>
            </TouchableOpacity>
          )}
          {selectedClassrooms.length > 0 && (
            <TouchableOpacity
              style={[styles.chip, { borderStyle: 'dashed' }]}
              onPress={() => setShowClassroomModal(true)}
            >
              <Text style={styles.chipText}>+ Düzenle</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <Text style={styles.label}>Başlık</Text>
        <GlassInput 
          value={title} 
          onChangeText={setTitle} 
          placeholder="Ödev başlığını girin" 
          style={styles.inputSpacing}
        />

        <Text style={styles.label}>Açıklama</Text>
        <GlassInput 
          value={description} 
          onChangeText={setDescription} 
          placeholder="Ödev detaylarını yazın" 
          multiline
          numberOfLines={4}
          style={[styles.inputSpacing, { minHeight: 100, textAlignVertical: 'top' }]}
        />
        
        <View style={styles.fileSection}>
          <TouchableOpacity style={styles.fileButton} onPress={pickDocument}>
            <Paperclip size={20} color={colors.ink} />
            <Text style={styles.fileButtonText}>Dosya Ekle</Text>
          </TouchableOpacity>
          {selectedFile && (
            <Text style={styles.fileName} numberOfLines={1}>Seçilen: {selectedFile.name}</Text>
          )}
        </View>

        <Text style={styles.label}>Son Teslim Süresi / Tarihi</Text>

        <TouchableOpacity 
          style={[styles.accordionHeader, deadlineType === 'duration' && styles.accordionHeaderActive]}
          onPress={() => setDeadlineType(deadlineType === 'duration' ? null : 'duration')}
        >
          <View style={styles.accordionHeaderLeft}>
            <Hourglass size={18} color={deadlineType === 'duration' ? colors.ink : colors.submitted} style={{marginRight: 8}} />
            <Text style={[styles.accordionHeaderText, deadlineType === 'duration' && styles.accordionHeaderTextActive]}>Süre Seç</Text>
          </View>
        </TouchableOpacity>
        
        {deadlineType === 'duration' && (
          <View style={styles.accordionContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer} keyboardShouldPersistTaps="handled">
              {[
                { label: '1 Gün', value: 1 },
                { label: '3 Gün', value: 3 },
                { label: '1 Hafta', value: 7 },
                { label: '2 Hafta', value: 14 }
              ].map(d => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.chip, durationDays === d.value && styles.chipSelected]}
                  onPress={() => setDurationDays(d.value)}
                >
                  <Text style={[styles.chipText, durationDays === d.value && styles.chipTextSelected]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <GlassInput
              value={durationDays.toString()}
              onChangeText={(text) => {
                const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(parsed)) setDurationDays(parsed);
                else if (text === '') setDurationDays(0);
              }}
              keyboardType="numeric"
              placeholder="Gün sayısı"
            />
          </View>
        )}

        <TouchableOpacity 
          style={[styles.accordionHeader, deadlineType === 'custom' && styles.accordionHeaderActive]}
          onPress={() => setDeadlineType(deadlineType === 'custom' ? null : 'custom')}
        >
          <View style={styles.accordionHeaderLeft}>
            <CalendarIcon size={18} color={deadlineType === 'custom' ? colors.ink : colors.submitted} style={{marginRight: 8}} />
            <Text style={[styles.accordionHeaderText, deadlineType === 'custom' && styles.accordionHeaderTextActive]}>Tarih/Saat Belirle</Text>
          </View>
        </TouchableOpacity>

        {deadlineType === 'custom' && (
          <View style={styles.accordionContent}>
            <TouchableOpacity 
               style={styles.pickerButton} 
               onPress={() => {
                
                
                  setShowDateTimePicker(true);
                
              }}
            >
              <CalendarIcon size={20} color={colors.ink} style={{ marginRight: 8 }} />
              <Text style={styles.pickerButtonText}>Tarih ve Saat Seç</Text>
            </TouchableOpacity>
          </View>
        )}

        {calculatedDeadline() && (
          <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.glassBg, borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center' }}>
            <Text style={{ color: colors.submitted, fontSize: 12, marginBottom: 4 }}>Hesaplanan Son Teslim Zamanı:</Text>
            <Text style={{ color: colors.submitted, fontSize: 15, fontWeight: 'bold' }}>
              {format(calculatedDeadline()!, "d MMMM yyyy, HH:mm", { locale: tr })}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, (!title || selectedClassrooms.length === 0 || isSubmitting || (deadlineType === 'custom' && !combinedDate)) && styles.submitDisabled]} 
          onPress={handleCreate}
          disabled={!title || selectedClassrooms.length === 0 || isSubmitting || (deadlineType === 'custom' && !combinedDate)}
        >
          <Text style={styles.submitButtonText}>{isSubmitting ? 'Oluşturuluyor...' : 'Ödev Oluştur'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {showDateTimePicker && (
        <DateTimePicker
          value={combinedDate || new Date()}
          mode="datetime"
          display="default"
          onChange={onDateTimeChange}
        />
      )}

      <ClassroomSelectModal
        visible={showClassroomModal}
        onClose={() => setShowClassroomModal(false)}
        classrooms={myClassrooms}
        selectedIds={selectedClassrooms}
        onSelectionChange={setSelectedClassrooms}
      />
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
  
  content: { padding: 20, paddingBottom: 120 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  
  chipsContainer: { flexDirection: 'row', marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder, marginRight: 8, alignSelf: 'flex-start' },
  chipSelected: { backgroundColor: colors.glassBorder },
  chipText: { color: colors.inkDim, fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: colors.ink, fontWeight: 'bold' },
  
  inputSpacing: { marginBottom: 4 },
  
  fileSection: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  fileButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.glassBorder },
  fileButtonText: { color: colors.ink, fontWeight: 'bold', marginLeft: 8 },
  fileName: { color: colors.submitted, marginLeft: 12, flex: 1 },
  
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.glassBg, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginTop: 8 },
  accordionHeaderActive: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  accordionHeaderText: { color: colors.submitted, fontWeight: '600', fontSize: 14 },
  accordionHeaderTextActive: { color: colors.ink },
  accordionContent: { padding: 16, backgroundColor: colors.bg3, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginBottom: 8, marginTop: -4 },
  
  row: { flexDirection: 'row', marginTop: 4 },
  pickerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassBg, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder },
  pickerButtonText: { color: colors.ink, fontWeight: '600', fontSize: 14 },
  
  dateResultText: { color: colors.submitted, fontSize: 13, fontWeight: '500', marginTop: 12, textAlign: 'center' },
  
  submitButton: { backgroundColor: colors.submitted, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  submitDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.ink, fontSize: 16, fontWeight: 'bold' },
});
