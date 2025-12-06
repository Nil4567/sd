import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Mail, KeyRound, Settings, Database, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { User, AppSettings } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onBack: () => void;
}

// Default Fallback Admin (Useful for first-time setup or offline)
const DEFAULT_ADMIN: User = {
  email: 'admin@siddhivinayak.com',
  name: 'System Admin',
  role: 'admin',
  password: 'admin123'
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Database Connection State
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [dbUrl, setDbUrl] = useState(() => {
    try {
      const saved = localStorage.getItem('app_settings');
      return saved ? (JSON.parse(saved).googleScriptUrl || '') : '';
    } catch { return ''; }
  });
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Load users from local storage on mount
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('app_users');
      if (savedUsers) {
        setAvailableUsers(JSON.parse(savedUsers));
      } else {
        setAvailableUsers([DEFAULT_ADMIN]);
      }
    } catch { setAvailableUsers([DEFAULT_ADMIN]); }
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchUsersFromCloud = async () => {
    if (!dbUrl || !dbUrl.startsWith('http')) {
      setError('Please enter a valid Web App URL (must start with http/https)');
      return;
    }
    
    setIsFetchingUsers(true);
    setError('');

    try {
      const response = await fetch(dbUrl);
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      if (data && data.users && Array.isArray(data.users) && data.users.length > 0) {
        // Map sheet rows to User objects
        const remoteUsers: User[] = data.users.map((row: any) => ({
          email: row[0],
          name: row[1],
          role: row[2],
          password: row[3]
        }));
        
        setAvailableUsers(remoteUsers);
        localStorage.setItem('app_users', JSON.stringify(remoteUsers));
        
        // Also save the URL to settings
        const currentSettings = localStorage.getItem('app_settings');
        const newSettings: AppSettings = currentSettings 
          ? { ...JSON.parse(currentSettings), googleScriptUrl: dbUrl }
          : { shopName: 'Siddhivinayak Digital', currencySymbol: '₹', googleScriptUrl: dbUrl };
        
        localStorage.setItem('app_settings', JSON.stringify(newSettings));
        
        setShowDbSettings(false);
        alert(`Successfully synced ${remoteUsers.length} users from cloud.`);
      } else {
        // If connected but no users returned, ensure Default Admin is preserved
        setError('Connected, but no users found. Default Admin is active.');
        if (!availableUsers.some(u => u.email === DEFAULT_ADMIN.email)) {
             setAvailableUsers(prev => [...prev, DEFAULT_ADMIN]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'Failed to fetch' ? 'Failed to fetch. Check internet or script permissions.' : 'Failed to connect. Check URL.');
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      
      // Check credentials against available users
      const foundUser = availableUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (foundUser) {
        if (foundUser.password === password) {
          onLoginSuccess(foundUser);
        } else {
          setError('Incorrect password.');
        }
      } else {
        // Fallback check for Default Admin if list is empty or wiped
        if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
           onLoginSuccess(DEFAULT_ADMIN);
        } else {
           setError('User not found. Ask Admin to assign you rights.');
        }
      }
    }, 800);
  };

  if (showDbSettings) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
         <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100">
               <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <Database className="text-primary-600" />
                  <h3 className="text-lg font-bold text-slate-900">Connect Database</h3>
               </div>
               <p className="text-sm text-slate-500 mb-4">
                 Enter the Google Web App URL to fetch the authorized user list.
               </p>
               <div className="space-y-4">
                  <input
                    type="text"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowDbSettings(false)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={fetchUsersFromCloud}
                      disabled={isFetchingUsers}
                      className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 flex justify-center items-center gap-2"
                    >
                      {isFetchingUsers ? 'Syncing...' : 'Sync Users'}
                    </button>
                  </div>
                  {error && <p className="text-red-600 text-xs text-center mt-2">{error}</p>}
               </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        
      {/* Clock in Top Right */}
      <div className="absolute top-4 right-4 text-xs font-mono text-slate-400 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
          <Clock size={12} />
          {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative">
        <button 
          onClick={onBack}
          className="absolute left-0 top-0 -mt-16 flex items-center text-slate-400 hover:text-slate-900 transition-colors font-medium text-sm group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 shadow-sm group-hover:border-slate-400">
             <ArrowLeft className="w-4 h-4" /> 
          </div>
          Back
        </button>

        <button 
          onClick={() => setShowDbSettings(true)}
          className="absolute right-0 top-0 -mt-16 flex items-center text-slate-400 hover:text-primary-600 transition-colors"
          title="Connect Database"
        >
          <Settings className="w-5 h-5" />
        </button>
        
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/30 transform -rotate-3 mb-6">
          <KeyRound className="h-8 w-8 text-white" />
        </div>
        
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          Staff Dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Secure Access Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-white ring-1 ring-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Authorized Email ID
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-11 sm:text-sm border-slate-300 rounded-xl p-3 transition-all"
                  placeholder="name@gmail.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-11 sm:text-sm border-slate-300 rounded-xl p-3 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 font-medium animate-fade-in">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/30 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all transform active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Verifying Rights...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-slate-400">
                Default Admin: <span className="font-mono">admin@siddhivinayak.com</span> / <span className="font-mono">admin123</span>
            </p>
             <p className="text-xs text-slate-400">
                Protected by RBAC Security
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;