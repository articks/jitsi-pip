#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ca_dir="${script_dir}/config/local-ca"
keys_dir="${script_dir}/config/web/keys"

mkdir -p "${ca_dir}" "${keys_dir}"
umask 077

if [[ -f "${ca_dir}/ca.key" \
        && -f "${ca_dir}/ca.crt" \
        && -f "${keys_dir}/cert.key" \
        && -f "${keys_dir}/cert.crt" ]] \
        && openssl verify -CAfile "${ca_dir}/ca.crt" "${keys_dir}/cert.crt" >/dev/null 2>&1; then
    echo "Existing local certificate is valid; keeping the same CA."
    echo "Local CA: ${ca_dir}/ca.crt"
    echo "Jitsi certificate: ${keys_dir}/cert.crt"
    exit 0
fi

openssl req \
    -x509 \
    -newkey rsa:3072 \
    -sha256 \
    -days 3650 \
    -nodes \
    -keyout "${ca_dir}/ca.key" \
    -out "${ca_dir}/ca.crt" \
    -subj "/CN=Jitsi Meet PiP Local Development CA"

openssl req \
    -new \
    -newkey rsa:2048 \
    -sha256 \
    -nodes \
    -keyout "${keys_dir}/cert.key" \
    -out "${ca_dir}/server.csr" \
    -subj "/CN=localhost"

openssl x509 \
    -req \
    -in "${ca_dir}/server.csr" \
    -CA "${ca_dir}/ca.crt" \
    -CAkey "${ca_dir}/ca.key" \
    -CAcreateserial \
    -days 825 \
    -sha256 \
    -extfile "${script_dir}/localhost.ext" \
    -out "${keys_dir}/cert.crt"

chmod 600 "${ca_dir}/ca.key" "${keys_dir}/cert.key"
chmod 644 "${ca_dir}/ca.crt" "${keys_dir}/cert.crt"

echo "Local CA: ${ca_dir}/ca.crt"
echo "Jitsi certificate: ${keys_dir}/cert.crt"
