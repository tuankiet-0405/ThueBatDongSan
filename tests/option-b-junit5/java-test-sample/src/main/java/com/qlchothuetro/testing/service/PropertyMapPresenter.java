package com.qlchothuetro.testing.service;

import com.qlchothuetro.testing.model.Property;

public class PropertyMapPresenter {

    public static final double DEFAULT_LNG = 106.7000;
    public static final double DEFAULT_LAT = 10.7769;

    public MarkerPayload toMarkerPayload(Property property) {
        if (property == null || property.getLng() == null || property.getLat() == null) {
            return new MarkerPayload(DEFAULT_LNG, DEFAULT_LAT, "Unknown property");
        }

        double lng = property.getLng();
        double lat = property.getLat();

        if (!isInValidRange(lng, lat)) {
            return new MarkerPayload(DEFAULT_LNG, DEFAULT_LAT, property.getTitle());
        }

        return new MarkerPayload(lng, lat, property.getTitle());
    }

    public boolean isInValidRange(double lng, double lat) {
        return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
    }

    public record MarkerPayload(double lng, double lat, String label) {}
}
