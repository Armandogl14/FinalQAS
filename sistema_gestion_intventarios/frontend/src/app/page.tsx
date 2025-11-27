'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Shield, Zap, Package } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { authenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && authenticated) {
      router.push('/dashboard');
    }
  }, [authenticated, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/25 mb-6">
            <BarChart3 className="text-white" size={40} />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema moderno de gestión de inventarios
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="relative inline-block">
              {/* Outer spinning ring */}
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              {/* Inner spinning ring */}
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="text-blue-600" size={24} />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-800">
                Inicializando sistema de autenticación...
              </h2>
              <p className="text-gray-600">
                Por favor espera mientras verificamos tus credenciales
              </p>
              
              {/* Loading dots */}
              <div className="flex justify-center gap-2 pt-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0ms]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:150ms]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:300ms]"></div>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-fade-in">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="text-blue-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Productos</h3>
              <p className="text-sm text-gray-600">
                Administra tu inventario de manera eficiente y en tiempo real
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Control de Stock</h3>
              <p className="text-sm text-gray-600">
                Monitorea y ajusta el stock con alertas automáticas
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-purple-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rápido y Seguro</h3>
              <p className="text-sm text-gray-600">
                Tecnología moderna con autenticación robusta
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
