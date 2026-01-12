# Testing Structure

This directory contains all tests for the REGAIN application, organized by test type and feature domain.

## Directory Structure

```
tests/
├── e2e/              # End-to-End tests (Playwright)
├── unit/              # Unit tests (Vitest)
└── integration/      # Integration tests (Vitest)
```

## Test Types

### E2E Tests (`tests/e2e/`)
- **Framework**: Playwright
- **Scope**: Full browser-based user flows
- **Configuration**: `playwright.config.ts`
- **File Pattern**: `*.spec.ts`

### Unit Tests (`tests/unit/`)
- **Framework**: Vitest
- **Scope**: Individual functions, utilities, and business logic
- **Configuration**: `vitest.config.ts`
- **File Pattern**: `*.test.ts`

### Integration Tests (`tests/integration/`)
- **Framework**: Vitest
- **Scope**: Service interactions and API contracts
- **Configuration**: `vitest.config.ts`
- **File Pattern**: `*.test.ts`

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit          # Run once
npm run test:unit:watch    # Watch mode
npm run test:unit:ui       # UI mode
npm run test:unit:coverage # With coverage
```

### E2E Tests Only
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # UI mode
npm run test:e2e:headed    # Headed mode (see browser)
npm run test:e2e:debug     # Debug mode
npm run test:e2e:report    # View HTML report
```

## Test Organization

### Feature-Based Structure
Tests are organized by feature domain:
- `auth/` - Authentication flows
- `onboarding/` - User onboarding
- `athlete/` - Athlete-specific features
- `coach/` - Coach-specific features
- `navigation/` - Cross-cutting navigation

### Page Object Model
E2E tests use Page Object Model pattern:
- `tests/e2e/page-objects/` - Reusable page objects
- `tests/e2e/fixtures/` - Test fixtures and helpers

## Configuration Separation

- **Playwright** (`playwright.config.ts`): Only targets `tests/e2e/**/*.spec.ts`
- **Vitest** (`vitest.config.ts`): Only targets `tests/unit/**/*.test.ts` and `tests/integration/**/*.test.ts`

This ensures no conflicts between test runners.

## Environment Variables

Create a `.env` file in the root directory with test credentials:

```env
TEST_ATHLETE_EMAIL=athlete@test.com
TEST_ATHLETE_PASSWORD=testpass123
TEST_COACH_EMAIL=coach@test.com
TEST_COACH_PASSWORD=testpass123
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

## Writing Tests

### E2E Test Example
```typescript
import { test, expect } from '../fixtures/auth.fixtures';

test('should login successfully', async ({ page, authPage }) => {
  await page.goto('/');
  await authPage.login('user@test.com', 'password');
  await expect(page.locator('#page-home')).toBeVisible();
});
```

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { filterExercisesByDiscipline } from '../../../js/core/workout-engine.js';

describe('filterExercisesByDiscipline', () => {
  it('should filter exercises correctly', () => {
    const exercises = [...];
    const result = filterExercisesByDiscipline(exercises, 'Pilates');
    expect(result).toHaveLength(1);
  });
});
```

## Best Practices

1. **Use fixtures** for common setup (authentication, test data)
2. **Use page objects** for UI interactions
3. **Keep tests isolated** - each test should be independent
4. **Use descriptive test names** - describe what is being tested
5. **Mock external dependencies** in unit tests
6. **Use test data factories** for generating test data

