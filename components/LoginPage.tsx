import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Lock,
  Mail,
  KeyRound,
  Settings,
  Database,
  AlertCircle,
  Clock,
} from "lucide-react";

interface User {
  email: string;
  name: string;
  role: string;
  password: string;
}

const DEFAULT_ADMIN: User = {
  email: "admin@siddhivinayak.com",
  name: "System Admin",
  role: "admin",
  password: "admin123",
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [dbUrl, setDbUrl] = useState("");
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  const [availableUsers, setAvailableUsers] = useState<User[]>([
    DEFAULT_ADMIN,
  ]);

  // clock
  useEffect(() => {
    const timer = setInterval(
      () => setCurrentTime(new Date()),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);

      const user = availableUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) return setError("User not found");

      if (user.password !== password)
        return setError("Incorrect password");

      alert(`Login Success: Welcome ${user.name}`);
    }, 800);
  };

  // Database Settings Page
  if (showDbSettings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border">
          <div className="flex items-center gap-2 mb-4">
            <Database className="text-blue-600" />
            <h2 className="font-bold text-lg">Database Connection</h2>
          </div>

          <input
            className="w-full border p-3 rounded-xl text-sm"
            placeholder="https://google-script-url"
            value={dbUrl}
            onChange={e => setDbUrl(e.target.value)}
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowDbSettings(false)}
              className="flex-1 border rounded-xl py-2"
            >
              Back
            </button>

            <button
              disabled={isFetchingUsers}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2"
            >
              {isFetchingUsers ? "Syncing..." : "Sync Users"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN LOGIN UI
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4">
      
      {/* Time Badge */}
      <div className="absolute top-4 right-4 text-xs font-mono bg-white px-3 py-1.5 rounded-full shadow-sm border flex items-center gap-2">
        <Clock size={12} />
        {currentTime.toLocaleDateString()}{" "}
        {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <KeyRound className="text-white h-8 w-8" />
        </div>

        <h2 className="text-3xl font-bold text-slate-800">Staff Dashboard</h2>
        <p className="text-sm text-slate-500">Secure Access Portal</p>

        <button
          onClick={() => setShowDbSettings(true)}
          className="absolute right-4 top-4 text-slate-400 hover:text-blue-600"
        >
          <Settings />
        </button>
      </div>

      {/* Form */}
      <div className="mt-8 w-full max-w-md mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl border">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 border rounded-xl p-3"
                  placeholder="name@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 border rounded-xl p-3"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
            >
              {loading ? "Verifying..." : "Login"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-3">
          Default Admin: admin@siddhivinayak.com / admin123
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
