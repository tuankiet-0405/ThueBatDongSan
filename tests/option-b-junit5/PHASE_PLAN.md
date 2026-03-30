# Option B JUnit5 - Phase Plan

## Goal

Build a JUnit5-based testing flow that mirrors the same 4 target functions already tested in Jest:
1. getProperties
2. createProperty
3. searchProperties
4. initializeMap

## Current baseline

- Maven + JUnit5 project is ready.
- Existing sample tests run successfully.
- Current sample now maps 1:1 to all 4 Jest target functions.

## Phase 0 - Scope lock and mapping

Objective:
- Freeze exact scope to avoid rework.

Tasks:
- List the 4 target functions and expected behaviors from Jest tests.
- Build a mapping table: Jest function -> Java service class -> JUnit5 test class.
- Define pass criteria for each function.

Deliverable:
- One mapping table in report.

Exit criteria:
- All 4 functions have clear target classes and tests.

## Phase 1 - White Box parity (getProperties)

Objective:
- Reproduce internal logic tests for filtering, sorting, pagination.

Tasks:
- Keep `PropertyFilterService` as logic core.
- Expand tests for:
  - approved filter on/off
  - sort order
  - pagination edge cases
  - invalid page/limit paths
- Add branch-focused assertions.

Deliverable:
- White Box JUnit5 class aligned to getProperties behavior.

Exit criteria:
- White Box tests green and cover all key branches.

## Phase 2 - Black Box parity (createProperty)

Objective:
- Reproduce input/output validation behavior.

Tasks:
- Keep `PropertyValidationService` as entry validator.
- Expand tests for:
  - valid input -> pass
  - missing title -> fail
  - non-positive price -> fail
  - non-positive area -> fail
  - missing district -> fail
- Add expected message assertions (not only valid/invalid).

Deliverable:
- Black Box JUnit5 class aligned to createProperty validation contract.

Exit criteria:
- Black Box tests green and input-output matrix complete.

## Phase 3 - Gray Box parity A (initializeMap)

Objective:
- Reproduce coordinate and fallback map logic.

Tasks:
- Keep `PropertyMapPresenter` as map logic adapter.
- Expand tests for:
  - valid coordinates used directly
  - null coordinates fallback to default center
  - out-of-range coordinates fallback
  - label mapping behavior

Deliverable:
- Gray Box map tests aligned to initializeMap expectations.

Exit criteria:
- Gray Box map tests green and cover fallback/range logic.

## Phase 4 - Gray Box parity B (searchProperties)

Objective:
- Add missing 4th function equivalent for search/filter flow.

Tasks:
- Create new class `PropertySearchQueryBuilder`.
- Implement query building rules equivalent to Jest searchProperties tests:
  - area filter
  - price filter
  - district filter
  - combined filters
  - empty filter behavior
- Create JUnit5 test class for query builder output assertions.

Deliverable:
- New JUnit5 tests to represent searchProperties behavior.

Exit criteria:
- 4/4 target functions now have JUnit5 equivalents.

## Phase 5 - Evidence and reporting

Objective:
- Produce final artifacts for submission.

Tasks:
- Run `mvn test` and capture terminal output.
- Capture evidence screenshots:
  - full test summary (BUILD SUCCESS)
  - Tests run / Failures / Errors summary
  - project tree and key test files
- Write final result table by phase.

Deliverable:
- Evidence section ready for report.

Exit criteria:
- Report has clear proof and traceability from requirement -> test -> result.

## Phase 6 - Final packaging

Objective:
- Make grading easy for reviewer.

Tasks:
- Add short README section: how to run in one command.
- Add matrix table: Requirement -> Test class -> Status.
- Add known limitations section (if any).

Deliverable:
- Final clean package for submission.

Exit criteria:
- Reviewer can run and verify in less than 5 minutes.

## Suggested execution order

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6

## Suggested quick command set

- `mvn test`
- `mvn -q test`
