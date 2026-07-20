# AI Development Rules (Antigravity Rulebook)

This document contains the strict operational directives for Antigravity (the AI assistant) when developing, modifying, or interacting with the FreightFlow codebase. These rules override standard AI behaviors and ensure that the codebase remains aligned with the enterprise architecture.

## 1. Documentation First
*   **Always read `PROJECT_SPECIFICATION.md` before coding.** You must understand the overall ecosystem, active bounded contexts, and the current state of the architecture before proposing any implementation.
*   **Keep frontend and backend synchronized with the documentation.** If a feature requires an API change, the `API_SPECIFICATION.md` and `FRONTEND_ARCHITECTURE.md` must be updated alongside the code.

## 2. Architectural Integrity
*   **Never change architecture without approval.** Do not introduce new technologies, databases, ORMs, or global state managers without explicit user approval.
*   **Maintain backward compatibility.** Do not break existing API contracts or database schemas without a documented and approved migration plan.

## 3. Implementation Etiquette
*   **Explain the implementation plan before modifying files.** Never start silently editing or creating files. Present a clear, step-by-step plan for user approval first.
*   **Only implement one module at a time.** Avoid giant cross-domain PRs/changes. Focus on a single bounded context (e.g., `freight/shipments`) before moving to another.
*   **Do not modify unrelated files.** Keep changes strictly scoped to the feature at hand. Do not auto-format or "clean up" unrelated files during a task.

## 4. Code Quality & Business Logic
*   **Never hardcode business logic.** Rules, margins, statuses, and permissions should be dynamic, utilizing the database, constants files, or the designated `PermissionService`.
*   **Reuse existing services and components.** Before creating a new UI component or backend service, search the existing codebase to determine if a generic equivalent already exists (e.g., a shared `BaseRepository` or a UI `Button` atom).
*   **Write tests for new features.** If a new backend service or frontend utility is introduced, it must be accompanied by its corresponding unit test.

## 5. Validation & Safety
*   **After every completed phase, provide a validation report before proceeding.**
*   **Never assume missing requirements.** Always follow the documentation in `/docs`.
*   **If documentation and code conflict, stop and ask for approval before making changes.**
*   **Preserve the existing POC unless explicitly instructed to replace or remove functionality.**
*   **Every implementation must leave the project in a runnable state.** Never leave the codebase partially broken between phases.
