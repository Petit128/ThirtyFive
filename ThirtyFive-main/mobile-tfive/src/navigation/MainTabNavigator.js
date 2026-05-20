import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Imports des écrans principaux
import StudentDashboardScreen from '../Student/DashboardScreen';
import ProfessorDashboardScreen from '../Professor/ProfessorDashboardScreen';
import AdminDashboardScreen from '../Admin/AdminDashboardScreen';
import StudentQuizScreen from '../Student/QuizScreen';
import StudentGradesScreen from '../Student/GradesScreen';
import StudentForumScreen from '../Student/ForumScreen';
import TopicDetailScreen from '../Student/TopicDetailScreen';
import CreateLessonScreen from '../Professor/CreateLessonScreen';
import CreateQuizScreen from '../Professor/CreateQuizScreen';
import GradeStudentsScreen from '../Professor/GradeStudentsScreen';
import QuizResponsesScreen from '../Professor/QuizResponsesScreen';
import UploadFileScreen from '../Professor/UploadFileScreen';
import ManageUsersScreen from '../Admin/ManageUsersScreen';
import ManageFilesScreen from '../Admin/ManageFilesScreen';
import PendingFilesScreen from '../Admin/PendingFilesScreen';
import AdminUploadFileScreen from '../Admin/UploadFileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LessonViewerScreen from '../Student/LessonViewerScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack pour les leçons
function LessonsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LessonsList" component={StudentDashboardScreen} />
      <Stack.Screen name="LessonViewer" component={LessonViewerScreen} />
    </Stack.Navigator>
  );
}

// Stack pour les quiz
function QuizStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QuizList" component={StudentQuizScreen} />
    </Stack.Navigator>
  );
}

// Stack pour les notes
function GradesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GradesList" component={StudentGradesScreen} />
    </Stack.Navigator>
  );
}

// Stack pour le forum
function ForumStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ForumList" component={StudentForumScreen} />
      <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
    </Stack.Navigator>
  );
}

// Stack pour les notifications
function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsList" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

// Stack pour le profil
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Stack pour le professeur
function ProfessorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfessorDashboard" component={ProfessorDashboardScreen} />
      <Stack.Screen name="CreateLesson" component={CreateLessonScreen} />
      <Stack.Screen name="CreateQuiz" component={CreateQuizScreen} />
      <Stack.Screen name="GradeStudents" component={GradeStudentsScreen} />
      <Stack.Screen name="LessonViewer" component={LessonViewerScreen} />
      <Stack.Screen name="QuizResponses" component={QuizResponsesScreen} />
      <Stack.Screen name="UploadFile" component={UploadFileScreen} />
    </Stack.Navigator>
  );
}

// Stack pour l'admin
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
      <Stack.Screen name="ManageFiles" component={ManageFilesScreen} />
      <Stack.Screen name="PendingFiles" component={PendingFilesScreen} />
      <Stack.Screen name="AdminUploadFile" component={AdminUploadFileScreen} />
    </Stack.Navigator>
  );
}

export default function MainTabNavigator() {
  const { isStudent, isProfessor, isAdmin } = useAuth();

  const getTabScreens = () => {
    const screens = [];

    // Dashboard (principal) - selon le rôle
    if (isStudent) {
      screens.push(
        <Tab.Screen 
          key="dashboard"
          name="Accueil" 
          component={LessonsStack}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
    } else if (isProfessor) {
      screens.push(
        <Tab.Screen 
          key="dashboard"
          name="Dashboard" 
          component={ProfessorStack}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="school" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
    } else if (isAdmin) {
      screens.push(
        <Tab.Screen 
          key="dashboard"
          name="Dashboard" 
          component={AdminStack}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="shield" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
    }

    // Quiz (étudiant uniquement)
    if (isStudent) {
      screens.push(
        <Tab.Screen 
          key="quiz"
          name="Quiz" 
          component={QuizStack}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="help-circle" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
    }

    // Notes (étudiant uniquement)
    if (isStudent) {
      screens.push(
        <Tab.Screen 
          key="grades"
          name="Notes" 
          component={GradesStack}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="stats-chart" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
    }

    // Forum (tous les utilisateurs)
    screens.push(
      <Tab.Screen 
        key="forum"
        name="Forum" 
        component={ForumStack}
        options={{ 
          tabBarIcon: ({ color, size }) => <Icon name="chatbubbles" size={size} color={color} />,
          headerShown: false
        }}
      />
    );

    // Notifications (tous les utilisateurs)
    screens.push(
      <Tab.Screen 
        key="notifications"
        name="Notifs" 
        component={NotificationsStack}
        options={{ 
          tabBarIcon: ({ color, size }) => <Icon name="notifications" size={size} color={color} />,
          headerShown: false
        }}
      />
    );

    // Actions professeur
    if (isProfessor) {
      screens.push(
        <Tab.Screen 
          key="create-lesson"
          name="Créer Leçon" 
          component={CreateLessonScreen}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="add-circle" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
      screens.push(
        <Tab.Screen 
          key="create-quiz"
          name="Créer Quiz" 
          component={CreateQuizScreen}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="create" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
      screens.push(
        <Tab.Screen 
          key="grade-students"
          name="Noter" 
          component={GradeStudentsScreen}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="document-text" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
      screens.push(
        <Tab.Screen 
          key="upload-file"
          name="Upload" 
          component={UploadFileScreen}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="cloud-upload" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
    }

    // Actions admin
    if (isAdmin) {
      screens.push(
        <Tab.Screen 
          key="manage-users"
          name="Utilisateurs" 
          component={ManageUsersScreen}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="people" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
      screens.push(
        <Tab.Screen 
          key="manage-files"
          name="Fichiers" 
          component={ManageFilesScreen}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="folder" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
      screens.push(
        <Tab.Screen 
          key="pending-files"
          name="En attente" 
          component={PendingFilesScreen}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="hourglass" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
      screens.push(
        <Tab.Screen 
          key="admin-upload"
          name="Upload" 
          component={AdminUploadFileScreen}
          options={{ 
            tabBarIcon: ({ color, size }) => <Icon name="cloud-upload" size={size} color={color} />,
            headerShown: false
          }}
        />
      );
    }

    // Profil (tous)
    screens.push(
      <Tab.Screen 
        key="profile"
        name="Profil" 
        component={ProfileStack}
        options={{ 
          tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
          headerShown: false
        }}
      />
    );

    return screens;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#646cff',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: 'rgba(100, 108, 255, 0.2)',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTitleStyle: {
          color: '#fff',
        },
      }}
    >
      {getTabScreens()}
    </Tab.Navigator>
  );
}