package com.qlchothuetro.testing.service;

import java.util.LinkedHashMap;
import java.util.Map;

public class PropertySearchQueryBuilder {

    public Map<String, String> build(Double minArea, Double maxPrice, String district) {
        Map<String, String> query = new LinkedHashMap<>();

        if (minArea != null && minArea > 0) {
            query.put("address.area[gte]", toNumberString(minArea));
        }

        if (maxPrice != null && maxPrice > 0) {
            query.put("price[lte]", toNumberString(maxPrice));
        }

        if (district != null && !district.trim().isEmpty()) {
            query.put("address.district", district.trim());
        }

        return query;
    }

    private String toNumberString(Double value) {
        if (value == null) {
            return "";
        }

        if (Math.floor(value) == value) {
            return String.valueOf(value.longValue());
        }

        return String.valueOf(value);
    }
}
