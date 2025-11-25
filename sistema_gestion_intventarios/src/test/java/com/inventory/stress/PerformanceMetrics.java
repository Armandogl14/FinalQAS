package com.inventory.stress;

import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

@Component
public class PerformanceMetrics {

    private final LongAdder requestCount = new LongAdder();
    private final LongAdder errorCount = new LongAdder();
    private final AtomicLong totalResponseTime = new AtomicLong(0);
    private final AtomicLong maxResponseTime = new AtomicLong(0);
    private final AtomicLong minResponseTime = new AtomicLong(Long.MAX_VALUE);

    public void recordRequest(long responseTime) {
        requestCount.increment();
        totalResponseTime.addAndGet(responseTime);

        // Actualizar max response time
        maxResponseTime.updateAndGet(current -> Math.max(current, responseTime));

        // Actualizar min response time
        minResponseTime.updateAndGet(current -> Math.min(current, responseTime));
    }

    public void recordError() {
        errorCount.increment();
    }

    public void reset() {
        requestCount.reset();
        errorCount.reset();
        totalResponseTime.set(0);
        maxResponseTime.set(0);
        minResponseTime.set(Long.MAX_VALUE);
    }

    public String getReport() {
        long requests = requestCount.sum();
        long errors = errorCount.sum();
        long totalTime = totalResponseTime.get();

        if (requests == 0) {
            return "No hay datos de rendimiento disponibles";
        }

        double averageResponseTime = (double) totalTime / requests;
        double errorRate = (double) errors / requests * 100;

        return String.format(
                "=== MÉTRICAS DE RENDIMIENTO ===\n" +
                        "Total de requests: %d\n" +
                        "Errores: %d (%.2f%%)\n" +
                        "Tiempo de respuesta promedio: %.2f ms\n" +
                        "Tiempo de respuesta mínimo: %d ms\n" +
                        "Tiempo de respuesta máximo: %d ms\n",
                requests, errors, errorRate, averageResponseTime,
                minResponseTime.get(), maxResponseTime.get()
        );
    }
}