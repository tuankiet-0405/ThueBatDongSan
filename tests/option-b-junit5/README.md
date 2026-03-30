# Phuong an B - JUnit5

Folder nay dung de chuan bi phuong an theo dung yeu cau "Dung JUnit5" trong de tai.

## Muc tieu

- Chuyen doi hoac bo sung bo test sang JUnit5.
- Trinh bay du 3 nhom kiem thu: hop trang, hop den, hop xam.
- Co minh chung chay test va tong ket ket qua.

## Goi y cau truc

- `docs/`: tai lieu thiet ke test, mapping test case.
- `java-test-sample/`: module Java mau su dung JUnit5.
- `evidence/`: anh chup man hinh, log terminal, ket qua chay test.

## Trang thai

- [x] Tao folder phuong an B
- [x] Tao khung module JUnit5
- [x] Viet test mau White Box / Black Box / Gray Box
- [x] Chay test va thu thap minh chung

## Cach chay JUnit5 sample

Lo trinh theo phase: xem file `PHASE_PLAN.md`.

Di chuyen vao folder:

`tests/option-b-junit5/java-test-sample`

Lenh chay:

`mvn test`

Test hien co:

- White Box: `PropertyFilterServiceWhiteBoxTest`
- Black Box: `PropertyValidationServiceBlackBoxTest`
- Gray Box: `PropertyMapPresenterGrayBoxTest`
- Gray Box: `PropertySearchQueryBuilderGrayBoxTest`

Tong ket hien tai:

- Tests run: 15
- Failures: 0
- Errors: 0
- BUILD SUCCESS

## Minh chung can chup cho bao cao

1. Man hinh terminal co lenh `mvn test` va dong tong ket `BUILD SUCCESS`.
2. Man hinh terminal hien dong tong ket test (Tests run, Failures, Errors).
3. Anh cau truc folder JUnit5 trong `tests/option-b-junit5/java-test-sample`.
4. Anh file test cua 4 chuc nang (getProperties, createProperty, initializeMap, searchProperties).
