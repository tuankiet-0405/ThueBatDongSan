package com.qlchothuetro.testing.model;

public class Property {
    private final String id;
    private final String title;
    private final String district;
    private final double price;
    private final double area;
    private final boolean approved;
    private final Double lng;
    private final Double lat;

    public Property(String id, String title, String district, double price, double area, boolean approved, Double lng, Double lat) {
        this.id = id;
        this.title = title;
        this.district = district;
        this.price = price;
        this.area = area;
        this.approved = approved;
        this.lng = lng;
        this.lat = lat;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDistrict() {
        return district;
    }

    public double getPrice() {
        return price;
    }

    public double getArea() {
        return area;
    }

    public boolean isApproved() {
        return approved;
    }

    public Double getLng() {
        return lng;
    }

    public Double getLat() {
        return lat;
    }
}
