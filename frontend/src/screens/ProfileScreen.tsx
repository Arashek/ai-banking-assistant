import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import ReactNativeBiometrics from 'react-native-biometrics';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const toggleBiometrics = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      if (!available) {
        Alert.alert('Error', 'Biometric authentication is not available on this device');
        return;
      }

      if (!biometricsEnabled) {
        // Prompt for biometric authentication before enabling
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Confirm your identity',
        });

        if (success) {
          setBiometricsEnabled(true);
          Alert.alert('Success', 'Biometric authentication enabled');
        }
      } else {
        setBiometricsEnabled(false);
        Alert.alert('Success', 'Biometric authentication disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to configure biometric authentication');
    }
  };

  const SettingItem = ({
    icon,
    title,
    value,
    onPress,
    showToggle = false,
    showArrow = true,
  }: {
    icon: string;
    title: string;
    value?: boolean;
    onPress?: () => void;
    showToggle?: boolean;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={24} color="#2C3E50" />
      </View>
      <Text style={styles.settingText}>{title}</Text>
      {showToggle && (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: '#95A5A6', true: '#2C3E50' }}
          thumbColor={value ? '#ECF0F1' : '#FFFFFF'}
        />
      )}
      {showArrow && !showToggle && (
        <Icon name="chevron-right" size={24} color="#95A5A6" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <SettingItem
          icon="person"
          title="Personal Information"
          onPress={() => navigation.navigate('PersonalInfo')}
        />
        <SettingItem
          icon="security"
          title="Security"
          onPress={() => navigation.navigate('Security')}
        />
        <SettingItem
          icon="notifications"
          title="Notifications"
          showToggle
          value={notificationsEnabled}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        />
        <SettingItem
          icon="fingerprint"
          title="Biometric Login"
          showToggle
          value={biometricsEnabled}
          onPress={toggleBiometrics}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <SettingItem
          icon="language"
          title="Language"
          onPress={() => navigation.navigate('Language')}
        />
        <SettingItem
          icon="dark-mode"
          title="Dark Mode"
          showToggle
          value={darkModeEnabled}
          onPress={() => setDarkModeEnabled(!darkModeEnabled)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingItem
          icon="help"
          title="Help Center"
          onPress={() => navigation.navigate('Help')}
        />
        <SettingItem
          icon="description"
          title="Terms of Service"
          onPress={() => navigation.navigate('Terms')}
        />
        <SettingItem
          icon="privacy-tip"
          title="Privacy Policy"
          onPress={() => navigation.navigate('Privacy')}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color="#E74C3C" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2C3E50',
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#ECF0F1',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginLeft: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    padding: 15,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 12,
    marginVertical: 20,
  },
});

export default ProfileScreen;
