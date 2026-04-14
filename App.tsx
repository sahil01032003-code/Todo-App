import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import Login from './app/Login';
import Dashboard from './app/Dashboard';
import Tasks from './app/tasks';
import Profile from './app/Profile';
import SignUp from './app/SignUp';
import { getSession } from './app/authStorage';
import { registerForPushNotification } from './app/notificationService';
import {  scheduleNotification } from './app/notificationService';
import {  setupNotificationCategories } from './app/notificationService';



const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
   handleNotification: async () => ({
       shouldShowAlert:true,
       shouldShowBanner:true,
       shouldShowList:true,
       shouldPlaySound:true,
       shouldSetBadge:true,
       }),
});

function TabNavigator({ tasks, setTasks, setIsLoggedIn }: any) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e5e5',
          borderTopWidth: 0.5,
          paddingVertical: 10,
          height: 60,
        },
        tabBarActiveTintColor: '#534AB7',
        tabBarInactiveTintColor: '#aaa',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ focused, color }: any) => {
          const icons: any = {
            Home:    focused ? 'home'      : 'home-outline',
            Tasks:   focused ? 'clipboard' : 'clipboard-outline',
            Profile: focused ? 'person'    : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {(props) => <Dashboard {...props} tasks={tasks} setTasks={setTasks} />}
      </Tab.Screen>
      <Tab.Screen name="Tasks">
        {(props) => <Tasks {...props} tasks={tasks} setTasks={setTasks} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(props) => <Profile {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
const DAILY_CHECKIN_TITLE = '📋 Daily check-in';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const navigationRef = useRef<any>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {

    const checkSession = async () => {
      const session = await getSession();
     setIsLoggedIn(!!(session && Date.now()< session.expiry));
     };
    checkSession();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

     const initNotification=async()=>{

           await setupNotificationCategories();
                await registerForPushNotification();

           // Guard :only  schedule if not already scheduled

         const scheduled = await Notifications.getAllScheduledNotificationsAsync();

          // ✅ FIX 5: title now uses the constant — guard will actually work
                const alreadyScheduled = scheduled.some(
                  (n) => n.content.title === DAILY_CHECKIN_TITLE
                );

           if(!alreadyScheduled){
               await scheduleNotification(
                   DAILY_CHECKIN_TITLE,
                   'You have pending tasks waiting. Tap to review ',
                     5,        // seconds (use 86400 for real daily)
                     false, // repeate
                     {screen:'Tasks'}  // data payload for navigation

                   );
               }
         };

   initNotification();



    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification.request.content);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (navigationRef.current?.isReady()) {
          if (data?.screen === 'Tasks') {
            navigationRef.current.navigate('Tabs', { screen: 'Tasks' });
          } else if (data?.screen === 'Home') {
            navigationRef.current.navigate('Tabs', { screen: 'Home' });
          }
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isLoggedIn]);

  if (isLoggedIn === null) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <Stack.Screen name="Tabs">
              {(props) => (
                <TabNavigator
                  {...props}
                  tasks={tasks}
                  setTasks={setTasks}
                  setIsLoggedIn={setIsLoggedIn}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Login">
                {(props) => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
              </Stack.Screen>
              <Stack.Screen name="SignUp">
                {(props) => <SignUp {...props} setIsLoggedIn={setIsLoggedIn} />}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}