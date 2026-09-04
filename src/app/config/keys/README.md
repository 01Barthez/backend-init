# Do not store JWT material here

RS256 PEMs live at the repository root: `keys/jwt-*.pem`
(`npm run keys:generate`). Runtime reads `JWT_*_KEY_PATH` only.

This directory is intentionally empty of key files.
