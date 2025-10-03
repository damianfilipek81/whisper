import React from 'react';
import { View, Switch } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from './Typography';

interface SettingRowProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Typography 
          variant="bodyLarge" 
          weight="semibold"
          iconLeft={<Ionicons name={icon as any} size={20} color="#000000" />}
        >
          {title}
        </Typography>
        <Typography variant="caption" color="muted">
          {description}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E9E9EB', true: '#34C759' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E9E9EB"
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  textContainer: {
    flex: 1,
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.md,
  },
}));

