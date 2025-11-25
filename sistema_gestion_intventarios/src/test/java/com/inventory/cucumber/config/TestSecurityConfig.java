package com.inventory.cucumber.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@Profile("test")
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(authz -> authz
                        .anyRequest().permitAll() // Permitir todo en tests
                )
                .httpBasic(httpBasic -> httpBasic.disable()) // Deshabilitar autenticación básica
                .formLogin(formLogin -> formLogin.disable()) // Deshabilitar formulario de login
                .logout(logout -> logout.disable()) // Deshabilitar logout
                .anonymous(anonymous -> anonymous.disable()); // Deshabilitar usuario anónimo

        return http.build();
    }
}