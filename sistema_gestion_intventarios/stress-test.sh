#!/bin/bash
# Script para ejecutar pruebas de estrés

echo "🚀 Iniciando pruebas de estrés del Sistema de Inventarios..."

# Verificar si JMeter está instalado
if ! command -v jmeter &> /dev/null; then
    echo "❌ JMeter no está instalado. Descárgalo de: https://jmeter.apache.org/download_jmeter.cgi"
    exit 1
fi

# Crear directorio de resultados
mkdir -p target/stress-results

# Ejecutar la aplicación en modo de prueba de estrés
echo "📦 Iniciando aplicación Spring Boot..."
mvn spring-boot:run -Dspring.profiles.active=stress-test -Dserver.port=8081 &
APP_PID=$!

# Esperar a que la aplicación inicie
sleep 15

echo "🧪 Ejecutando pruebas de estrés con JMeter..."

# Ejecutar JMeter en modo no GUI
jmeter -n -t src/test/jmeter/inventory-stress-test.jmx \
       -l target/stress-results/results.jtl \
       -e -o target/stress-results/html-report \
       -Jthreads=50 \
       -Jrampup=30 \
       -Jduration=120

echo "📊 Generando reporte HTML..."

# Matar la aplicación
kill $APP_PID

echo "✅ Pruebas completadas!"
echo "📋 Revisa los resultados en:"
echo "   - target/stress-results/results.jtl"
echo "   - target/stress-results/html-report/index.html"
