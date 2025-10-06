package com.luxestore.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

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
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(new AntPathRequestMatcher("/api/auth/signup"),
                                 new AntPathRequestMatcher("/api/auth/login")).permitAll()
                //.requestMatchers(new AntPathRequestMatcher("/api/admin/**")).hasRole("ADMIN")
                .requestMatchers(new AntPathRequestMatcher("/h2-console/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/products/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/cart/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/wishlist/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/users/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/orders/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/payment/**")).permitAll()

                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions().disable())
            .httpBasic();
        return http.build();
    }
}