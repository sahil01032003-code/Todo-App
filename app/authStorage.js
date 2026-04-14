 //import *as Keychain from 'react-native-keychain';
import * as SecureStore from 'expo-secure-store';

const makeKey = (email) => {
  if (!email) {
    throw new Error("Invalid email for key");
  }

  return (
    "user_" +
    email
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
  );
};




// 🔐 SESSION

export const saveSession = async (session) => {
  await SecureStore.setItemAsync("session", JSON.stringify(session));
};

export const getSession = async () => {
  const data = await SecureStore.getItemAsync("session");
  return data ? JSON.parse(data) : null;
};

export const clearSession = async () => {
  await SecureStore.deleteItemAsync("session");
};

// userdaTa -> secure Store

export const saveUser=async(userData)=>{
const key = makeKey(userData.email);
await SecureStore.setItemAsync(key,JSON.stringify(userData));
};

export const getUser=async(email)=>{
 const key = makeKey(email);
const data=await SecureStore.getItemAsync(key);
return data ? JSON.parse(data) :null;
};

export const clearUser=async(email)=>{
//const key="user_"+email;
 const key = makeKey(email); // ✅ FIX HERE
await SecureStore.deleteItemAsync(key);
};