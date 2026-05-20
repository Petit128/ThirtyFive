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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    const result = await register({ name, email, password, role });
    setLoading(false);

    if (result.success) {
      Alert.alert('Succès', 'Inscription réussie ! Connectez-vous.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>📝 Inscription</Text>
          <Text style={styles.subtitle}>Créez votre compte</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="person-outline" size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>

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
              placeholder="Mot de passe (6+ caractères)"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Confirmer mot de passe"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Icon name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'student' && styles.roleActive]}
              onPress={() => setRole('student')}
            >
              <Icon name="person-outline" size={20} color={role === 'student' ? '#fff' : '#888'} />
              <Text style={[styles.roleButtonText, role === 'student' && styles.roleActiveText]}>Étudiant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'professor' && styles.roleActive]}
              onPress={() => setRole('professor')}
            >
              <Icon name="school-outline" size={20} color={role === 'professor' ? '#fff' : '#888'} />
              <Text style={[styles.roleButtonText, role === 'professor' && styles.roleActiveText]}>Professeur</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>
              Déjà un compte ? <Text style={styles.loginLinkBold}>Se connecter</Text>
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
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 8 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888' },
  form: { paddingHorizontal: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 16, paddingHorizontal: 16, gap: 12 },
  input: { flex: 1, paddingVertical: 14, color: '#fff', fontSize: 16 },
  roleSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', gap: 8 },
  roleActive: { backgroundColor: '#646cff' },
  roleButtonText: { color: '#888', fontWeight: '500' },
  roleActiveText: { color: '#fff' },
  registerButton: { backgroundColor: '#646cff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  loginLink: { textAlign: 'center', color: '#888', marginTop: 24 },
  loginLinkBold: { color: '#646cff', fontWeight: '600' },
});