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

## Docker / VPS permissions

The production image runs as UID **1000** (`node`). Private PEMs with mode `600`
are only readable by their owner. If the host user is not UID 1000, the
container gets `EACCES` on boot.

Fix once on the host (repo root):

```bash
sudo chown -R 1000:1000 keys/
chmod 600 keys/*-private.pem
chmod 644 keys/*-public.pem
```

Then recreate the API container.

Production: generate once per environment, store in a secret manager, rotate
with overlapping public keys if you ever change the pair.
