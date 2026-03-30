package com.qlchothuetro.testing.service;

public class PropertyValidationService {

    public ValidationResult validateCreateInput(String title, double price, double area, String district) {
        if (title == null || title.trim().isEmpty()) {
            return new ValidationResult(false, "Title is required");
        }
        if (price <= 0) {
            return new ValidationResult(false, "Price must be greater than 0");
        }
        if (area <= 0) {
            return new ValidationResult(false, "Area must be greater than 0");
        }
        if (district == null || district.trim().isEmpty()) {
            return new ValidationResult(false, "District is required");
        }
        return new ValidationResult(true, "Valid input");
    }

    public record ValidationResult(boolean valid, String message) {}
}
