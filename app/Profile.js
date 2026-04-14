import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, Alert, ActivityIndicator, Modal
} from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { clearSession, getUser, getSession } from './authStorage';
import { saveImageLocally, getSavedImage } from './mediaStorage';
import * as ImagePicker from 'expo-image-picker';

export default function Profile({ setIsLoggedIn }) {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const scale = useSharedValue(1);
  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = e.scale; })
    .onEnd(() => { scale.value = withSpring(1); });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const session = await getSession();
    if (session?.email) {
      const userData = await getUser(session.email);
      setUser(userData);
      const savedAvatar = await getSavedImage(session.email);
      if (savedAvatar) setAvatar(savedAvatar + '?t=' + Date.now());
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      "Change Photo",
      "Choose an option",
      [
        { text: "Camera", onPress: handleCamera },
        { text: "Gallery", onPress: handleGallery },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // ✅ FIXED handleCamera
  const handleCamera = async () => {
    const { status: existing } = await ImagePicker.getCameraPermissionsAsync();
    let finalStatus = existing;

    if (existing === 'undetermined') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        "Permission Required",
        "Camera access is needed. Please enable it in your device settings."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  // ✅ FIXED handleGallery
  const handleGallery = async () => {
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    let finalStatus = existing;

    if (existing === 'undetermined') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        "Permission Required",
        "Gallery access is needed. Please enable it in your device settings."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri) => {
    setUploading(true);
    try {
      const session = await getSession();
      if (!session?.email) {
        Alert.alert("Error", "Session not found. Please log in again.");
        return;
      }
      const savedPath = await saveImageLocally(uri, session.email);
      setAvatar(savedPath + '?t=' + Date.now());
    } catch (err) {
      console.log("Upload error:", err);
      Alert.alert("Error", "Failed to save photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    setIsLoggedIn(false);
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "?";

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scroll}>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAvatarModal(true)}>
              {uploading ? (
                <View style={styles.avatar}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleChangePhoto} style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{user?.name || "—"}</Text>
          <Text style={styles.role}>Mobile Developer</Text>
        </View>

        <Text style={styles.sectionTitle}>Account info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#534AB7" />
            <Text style={styles.infoLabel}>Full name</Text>
            <Text style={styles.infoValue}>{user?.name || "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color="#534AB7" />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#534AB7" />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || "—"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#E24B4A" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Modal
          visible={showAvatarModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAvatarModal(false)}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.modalCloseArea}
                activeOpacity={1}
                onPress={() => setShowAvatarModal(false)}
              >
                <GestureDetector gesture={pinch}>
                  <Animated.View style={animatedStyle}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.modalAvatarImage} />
                    ) : (
                      <Text style={styles.modalAvatarText}>{initials}</Text>
                    )}
                  </Animated.View>
                </GestureDetector>
              </TouchableOpacity>
            </View>
          </GestureHandlerRootView>
        </Modal>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  headerBar: { alignItems: 'center', paddingTop: 50, paddingBottom: 8 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#AFA9EC',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarText: { fontSize: 28, fontWeight: '500', color: '#3C3489' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#534AB7',
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#f7f7f7',
  },
  name: { fontSize: 18, fontWeight: '500' },
  role: { fontSize: 13, color: '#999', marginTop: 4 },
  sectionTitle: {
    fontSize: 12, fontWeight: '500',
    color: '#aaa', marginBottom: 8, marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#e5e5e5', marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 13, borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0', gap: 12,
  },
  infoLabel: { flex: 1, fontSize: 13 },
  infoValue: { fontSize: 13, color: '#999' },
  logoutBtn: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#F09595',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    padding: 14, marginBottom: 20,
  },
  logoutText: { fontSize: 14, fontWeight: '500', color: '#E24B4A' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCloseArea: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  modalAvatarImage: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 4, borderColor: '#fff',
  },
  modalAvatarText: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#AFA9EC', textAlign: 'center',
    lineHeight: 220, fontSize: 70, fontWeight: '500',
    color: '#3C3489', borderWidth: 4, borderColor: '#fff',
    overflow: 'hidden',
  },
});