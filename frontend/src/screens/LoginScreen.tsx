import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactNativeBiometrics from 'react-native-biometrics';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const rnBiometrics = new ReactNativeBiometrics();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      if (available && biometryType) {
        // Biometric authentication is available
        console.log(`Biometric type available: ${biometryType}`);
      }
    } catch (error) {
      console.error('Biometric check error:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.login(email, password);
      await login(response.token, response.user);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      const { success, signature } = await rnBiometrics.simplePrompt({
        promptMessage: 'Confirm fingerprint',
      });

      if (success) {
        const response = await authApi.verifyBiometric(signature);
        await login(response.token, response.user);
        navigation.replace('Home');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="account-balance" size={80} color="#2C3E50" />
        <Text style={styles.title}>AI Banking Assistant</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.biometricButton, loading && styles.buttonDisabled]}
          onPress={handleBiometricLogin}
          disabled={loading}
        >
          <Icon name="fingerprint" size={24} color="#fff" />
          <Text style={styles.buttonText}>Login with Biometrics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text style={styles.registerText}>
            Don't have an account? Register here
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 10,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  button: {
    backgroundColor: '#2C3E50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  biometricButton: {
    backgroundColor: '#34495E',
    padding: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    color: '#2C3E50',
    fontSize: 14,
  },
});

export default LoginScreen;
