package com.luxestore.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        // For dev quick testing you set allowedOrigins("*") and allowCredentials=false
        // For production add exact origin and set allowCredentials(true) if using cookies.
        cfg.setAllowedOrigins(List.of("*"));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(false);
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cfg);
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth

                // Explicit AntPathRequestMatcher for OPTIONS (preflight)
                .requestMatchers(new AntPathRequestMatcher("/**", HttpMethod.OPTIONS.name())).permitAll()

                // Auth endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/auth/**")).permitAll()

                // Public data endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/products/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/cart/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/wishlist/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/orders/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/payment/**")).permitAll()

                // H2 console
                .requestMatchers(new AntPathRequestMatcher("/h2-console/**")).permitAll()

                // everything else requires authentication
                .anyRequest().authenticated()
            )
            // allow frames for H2 console
            .headers(headers -> headers.frameOptions().disable());

        // Do not enable httpBasic() if you want to avoid browser login popups
        // .httpBasic();

        return http.build();
    }
}
