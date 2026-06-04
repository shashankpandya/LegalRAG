```markdown
# LegalRAG Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill provides guidance on the development conventions and workflows used in the LegalRAG TypeScript codebase. It covers file naming, import/export styles, commit patterns, and testing practices, ensuring consistency and maintainability across the project.

## Coding Conventions

### File Naming

- Use **kebab-case** for all file names.
  - Example:  
    ```
    legal-rag-service.ts
    user-profile-handler.ts
    ```

### Import Style

- Use **alias imports** for modules.
  - Example:
    ```typescript
    import { fetchData as getData } from './data-utils';
    ```

### Export Style

- Use **named exports** for functions, classes, and constants.
  - Example:
    ```typescript
    // In user-service.ts
    export function createUser() { ... }
    export const USER_ROLE = 'admin';
    ```

### Commit Patterns

- Commit messages are freeform, with no strict prefix requirements.
- Average commit message length: ~41 characters.
  - Example:
    ```
    Add user authentication middleware
    Fix bug in document parser
    ```

## Workflows

### Adding a New Feature
**Trigger:** When implementing a new feature or module  
**Command:** `/add-feature`

1. Create a new file using kebab-case (e.g., `new-feature.ts`).
2. Use alias imports for dependencies.
3. Export all functions/classes using named exports.
4. Write or update corresponding tests in a `*.test.ts` file.
5. Commit changes with a clear, concise message.

### Refactoring Code
**Trigger:** When improving or restructuring existing code  
**Command:** `/refactor`

1. Identify files to refactor.
2. Ensure file names follow kebab-case.
3. Update imports to use aliases where appropriate.
4. Use named exports consistently.
5. Update or add tests if necessary.
6. Commit with a descriptive message.

### Writing Tests
**Trigger:** When adding or updating tests  
**Command:** `/write-test`

1. Create or update a test file matching `*.test.ts`.
2. Write test cases for new or modified functionality.
3. Ensure all tests pass before committing.
4. Commit with a message indicating the test changes.

## Testing Patterns

- Test files follow the `*.test.ts` naming convention.
- The specific testing framework is not detected; use standard TypeScript testing practices.
- Example test file:
  ```typescript
  // user-service.test.ts
  import { createUser } from './user-service';

  describe('createUser', () => {
    it('should create a user with default role', () => {
      const user = createUser('Alice');
      expect(user.role).toBe('admin');
    });
  });
  ```

## Commands

| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /add-feature   | Scaffold and implement a new feature/module  |
| /refactor      | Refactor existing code for consistency       |
| /write-test    | Add or update tests for code changes         |
```