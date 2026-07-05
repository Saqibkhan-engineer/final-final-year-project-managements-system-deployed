import { useState, useEffect } from "react";
import "./App.css";
import React from "react";
import { Login } from "./components/login";
import { StudentDashboard } from "./components/StudentDashboard";
import { OfficeDashboard } from "./components/fypofficeDashboard";
import { SupervisorDashboard } from "./components/supervisorDashboard";
import { AdminDashboard } from "./components/adminDashboard";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [userData, setUserData] = useState(null);

  // Check for existing session on mount
  // sessionStorage = tab-isolated (default), localStorage = persisted (Remember Me)
  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const roleMap = {
          'student': 'student',
          'pec': 'office',
          'supervisor': 'supervisor',
          'admin': 'admin'
        };
        setCurrentUser(roleMap[user.role] || 'student');
        setActiveRole(roleMap[user.role] || 'student');
        setUserData(user);
      } catch (e) {
        console.error('Failed to parse saved user');
        sessionStorage.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
      }
    }
  }, []);



  const handleLogin = (userType, user) => {
    setCurrentUser(userType);
    setActiveRole(userType);
    setUserData(user);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    setCurrentUser(null);
    setActiveRole(null);
    setUserData(null);
  };

  if (!activeRole) {
    return <Login onLogin={handleLogin} />;
  }

  if (activeRole === "student") {
    return (
      <StudentDashboard
        user={userData}
        onLogout={handleLogout}
      />
    );
  }

  if (activeRole === "office") {
    return (
      <OfficeDashboard
        user={userData}
        originalRole={currentUser}
        onSwitchRole={setActiveRole}
        onLogout={handleLogout}
      />
    );
  }

  if (activeRole === "supervisor") {
    return (
      <SupervisorDashboard
        user={userData}
        originalRole={currentUser}
        onSwitchRole={setActiveRole}
        onLogout={handleLogout}
      />
    );
  }

  if (activeRole === "admin") {
    return (
      <AdminDashboard
        user={userData}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}

export default App;
