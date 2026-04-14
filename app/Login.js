import React from 'react';
import {Text,View,StyleSheet,TextInput,TouchableOpacity,Image, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {saveSession,getUser} from './authStorage';
import Animated,{
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
} from 'react-native-reanimated';


export default function Login({navigation,setIsLoggedIn}){

   const [showPassword, setShowPassword] = useState(false);
   const [email, setEmail] = useState('');
   const [error, setError] = useState('');
   const [password, setPassword] = useState('');

   const shakeX = useSharedValue(0);
   const hasError = useSharedValue(false);

   const shakeStyle = useAnimatedStyle(() => ({
     transform: [{ translateX: shakeX.value }],
     borderColor: hasError.value ? '#E24B4A' : '#D3D1C7',
   }));

   // for shake animation
   const triggerShake = () => {
     hasError.value = true;
     shakeX.value = withSequence(
       withTiming(-10, { duration: 50 }),
       withTiming(10,  { duration: 50 }),
       withTiming(-8,  { duration: 50 }),
       withTiming(8,   { duration: 50 }),
       withTiming(-4,  { duration: 50 }),
       withTiming(0,   { duration: 50 }),
     );
   };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      triggerShake();
      return;
    }
    try {
      const storedUser = await getUser(email.trim());
      console.log("Stored user:", storedUser);

      if (!storedUser || storedUser.email !== email.trim()) {
        setError("No account found with this email");
        triggerShake();
        return;
      }

      if (storedUser.password !== password) {
        setError("Incorrect password");
        triggerShake();
        return;
      }

      const session = {
        accessToken: "token_123",
        refreshToken: "refresh_456",
        email: email.trim(),
        expiry: Date.now() + (7 * 24 * 60 * 60 * 1000)
      };

      await saveSession(session);
      setError('');
      hasError.value = false;
      setIsLoggedIn(true);

    } catch(err){
      console.log("Login error:", err);
      setError("Something went wrong. Try again.");
      triggerShake();
    }
  };

    return(
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
      <ScrollView
         style={{ backgroundColor: '#fff' }}
         contentContainerStyle={{flexGrow:1,paddingBottom:60}}
         keyboardShouldPersistTaps="handled"
         showsVerticalScrollIndicator={false}
         >
          <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="person-circle-outline" size={56} color="#185FA5" />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue </Text>
          </View>

          {/* Email Input  */}
          <Text style={styles.label}>Email</Text>
          <Animated.View style={[styles.inputWrapper, shakeStyle]}>
            <Ionicons name="mail-outline" size={18} color="#888780" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#888780"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </Animated.View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <Animated.View style={[styles.inputWrapper, shakeStyle]}>
            <Ionicons name="lock-closed-outline" size={18} color="#888780" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888780"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#888780" style={styles.inputIcon} />
            </TouchableOpacity>
          </Animated.View>

          {error ? (
            <Text style={{ color: '#E24B4A', marginBottom: 10, marginLeft: 23 }}>
              {error}
            </Text>
          ) : null}

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forget password?</Text>
          </TouchableOpacity>

          {/* Sign in */}
          <TouchableOpacity style={styles.signInBtn} onPress={handleLogin}>
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-github" size={20} color="#1a1a1a" />
              <Text style={styles.socialText}>GitHub</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>No account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'#fff',
    paddingTop:60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title:{
    fontSize:24,
    fontWeight:'600',
    color:'#1a1a1a',
    marginTop:12,
  },
  subtitle:{
    fontSize:14,
    color:'#888780',
    marginTop:4,
  },
  label:{
    fontSize:13,
    color:'#444441',
    fontWeight:'500',
    marginBottom:19,
    marginLeft:23,
    marginTop:8,
  },
  inputWrapper:{
    flexDirection:'row',
    alignItems:'center',
    borderRadius:10,
    marginBottom:14,
    paddingHorizontal:20,
    padding:5,
    marginLeft:23,
    marginRight:23,
    borderWidth:1,
  },
  inputIcon:{
    marginRight:8,
  },
  input:{
    flex:1,
    height:48,
    fontSize:15,
    color:'#1a1a1a',
  },
  forgotBtn:{
    alignSelf:'flex-end',
    marginBottom:20,
    marginRight:7,
  },
  forgotText:{
    fontSize:13,
    color:'#185FA5',
  },
  signInBtn: {
    backgroundColor: '#185FA5',
    borderRadius: 10,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    marginLeft:15,
    marginRight:15,
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft:20,
    marginRight:20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D3D1C7',
  },
  dividerText: {
    fontSize: 12,
    color: '#888780',
    marginHorizontal: 10,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D3D1C7',
    borderRadius: 10,
    height: 46,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#888780',
  },
  signUpLink: {
    fontSize: 14,
    color: '#185FA5',
    fontWeight: '600',
  },
});