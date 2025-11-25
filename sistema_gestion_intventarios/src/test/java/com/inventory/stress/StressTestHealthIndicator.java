package com.inventory.stress;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import javax.management.MBeanServer;
import javax.management.ObjectName;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;

@Component
public class StressTestHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapMemoryUsage = memoryBean.getHeapMemoryUsage();

        long used = heapMemoryUsage.getUsed();
        long max = heapMemoryUsage.getMax();
        double memoryUsagePercent = (double) used / max * 100;

        Health.Builder healthBuilder = new Health.Builder();

        if (memoryUsagePercent > 90) {
            healthBuilder.down();
        } else if (memoryUsagePercent > 70) {
            healthBuilder.status("WARNING");
        } else {
            healthBuilder.up();
        }

        return healthBuilder
                .withDetail("memory.used", used)
                .withDetail("memory.max", max)
                .withDetail("memory.usage.percent", String.format("%.2f%%", memoryUsagePercent))
                .build();
    }
}