#!/bin/bash
# Script para instalar y ejecutar el proyecto

echo "=================================="
echo "  INVENTORY MANAGEMENT SYSTEM"
echo "  Setup Script"
echo "=================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Descargar de: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"
echo ""

# Install dependencies
echo "📦 Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo ""

# Check .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  Archivo .env.local no encontrado"
    cp .env.example .env.local
    echo "✅ Archivo .env.local creado desde .env.example"
    echo "ℹ️  Editar .env.local con tus valores si es necesario"
    echo ""
fi

# Start development server
echo "🚀 Iniciando servidor de desarrollo..."
echo "📍 La aplicación estará en: http://localhost:3000"
echo ""
npm run dev
