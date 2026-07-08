package com.digitaldynamics.pms.config;

import com.fasterxml.jackson.core.SerializableString;
import com.fasterxml.jackson.core.io.CharacterEscapes;
import com.fasterxml.jackson.core.io.SerializedString;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@Configuration
public class JsonResponseSecurityConfig {

    @Bean
    Jackson2ObjectMapperBuilderCustomizer securityJsonEscapingCustomizer() {
        return builder -> builder.postConfigurer(
                mapper -> mapper.getFactory().setCharacterEscapes(new HtmlSafeCharacterEscapes()));
    }

    static class HtmlSafeCharacterEscapes extends CharacterEscapes {
        private final int[] asciiEscapes;

        HtmlSafeCharacterEscapes() {
            asciiEscapes = CharacterEscapes.standardAsciiEscapesForJSON();
            asciiEscapes['<'] = CharacterEscapes.ESCAPE_CUSTOM;
            asciiEscapes['>'] = CharacterEscapes.ESCAPE_CUSTOM;
            asciiEscapes['&'] = CharacterEscapes.ESCAPE_CUSTOM;
            asciiEscapes['\''] = CharacterEscapes.ESCAPE_CUSTOM;
            asciiEscapes['/'] = CharacterEscapes.ESCAPE_CUSTOM;
        }

        @Override
        public int[] getEscapeCodesForAscii() {
            return asciiEscapes;
        }

        @Override
        public SerializableString getEscapeSequence(int ch) {
            return switch (ch) {
                case '<' -> new SerializedString("\\u003C");
                case '>' -> new SerializedString("\\u003E");
                case '&' -> new SerializedString("\\u0026");
                case '\'' -> new SerializedString("\\u0027");
                case '/' -> new SerializedString("\\/");
                case 0x2028 -> new SerializedString("\\u2028");
                case 0x2029 -> new SerializedString("\\u2029");
                default -> null;
            };
        }
    }

    @ControllerAdvice(annotations = RestController.class)
    static class JsonContentTypeAdvice implements ResponseBodyAdvice<Object> {
        @Override
        public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
            return MappingJackson2HttpMessageConverter.class.isAssignableFrom(converterType);
        }

        @Override
        public Object beforeBodyWrite(
                Object body,
                MethodParameter returnType,
                MediaType selectedContentType,
                Class<? extends HttpMessageConverter<?>> selectedConverterType,
                ServerHttpRequest request,
                ServerHttpResponse response) {
            String path = request.getURI().getPath();
            if (path != null && path.startsWith("/api")) {
                response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
            }
            return body;
        }
    }
}
