package com.inventory.stress;

import org.example.Main;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(classes = org.example.Main.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("stress-test")
@TestPropertySource(properties = {
        "spring.datasource.hikari.maximum-pool-size=50",
        "spring.datasource.hikari.minimum-idle=10",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework=WARN",
        "logging.level.org.hibernate=WARN"
})
public class StressTestBase {

    protected static ConfigurableApplicationContext context;

    public static void startApplication() {
        if (context == null || !context.isActive()) {
            System.setProperty("spring.profiles.active", "stress-test");
            context = SpringApplication.run(org.example.Main.class);
        }
    }

    public static void stopApplication() {
        if (context != null && context.isActive()) {
            context.close();
        }
    }
}