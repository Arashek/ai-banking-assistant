import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { bankingApi } from '../services/api';

const RegisterScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    idNumber: '',
  });
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep1 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }
    if (!formData.idNumber.trim()) {
      Alert.alert('Error', 'Please enter your ID number');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    try {
      setLoading(true);
      const response = await bankingApi.register(formData);
      await login(response.token, response.user);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'An error occurred during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'Enter your basic information'
            : 'Complete your profile details'}
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        <View
          style={[styles.stepIndicator, step >= 1 && styles.stepIndicatorActive]}
        >
          <Text
            style={[styles.stepText, step >= 1 && styles.stepTextActive]}
          >
            1
          </Text>
        </View>
        <View style={styles.stepLine} />
        <View
          style={[styles.stepIndicator, step >= 2 && styles.stepIndicatorActive]}
        >
          <Text
            style={[styles.stepText, step >= 2 && styles.stepTextActive]}
          >
            2
          </Text>
        </View>
      </View>

      {step === 1 ? (
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="person" size={20} color="#95A5A6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#95A5A6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#95A5A6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.showPasswordButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color="#95A5A6"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#95A5A6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="phone" size={20} color="#95A5A6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="home" size={20} color="#95A5A6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="badge" size={20} color="#95A5A6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ID Number"
              value={formData.idNumber}
              onChangeText={(value) => updateFormData('idNumber', value)}
            />
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleBack}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleRegister}
            >
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginLinkText}>
          Already have an account? <Text style={styles.loginLinkTextBold}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ECF0F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorActive: {
    backgroundColor: '#2C3E50',
  },
  stepText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#ECF0F1',
    marginHorizontal: 10,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#2C3E50',
  },
  showPasswordButton: {
    padding: 10,
  },
  button: {
    backgroundColor: '#2C3E50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2C3E50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#2C3E50',
  },
  loginLink: {
    padding: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  loginLinkTextBold: {
    color: '#2C3E50',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
