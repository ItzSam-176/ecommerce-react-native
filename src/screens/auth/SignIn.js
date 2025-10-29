import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../navigation/AuthProvider';
import Input from '../../components/Form/Input';
import CustomButton from '../../components/Form/CustomButton';
import { useToastify } from '../../hooks/useToastify';
import { isValidEmail, isValidPassword } from '../../utils/validators';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('samsorathia3184@gmail.com');
  const [password, setPassword] = useState('Sam123');
  const [errorMsg, setErrorMsg] = useState(null);
  const { signIn } = useAuth();
  const { loading } = useAuth();
  const { showToast } = useToastify();

  const handleSignIn = async () => {
    setErrorMsg(null);
    if (!email.trim() || !password.trim()) {
      showToast('All fields are required', '', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('Invalid email address', '', 'error');
      return;
    }
    if (!isValidPassword(password)) {
      showToast('Password must be at least 6 characters', '', 'error');
      return;
    }
    try {
      await signIn(email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Input
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />

      <Input
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      <CustomButton
        title="Sign In"
        onPress={handleSignIn}
        loading={loading}
        disabled={!email || !password}
      />
      <Text onPress={() => navigation.navigate('SignUp')} style={styles.link}>
        Don't have an account? Sign Up
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#353F54',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
    color: '#fff',
  },
  error: {
    color: '#ff4458',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    color: '#4fc3f7',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
});
