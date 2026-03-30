package com.qlchothuetro.testing.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import com.qlchothuetro.testing.model.Property;

public class PropertyFilterService {

    public List<Property> getApprovedSortedByPrice(List<Property> input) {
        if (input == null || input.isEmpty()) {
            return List.of();
        }

        return input.stream()
                .filter(Objects::nonNull)
                .filter(Property::isApproved)
                .sorted(Comparator.comparingDouble(Property::getPrice))
                .collect(Collectors.toList());
    }

    public List<Property> paginate(List<Property> input, int page, int limit) {
        if (input == null || input.isEmpty() || page <= 0 || limit <= 0) {
            return List.of();
        }

        int fromIndex = (page - 1) * limit;
        if (fromIndex >= input.size()) {
            return List.of();
        }

        int toIndex = Math.min(fromIndex + limit, input.size());
        return new ArrayList<>(input.subList(fromIndex, toIndex));
    }
}
