import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';


// SAFE KEY GENERATOR

const makeImageKey = (email) => {
  if (!email) throw new Error("Email required for image key");

  return "avatar_" + email.toLowerCase().replace(/[^a-z0-9]/g, "_");
};


//  REQUEST PERMISSION

export const requestMediaPermission = async () => {
  if (Platform.OS !== 'android') return true;

           const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
           Alert.alert(
          'Permission Required',
          'Please allow photo access in your device settings.'
         );
    return false;
  }

  return true;
};


// PICK IMAGE FROM GALLERY


export const pickImage = async () => {
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1], // square
    quality: 0.7,
  });

  if (result.canceled) return null;

  return result.assets[0]; // { uri, width, height }
};


//  TAKE PHOTO


export const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert('Camera permission required');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled) return null;

  return result.assets[0];
};

// ─────────────────────────────────────────────
// 💾 SAVE IMAGE LOCALLY + SECURE STORE
// ─────────────────────────────────────────────

export const saveImageLocally = async (uri, email) => {
  if (!uri || !email) {
    throw new Error("URI and email required");
  }

  const fileName =
    "avatar_" +
    email.toLowerCase().replace(/[^a-z0-9]/g, "_") +
    ".jpg";

  const destPath = FileSystem.documentDirectory + fileName;

  // Check source exists
  const srcInfo = await FileSystem.getInfoAsync(uri);
  if (!srcInfo.exists) {
    throw new Error("Source image not found: " + uri);
  }

  // Delete old file if exists
  const destInfo = await FileSystem.getInfoAsync(destPath);
  if (destInfo.exists) {
    await FileSystem.deleteAsync(destPath, { idempotent: true });
  }

  // Copy image
  await FileSystem.copyAsync({ from: uri, to: destPath });

  // Save path in SecureStore
  const key = makeImageKey(email);
  await SecureStore.setItemAsync(key, destPath);

  return destPath;
};

// ─────────────────────────────────────────────
// 📂 GET SAVED IMAGE
// ─────────────────────────────────────────────

export const getSavedImage = async (email) => {
  const key = makeImageKey(email);

  const path = await SecureStore.getItemAsync(key);
  if (!path) return null;

  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
};

// ─────────────────────────────────────────────
// 🗑️ DELETE IMAGE
// ─────────────────────────────────────────────

export const deleteImage = async (email) => {
  const key = makeImageKey(email);

  const path = await SecureStore.getItemAsync(key);

  if (path) {
    await FileSystem.deleteAsync(path, { idempotent: true });
    await SecureStore.deleteItemAsync(key);
  }
};
