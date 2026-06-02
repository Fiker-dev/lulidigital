# Google Business Profile Blog Automation

The blog workflow can publish a Google Business Profile LocalPost after each generated article.

## Required GitHub Secrets

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_ACCOUNT_ID`
- `GOOGLE_LOCATION_ID`

## Google Approval Status

Google Business Profile API projects can return `RESOURCE_EXHAUSTED` with `0 QPM` until Google approves API access. The workflow detects that quota state and skips the LocalPost so the blog automation can keep running.

After approval, confirm the quota has changed from `0 QPM` to an approved value, then run the workflow again.

## LocalPost Payload

Each Google Business Profile post is a standard update with:

- the generated article title
- the generated meta description
- a `LEARN_MORE` call-to-action pointing to the article URL

## Token Safety

If OAuth tokens or client secrets were visible in screenshots or chat, rotate the OAuth client secret and generate a fresh refresh token before adding the values to GitHub Secrets.
