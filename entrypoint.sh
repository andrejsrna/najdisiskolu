#!/bin/sh
set -e

echo "==> Aplikujem databázové migrácie (prisma migrate deploy)..."
node_modules/.bin/prisma migrate deploy

echo "==> Seed dát (preskočí sa, ak DB už obsahuje školy)..."
node_modules/.bin/prisma db seed

echo "==> Spúšťam Next.js..."
exec node node_modules/next/dist/bin/next start
