package com.qlchothuetro.testing.graybox;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.qlchothuetro.testing.model.Property;
import com.qlchothuetro.testing.service.PropertyMapPresenter;

class PropertyMapPresenterGrayBoxTest {

    private final PropertyMapPresenter presenter = new PropertyMapPresenter();

    @Test
    @DisplayName("Gray Box - valid coordinates should be used")
    void shouldUseRealCoordinatesWhenValid() {
        Property property = new Property("1", "Phong tro Q1", "Quan 1", 5_000_000, 20, true, 106.701, 10.78);

        var marker = presenter.toMarkerPayload(property);

        assertEquals(106.701, marker.lng());
        assertEquals(10.78, marker.lat());
        assertEquals("Phong tro Q1", marker.label());
    }

    @Test
    @DisplayName("Gray Box - null coordinates should fallback to default")
    void shouldFallbackWhenCoordinatesNull() {
        Property property = new Property("2", "Phong tro Q2", "Quan 2", 4_500_000, 18, true, null, null);

        var marker = presenter.toMarkerPayload(property);

        assertEquals(PropertyMapPresenter.DEFAULT_LNG, marker.lng());
        assertEquals(PropertyMapPresenter.DEFAULT_LAT, marker.lat());
    }

    @Test
    @DisplayName("Gray Box - range guard should reject invalid lat lng")
    void shouldRejectInvalidRange() {
        assertTrue(!presenter.isInValidRange(200, 95));
    }
}
