# JWT RSA key material

Generate RS256 pairs with:

```bash
npm run keys:generate
```

Files under `keys/` (gitignored PEMs):

- `jwt-access-private.pem` / `jwt-access-public.pem`
- `jwt-refresh-private.pem` / `jwt-refresh-public.pem`

Do not commit PEMs. Do not `COPY` them into the Docker image. Compose mounts
`./keys:/app/keys` and the app reads `JWT_*_KEY_PATH`.

## Docker / VPS permissions

The production image runs as UID **1000** (`node`). Private PEMs with mode `600`
are only readable by their owner.

**Do not** `chown -R 1000:1000 keys/` — that blocks the deploy user from
updating the checkout. Own **only the PEM files** as UID 1000:

```bash
sudo chown 1000:1000 keys/*.pem
sudo chmod 600 keys/*-private.pem
sudo chmod 644 keys/*-public.pem
# keep the keys/ directory owned by the SSH deploy user
sudo chown "$(id -un):$(id -gn)" keys
```

Then recreate the API container.

Production: generate once per environment, store in a secret manager, rotate
with overlapping public keys if you ever change the pair.
