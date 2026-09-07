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

**Do not** `chown -R 1000:1000 keys/` — that makes `keys/README.md` (tracked by
git) unwritable for the deploy user and breaks `git pull`.

Own **only the PEM files** as UID 1000; keep the directory + README as the
deploy user:

```bash
sudo chown 1000:1000 keys/*.pem
sudo chmod 600 keys/*-private.pem
sudo chmod 644 keys/*-public.pem
# keys/ and keys/README.md stay owned by your SSH deploy user (e.g. zenora)
```

Then recreate the API container.

Production: generate once per environment, store in a secret manager, rotate
with overlapping public keys if you ever change the pair.
