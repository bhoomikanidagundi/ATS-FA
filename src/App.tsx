/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import { ThemeProvider } from './lib/ThemeProvider';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Result from './pages/Result';
import History from './pages/History';
import Builder from './pages/Builder';
import GeneratedResume from './pages/GeneratedResume';
import RecruiterDashboard from './pages/RecruiterDashboard';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { token, user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 dark:text-slate-100">Loading...</div>;
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if they try to access a forbidden area
    return <Navigate to={user.role === 'recruiter' ? "/recruiter-dashboard" : "/dashboard"} replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            {/* Candidate Routes */}
            <Route element={<ProtectedRoute allowedRoles={['candidate']}><Outlet /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/history" element={<History />} />
              <Route path="/result/:id" element={<Result />} />
              <Route path="/builder" element={<Builder />} />
              <Route path="/resume/:id" element={<GeneratedResume />} />
            </Route>

            {/* Recruiter Routes */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter']}><Outlet /></ProtectedRoute>}>
              <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
              <Route path="/jobs" element={<RecruiterDashboard />} />
              <Route path="/talent" element={<RecruiterDashboard />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
