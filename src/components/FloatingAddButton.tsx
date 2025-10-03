import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';

interface FloatingAddButtonProps {
  onPress: () => void;
  visible?: boolean;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({
  onPress,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.fabContainer}>
      <TouchableOpacity style={styles.fab} onPress={onPress}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  fabContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
}));
