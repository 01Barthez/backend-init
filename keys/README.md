# JWT RSA key material

Generate RS256 pairs with:

```bash
npm run keys:generate
```

Files (gitignored):

- `jwt-access-private.pem` / `jwt-access-public.pem`
- `jwt-refresh-private.pem` / `jwt-refresh-public.pem`

Do not commit PEMs. Do not `COPY` them into the Docker image. Mount
`./keys:/app/keys` (or inject via secrets) and set `JWT_*_KEY_PATH`.

Production: generate once per environment, store in a secret manager, rotate
with overlapping public keys if you ever change the pair.
