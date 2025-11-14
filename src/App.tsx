import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminDocuments from "./pages/admin/Documents";
import AdminQuizzes from "./pages/admin/Quizzes";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import EmployeeDashboard from "./pages/employee/Dashboard";
import QuizTake from "./pages/employee/QuizTake";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/documents" 
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                  <AdminDocuments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/quizzes" 
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                  <AdminQuizzes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee/quiz/:quizId" 
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <QuizTake />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
