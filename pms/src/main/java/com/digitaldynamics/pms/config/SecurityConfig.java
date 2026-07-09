package com.digitaldynamics.pms.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        @Qualifier("jwtAuthenticationFilter") OncePerRequestFilter jwtFilter,
        @Value("${pms.security.force-https:false}") boolean forceHttps) throws Exception {
    http.csrf(csrf -> csrf.disable()) // Enabling or disabling this depends on stateless Authorization-header auth
        .cors(Customizer.withDefaults());

    if (forceHttps) {
        http.requiresChannel(channel -> channel.anyRequest().requiresSecure())
            .addFilterBefore(new PermanentHttpsRedirectFilter(), UsernamePasswordAuthenticationFilter.class);
    }

    http.headers(headers -> {
        headers.xssProtection(xss -> xss
            .headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK));
        headers.contentTypeOptions(Customizer.withDefaults());
        headers.contentSecurityPolicy(csp -> csp
            .policyDirectives(
                "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'"));

        if (forceHttps) {
        headers.httpStrictTransportSecurity(hsts -> hsts
            .includeSubDomains(true)
            .preload(true)
            .maxAgeInSeconds(31536000));
        }
    });

    return http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/*.html",
                                "/error",
                                "/error/**",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/favicon.ico",
                                "/*.css",
                                "/*.js",
                                "/*.png",
                                "/*.jpg",
                                "/*.jpeg",
                                "/*.gif",
                                "/*.svg",
                                "/*.ico",
                                "/api/auth/**",
                                "/api/docs")
                        .permitAll()
                        .requestMatchers("/actuator/health/**", "/actuator/info", "/v3/api-docs/**", "/swagger-ui/**",
                                "/swagger-ui.html")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/quotations").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    static class PermanentHttpsRedirectFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            if (isSecureRequest(request)) {
                filterChain.doFilter(request, response);
                return;
            }

            String host = request.getServerName();
            int port = request.getServerPort();
            String uri = request.getRequestURI();
            String query = request.getQueryString();

            int httpsPort = (port == 80 || port <= 0) ? 443 : port;
            String portSegment = httpsPort == 443 ? "" : ":" + httpsPort;
            String querySegment = (query == null || query.isBlank()) ? "" : "?" + query;
            String location = "https://" + host + portSegment + uri + querySegment;

            response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
            response.setHeader("Location", location);
        }

        private boolean isSecureRequest(HttpServletRequest request) {
            if (request.isSecure()) {
                return true;
            }

            String forwardedProto = request.getHeader("X-Forwarded-Proto");
            return forwardedProto != null && forwardedProto.equalsIgnoreCase("https");
        }
    }

    @Bean
    BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
