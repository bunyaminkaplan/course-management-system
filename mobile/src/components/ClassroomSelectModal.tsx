import { colors, fonts, radii, spacing } from '../theme/tokens';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Check, X, Search } from 'lucide-react-native';
import { ClassRoom } from '../types/api';

interface ClassroomSelectModalProps {
  visible: boolean;
  onClose: () => void;
  classrooms: ClassRoom[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export default function ClassroomSelectModal({ visible, onClose, classrooms, selectedIds, onSelectionChange }: ClassroomSelectModalProps) {
  const [searchText, setSearchText] = useState('');

  const filteredClassrooms = useMemo(() => {
    let result = classrooms;
    if (searchText) {
      result = classrooms.filter(c => c.name.toLocaleLowerCase('tr-TR').includes(searchText.toLocaleLowerCase('tr-TR')));
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  }, [classrooms, searchText]);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const newSelected = new Set([...selectedIds, ...filteredClassrooms.map(c => c.id)]);
    onSelectionChange(Array.from(newSelected));
  };

  const handleSelectNone = () => {
    const filteredIds = filteredClassrooms.map(c => c.id);
    onSelectionChange(selectedIds.filter(id => !filteredIds.includes(id)));
  };

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="box-none">
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Sınıf(lar) Seçimi</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.submitted} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={18} color={colors.submitted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { outlineStyle: 'none' } as any]}
              placeholder="Sınıf ara..."
              placeholderTextColor={colors.submitted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              onPress={() => {
                const filteredIds = filteredClassrooms.map(c => c.id);
                const allSelected = filteredIds.every(id => selectedIds.includes(id));
                if (allSelected && filteredIds.length > 0) {
                  handleSelectNone();
                } else {
                  handleSelectAll();
                }
              }} 
              style={styles.actionBtn}
            >
              <Text style={styles.actionText}>
                {filteredClassrooms.length > 0 && filteredClassrooms.every(c => selectedIds.includes(c.id)) 
                  ? "Hiçbirini Seçme" 
                  : "Tümünü Seç"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {filteredClassrooms.map(c => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => handleToggle(c.id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <Check size={14} color={colors.bg1} />}
                  </View>
                  <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
            {filteredClassrooms.length === 0 && (
              <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
            <Text style={styles.confirmText}>Onayla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.bg1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  content: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.bg2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    padding: 20,
    shadowColor: colors.bg1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fonts.headingSemibold
  },
  closeBtn: {
    padding: 4
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 12,
    marginBottom: 16
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    paddingVertical: 12,
    fontFamily: fonts.body
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.glassBg,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder
  },
  actionText: {
    color: colors.submitted,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.bodyMedium
  },
  list: {
    maxHeight: 350,
    flexShrink: 1,
    marginBottom: 16
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBg
  },
  itemSelected: {
    backgroundColor: colors.glassBg,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.inkDim,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft
  },
  itemText: {
    color: colors.ink,
    fontSize: 15,
    fontFamily: fonts.bodyMedium
  },
  itemTextSelected: {
    color: colors.ink,
    fontWeight: 'bold'
  },
  emptyText: {
    color: colors.submitted,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: fonts.body
  },
  confirmBtn: {
    backgroundColor: colors.accentSoft,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  confirmText: {
    color: colors.bg1,
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: fonts.headingSemibold
  }
});
