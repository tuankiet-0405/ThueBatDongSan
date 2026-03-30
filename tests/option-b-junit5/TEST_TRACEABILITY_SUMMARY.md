# JUnit5 Test Traceability Summary

## Tong ket nhanh

- Tong so test da chay: 15
- Failures: 0
- Errors: 0
- Trang thai: PASS (BUILD SUCCESS)

## Mapping yeu cau -> test class -> test methods

| Chuc nang yeu cau | Nhom kiem thu | Test class | Test methods da chay | So test | Ket qua |
|---|---|---|---|---:|---|
| getProperties | White Box | PropertyFilterServiceWhiteBoxTest | shouldFilterApprovedAndSortByPrice, shouldPaginateCorrectly, shouldReturnEmptyForInvalidPaginationInput | 3 | Pass |
| createProperty | Black Box | PropertyValidationServiceBlackBoxTest | validInputShouldPass, missingTitleShouldFail, nonPositivePriceShouldFail, nonPositiveAreaShouldFail | 4 | Pass |
| searchProperties | Gray Box | PropertySearchQueryBuilderGrayBoxTest | shouldBuildAreaOnlyQuery, shouldBuildPriceOnlyQuery, shouldBuildDistrictOnlyQuery, shouldBuildCombinedQuery, shouldReturnEmptyQueryForEmptyFilters | 5 | Pass |
| initializeMap | Gray Box | PropertyMapPresenterGrayBoxTest | shouldUseRealCoordinatesWhenValid, shouldFallbackWhenCoordinatesNull, shouldRejectInvalidRange | 3 | Pass |

## Nguon minh chung chi tiet

1. Tong ket terminal Maven:
- BUILD SUCCESS
- Tests run: 15, Failures: 0, Errors: 0

2. Report XML (Surefire):
- tests/option-b-junit5/java-test-sample/target/surefire-reports/TEST-com.qlchothuetro.testing.whitebox.PropertyFilterServiceWhiteBoxTest.xml
- tests/option-b-junit5/java-test-sample/target/surefire-reports/TEST-com.qlchothuetro.testing.blackbox.PropertyValidationServiceBlackBoxTest.xml
- tests/option-b-junit5/java-test-sample/target/surefire-reports/TEST-com.qlchothuetro.testing.graybox.PropertySearchQueryBuilderGrayBoxTest.xml
- tests/option-b-junit5/java-test-sample/target/surefire-reports/TEST-com.qlchothuetro.testing.graybox.PropertyMapPresenterGrayBoxTest.xml

## Goi y chup hinh bao cao (chi can 3 hinh)

1. Hinh 1: Terminal Maven co dong BUILD SUCCESS va tong ket Tests run/Failures/Errors.
2. Hinh 2: File nay (bang mapping 4 chuc nang).
3. Hinh 3: Thu muc surefire-reports hien 4 file XML theo 4 test class.
