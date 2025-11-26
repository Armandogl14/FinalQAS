'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, LogOut, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { authenticated, loading, roles, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Products', href: '/products' },
    { label: 'Stock History', href: '/stock-history' },
    ...(authenticated && (roles?.isAdmin || roles?.isEmployee) 
      ? [{ label: 'Stock Management', href: '/stock-management' }] 
      : [])
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo */}
          <div className="logo-section">
            <Link href="/dashboard" className="logo-link">
              <div className="logo-icon-wrapper">
                <BarChart3 size={24} className="logo-icon" />
              </div>
              <span>Inventory</span>
            </Link>
          </div>

          {/* Desktop Menu - Perfectly Centered */}
          <div className="desktop-menu">
            <div className="menu-items-wrapper">
              {menuItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="menu-item-link"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Section */}
          <div className="auth-section">
            {loading ? (
              <span className="auth-loading">
                <div className="auth-spinner"></div>
                <span className="auth-loading-text">Autenticando...</span>
              </span>
            ) : (
              <>
                {authenticated && roles && (
                  <span className="role-badge">
                    {roles.isAdmin ? 'Admin' : roles.isEmployee ? 'Employee' : 'Guest'}
                  </span>
                )}
                <button
                  onClick={authenticated ? logout : login}
                  className={`auth-button ${authenticated ? 'auth-button-logout' : 'auth-button-login'}`}
                >
                  {authenticated ? (
                    <>
                      <LogOut size={18} /> <span className="auth-button-text">Logout</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} /> <span className="auth-button-text">Login</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-menu-button"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-items">
              {menuItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mobile-menu-link"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mobile-menu-auth">
              {authenticated && roles && (
                <div className="mobile-role-info">
                  Rol: <span className="mobile-role-label">{roles.isAdmin ? 'Admin' : roles.isEmployee ? 'Employee' : 'Guest'}</span>
                </div>
              )}
              <button
                onClick={() => {
                  if (authenticated) {
                    logout();
                  } else {
                    login();
                  }
                  setIsOpen(false);
                }}
                className={`mobile-auth-button ${authenticated ? 'mobile-auth-button-logout' : 'mobile-auth-button-login'}`}
              >
                {authenticated ? (
                  <>
                    <LogOut size={18} /> Logout
                  </>
                ) : (
                  <>
                    <LogIn size={18} /> Login
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
