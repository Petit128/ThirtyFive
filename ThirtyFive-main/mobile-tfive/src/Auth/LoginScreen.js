import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erreur', result.error);
    }
  };

  const quickLogin = async (email, password) => {
    setEmail(email);
    setPassword(password);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Erreur', result.error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="school" size={60} color="#646cff" />
          </View>
          <Text style={styles.title}>T-Five</Text>
          <Text style={styles.subtitle}>Plateforme d'apprentissage interactive</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="mail-outline" size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Comptes de test</Text>
            <View style={styles.dividerLine} />
          </View>

         
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>
              Pas de compte ? <Text style={styles.registerLinkBold}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(100,108,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
  form: { paddingHorizontal: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 16, paddingHorizontal: 16, gap: 12 },
  input: { flex: 1, paddingVertical: 14, color: '#fff', fontSize: 16 },
  loginButton: { backgroundColor: '#646cff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#888', paddingHorizontal: 16, fontSize: 12 },
  quickButtons: { flexDirection: 'row', gap: 12 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 25, gap: 8 },
  studentBtn: { backgroundColor: '#10b981' },
  professorBtn: { backgroundColor: '#f59e0b' },
  adminBtn: { backgroundColor: '#ef4444' },
  quickBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  registerLink: { textAlign: 'center', color: '#888', marginTop: 24 },
  registerLinkBold: { color: '#646cff', fontWeight: '600' },
});