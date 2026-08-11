# EPIC 27 â API Consistency and Error Contract

## Epic Scope
Standard API response shapes, error codes, pagination, filtering, and sorting conventions.

**Explanation:** This prevents frontend pain. A consistent API means the Next.js app can handle errors and lists predictably.

## Feature 27.1 â Error Contract

### Domain Rules
- Validation errors use Laravel-style field errors.
- Domain errors use stable error codes.
- Auth errors are consistent.

### Standard Errors
- `AUTHENTICATION_REQUIRED`
- `FORBIDDEN`
- `WORKSPACE_HEADER_MISSING`
- `WORKSPACE_NOT_FOUND`
- `WORKSPACE_ACCESS_DENIED`
- `PERMISSION_DENIED`
- `VALIDATION_ERROR`
- `INVALID_STATUS_TRANSITION`
- `PLAN_LIMIT_REACHED`
- `RESOURCE_NOT_FOUND`

### Example
```json
{
  "message": "Invalid task status transition.",
  "code": "INVALID_STATUS_TRANSITION"
}
```

## Feature 27.2 â Pagination Contract

### Domain Rules
- All list endpoints use the same pagination shape.

### Response Shape
```json
{
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100
  }
}
```

## Feature 27.3 â Filtering and Sorting Contract

### Domain Rules
- Use consistent query parameters.
- Unsupported sort/filter should fail clearly or be ignored consistently.

### Examples
- `?filter[status]=TODO`
- `?filter[project_id]=...`
- `?sort=-created_at`

---
