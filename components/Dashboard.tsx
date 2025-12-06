import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart as BarChartIcon, 
  Users, 
  FileText, 
  LogOut, 
  Plus, 
  Search, 
  CheckCircle, 
  Clock, 
  Settings as SettingsIcon,
  X,
  Save,
  Database,
  Copy,
  AlertTriangle,
  TrendingUp,
  Wallet,
  CloudUpload,
  RefreshCw,
  Info,
  Zap,
  DownloadCloud,
  UserPlus,
  Trash2,
  Shield,
  Briefcase,
  CreditCard,
  Banknote,
  AlertOctagon,
  Calendar,
  Flag
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Order, AppSettings, User } from '../types';

interface DashboardProps {
  currentUser: User | null;
  onLogout: () => void;
}

// --- SAMPLE DATA GENERATION ---

const defaultUsers: User[] = [
  { email: 'admin@siddhivinayak.com', name: 'System Admin', role: 'admin', password: 'admin123' },
  { email: 'rohan@siddhivinayak.com', name: 'Rohan Verma', role: 'staff', password: 'staff' },
  { email: 'priya@siddhivinayak.com', name: 'Priya Desai', role: 'staff', password: 'staff' },
  { email: 'amit@siddhivinayak.com', name: 'Amit Kumar', role: 'staff', password: 'staff' }
];

const generateSampleOrders = (): Order[] => {
  const today = new Date();
  const orders: Order[] = [];
  const services = ['Thesis Binding', 'A4 Color Print', 'Visiting Cards', 'Poster Printing', 'Lamination', 'Xerox Bulk', 'Project Design', 'Invitation Cards'];
  const priorities = ['Low', 'Medium', 'High'] as const;
  
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];
    
    const status = i < 8 ? 'Completed' : (i < 14 ? 'Processing' : 'Pending');
    const amount = Math.floor(Math.random() * 2000) + 50;
    const advance = Math.floor(amount * (Math.random() > 0.5 ? 0.5 : 0)); // 50% chance of advance
    
    // Assign to random user
    const assignee = defaultUsers[Math.floor(Math.random() * defaultUsers.length)].email;

    orders.push({
      id: `ORD-${1050 + i}`,
      customerName: `Customer ${i + 1}`,
      serviceType: services[Math.floor(Math.random() * services.length)],
      status: status as any,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      amount: amount,
      date: dateStr,
      assignedTo: assignee,
      advance: advance,
      paymentMode: advance > 0 ? (Math.random() > 0.5 ? 'Online' : 'Cash') : 'Pending',
      completedAt: status === 'Completed' ? new Date().toISOString() : undefined
    });
  }
  return orders;
};

const defaultSettings: AppSettings = {
  shopName: 'Siddhivinayak Digital',
  currencySymbol: '₹',
  googleScriptUrl: ''
};

const Dashboard: React.FC<DashboardProps> = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data State
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('app_orders');
      // If local storage has very few orders (old data), load sample data
      return (saved && JSON.parse(saved).length > 2) ? JSON.parse(saved) : generateSampleOrders();
    } catch { return generateSampleOrders(); }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('app_users');
      return (saved && JSON.parse(saved).length > 1) ? JSON.parse(saved) : defaultUsers;
    } catch { return defaultUsers; }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('app_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch { return defaultSettings; }
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('last_backup_time'));
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // New User State
  const [newUser, setNewUser] = useState<User>({ email: '', name: '', role: 'staff', password: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<{
    customerName: string;
    serviceType: string;
    amount: string;
    status: Order['status'];
    priority: Order['priority'];
    assignedTo: string;
    advance: string;
    paymentMode: Order['paymentMode'];
  }>({
    customerName: '',
    serviceType: '',
    amount: '',
    status: 'Pending',
    priority: 'Medium',
    assignedTo: currentUser?.email || '',
    advance: '',
    paymentMode: 'Cash'
  });
  const [isSaving, setIsSaving] = useState(false);

  // --- Logic (Unified Sync) ---

  const syncData = useCallback(async (silent = false) => {
    if (!settings.googleScriptUrl || !settings.googleScriptUrl.startsWith('http')) {
      if (!silent) setSyncError("Invalid URL. Check Settings.");
      return;
    }
    
    if (!silent) setIsFetching(true);
    setSyncError(null);

    try {
      // 1. PUSH (Backup)
      const pushPayload = {
        action: 'backup_all',
        orders: orders.map(o => ({ 
            id: o.id, 
            date: o.date, 
            customerName: o.customerName, 
            serviceType: o.serviceType, 
            amount: o.amount, 
            status: o.status, 
            assignedTo: o.assignedTo || '',
            advance: o.advance || 0,
            paymentMode: o.paymentMode || 'Pending',
            completedAt: o.completedAt || '',
            priority: o.priority || 'Medium'
        })),
        users: users.map(u => ({ email: u.email, name: u.name, role: u.role, password: u.password }))
      };

      await fetch(settings.googleScriptUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: {'Content-Type': 'text/plain'}, 
        body: JSON.stringify(pushPayload) 
      });

      // 2. PULL (Fetch Latest)
      await new Promise(r => setTimeout(r, 1500)); 

      const response = await fetch(settings.googleScriptUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      if (data) {
        if (data.orders && Array.isArray(data.orders)) {
          const remoteOrders: Order[] = data.orders.map((row: any) => ({
            id: row[0], 
            date: row[1], 
            customerName: row[2], 
            serviceType: row[3], 
            amount: Number(row[4]), 
            status: row[5], 
            assignedTo: row[6] || '',
            advance: Number(row[7]) || 0,
            paymentMode: row[8] || 'Pending',
            completedAt: row[9] || undefined,
            priority: row[10] || 'Medium'
          }));
          setOrders(remoteOrders);
        }
        if (data.users && Array.isArray(data.users)) {
          const remoteUsers: User[] = data.users.map((row: any) => ({
             email: row[0], name: row[1], role: row[2], password: row[3]
          }));
          setUsers(remoteUsers);
        }
      }

      const now = new Date().toLocaleTimeString();
      setLastSyncTime(now);
      localStorage.setItem('last_backup_time', now);
      if (!silent) console.log("Sync Complete");

    } catch (err: any) {
      console.error("Sync Error:", err);
      const msg = err.message === 'Failed to fetch' 
        ? 'Connection Failed. Check Internet.' 
        : 'Sync Failed. Server Error.';
      setSyncError(msg);
      if(!silent) alert(msg);
    } finally {
      if (!silent) setIsFetching(false);
    }
  }, [settings.googleScriptUrl, orders, users]);

  // --- Effects ---

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { localStorage.setItem('app_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('app_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('app_users', JSON.stringify(users)); }, [users]);

  useEffect(() => {
    if (settings.googleScriptUrl && settings.googleScriptUrl.startsWith('http')) {
      syncData(true);
    }
  }, []); 

  useEffect(() => {
    if (!settings.googleScriptUrl || !settings.googleScriptUrl.startsWith('http')) return;
    const autoSyncInterval = setInterval(() => {
      console.log("Auto-Syncing...");
      syncData(true);
    }, 600000); // 10 mins
    return () => clearInterval(autoSyncInterval);
  }, [syncData, settings.googleScriptUrl]); 

  // --- Handlers ---

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const advance = Number(newOrder.advance) || 0;
    const status = newOrder.status;
    
    const orderData: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newOrder.customerName,
      serviceType: newOrder.serviceType,
      amount: Number(newOrder.amount),
      status: status,
      priority: newOrder.priority,
      date: new Date().toISOString().split('T')[0],
      assignedTo: newOrder.assignedTo,
      advance: advance,
      paymentMode: advance > 0 ? newOrder.paymentMode : 'Pending',
      completedAt: status === 'Completed' ? new Date().toISOString() : undefined
    };
    
    setOrders(prev => [orderData, ...prev]);
    if (settings.googleScriptUrl) setTimeout(() => syncData(true), 500); 

    setIsSaving(false);
    setIsModalOpen(false);
    setNewOrder({ 
        customerName: '', serviceType: '', amount: '', status: 'Pending', priority: 'Medium', assignedTo: currentUser?.email || '',
        advance: '', paymentMode: 'Cash'
    });
  };

  const updateOrderStatus = (id: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(o => {
      if (o.id === id) {
        return {
          ...o,
          status: newStatus,
          // Set completedAt if newly completed, otherwise keep existing or clear if moving back to pending
          completedAt: newStatus === 'Completed' ? (o.completedAt || new Date().toISOString()) : undefined
        };
      }
      return o;
    });
    setOrders(updatedOrders);
    if (settings.googleScriptUrl) setTimeout(() => syncData(true), 1000);
  };

  const updateOrderAssignee = (id: string, newAssignee: string) => {
    const updatedOrders = orders.map(o => o.id === id ? { ...o, assignedTo: newAssignee } : o);
    setOrders(updatedOrders);
    if (settings.googleScriptUrl) setTimeout(() => syncData(true), 1000);
  };

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      if(users.find(u => u.email === newUser.email)) return alert('User email already exists');
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setNewUser({ email: '', name: '', role: 'staff', password: '' });
      if (settings.googleScriptUrl) setTimeout(() => syncData(true), 500);
      alert('User added! Syncing...');
  };

  const handleDeleteUser = (email: string) => {
      if(confirm('Are you sure?')) {
          const updated = users.filter(u => u.email !== email);
          setUsers(updated);
          if (settings.googleScriptUrl) setTimeout(() => syncData(true), 500);
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Code copied!');
  };

  // --- Filtering & Stats ---
  const visibleOrders = currentUser?.role === 'admin' 
    ? orders 
    : orders.filter(o => o.assignedTo === currentUser?.email);

  const filteredOrders = visibleOrders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Stats Calculation
  const totalBusiness = visibleOrders.reduce((acc,o) => acc + o.amount, 0);
  const totalAdvance = visibleOrders.reduce((acc,o) => acc + (o.advance || 0), 0);
  const totalPending = totalBusiness - totalAdvance;
  
  const cashReceived = visibleOrders
    .filter(o => o.paymentMode === 'Cash')
    .reduce((acc, o) => acc + (o.advance || 0), 0);
    
  const onlineReceived = visibleOrders
    .filter(o => o.paymentMode === 'Online' || o.paymentMode === 'UPI')
    .reduce((acc, o) => acc + (o.advance || 0), 0);

  const chartData = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = visibleOrders.filter(o => o.date === dateStr);
    return { name: d.toLocaleDateString('en-US', { weekday: 'short' }), sales: dayOrders.reduce((acc, o) => acc + o.amount, 0) };
  }).reverse();

  // Helper for TAT Display
  const getTAT = (order: Order) => {
    const created = new Date(order.date);
    const end = order.completedAt ? new Date(order.completedAt) : new Date();
    const diffTime = Math.abs(end.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };
  
  // Helper for Priority Color
  const getPriorityColor = (p: Order['priority']) => {
    switch(p) {
        case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
        case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Content Renderer
  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        if (currentUser?.role !== 'admin') {
            return (
                <div className="flex flex-col items-center justify-center h-96 text-center animate-fade-in">
                    <Shield size={64} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Access Restricted</h3>
                    <p className="text-slate-500 max-w-md mt-2">Only administrators can access system settings and user management.</p>
                </div>
            );
        }

        return (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
            {/* General Settings */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <SettingsIcon size={24} className="text-primary-600" />
                General Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
                  <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={settings.shopName} onChange={(e) => setSettings({...settings, shopName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                  <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={settings.currencySymbol} onChange={(e) => setSettings({...settings, currencySymbol: e.target.value})} />
                </div>
              </div>
            </div>

            {/* User Management */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <Users size={24} className="text-blue-600" />
                 User Management
               </h3>
               
               {/* Add User Form */}
               <form onSubmit={handleAddUser} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                   <div className="md:col-span-1">
                       <label className="text-xs font-semibold text-slate-500">Email ID</label>
                       <input required type="email" placeholder="staff@gmail.com" className="w-full p-2 border rounded-lg text-sm" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                   </div>
                   <div className="md:col-span-1">
                       <label className="text-xs font-semibold text-slate-500">Name</label>
                       <input required type="text" placeholder="John Doe" className="w-full p-2 border rounded-lg text-sm" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                   </div>
                   <div className="md:col-span-1">
                       <label className="text-xs font-semibold text-slate-500">Password</label>
                       <input required type="text" placeholder="pass123" className="w-full p-2 border rounded-lg text-sm" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                   </div>
                   <div className="md:col-span-1">
                       <label className="text-xs font-semibold text-slate-500">Role</label>
                       <select className="w-full p-2 border rounded-lg text-sm" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                           <option value="staff">Staff</option>
                           <option value="admin">Admin</option>
                       </select>
                   </div>
                   <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-1">
                       <UserPlus size={16} /> Add
                   </button>
               </form>

               {/* User List */}
               <div className="overflow-hidden rounded-xl border border-slate-200">
                   <table className="min-w-full divide-y divide-slate-200">
                       <thead className="bg-slate-50">
                           <tr>
                               <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Email</th>
                               <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Name</th>
                               <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Role</th>
                               <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Action</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 bg-white">
                           {users.map((u) => (
                               <tr key={u.email}>
                                   <td className="px-4 py-2 text-sm text-slate-700">{u.email}</td>
                                   <td className="px-4 py-2 text-sm text-slate-600">{u.name}</td>
                                   <td className="px-4 py-2">
                                       <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                           {u.role.toUpperCase()}
                                       </span>
                                   </td>
                                   <td className="px-4 py-2 text-right">
                                       {u.email !== currentUser?.email && (
                                           <button onClick={() => handleDeleteUser(u.email)} className="text-red-400 hover:text-red-600">
                                               <Trash2 size={16} />
                                           </button>
                                       )}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
            </div>

            {/* Database Setup */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Database size={24} className="text-green-600" />
                Cloud Database
              </h3>
              <div className="bg-amber-50 p-4 rounded-lg mb-4 text-xs text-amber-900 border border-amber-100 flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5" />
                <span><strong>Updated Script Required:</strong> To support TAT, Payments & Priority, please update your Google Apps Script with the code below.</span>
              </div>
              
              <div className="relative mb-6 group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyToClipboard(
`function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ordersSheet = ss.getSheets()[0]; 
  var usersSheet = ss.getSheetByName("Users");
  
  var orders = [];
  var users = [];

  // Read Orders (11 columns: ID, Date, Name, Service, Amount, Status, AssignedTo, Advance, PayMode, CompletedAt, Priority)
  var orderData = ordersSheet.getDataRange().getValues();
  if (orderData.length > 1) { orderData.shift(); orders = orderData; }

  // Read Users
  if (usersSheet) {
    var userData = usersSheet.getDataRange().getValues();
    if (userData.length > 1) { userData.shift(); users = userData; }
  }

  return ContentService.createTextOutput(JSON.stringify({ orders: orders, users: users }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var params = JSON.parse(e.postData.contents);

    if (params.action === 'backup_all') {
       // Save Orders
       var sheet = ss.getSheets()[0];
       var lastRow = sheet.getLastRow();
       if (lastRow > 1) { sheet.getRange(2, 1, lastRow - 1, 11).clearContent(); }
       
       if (params.orders && params.orders.length > 0) {
         var rows = params.orders.map(function(o) { 
           return [o.id, o.date, o.customerName, o.serviceType, o.amount, o.status, o.assignedTo, o.advance, o.paymentMode, o.completedAt, o.priority]; 
         });
         sheet.getRange(2, 1, rows.length, 11).setValues(rows);
       }

       // Save Users
       var userSheet = ss.getSheetByName("Users");
       if (!userSheet) { userSheet = ss.insertSheet("Users"); userSheet.appendRow(["Email", "Name", "Role", "Password"]); }
       var lastUserRow = userSheet.getLastRow();
       if (lastUserRow > 1) { userSheet.getRange(2, 1, lastUserRow - 1, 4).clearContent(); }
       if (params.users && params.users.length > 0) {
         var userRows = params.users.map(function(u) { return [u.email, u.name, u.role, u.password]; });
         userSheet.getRange(2, 1, userRows.length, 4).setValues(userRows);
       }
       
       return ContentService.createTextOutput("Sync Success");
    }
    return ContentService.createTextOutput("Invalid Action");
  } catch(e) { return ContentService.createTextOutput("Error: " + e.toString()); } 
  finally { lock.releaseLock(); }
}`
                  )} className="bg-slate-800 text-white px-3 py-1 text-xs rounded">Copy Code</button>
                </div>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto font-mono">
{`// NEW SCRIPT FOR PRIORITY & TRANSFERS (11 COLUMNS)
function doGet(e) {
  // Reads Orders (including Priority) and Users
  // ...
}

function doPost(e) {
  // Saves Orders with new columns:
  // [ID, Date, Name, Service, Amount, Status, AssignedTo, Advance, PayMode, CompletedAt, Priority]
}`}
                </pre>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Web App URL</label>
                <div className="flex gap-2">
                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" value={settings.googleScriptUrl} onChange={(e) => setSettings({...settings, googleScriptUrl: e.target.value})} />
                    <button id="test-btn" onClick={() => syncData(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg whitespace-nowrap"><Zap size={16} /> Test Sync</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900">
                        {currentUser?.role === 'admin' ? 'All Orders' : 'My Assigned Jobs'}
                    </h3>
                    <p className="text-xs text-slate-500">
                        Showing {filteredOrders.length} records
                    </p>
                </div>
                <div className="relative w-full md:w-72">
                   <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>
             </div>
             <div className="overflow-x-auto border rounded-xl border-slate-100">
               <table className="min-w-full divide-y divide-slate-100">
                 <thead className="bg-slate-50">
                   <tr>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Order Details</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Financials</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Assigned To</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Timeline</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-100">
                   {filteredOrders.map((order) => {
                     const balance = order.amount - (order.advance || 0);
                     return (
                     <tr key={order.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <div className="text-xs font-bold text-primary-600 font-mono bg-primary-50 px-1.5 py-0.5 rounded">{order.id}</div>
                             <div className={`text-[10px] px-1.5 py-0.5 rounded border ${getPriorityColor(order.priority)}`}>{order.priority}</div>
                           </div>
                           <div className="text-[10px] text-slate-400 mt-1">{order.date}</div>
                           <div className="text-sm font-bold text-slate-900 mt-0.5">{order.customerName}</div>
                           <div className="text-xs text-slate-500">{order.serviceType}</div>
                       </td>
                       <td className="px-6 py-4">
                           <div className="text-sm font-bold">{settings.currencySymbol}{order.amount}</div>
                           <div className="text-[10px] text-green-600 font-semibold mt-0.5">Paid: {settings.currencySymbol}{order.advance} ({order.paymentMode})</div>
                           {balance > 0 && <div className="text-[10px] text-red-500 font-bold mt-0.5">Bal: {settings.currencySymbol}{balance}</div>}
                       </td>
                       <td className="px-6 py-4">
                           {/* Allow task transfer if order is not completed */}
                           {order.status !== 'Completed' ? (
                             <select 
                               value={order.assignedTo} 
                               onChange={(e) => updateOrderAssignee(order.id, e.target.value)}
                               className="text-xs border-none bg-slate-100 rounded px-2 py-1 text-slate-700 cursor-pointer hover:bg-slate-200 focus:ring-0 w-32 truncate"
                               title="Transfer Job"
                             >
                               {users.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                             </select>
                           ) : (
                             <div className="text-xs text-slate-600 font-medium">{users.find(u => u.email === order.assignedTo)?.name || order.assignedTo}</div>
                           )}
                       </td>
                       <td className="px-6 py-4">
                         <select 
                           value={order.status}
                           onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                           disabled={order.status === 'Completed' && currentUser?.role !== 'admin'}
                           className={`text-xs font-semibold rounded-full px-2 py-1 border-none cursor-pointer focus:ring-0 ${order.status==='Completed'?'bg-green-100 text-green-700':order.status==='Pending'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'}`}
                         >
                           <option value="Pending">Pending</option>
                           <option value="Processing">Processing</option>
                           {/* Only Admin can set to Completed, or if it is already Completed */}
                           {(currentUser?.role === 'admin' || order.status === 'Completed') && (
                             <option value="Completed">Completed</option>
                           )}
                           <option value="Cancelled">Cancelled</option>
                         </select>
                       </td>
                       <td className="px-6 py-4">
                         {order.status === 'Completed' ? (
                           <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Closed</span>
                              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                                <CheckCircle size={10} /> {getTAT(order)} Days
                              </span>
                           </div>
                         ) : (
                           <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Open</span>
                              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                                <Clock size={10} /> {getTAT(order)} Days
                              </span>
                           </div>
                         )}
                       </td>
                     </tr>
                   )})}
                 </tbody>
               </table>
               {filteredOrders.length === 0 && (
                   <div className="p-8 text-center text-slate-400 text-sm">
                       No jobs found. {currentUser?.role !== 'admin' && "Ask admin to assign new jobs to you."}
                   </div>
               )}
             </div>
          </div>
        );

      default: // 'overview'
        return (
          <div className="animate-fade-in space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-primary-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Welcome back, {currentUser?.name}!</h2>
                    <p className="text-slate-300 text-sm mb-6 max-w-lg">
                        You have {visibleOrders.filter(o => o.status === 'Pending').length} pending jobs assigned to you today.
                    </p>
                    <button onClick={() => setActiveTab('orders')} className="bg-white text-primary-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
                        View My Jobs
                    </button>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-white transform -skew-x-12"></div>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Business</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{settings.currencySymbol}{totalBusiness.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Briefcase size={20} /></div>
                 </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cash Received</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-1">{settings.currencySymbol}{cashReceived.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Banknote size={20} /></div>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Online Received</p>
                        <h3 className="text-2xl font-black text-blue-600 mt-1">{settings.currencySymbol}{onlineReceived.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><CreditCard size={20} /></div>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Market Pending</p>
                        <h3 className="text-2xl font-black text-red-500 mt-1">{settings.currencySymbol}{totalPending.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg text-red-500"><AlertOctagon size={20} /></div>
                 </div>
              </div>
            </div>
            
             <div className="h-64 bg-white p-4 rounded-2xl border border-slate-100">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize:12}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="sales" stroke="#4f46e5" fill="#e0e7ff" />
                    </AreaChart>
                 </ResponsiveContainer>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-20">
        <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
                <div className="bg-primary-600 p-1.5 rounded-lg"><FileText size={18} className="text-white" /></div>
                <h1 className="text-lg font-bold text-slate-900 truncate">{settings.shopName}</h1>
            </div>
          <p className="text-xs text-slate-400 ml-9">
              {currentUser?.name} <span className="opacity-50">({currentUser?.role})</span>
          </p>
        </div>
        <nav className="flex-1 px-3 space-y-1 mt-2">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl transition-all mb-1 ${activeTab==='overview'?'bg-primary-50 text-primary-700 font-semibold':'text-slate-500 hover:bg-slate-50'}`}><BarChartIcon size={20} /><span className="text-sm">Overview</span></button>
          <button onClick={() => setActiveTab('orders')} className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl transition-all mb-1 ${activeTab==='orders'?'bg-primary-50 text-primary-700 font-semibold':'text-slate-500 hover:bg-slate-50'}`}><Database size={20} /><span className="text-sm">Orders</span></button>
          
          {/* Admin Only Tab */}
          {currentUser?.role === 'admin' && (
             <button onClick={() => setActiveTab('settings')} className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl transition-all mb-1 ${activeTab==='settings'?'bg-primary-50 text-primary-700 font-semibold':'text-slate-500 hover:bg-slate-50'}`}><SettingsIcon size={20} /><span className="text-sm">Settings & Users</span></button>
          )}
        </nav>
        
        <div className="px-4 py-4 border-t border-slate-100 mx-3 mb-2 mt-auto">
             <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-semibold text-slate-400 uppercase">SYNC (10 MIN)</span>
                 {isBackingUp || isFetching ? <RefreshCw size={12} className="animate-spin text-primary-600"/> : <div className={`w-2 h-2 rounded-full ${settings.googleScriptUrl?'bg-green-500':'bg-gray-300'}`}></div>}
             </div>
             <div className="flex gap-2">
                 <button onClick={() => syncData(false)} disabled={isBackingUp || !settings.googleScriptUrl} className="w-full flex justify-center items-center gap-1 bg-white border hover:bg-slate-50 text-slate-600 py-2 rounded-lg text-xs font-bold"><RefreshCw size={14}/> Sync Now</button>
             </div>
             <p className="text-[10px] text-slate-300 text-center mt-2">{lastSyncTime || 'No sync yet'}</p>
        </div>

        <div className="p-3">
          <button onClick={onLogout} className="flex items-center space-x-3 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all w-full px-4 py-2.5 rounded-xl font-medium">
            <LogOut size={20} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
        {/* Sync Failure Notification Banner */}
        {syncError && (
          <div className="bg-red-600 text-white text-xs font-bold px-4 py-2 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-md">
            <AlertTriangle size={14} />
            {syncError}
            <button onClick={() => syncData(false)} className="underline ml-2 hover:text-red-100">Retry</button>
          </div>
        )}

        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
           <div className="md:hidden">
              <span className="font-bold text-slate-800">{settings.shopName}</span>
           </div>
           
           {/* Top Right Header Area */}
           <div className="flex items-center gap-4 ml-auto">
               <div className="hidden md:flex flex-col items-end mr-2">
                   <h2 className="text-xl font-black text-slate-900 capitalize tracking-tight leading-none">{activeTab === 'overview' ? 'Overview' : activeTab === 'orders' ? 'Orders' : 'Admin Settings'}</h2>
                   <p className="text-xs text-slate-400 font-mono mt-1">
                      {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </p>
               </div>
               
               {activeTab !== 'settings' && (
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/30 text-sm font-bold">
                    <Plus size={18} /> <span className="hidden sm:inline">New Order</span>
                </button>
               )}
               <button onClick={onLogout} className="md:hidden"><LogOut size={20} className="text-slate-600"/></button>
           </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
          {renderContent()}
        </div>
      </main>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">New Order</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
            </div>
            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Customer</label>
                  <input required type="text" placeholder="e.g. Rahul Sharma" className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-primary-500" value={newOrder.customerName} onChange={e => setNewOrder({...newOrder, customerName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Service</label>
                      <input required type="text" placeholder="e.g. A4 Print" className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-primary-500" value={newOrder.serviceType} onChange={e => setNewOrder({...newOrder, serviceType: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                    <select className="w-full p-3 border rounded-xl mt-1 bg-white focus:ring-2 focus:ring-primary-500" value={newOrder.priority} onChange={e => setNewOrder({...newOrder, priority: e.target.value as any})}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                 </div>
              </div>
              
              {/* Amount and Advance */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Total Bill</label>
                      <input required type="number" placeholder="0.00" className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-primary-500" value={newOrder.amount} onChange={e => setNewOrder({...newOrder, amount: e.target.value})} />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Advance Paid</label>
                      <input type="number" placeholder="0.00" className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-primary-500" value={newOrder.advance} onChange={e => setNewOrder({...newOrder, advance: e.target.value})} />
                  </div>
              </div>

              {/* Payment Mode & Status */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Payment Mode</label>
                    <select className="w-full p-3 border rounded-xl mt-1 bg-white focus:ring-2 focus:ring-primary-500" value={newOrder.paymentMode} onChange={e => setNewOrder({...newOrder, paymentMode: e.target.value as any})}>
                        <option value="Cash">Cash</option>
                        <option value="Online">Online / UPI</option>
                    </select>
                 </div>
                 <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Job Status</label>
                      <select className="w-full p-3 border rounded-xl mt-1 bg-white focus:ring-2 focus:ring-primary-500" value={newOrder.status} onChange={e => setNewOrder({...newOrder, status: e.target.value as any})}><option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Completed">Completed</option></select>
                  </div>
              </div>
              
              {/* Assignment Logic */}
              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Assign To</label>
                  <select 
                    className="w-full p-3 border rounded-xl mt-1 bg-white focus:ring-2 focus:ring-primary-500" 
                    value={newOrder.assignedTo} 
                    onChange={e => setNewOrder({...newOrder, assignedTo: e.target.value})}
                    disabled={currentUser?.role !== 'admin'} 
                  >
                      {users.map(u => (
                          <option key={u.email} value={u.email}>{u.name} ({u.role})</option>
                      ))}
                  </select>
              </div>
              
              {/* Pending Calculation Preview */}
              <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Balance Pending:</span>
                  <span className="text-lg font-black text-slate-800">{settings.currencySymbol}{(Number(newOrder.amount) - Number(newOrder.advance)).toFixed(2)}</span>
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">{isSaving ? 'Saving...' : 'Create Order'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;