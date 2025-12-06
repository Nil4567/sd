import React, { useState } from 'react';
import { ViewState, User } from './types';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(ViewState.HOME);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <LandingPage onNavigateLogin={() => setCurrentView(ViewState.LOGIN)} />;
      case ViewState.LOGIN:
        return (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess} 
            onBack={() => setCurrentView(ViewState.HOME)} 
          />
        );
      case ViewState.DASHBOARD:
        return (
          <Dashboard 
            currentUser={currentUser} 
            onLogout={handleLogout} 
          />
        );
      default:
        return <LandingPage onNavigateLogin={() => setCurrentView(ViewState.LOGIN)} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {renderView()}
    </div>
  );
};

export default App;