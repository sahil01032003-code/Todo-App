import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getSession, getUser } from './authStorage';
import { getSavedImage } from './mediaStorage';
import { sendLocalNotification, scheduleNotification } from './notificationService';
import * as Notifications from 'expo-notifications';

export default function Dashboard({ navigation, tasks, setTasks }) {

  const [showInput, setShowInput] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [userName, setUserName] = useState('');

  async function addTask() {
    if (taskText.trim() === '') return;
    const taskId = Date.now().toString();
    
    // 1. Schedule repeating reminder (every 60 seconds)
    const notificationId = await scheduleNotification(
      '⏰ Task Reminder',
      `Don't forget: "${taskText.trim()}"`,
      60,
      true, // ✅ repeats every 60s
      { taskId }
    );

    // 2. Create and set task
    const newTask = { 
      id: taskId, 
      title: taskText.trim(), 
      done: false,
      notificationId // ✅ store it so we can cancel it later
    };
    setTasks([newTask, ...tasks]);

    // 3. Simple confirmation notification (immediate)
    sendLocalNotification(
      '📝 Task Added',
      `"${taskText.trim()}" has been added to your list`,
      { taskId }
    );

    setTaskText('');
    setShowInput(false);
  }

  const scale = useSharedValue(1);
  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = e.scale; })
    .onEnd(() => { scale.value = withSpring(1); });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        const session = await getSession();
        if (session?.email) {
          const userData = await getUser(session.email);
          if (userData?.name) {
            setUserName(userData.name);
          }
          const img = await getSavedImage(session.email);
          if (img) setAvatar(img + '?t=' + Date.now());
        }
      };
      loadUserData();
    }, [])
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const pendingTasks = tasks.filter(t => !t.done).length;

  const initials = userName
    ? userName.split(" ").map(n => n[0]).join("").toUpperCase()
    : "SK";

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 10 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello {userName || 'User'}</Text>
            <Text style={styles.sub}>{todayDateStr}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.7}
            onPress={() => setShowAvatarModal(true)}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 42, height: 42, borderRadius: 21 }} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Tasks')}>
            <Ionicons name="clipboard-outline" size={24} color="#534AB7" />
            <Text style={styles.cardNum}>{totalTasks}</Text>
            <Text style={styles.cardLb1}>Tasks</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Ionicons name="cash-outline" size={24} color="#0F6E56" />
            <Text style={styles.cardNum}>$12k</Text>
            <Text style={styles.cardLb1}>Earning</Text>
          </View>

          <View style={styles.card}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color="#185FA5" />
            <Text style={styles.cardNum}>{completedTasks}</Text>
            <Text style={styles.cardLb1}>Completed</Text>
          </View>

          <View style={styles.card}>
            <Ionicons name="time-outline" size={24} color="#E24B4A" />
            <Text style={styles.cardNum}>{pendingTasks}</Text>
            <Text style={styles.cardLb1}>Pending</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.fullcard}
          onPress={() => setShowInput(!showInput)}
          activeOpacity={0.8}
        >
          <View style={styles.addTaskRow}>
            <Ionicons name="add-circle-outline" size={24} color="#534AB7" />
            <Text style={styles.SectionTitle}>Add New Task</Text>
          </View>

          {showInput && (
            <View onStartShouldSetResponder={() => true}>
              <TextInput
                style={styles.taskInput}
                placeholder="Write your task here..."
                placeholderTextColor="#aaa"
                value={taskText}
                onChangeText={setTaskText}
                autoFocus={true}
              />
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.addBtn} onPress={addTask}>
                  <Text style={styles.addBtnText}>Add Task</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setShowInput(false); setTaskText(''); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 35,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1a1a1a',
    marginTop: 35,
  },
  sub: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#AFA9EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3489',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: '#fff',
  },
  modalAvatarText: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#AFA9EC',
    textAlign: 'center',
    lineHeight: 220,
    fontSize: 70,
    fontWeight: '500',
    color: '#3C3489',
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 30,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  fullcard: {
    width: '98%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 30,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
    marginTop: 12,
  },
  SectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#aaa',
    marginTop: 20,
    marginBottom: 10,
  },
  cardNum: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  cardLb1: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskInput: {
    borderWidth: 0.5,
    borderColor: '#D3D1C7',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#1a1a1a',
    backgroundColor: '#f7f7f7',
    marginTop: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  addBtn: {
    flex: 1,
    backgroundColor: '#534AB7',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  cancelBtnText: {
    color: '#aaa',
    fontSize: 13,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
    gap: 10,
  },
  taskTitle: {
    flex: 1,
    fontSize: 13,
    color: '#1a1a1a',
  },
  pendingTag: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: '#F09595',
    color: '#A32D2D',
  },
});