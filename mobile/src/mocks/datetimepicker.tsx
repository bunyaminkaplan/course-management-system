import { colors, fonts, radii, spacing } from '../theme/tokens';
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { BlurView } from 'expo-blur';

const TR_DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function DateTimePicker({ value, mode, onChange }: any) {
  const [currentValue, setCurrentValue] = useState(value || new Date());
  const [viewDate, setViewDate] = useState(new Date(currentValue));

  const [hour, setHour] = useState(String(currentValue.getHours()).padStart(2, '0'));
  const [minute, setMinute] = useState(String(currentValue.getMinutes()).padStart(2, '0'));

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  // Adjust so Monday is 0
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [startDay, daysInMonth]);

  const handleConfirm = () => {
    const newDate = new Date(currentValue);
    if (mode === 'time' || mode === 'datetime') {
      newDate.setHours(parseInt(hour, 10) || 0);
      newDate.setMinutes(parseInt(minute, 10) || 0);
    }
    if (onChange) onChange({ type: 'set' }, newDate);
  };

  const handleCancel = () => {
    if (onChange) onChange({ type: 'dismiss' });
  };

  const selectDate = (day: number) => {
    const newDate = new Date(currentValue);
    newDate.setFullYear(viewDate.getFullYear(), viewDate.getMonth(), day);
    setCurrentValue(newDate);
  };

  const changeMonth = (delta: number) => {
    const newView = new Date(viewDate);
    newView.setMonth(newView.getMonth() + delta);
    setViewDate(newView);
  };

  const isSelected = (day: number) => {
    return currentValue.getDate() === day &&
           currentValue.getMonth() === viewDate.getMonth() &&
           currentValue.getFullYear() === viewDate.getFullYear();
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="auto">
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.content}>
          <Text style={styles.title}>
            {mode === 'date' ? 'Tarih Seçin' : mode === 'time' ? 'Saat Seçin' : 'Tarih ve Saat Seçin'}
          </Text>

          {(mode === 'date' || mode === 'datetime') && (
            <View style={styles.calendarContainer}>
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
                  <Text style={styles.monthBtnText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>
                  {TR_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
                  <Text style={styles.monthBtnText}>{'>'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.daysHeader}>
                {TR_DAYS.map(d => (
                  <Text key={d} style={styles.dayHeaderText}>{d}</Text>
                ))}
              </View>

              <View style={styles.grid}>
                {calendarDays.map((day, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.dayCell, day && isSelected(day) && styles.dayCellSelected]}
                    onPress={() => day && selectDate(day)}
                    disabled={!day}
                  >
                    <Text style={[styles.dayText, day && isSelected(day) && styles.dayTextSelected]}>
                      {day || ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {(mode === 'time' || mode === 'datetime') && (
            <View style={styles.timeContainer}>
              <View style={styles.timeInputsRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Saat</Text>
                  <TextInput
                    style={styles.input}
                    value={hour}
                    onChangeText={setHour}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <Text style={styles.colon}>:</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Dakika</Text>
                  <TextInput
                    style={styles.input}
                    value={minute}
                    onChangeText={setMinute}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
              </View>
            </View>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Onayla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  content: { 
    width: '100%', 
    maxWidth: 380, 
    backgroundColor: 'rgba(21,15,46,0.85)', 
    padding: 24, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: colors.glassBorder,
    shadowColor: colors.bg1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  title: { 
    color: colors.ink, 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center', 
    fontFamily: fonts.headingSemibold 
  },
  calendarContainer: {
    backgroundColor: colors.glassBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.glassBg
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthBtn: {
    padding: 8,
    backgroundColor: colors.glassBorder,
    borderRadius: 8,
  },
  monthBtnText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: 'bold',
  },
  monthLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.bodySemibold
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    color: colors.submitted,
    fontSize: 12,
    fontFamily: fonts.bodyMedium
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(245,166,35,0.8)',
  },
  dayText: {
    color: colors.ink,
    fontSize: 14,
    fontFamily: fonts.body
  },
  dayTextSelected: {
    color: colors.bg1,
    fontWeight: 'bold',
  },
  timeContainer: {
    marginBottom: 24,
  },
  timeInputsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  inputGroup: {
    alignItems: 'center',
  },
  inputLabel: {
    color: colors.submitted,
    fontSize: 11,
    marginBottom: 6,
    fontFamily: fonts.bodyMedium
  },
  input: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    color: colors.ink,
    fontSize: 20,
    paddingVertical: 12,
    textAlign: 'center',
    width: 64,
    fontFamily: fonts.bodyMedium
  },
  colon: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  buttons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 16, 
    backgroundColor: colors.glassBg, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.glassBorder 
  },
  cancelText: { color: colors.ink, fontWeight: 'bold', fontSize: 14, fontFamily: fonts.headingSemibold },
  confirmBtn: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 16, 
    backgroundColor: colors.glassBg, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(245,166,35,0.45)' 
  },
  confirmText: { color: colors.accentSoft, fontWeight: 'bold', fontSize: 14, fontFamily: fonts.headingSemibold },
});
