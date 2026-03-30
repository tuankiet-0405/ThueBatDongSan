package com.qlchothuetro.testing.whitebox;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.qlchothuetro.testing.model.Property;
import com.qlchothuetro.testing.service.PropertyFilterService;

class PropertyFilterServiceWhiteBoxTest {

    private final PropertyFilterService service = new PropertyFilterService();

    @Test
    @DisplayName("White Box - filter approved and sort by price")
    void shouldFilterApprovedAndSortByPrice() {
        List<Property> input = List.of(
                new Property("1", "A", "Quan 1", 6_000_000, 20, true, 106.7, 10.7),
                new Property("2", "B", "Quan 1", 4_000_000, 18, false, 106.8, 10.8),
                new Property("3", "C", "Quan 2", 5_000_000, 25, true, 106.9, 10.9)
        );

        List<Property> output = service.getApprovedSortedByPrice(input);

        assertEquals(2, output.size());
        assertEquals("3", output.get(0).getId());
        assertEquals("1", output.get(1).getId());
    }

    @Test
    @DisplayName("White Box - pagination branch for page 2")
    void shouldPaginateCorrectly() {
        List<Property> input = List.of(
                new Property("1", "A", "Quan 1", 5_000_000, 20, true, 106.7, 10.7),
                new Property("2", "B", "Quan 1", 6_000_000, 22, true, 106.8, 10.8),
                new Property("3", "C", "Quan 1", 7_000_000, 24, true, 106.9, 10.9)
        );

        List<Property> page2 = service.paginate(input, 2, 2);

        assertEquals(1, page2.size());
        assertEquals("3", page2.get(0).getId());
    }

    @Test
    @DisplayName("White Box - invalid pagination inputs return empty")
    void shouldReturnEmptyForInvalidPaginationInput() {
        List<Property> output = service.paginate(List.of(), 0, 0);
        assertTrue(output.isEmpty());
    }
}
