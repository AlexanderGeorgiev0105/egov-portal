package com.example.demo.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.demo.repository.AdminRepository;
import com.example.demo.repository.UserRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider adminAuthProvider(AdminRepository adminRepository, PasswordEncoder encoder) {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(new AdminUserDetailsService(adminRepository));
        p.setPasswordEncoder(encoder);
        return p;
    }

    @Bean
    public DaoAuthenticationProvider userAuthProvider(UserRepository userRepository, PasswordEncoder encoder) {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(new EgnUserDetailsService(userRepository));
        p.setPasswordEncoder(encoder);
        return p;
    }

    @Bean
    public ActiveUserFilter activeUserFilter() {
        return new ActiveUserFilter();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain adminChain(org.springframework.security.config.annotation.web.builders.HttpSecurity http,
                                         DaoAuthenticationProvider adminAuthProvider) throws Exception {

        http.securityMatcher("/api/admin/**")
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(adminAuthProvider)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/admin/auth/login").permitAll()
                        .anyRequest().hasRole("ADMIN")
                )
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain userChain(org.springframework.security.config.annotation.web.builders.HttpSecurity http,
                                        DaoAuthenticationProvider userAuthProvider,
                                        ActiveUserFilter activeUserFilter) throws Exception {

        http.securityMatcher("/api/**")
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(userAuthProvider)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .anyRequest().authenticated()
                )
                .httpBasic(withDefaults())
                .addFilterAfter(activeUserFilter, BasicAuthenticationFilter.class);

        return http.build();
    }
}
