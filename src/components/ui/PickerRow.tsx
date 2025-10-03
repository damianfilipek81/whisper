import React from 'react';
import { View, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from './Typography';

interface PickerOption<T = string> {
  value: T;
  label: string;
}

interface PickerRowProps<T = string> {
  icon: string;
  title: string;
  subtitle?: string;
  selectedValue: T;
  options: PickerOption<T>[];
  onValueChange: (value: T) => void;
}

export function PickerRow<T = string>({
  icon,
  title,
  subtitle,
  selectedValue,
  options,
  onValueChange,
}: PickerRowProps<T>) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography 
          variant="bodyLarge" 
          weight="semibold"
          iconLeft={<Ionicons name={icon as any} size={20} color="#000000" />}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="muted">
            {subtitle}
          </Typography>
        )}
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {options.map((option) => (
            <Picker.Item
              key={String(option.value)}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.xs,
  },
  pickerContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.otherMessage + '30',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        paddingVertical: 0,
      },
      android: {
        paddingHorizontal: theme.spacing.sm,
      },
    }),
  },
  picker: {
    ...Platform.select({
      ios: {
        height: 180,
      },
      android: {
        height: 50,
      },
    }),
  },
  pickerItem: {
    ...Platform.select({
      ios: {
        fontSize: 18,
        height: 180,
      },
    }),
  },
}));

