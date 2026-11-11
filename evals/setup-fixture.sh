#!/usr/bin/env bash
# Scaffold for every case: a fresh git repository containing the acme-shop fixture.
set -eu
cp -R "$(dirname "$0")/fixtures/acme-shop/." .
git init -q
git add -A
git -c user.name=Eval -c user.email=eval@example.com commit -qm "Initial acme-shop"
