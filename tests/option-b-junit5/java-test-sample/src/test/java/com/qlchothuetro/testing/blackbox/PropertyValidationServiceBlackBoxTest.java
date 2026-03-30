package com.qlchothuetro.testing.blackbox;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.qlchothuetro.testing.service.PropertyValidationService;

class PropertyValidationServiceBlackBoxTest {

    private final PropertyValidationService service = new PropertyValidationService();

    @Test
    @DisplayName("Black Box - valid input should pass")
    void validInputShouldPass() {
        var result = service.validateCreateInput("Phong tro quan 1", 5_000_000, 20, "Quan 1");
        assertTrue(result.valid());
    }

    @Test
    @DisplayName("Black Box - missing title should fail")
    void missingTitleShouldFail() {
        var result = service.validateCreateInput(" ", 5_000_000, 20, "Quan 1");
        assertFalse(result.valid());
    }

    @Test
    @DisplayName("Black Box - non-positive price should fail")
    void nonPositivePriceShouldFail() {
        var result = service.validateCreateInput("Phong tro", 0, 20, "Quan 1");
        assertFalse(result.valid());
    }

    @Test
    @DisplayName("Black Box - non-positive area should fail")
    void nonPositiveAreaShouldFail() {
        var result = service.validateCreateInput("Phong tro", 4_000_000, -10, "Quan 1");
        assertFalse(result.valid());
    }
}
