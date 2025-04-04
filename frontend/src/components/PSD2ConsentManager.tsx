import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bankingApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { translations } from '../translations/es';

const { bankAccess } = translations;

interface ConsentStatus {
  enabled: boolean;
  lastAuthorized: string | null;
  consentId: string | null;
  consentExpiresAt: string | null;
}

const PSD2ConsentManager: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);

  useEffect(() => {
    loadConsentStatus();
  }, []);

  const loadConsentStatus = async () => {
    try {
      const response = await bankingApi.getPSD2ConsentStatus();
      setConsentStatus(response);
    } catch (error) {
      console.error('Error loading consent status:', error);
    }
  };

  const handleAuthorize = async () => {
    try {
      setLoading(true);
      const response = await bankingApi.initiatePSD2Authorization();
      await Linking.openURL(response.authorizationUrl);
    } catch (error) {
      Alert.alert(
        bankAccess.errors.authFailed,
        bankAccess.errors.connectionFailed
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    Alert.alert(
      bankAccess.confirmDisconnect.title,
      bankAccess.confirmDisconnect.message,
      [
        {
          text: bankAccess.confirmDisconnect.cancel,
          style: 'cancel',
        },
        {
          text: bankAccess.confirmDisconnect.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await bankingApi.revokePSD2Consent();
              await loadConsentStatus();
              Alert.alert(
                translations.common.success,
                bankAccess.success.disconnected
              );
            } catch (error) {
              Alert.alert(
                translations.common.error,
                bankAccess.errors.disconnectFailed
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="account-balance" size={24} color="#2C3E50" />
        <Text style={styles.title}>{bankAccess.title}</Text>
      </View>

      <View style={styles.content}>
        {consentStatus?.enabled ? (
          <>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, styles.statusActive]} />
              <Text style={styles.statusText}>{bankAccess.connected}</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>{bankAccess.lastAuthorized}</Text>
              <Text style={styles.infoValue}>
                {new Date(consentStatus.lastAuthorized!).toLocaleDateString('es-ES')}
              </Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>{bankAccess.expiresOn}</Text>
              <Text style={styles.infoValue}>
                {new Date(consentStatus.consentExpiresAt!).toLocaleDateString('es-ES')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={handleRevoke}
            >
              <Icon name="link-off" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>{bankAccess.disconnect}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, styles.statusInactive]} />
              <Text style={styles.statusText}>{bankAccess.notConnected}</Text>
            </View>

            <Text style={styles.description}>
              {bankAccess.description}
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleAuthorize}
            >
              <Icon name="link" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>{bankAccess.connect}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.securityInfo}>
        <Icon name="security" size={20} color="#95A5A6" />
        <Text style={styles.securityText}>
          {bankAccess.securityInfo}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 10,
  },
  content: {
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#27AE60',
  },
  statusInactive: {
    backgroundColor: '#E74C3C',
  },
  statusText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  infoValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonPrimary: {
    backgroundColor: '#2C3E50',
  },
  buttonDanger: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 5,
  },
  securityText: {
    fontSize: 12,
    color: '#95A5A6',
    marginLeft: 8,
    flex: 1,
  },
});

export default PSD2ConsentManager;
