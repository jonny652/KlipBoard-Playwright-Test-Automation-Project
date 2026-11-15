# Test Data

Each JSON file in this folder holds an array of data rows. Tests in `tests/`
loop over these rows, driving one `test.describe` block per row.

## home.json

One row per page to verify. Fields:

| Field   | Required | Description                                              |
|---------|----------|-----------------------------------------------------------|
| `url`   | Yes      | Full URL the test navigates to.                           |
| `title` | No       | Expected `<title>` text. Omit to skip the title assertion.|
| `heading` | No     | Expected text of the page's main heading. Omit to skip.   |

Only `url` is required — every other field is optional, and the matching
assertion in the spec is only registered when that field is present. This
means new rows can be added with partial data without breaking the suite.

## api-endpoints.json

One row per endpoint to check via HTTP (no browser page involved — see `tests/api.spec.ts`). Fields:

| Field            | Required | Description                                              |
|------------------|----------|-----------------------------------------------------------|
| `path`           | Yes      | Path requested against the configured `baseURL`.          |
| `expectedStatus` | Yes      | Expected HTTP status code.                                |
| `contentType`    | No       | Substring expected in the `content-type` response header. Omit to skip. |
| `bodyContains`   | No       | Substring expected in the response body. Omit to skip.    |
