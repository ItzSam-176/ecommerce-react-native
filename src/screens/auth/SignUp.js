import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { supabase } from '../../supabase/supabase';
import Input from '../../components/Form/Input'; // 👈 Reusable Input
import CustomButton from '../../components/Form/CustomButton'; // 👈 Reusable Button
import { useAuth } from '../../navigation/AuthProvider';
import { useToastify } from '../../hooks/useToastify';
import {
  isValidEmail,
  isValidPhone,
  isValidPassword,
} from '../../utils/validators';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const { loading } = useAuth();
  const { showToast } = useToastify();

  // Step 1: Signup
  const handleSignUp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      showToast('All fields are required', '', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('Invalid email address', '', 'error');
      return;
    }

    if (!isValidPhone(phone)) {
      showToast('Invalid phone number', '', 'error');
      return;
    }

    if (!isValidPassword(password)) {
      showToast('Password must be at least 6 characters', '', 'error');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });

    if (error) setErrorMsg(error.message);
    else {
      setInfoMsg('Sign up successful! OTP sent to your email.');
      setOtpSent(true);

      // Trigger OTP email manually since signUp sends confirmation link by default
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }, // user already exists
      });
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    const {
      data: { session },
      error,
    } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) setErrorMsg(error.message);
    else {
      setInfoMsg('✅ Email verified!');
      setOtp('');
      setOtpSent(false);
      setInfoMsg(``);
      // Get the current user (after OTP verification, session is valid)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setErrorMsg(userError.message);
        return;
      }

      // Insert into your custom users table
      const { error: dbError } = await supabase.from('users').insert([
        {
          id: user.id, // 👈 this is the auth user id
          name,
          phone,
          email,
        },
      ]);

      if (dbError) setErrorMsg(dbError.message);
      else setInfoMsg('User record created successfully!');
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {!otpSent && (
        <>
          <Input placeholder="Name" value={name} onChangeText={setName} />
          <Input
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <CustomButton
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            disabled={!name || !phone || !email || !password}
          />
        </>
      )}

      {otpSent && (
        <>
          <Input
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />

          <CustomButton
            title="Verify OTP"
            onPress={handleVerifyOtp}
            loading={loading}
            disabled={!otp}
          />
        </>
      )}

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      {infoMsg && <Text style={styles.info}>{infoMsg}</Text>}

      {!otpSent && (
        <Text onPress={() => navigation.navigate('SignIn')} style={styles.link}>
          Already have an account? Sign In
        </Text>
      )}
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
  info: {
    color: '#4fc3f7',
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
