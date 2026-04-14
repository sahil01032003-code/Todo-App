import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { saveUser } from './authStorage';


export default function SignUp({ navigation }: any) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigation.replace("Login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);


  async function getLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert("permission denied");
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});

    // convert coordinates -> address
    let address = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    if (address.length > 0) {
      const place = `${address[0].city || address[0].subregion || address[0].district}, ${address[0].region}`;
      handleChange("location", place);
    }

    const coords = `${loc.coords.latitude},${loc.coords.longitude}`;



  }


  function handleChange(field: string, value: string) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleBlur(field: string) {
    const validationErrors = validate(form);
    setErrors((prev: any) => ({ ...prev, [field]: validationErrors[field] }));
  }

  function validate(data: any) {
    let err: any = {};
    if (!data.name.trim()) err.name = "Name is required";
    if (!data.email) {
      err.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      err.email = "Invalid email address";
    }
    if (!data.phone) {
      err.phone = "Phone is required";
    } else if (!/^[0-9]{10}$/.test(data.phone)) {
      err.phone = "Enter valid 10-digit number";
    }

    if (!data.location) {
      err.location = "Location is required";
    }

    if (data.password.length < 6) err.password = "Min 6 characters";
    if (data.confirmPassword !== data.password)
      err.confirmPassword = "Passwords do not match";
    return err;
  }

  async function handleSubmit() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const userData = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          location: form.location,
        };
        await saveUser(userData);

        setLoading(false);
        setSuccess(true);
      } catch (error) {
        console.log("Error:", error);
        setLoading(false);
      }
    } else {
      setErrors(validationErrors);
    }
  }

  // ✅ Success UI
  if (success) {
    return (
      <View style={styles.center}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
        <Text style={styles.successText}>Account Created!</Text>
        <Text style={styles.successSub}>Redirecting to login...</Text>
      </View>
    );
  }

  // ✅ Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#185FA5" />
        <Text style={styles.loadingText}>Creating your account...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
      <ScrollView
        style={{ backgroundColor: '#fff' }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="person-add-outline" size={56} color="#185FA5" />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Fill in your details to get started</Text>
          </View>

          {/* Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
            <Ionicons name="person-outline" size={18} color="#888780" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor="#888780"
              value={form.name}
              onChangeText={(text) => handleChange("name", text)}
              onBlur={() => handleBlur("name")}
            />
          </View>
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={18} color="#888780" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#888780"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(text) => handleChange("email", text)}
              onBlur={() => handleBlur("email")}
            />
          </View>
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          {/* Phone */}
          <Text style={styles.label}>Phone</Text>
          <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
            <Ionicons name="call-outline" size={18} color="#888780" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="10-digit phone number"
              placeholderTextColor="#888780"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => handleChange("phone", text)}
              onBlur={() => handleBlur("phone")}
            />
          </View>
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

          {/* Location  */}

          <Text style={styles.label}>Location</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={18} color="#888780" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your location"
              placeholderTextColor="#888780"
              value={form.location}
               onChangeText={(text) => handleChange("location", text)}
            />
            <TouchableOpacity onPress={getLocation}>
              <Ionicons name="location-outline" size={28} color="#185FA5" />
            </TouchableOpacity>
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={18} color="#888780" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor="#888780"
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(text) => handleChange("password", text)}
              onBlur={() => handleBlur("password")}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#888780"
                style={styles.inputIcon}
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.error}>{errors.password}</Text>}

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#888780" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor="#888780"
              secureTextEntry={!showConfirm}
              value={form.confirmPassword}
              onChangeText={(text) => handleChange("confirmPassword", text)}
              onBlur={() => handleBlur("confirmPassword")}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons
                name={showConfirm ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#888780"
                style={styles.inputIcon}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.error}>{errors.confirmPassword}</Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.submitText}>Create Account</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#888780",
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    color: "#444441",
    fontWeight: "500",
    marginBottom: 6,
    marginLeft: 23,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D3D1C7",
    borderRadius: 10,
    marginBottom: 4,
    paddingHorizontal: 20,
    padding: 5,
    marginLeft: 23,
    marginRight: 23,
    borderWidth: 1,
  },
  inputError: {
    borderColor: "#E24B4A",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#1a1a1a",
  },
  error: {
    color: "#E24B4A",
    fontSize: 12,
    marginLeft: 23,
    marginBottom: 6,
  },
  submitBtn: {
    backgroundColor: "#185FA5",
    borderRadius: 10,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 24,
    marginLeft: 15,
    marginRight: 15,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#888780",
  },
  loginLink: {
    fontSize: 14,
    color: "#185FA5",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#185FA5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  successSub: {
    marginTop: 8,
    fontSize: 14,
    color: "#888780",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888780",
  },
});