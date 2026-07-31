import { colors, fonts, radii, spacing } from '../../theme/tokens';
import React, { useState } from 'react';
import BackButton from '../../components/BackButton';
import GradientBackground from '../../components/GradientBackground';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, CircleUser, Calendar as CalendarIcon, Clock as ClockIcon, Paperclip } from 'lucide-react-native';
import GlassInput from '../../components/GlassInput';
import DateTimePicker from '../../mocks/datetimepicker';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { post } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import ClassroomSelectModal from '../../components/ClassroomSelectModal';

export default function CreateExamScreen() {
  const { myClassrooms } = useMyClassrooms();
  const navigation = useNavigation<any>();

  const [selectedClassrooms, setSelectedClassrooms] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<{name: string, uri: string} | null>(null);
  const [combinedDate, setCombinedDate] = useState<Date | null>(null);

  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const handleFilePick = async () => {
    // Mock document picker
    setTimeout(() => {
      setSelectedFile({ name: 'sinav_talimatlari.pdf', uri: 'file://mock/sinav.pdf' });
    }, 500);
  };

  const toggleClassroom = (id: number) => {
    if (selectedClassrooms.includes(id)) {
      setSelectedClassrooms(selectedClassrooms.filter(c => c !== id));
    } else {
      setSelectedClassrooms([...selectedClassrooms, id]);
    }
  };

  const onDateTimeChange = (event: any, selectedDate?: Date) => {
    setShowDateTimePicker(false);
    if (event.type === 'set' && selectedDate) {
      setCombinedDate(selectedDate);
    }
  };

  const queryClient = useQueryClient();

  const handleCreate = async () => {
    if (!title || selectedClassrooms.length === 0 || !combinedDate) return;

    setIsSubmitting(true);
    const dateStr = format(combinedDate, 'yyyy-MM-dd');
    try {
      const promises = selectedClassrooms.map(id => {
        return post('/api/exams/', {
          classroom: id,
          title,
          date: dateStr,
          document_url: selectedFile?.uri || null
        });
      });
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Sınav oluşturulurken bir hata meydana geldi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground>
<View style={styles.topbar}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title} numberOfLines={1}>Yeni Sınav</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
            <CircleUser size={28} color={colors.accentSoft} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Sınıf(lar) Seçimi</Text>
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

        <Text style={styles.label}>Sınav Başlığı</Text>
        <GlassInput 
          value={title} 
          onChangeText={setTitle} 
          placeholder="Örn: Vize Sınavı" 
          style={styles.inputSpacing}
        />

        
        <Text style={styles.label}>Belge / Döküman (Opsiyonel)</Text>
        <View style={styles.fileSection}>
          <TouchableOpacity style={styles.fileButton} onPress={handleFilePick}>
            <Paperclip size={20} color={colors.ink} />
            <Text style={styles.fileButtonText}>Dosya Ekle</Text>
          </TouchableOpacity>
          {selectedFile && (
            <Text style={styles.fileName} numberOfLines={1}>Seçilen: {selectedFile.name}</Text>
          )}
        </View>

        <Text style={styles.label}>Sınav Tarihi ve Saati</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
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

        {combinedDate && (
          <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.glassBg, borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center' }}>
            <Text style={{ color: colors.submitted, fontSize: 12, marginBottom: 4 }}>Seçilen Sınav Zamanı:</Text>
            <Text style={{ color: colors.submitted, fontSize: 15, fontWeight: 'bold' }}>
              {format(combinedDate, "d MMMM yyyy, HH:mm", { locale: tr })}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, (!title || selectedClassrooms.length === 0 || !combinedDate || isSubmitting) && styles.submitDisabled]} 
          onPress={handleCreate}
          disabled={!title || selectedClassrooms.length === 0 || !combinedDate || isSubmitting}
        >
          <Text style={styles.submitButtonText}>{isSubmitting ? 'Oluşturuluyor...' : 'Sınav Oluştur'}</Text>
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
  fileSection: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  fileButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.glassBorder },
  fileButtonText: { color: colors.ink, fontWeight: 'bold', marginLeft: 8 },
  fileName: { color: colors.submitted, marginLeft: 12, flex: 1 },
  
  pickerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassBg, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder },
  pickerButtonText: { color: colors.ink, fontWeight: '600', fontSize: 14 },
  
  submitButton: { backgroundColor: colors.submitted, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  submitDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.ink, fontSize: 16, fontWeight: 'bold' },
});
