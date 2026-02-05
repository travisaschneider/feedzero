# Comprehensive Test Audit Prompt

Use this prompt to audit all tests in the codebase for behavior-testing compliance, traceability to features, and documentation alignment.

---

## Prompt

You are performing a comprehensive audit of all tests in this codebase. Your goal is to ensure every test:

1. **Tests behavior, not implementation** — asserts on user-observable outcomes
2. **Is traceable** — can be linked to a documented feature or technical requirement
3. **Matches documentation** — Gherkin scenarios in feature docs align with actual test coverage

### Phase 1: Inventory All Tests

For each test file in `tests/`:

1. List every test case by name
2. Categorize each test:
   - **Unit test** (tests a pure function or isolated module)
   - **Store test** (tests Zustand store actions/state)
   - **Component test** (tests React component rendering/behavior)
   - **Integration test** (tests multiple modules working together)
   - **E2E test** (tests full user flows in browser)

### Phase 2: Detect Anti-Patterns

Flag any test that exhibits these anti-patterns:

#### Anti-Pattern 1: Mock Function Assertions in Component Tests
```typescript
// BAD: Asserts mock was called instead of observable outcome
const mockSelectFeed = vi.fn();
useFeedStore.setState({ selectFeed: mockSelectFeed });
renderPage("/feeds/feed-1");
expect(mockSelectFeed).toHaveBeenCalledWith("feed-1"); // ❌
```

**Detection:** Search for patterns like:
- `expect(mock*).toHaveBeenCalledWith` in component/page tests
- `vi.fn()` assigned to store methods that are then asserted on
- Comments like "// This tests that X was called" in component tests

**Fix:** Assert on the observable outcome instead:
```typescript
// GOOD: Asserts on observable state change
renderPage("/feeds/feed-1");
expect(useFeedStore.getState().selectedFeedId).toBe("feed-1"); // ✓
```

#### Anti-Pattern 2: Weakened Assertions with Apologetic Comments
```typescript
// BAD: Comment admits the test doesn't verify actual behavior
await vi.waitFor(() => {
  expect(currentUrl).toMatch(/^\/feeds\/feed-1/); // ❌ partial match
});
// Note: auto-select may redirect back, so we check the navigation happened
```

**Detection:** Search for:
- `toMatch` where `toBe` should be used
- Comments containing "may", "might", "could", "redirect back", "workaround"
- Comments explaining why the assertion is weaker than expected

**Fix:** If the comment describes a bug, write a test that fails, fix the bug, then the test passes:
```typescript
// GOOD: Asserts exact expected behavior
await vi.waitFor(() => {
  expect(currentUrl).toBe("/feeds/feed-1"); // ✓ exact match
});
// Wait to ensure no unwanted redirect
await act(async () => { await new Promise(r => setTimeout(r, 50)); });
expect(currentUrl).toBe("/feeds/feed-1"); // ✓ still there
```

#### Anti-Pattern 3: Testing Implementation Details in Integration Tests
```typescript
// BAD: Tests internal state machine instead of user-visible effect
expect(useSyncStore.getState().status).toBe("syncing"); // ❌
```

**Context matters:**
- In a **store unit test**, this is acceptable — the store's state IS its observable output
- In a **component/integration test**, assert on what the user sees (loading spinner, status chip color, etc.)

#### Anti-Pattern 4: Incomplete Code Path Coverage
```typescript
// BAD: Only tests click handler, not keyboard shortcut
it("toggles view when clicking button", async () => { ... }); // ✓
// Missing: test for pressing "E" key — keyboard path could have different behavior
```

**Detection:** For each user action, verify ALL code paths are tested:
- Click handler AND keyboard shortcut
- Direct function call AND event-triggered call
- Success path AND error path

**Fix:** Add cross-path parity tests:
```typescript
it("E key and click both trigger extraction", async () => {
  // Test keyboard path
  pressKey("e");
  const keyboardResult = getExtractionState();
  
  // Reset
  resetState();
  
  // Test click path
  clickViewToggle();
  const clickResult = getExtractionState();
  
  // Both paths must produce identical outcomes
  expect(keyboardResult).toEqual(clickResult);
});
```

#### Anti-Pattern 5: Missing Real-World Conditions
```typescript
// BAD: Test passes because mock returns empty array
vi.mock("@/core/storage/db.ts", () => ({
  getArticles: vi.fn().mockResolvedValue({ ok: true, value: [] }), // ❌
}));
// Bug only manifests when articles exist!
```

**Detection:** Check if tests pass trivially because:
- Mocks return empty arrays/objects
- Async operations never complete
- State is never populated

**Fix:** Mock realistic data that exercises the code path:
```typescript
// GOOD: Mock returns data that exercises the bug
const articles = [makeArticle("art-1"), makeArticle("art-2")];
vi.mocked(db.getArticles).mockResolvedValue({ ok: true, value: articles });
```

### Phase 3: Trace Tests to Features

For each test, identify:

1. **Which feature doc** (`docs/features/*.md`) describes this behavior?
2. **Which Gherkin scenario** does this test implement?
3. If no feature doc exists, **is one needed**?

Create a traceability matrix:

| Test File | Test Name | Feature Doc | Gherkin Scenario | Status |
|-----------|-----------|-------------|------------------|--------|
| `feeds-page-behavior.test.tsx` | "Back button navigates from article to article list and stays there" | `010-mobile-navigation.md` | "Back from article shows article list" | ✓ Aligned |
| `keyboard-ui-parity.test.tsx` | "E key and click both trigger extraction" | `009-keyboard-navigation.md` | "Toggle view via keyboard shortcut" | ✓ Aligned |
| ... | ... | ... | ... | ... |

### Phase 4: Align Documentation

For each feature doc in `docs/features/`:

1. Read all Gherkin scenarios
2. For each scenario, find the corresponding test(s)
3. If a scenario has no test: **write one**
4. If a test has no scenario: **add the scenario to the doc**
5. Ensure scenario wording matches test name closely

Example alignment:
```gherkin
# In docs/features/010-mobile-navigation.md
Scenario: Back from article shows article list
  Given the user is viewing an article on mobile
  When the user taps the Back button
  Then the article list is displayed
  And the user is not auto-redirected to an article
```

```typescript
// In tests/pages/feeds-page-behavior.test.tsx
it("Back button navigates from article to article list and stays there", async () => {
  // Given: viewing an article on mobile
  mockIsDesktop = false;
  const articles = [makeArticle("art-1"), makeArticle("art-2")];
  vi.mocked(db.getArticles).mockResolvedValue({ ok: true, value: articles });
  renderPage("/feeds/feed-1/articles/art-2");
  
  // When: tap Back button
  const backBtn = findBackButton(container);
  await act(async () => { backBtn.click(); });
  
  // Then: article list displayed, no auto-redirect
  await vi.waitFor(() => {
    expect(currentUrl).toBe("/feeds/feed-1");
  });
  await act(async () => { await new Promise(r => setTimeout(r, 50)); });
  expect(currentUrl).toBe("/feeds/feed-1"); // Still there
});
```

### Phase 5: Fix and Re-implement

For each flagged issue:

1. **RED**: Write/rewrite the test to assert correct behavior — it MUST fail first
2. **GREEN**: Fix the production code to make the test pass
3. **REFACTOR**: Clean up the code
4. **DOCUMENT**: Update feature doc if needed

### Phase 6: Verify Completeness

Run these checks:

```bash
# All tests pass
npm test

# Type check passes
npx tsc --noEmit

# Coverage meets thresholds
npm run test:coverage

# E2E tests pass
npm run test:e2e
```

### Phase 7: Generate Report

Output a summary:

```markdown
## Test Audit Report

### Tests Reviewed: X
### Issues Found: Y
### Issues Fixed: Z

### Anti-Patterns Found:
- Mock function assertions: N instances (fixed)
- Weakened assertions: N instances (fixed)
- Missing code path coverage: N instances (fixed)
- Missing realistic test data: N instances (fixed)

### Traceability:
- Tests with matching feature docs: N
- Tests missing feature docs: N (created)
- Feature scenarios missing tests: N (implemented)

### Documentation Updates:
- Feature docs updated: [list]
- New feature docs created: [list]
- CLAUDE.md updated: [yes/no]
```

---

## Checklist for Each Test

- [ ] Test name describes **observable behavior**, not implementation detail
- [ ] Assertions verify **user-visible outcomes** (UI, URL, persisted state)
- [ ] No mock function assertions in component/integration tests
- [ ] No apologetic comments explaining why assertion is weak
- [ ] All code paths for user action are tested (click, keyboard, programmatic)
- [ ] Test uses realistic mock data that exercises the code path
- [ ] Test can be traced to a feature doc and Gherkin scenario
- [ ] Feature doc scenario wording aligns with test name

---

## Red Flags to Search For

```bash
# Mock function assertions in page/component tests
grep -r "expect(mock" tests/pages/ tests/components/

# Apologetic comments
grep -r "// Note:" tests/
grep -r "// TODO" tests/
grep -r "// FIXME" tests/
grep -r "// workaround" tests/
grep -r "may redirect" tests/

# Partial matchers where exact would be better
grep -r "toMatch(" tests/pages/ tests/components/
grep -r "toContain(" tests/pages/ tests/components/

# Empty mock returns
grep -r "mockResolvedValue({ ok: true, value: \[\] })" tests/

# Store method replacements
grep -r "setState({ .* vi.fn()" tests/
```

Run these searches at the START of the audit to quickly identify problem areas.
