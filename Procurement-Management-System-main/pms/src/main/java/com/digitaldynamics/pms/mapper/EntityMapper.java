package com.digitaldynamics.pms.mapper;

public interface EntityMapper<S, T> {
    T toDto(S source);
}
