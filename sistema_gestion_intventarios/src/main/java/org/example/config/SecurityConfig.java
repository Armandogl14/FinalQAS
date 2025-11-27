package org.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("!test")
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authz -> authz
                        // Endpoints de monitoreo públicos
                        .requestMatchers("/actuator/health", "/actuator/prometheus", "/actuator/metrics").permitAll()

                        // Endpoints públicos para usuarios GUEST
                        .requestMatchers("/api/public/**").permitAll()

                        // PRODUCTOS - Según la matriz de permisos del proyecto
                        .requestMatchers(HttpMethod.GET, "/api/v2/products", "/api/v2/products/**").permitAll() // Todos pueden ver
                        .requestMatchers(HttpMethod.POST, "/api/v2/products").hasAnyRole("ADMIN", "EMPLOYEE") // Admin y Employee pueden crear
                        .requestMatchers(HttpMethod.PUT, "/api/v2/products/**").hasAnyRole("ADMIN", "EMPLOYEE") // Admin y Employee pueden editar
                        .requestMatchers(HttpMethod.DELETE, "/api/v2/products/**").hasRole("ADMIN") // Solo Admin puede eliminar

                        // STOCK - Solo Admin y Employee
                        .requestMatchers("/api/v2/stock/**").hasAnyRole("ADMIN", "EMPLOYEE")

                        // API de integración - Solo Admin (según proyecto)
                        .requestMatchers("/api/integration/**").hasRole("ADMIN")

                        // Estadísticas públicas para GUEST
                        .requestMatchers(HttpMethod.GET, "/api/v2/products/stats").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v2/products/categories").permitAll()

                        // Stats detalladas solo para usuarios autenticados
                        .requestMatchers("/api/v2/admin/**").hasRole("ADMIN")

                        // Legacy API - mantener compatibilidad
                        .requestMatchers(HttpMethod.GET, "/api/v1/products", "/api/v1/products/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/products").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/products/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(
                        jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<String> roles = new ArrayList<>();
            Object realmAccess = jwt.getClaim("realm_access");
            if (realmAccess instanceof Map<?, ?> realm) {
                Object r = realm.get("roles");
                if (r instanceof Collection<?> rc) {
                    for (Object o : rc) {
                        if (o != null) roles.add(o.toString());
                    }
                }
            }
            Object resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess instanceof Map<?, ?> res) {
                Object client = res.get("inventory-app-public");
                if (client instanceof Map<?, ?> cm) {
                    Object cr = cm.get("roles");
                    if (cr instanceof Collection<?> crc) {
                        for (Object o : crc) {
                            if (o != null) roles.add(o.toString());
                        }
                    }
                }
            }
            return roles.stream()
                    .map(r -> new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                    .collect(Collectors.toSet());
        });
        return converter;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Agregar más orígenes permitidos
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://localhost:*",
                "http://react_inventory:*",
                "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        // Usar la URL externa para validar el issuer
        String issuerUri = "http://localhost:8180/realms/inventario";
        // Pero configurar manualmente el JWK Set URI usando el nombre interno
        String jwkSetUri = "http://keycloak:8080/realms/inventario/protocol/openid-connect/certs";

        return NimbusJwtDecoder.withJwkSetUri(jwkSetUri)
                .build();
    }
}
