# TODO: Backend IP Validation for Voting

## Tasks
- [x] Update app.js to set trust proxy for accurate IP handling
- [x] Modify routes/contests.js vote endpoint to accept and validate client IP from request body
- [x] Test the voting functionality to ensure IP validation works correctly

## Details
- In app.js: Add `app.set('trust proxy', true);` after app initialization.
- In routes/contests.js: Update the POST /:contestId/vote endpoint to:
  - Accept `ip` field in req.body.
  - Validate the IP using a regex for IPv4/IPv6.
  - Use the validated IP as voterId instead of req.ip.
  - Return appropriate error if IP is invalid.
- Validation: Use a simple regex to check if IP is valid IPv4 or IPv6.
- Followup: Ensure no new dependencies are needed; use built-in methods.
