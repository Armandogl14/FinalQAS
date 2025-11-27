'use client';

import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Package, TrendingUp, Settings, History, User, Shield, Zap, Lock } from 'lucide-react';
import Link from 'next/link';
import './dashboard.css';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { authenticated, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner-wrapper">
            <div className="spinner-outer"></div>
            <div className="spinner-inner"></div>
            <div className="spinner-icon">
              <BarChart3 size={24} color="#2563eb" />
            </div>
          </div>
          <p className="loading-text">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-decoration-1"></div>
          <div className="hero-decoration-2"></div>
          
          <div className="hero-content">
            <div className="hero-header">
              <div className="hero-icon-wrapper">
                <BarChart3 size={40} color="#ffffff" />
              </div>
              <h1 className="hero-title">Inventory Management System</h1>
            </div>
            <p className="hero-subtitle">
              Manage your products and stock efficiently with our modern platform
            </p>
          </div>
        </div>

        {authenticated ? (
          <>
            {/* User Info Section */}
            <div className="cards-grid">
              {/* Role Card */}
              <div className="info-card">
                <div className="card-header">
                  <h3 className="card-title">Your Role</h3>
                  <div className="card-icon-wrapper card-icon-blue">
                    <User size={24} color="#2563eb" />
                  </div>
                </div>
                <div className="card-content">
                  <p className="role-text">
                    {roles?.isAdmin ? 'Administrator' : roles?.isEmployee ? 'Employee' : roles?.isGuest ? 'Guest' : 'Not Assigned'}
                  </p>
                  <p className="role-description">
                    {roles?.isAdmin 
                      ? 'Full system access with all permissions' 
                      : roles?.isEmployee 
                      ? 'Can manage inventory and products' 
                      : roles?.isGuest
                      ? 'View-only access to products and history'
                      : 'No role assigned'}
                  </p>
                </div>
              </div>

              {/* Permissions Card */}
              <div className="info-card">
                <div className="card-header">
                  <h3 className="card-title">Permissions</h3>
                  <div className="card-icon-wrapper card-icon-green">
                    <Settings size={24} color="#059669" />
                  </div>
                </div>
                <div className="card-content">
                  <div className="permissions-list">
                    <div className={`permission-item ${(roles?.isAdmin || roles?.isEmployee || roles?.isGuest) ? 'permission-active' : 'permission-inactive'}`}>
                      <div className={`permission-dot ${(roles?.isAdmin || roles?.isEmployee || roles?.isGuest) ? 'permission-dot-active' : 'permission-dot-inactive'}`}></div>
                      View products
                    </div>
                    <div className={`permission-item ${(roles?.isAdmin || roles?.isEmployee) ? 'permission-active' : 'permission-inactive'}`}>
                      <div className={`permission-dot ${(roles?.isAdmin || roles?.isEmployee) ? 'permission-dot-active' : 'permission-dot-inactive'}`}></div>
                      Manage stock
                    </div>
                    <div className={`permission-item ${roles?.isAdmin ? 'permission-active' : 'permission-inactive'}`}>
                      <div className={`permission-dot ${roles?.isAdmin ? 'permission-dot-active' : 'permission-dot-inactive'}`}></div>
                      Admin tools
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Card */}
              <div className="info-card">
                <div className="card-header">
                  <h3 className="card-title">Access Level</h3>
                  <div className="card-icon-wrapper card-icon-purple">
                    <TrendingUp size={24} color="#7c3aed" />
                  </div>
                </div>
                <div className="card-content">
                  <div className="access-bars">
                    <div className={`access-bar access-bar-1 ${(roles?.isAdmin || roles?.isEmployee || roles?.isGuest) ? 'access-bar-active' : 'access-bar-inactive'}`}></div>
                    <div className={`access-bar access-bar-2 ${(roles?.isAdmin || roles?.isEmployee) ? 'access-bar-active' : 'access-bar-inactive'}`}></div>
                    <div className={`access-bar access-bar-3 ${roles?.isAdmin ? 'access-bar-active' : 'access-bar-inactive'}`}></div>
                  </div>
                  <p className="access-level-text">
                    {roles?.isAdmin 
                      ? 'Level 3 - Full Access' 
                      : roles?.isEmployee 
                      ? 'Level 2 - Operator' 
                      : roles?.isGuest
                      ? 'Level 1 - Viewer'
                      : 'Level 0 - No Access'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div>
              <div className="section-header">
                <div className="section-line section-line-blue"></div>
                <h2 className="section-title">Quick Access</h2>
              </div>
              <div className="quick-access-grid">
                {/* Products */}
                <Link href="/products" className="quick-access-card">
                  <div className="quick-access-content">
                    <div className="quick-access-icon-wrapper quick-access-icon-blue">
                      <Package size={32} color="#2563eb" />
                    </div>
                    <div>
                      <h3 className="quick-access-title quick-access-title-blue">Products</h3>
                      <p className="quick-access-description">Manage all products</p>
                    </div>
                  </div>
                </Link>

                {/* Stock History */}
                <Link href="/stock-history" className="quick-access-card">
                  <div className="quick-access-content">
                    <div className="quick-access-icon-wrapper quick-access-icon-green">
                      <History size={32} color="#059669" />
                    </div>
                    <div>
                      <h3 className="quick-access-title quick-access-title-green">Stock History</h3>
                      <p className="quick-access-description">View all movements</p>
                    </div>
                  </div>
                </Link>

                {/* Stock Management */}
                {(roles?.isAdmin || roles?.isEmployee) && (
                  <Link href="/stock-management" className="quick-access-card">
                    <div className="quick-access-content">
                      <div className="quick-access-icon-wrapper quick-access-icon-yellow">
                        <TrendingUp size={32} color="#d97706" />
                      </div>
                      <div>
                        <h3 className="quick-access-title quick-access-title-yellow">Stock Management</h3>
                        <p className="quick-access-description">Adjust inventory</p>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* Features Section */}
            <div>
              <div className="section-header">
                <div className="section-line section-line-purple"></div>
                <h2 className="section-title">Features</h2>
              </div>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon-wrapper feature-icon-blue">
                    <Package size={28} color="#2563eb" />
                  </div>
                  <div>
                    <p className="feature-title">Real-time Inventory</p>
                    <p className="feature-description">Track your stock levels in real-time</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-wrapper feature-icon-green">
                    <BarChart3 size={28} color="#059669" />
                  </div>
                  <div>
                    <p className="feature-title">Stock Movements</p>
                    <p className="feature-description">Complete history of all transactions</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-wrapper feature-icon-purple">
                    <Lock size={28} color="#7c3aed" />
                  </div>
                  <div>
                    <p className="feature-title">Role-based Access</p>
                    <p className="feature-description">Secure access control for your team</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-wrapper feature-icon-yellow">
                    <Zap size={28} color="#d97706" />
                  </div>
                  <div>
                    <p className="feature-title">Fast & Reliable</p>
                    <p className="feature-description">Built with modern technology stack</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-icon-wrapper">
                <Shield size={28} color="#dc2626" />
              </div>
              <h3 className="auth-title">Authentication Required</h3>
            </div>
            <div className="auth-content">
              <p className="auth-text">Please log in to access the inventory management system.</p>
            </div>
          </div>
        )}
      </div>
  );
}
