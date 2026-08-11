# AGENTS.md — Master Project Standards & AI Agent Rules

This document outlines the architecture, coding standards, pattern constraints, and quality expectations for AI agents working on this multi-tenant SaaS application across both the **Laravel Backend** (`server/`) and **Next.js Frontend** (`client/`).

---

## 1. Core Architecture & Design Philosophy

- **Decoupled Architecture:** Laravel serves strictly as a stateless REST API backend (Business Logic, Auth, Storage, Queues, WebSockets). Next.js (App Router) handles UI, Rendering, and Client-Side State.
- **Strict Multi-Tenancy:** Data isolation is a non-negotiable hard boundary. Never write queries, mutations, or API handlers that bypass tenant/workspace scoping (`workspace_id`, `tenant_id`, or active DB context).
- **Keep It Simple (KISS):** Prefer explicit, readable, single-purpose implementations over complex abstraction layers.
- **Don't Repeat Yourself (DRY):** Extract repetitive logic into reusable functions, custom hooks, or PHP traits—avoid premature abstraction if logic is used in only one context.
- **Single Responsibility Principle (SRP):** Each class, action, custom hook, or component must fulfill **one single responsibility**.
- **Strict Typing:**
  - **PHP:** Every PHP file MUST start with `declare(strict_types=1);`. Always declare parameter types, return types, and class property types.
  - **TypeScript:** Never use `any` or `unknown` without explicit type guards. Define strict types/interfaces for all models, component props, and API payloads.

---

## 2. Laravel Backend Standards (`server/`)

### Actions over Controllers (Domain-Driven Operations)
- **Skinny Controllers:** Controllers handle HTTP routing, request handoff, and resource delivery. **No business logic in controllers.**
- **Single-Purpose Actions (`app/Actions` or Domain Actions):**
  - Implement core business logic inside dedicated Action classes (e.g., `app/Actions/Projects/CreateProjectAction.php`).
  - Use single-method classes (`handle()` or `execute()`) or `__invoke()`.
  - Actions must be clean, unit-testable, and reusable across APIs, CLI commands, and asynchronous jobs.
- **Data Transfer Objects (DTOs):**
  - Group structured inputs into typed DTOs (`app/Data/` or `app/DTOs/`) before passing them into Actions. Do not pass raw `Request` objects into domain actions.

### Validation, Requests & API Responses
- **Form Requests (`app/Http/Requests`):** Always validate incoming API payloads using dedicated `FormRequest` classes. Never validate inline inside controllers or actions.
- **API Resources (`app/Http/Resources`):**
  - Never expose raw Eloquent models. Always transform output with API Resources.
  - Exclude internal fields (e.g., password hashes, soft-delete flags, internal flags) unless required.
- **Standardized API Envelope:**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {},
    "errors": null
  }
  ```

### Database, Queries & Multi-Tenancy
- **Tenant Scope Enforcement:**
  - Every tenant-aware Eloquent model must include a `BelongsToWorkspace` / `BelongsToTenant` scope or trait.
  - Never execute raw SQL (`DB::raw()`) without explicit tenant/workspace placeholders and bindings.
- **Query Optimization & N+1 Prevention:**
  - Always eager-load relationships (`with(['user', 'tasks'])`) when returning collections.
  - Use `withExists()` and `withCount()` for boolean flags and counters instead of fetching full relations.
  - Enable `Model::preventLazyLoading(!app()->isProduction());` in development.
- **Database Migrations:**
  - All foreign key relations must specify cascade behavior (`onDelete('cascade')` or `nullOnDelete()`).
  - Include compound indexes for tenant-scoped queries: `$table->index(['workspace_id', 'created_at']);`.

---

## 3. Next.js Frontend Standards (`client/`)

### Component Architecture & Modular Splitting
- **100-150 Line Component Rule:** Keep components concise (**< 100-150 lines**). Whenever a UI section or block contains a non-trivial amount of code, extract it into a separate, focused sub-component.
- **Feature-First Directory Structure:**
  ```text
  client/
  ├── features/
  │   └── chat/
  │       ├── components/    # ChatMessageArea.tsx, ChatSidebar.tsx, ConversationSidebarItem.tsx
  │       ├── hooks/         # useMentions.ts, useAudioRecorder.ts
  │       ├── types/         # index.ts
  │       └── api/           # chat.api.ts
  ├── components/            # App-wide UI primitives (Button, Modal, Input, UserAvatar)
  └── lib/                   # Utility clients (apiClient, queryClient)
  ```
- **Atomic UI Primitives:** Design reusable base UI elements (Buttons, Inputs, Modals) using headless libraries (Radix UI, Headless UI, or Shadcn) so feature components stay focused on product domain logic.

### Server Components (RSC) vs. Client Components
- **Server First Principle:** Keep components as **Server Components (RSC)** by default for faster initial loading and smaller bundle sizes.
- **When to use `'use client'`:**
  - Interactivity and event listeners (`onClick`, `onChange`, `onSubmit`).
  - State hooks (`useState`, `useReducer`, `useEffect`).
  - Custom hooks relying on browser APIs or React context (`useTenant()`, `useCurrentUser()`).
  - Client-side interactive libraries (e.g., drag-and-drop boards, chat voice players).
- **Leaf Component Rule:** Push `'use client'` as far down the component tree as possible. Do not mark an entire page or layout as `'use client'` just because a single child button needs an event listener.

### Data Fetching, State & Async Safety
- **Zero Logic in JSX:** Keep render functions clean and readable. Move side effects, state transitions, and API calls into custom hooks or helper functions.
- **Async Cancellation & Race-Condition Safety:** Any `useEffect` fetching async data on dependency changes MUST implement `isCancelled` cleanup flags to prevent out-of-order state overwrites.
- **Stale Prop Guards:** UI components rendering list details must validate that prop data matches the active resource ID before executing layout or scroll calculations.
- **Form Management:** Use **React Hook Form** paired with **Zod** schema validation matching backend `FormRequest` rules.
- **TypeScript Rigor:** Maintain matching TypeScript interfaces for all Laravel API Resource responses. Never use `any`.

---

## 4. UI & Design System Standards

- **Non-Overflow Floating UI:** Dropdowns, popovers, context menus, and tooltips MUST use `fixed` positioning with viewport boundary checking (`getBoundingClientRect()`) to prevent clipping inside `overflow-hidden` or `overflow-y-auto` containers.
- **Dark Mode Completeness:** Every component MUST fully support both light mode and dark mode styling (e.g., `bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10`).
- **Modern Palette & Micro-Animations:**
  - Use curated Tailwind color scales (`zinc-500`, `blue-600`, `emerald-500`) instead of raw uncurated browser defaults.
  - Implement subtle micro-animations for hover and active states (`transition-all duration-150 animate-in fade-in`).

---

## 5. Code Cleanliness & Quality Guardrails

### Clean Code Practices
- **Self-Documenting Code:** Choose clear, descriptive names over short abbreviations (e.g., `calculateProjectProgressPercentage()` instead of `calcPct()`).
- **Early Returns / Guard Clauses:** Avoid deeply nested `if/else` structures. Handle failure paths early and exit.
  ```php
  // BAD
  if ($user) {
      if ($user->hasTenantAccess($tenantId)) {
          return $this->processData();
      }
  }

  // GOOD
  if (!$user || !$user->hasTenantAccess($tenantId)) {
      throw new UnauthorizedAccessException();
  }
  return $this->processData();
  ```
- **Comment Strategy:** Code should explain *what* is happening through clarity. Write comments only to explain non-obvious *why* decisions or complex domain logic (such as async race-condition timelines).

---

## 6. Agent Workflow & Execution Rules

1. **Check Existing Dependencies First:** Inspect `composer.json` and `package.json` before introducing new libraries. Prefer native features or existing installed packages.
2. **Targeted Refactoring:** Touch **only** the files required for the specified task. Do not reformat, rewrite, or restyle unrelated files unless explicitly instructed.
3. **Automated Testing Requirements:**
   - **Backend:** Every new Action or API endpoint requires a corresponding **Pest** (or PHPUnit) test verifying happy paths, validation failures, and tenant access boundaries.
   - **Frontend:** Verify TypeScript compilation (`tsc --noEmit`) and component rendering without syntax errors.
4. **No Hallucinated API Endpoints:** Ensure API paths in Next.js match actual routes defined in Laravel `routes/api.php`.