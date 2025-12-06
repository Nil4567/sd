export enum ViewState {
  HOME = 'HOME',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD'
}

export interface User {
  email: string;
  name: string;
  role: 'admin' | 'staff';
  password?: string; // Simple auth for simulation
}

export interface Order {
  id: string;
  customerName: string;
  serviceType: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  amount: number;
  date: string; // Creation Date YYYY-MM-DD
  assignedTo: string;
  advance: number; // Amount received in advance
  paymentMode: 'Cash' | 'Online' | 'UPI' | 'Pending'; 
  completedAt?: string; // ISO String for TAT calculation
}

export interface StatData {
  name: string;
  value: number;
}

export interface AppSettings {
  shopName: string;
  currencySymbol: string;
  googleScriptUrl: string;
}