package com.qlchothuetro.testing.graybox;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.qlchothuetro.testing.service.PropertySearchQueryBuilder;

class PropertySearchQueryBuilderGrayBoxTest {

    private final PropertySearchQueryBuilder builder = new PropertySearchQueryBuilder();

    @Test
    @DisplayName("Gray Box - filter by area only")
    void shouldBuildAreaOnlyQuery() {
        Map<String, String> query = builder.build(30.0, null, "");

        assertEquals(1, query.size());
        assertEquals("30", query.get("address.area[gte]"));
    }

    @Test
    @DisplayName("Gray Box - filter by price only")
    void shouldBuildPriceOnlyQuery() {
        Map<String, String> query = builder.build(null, 10_000_000.0, "");

        assertEquals(1, query.size());
        assertEquals("10000000", query.get("price[lte]"));
    }

    @Test
    @DisplayName("Gray Box - filter by district only")
    void shouldBuildDistrictOnlyQuery() {
        Map<String, String> query = builder.build(null, null, "Quan 1");

        assertEquals(1, query.size());
        assertEquals("Quan 1", query.get("address.district"));
    }

    @Test
    @DisplayName("Gray Box - combine district and price")
    void shouldBuildCombinedQuery() {
        Map<String, String> query = builder.build(null, 7_000_000.0, "Quan 1");

        assertEquals(2, query.size());
        assertEquals("7000000", query.get("price[lte]"));
        assertEquals("Quan 1", query.get("address.district"));
    }

    @Test
    @DisplayName("Gray Box - empty filters return empty query")
    void shouldReturnEmptyQueryForEmptyFilters() {
        Map<String, String> query = builder.build(null, null, "  ");

        assertTrue(query.isEmpty());
    }
}
