import React, { useEffect } from 'react';
import { Animated, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Reanimated, { FadeOutRight, Layout } from 'react-native-reanimated';
import { sendLocalNotification, cancelNotification } from './notificationService';

export default function Tasks({ tasks, setTasks }) {

  useEffect(() => {
    const pending = tasks.filter(t => !t.done).length;
    if (pending === 0 && tasks.length > 0) {
      sendLocalNotification(
        '🏆 All Done!',
        'You completed all your tasks. Amazing work!',
        { screen: 'Home' }
      );
    }
  }, [tasks]);

  const toggleTask = (id, index) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.done) {
      // Mark as done -> cancel reminder
      if (task.notificationId) {
        cancelNotification(task.notificationId);
      }
      sendLocalNotification(
        '✅ Task Completed!', 
        `"${task.title}" marked as done. Great job!`,
        { screen: 'Tasks' }
      );
    }
    setTasks(tasks.map((t, i) => {
      if ((t.id && t.id === id) || (!t.id && i === index)) {
        return { ...t, done: !t.done };
      }
      return t;
    }));
  };

  const deleteTask = (id, index) => {
    const task = tasks.find((t, i) => (t.id && t.id === id) || (!t.id && i === index));
    if (task && task.notificationId) {
      cancelNotification(task.notificationId);
    }
    setTasks(tasks.filter((t, i) => !((t.id && t.id === id) || (!t.id && i === index))));
  };

  const renderLeftActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [0, 50],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.deleteAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </Animated.View>
      </View>
    );
  };

  function renderTask({ item, index }) {
    return (
      <Reanimated.View
        exiting={FadeOutRight}
        layout={Layout.springify().damping(14)}
      >
        <Swipeable
          renderLeftActions={renderLeftActions}
          onSwipeableOpen={() => deleteTask(item.id, index)}
          overshootLeft={false}
        >
          <View style={styles.taskRow}>
            <Ionicons
              name={item.done ? 'checkmark-circle' : 'time-outline'}
              size={18}
              color={item.done ? '#0F6E56' : '#E24B4A'}
            />
            <Text style={styles.taskTitle}>{item.title || item.text}</Text>
            <TouchableOpacity onPress={() => toggleTask(item.id, index)}>
              <Text style={item.done ? styles.taskTag : styles.pending}>
                {item.done ? 'Done' : 'Pending...'}
              </Text>
            </TouchableOpacity>
          </View>
        </Swipeable>
      </Reanimated.View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.SectionTitle}>Tasks</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks yet</Text>
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: 8 }} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: 50,
  },
  list: {
    padding: 16,
  },
  SectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#aaa',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 40,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
    gap: 10,
  },
  deleteAction: {
    backgroundColor: '#E24B4A',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    borderRadius: 10,
    marginRight: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 13,
    color: '#1a1a1a',
  },
  taskTag: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: '#E1F5EE',
    color: '#085041',
  },
  pending: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: '#F09595',
    color: '#A32D2D',
  },
});