"""
AES-256-GCM encryption for database backup files.
Uses authenticated encryption — any tampering with the ciphertext will be detected.
"""

import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _derive_key(password: str, salt: bytes) -> bytes:
    """Derive a 256-bit key from the password using PBKDF2-SHA256."""
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations=200_000)


def encrypt_file(input_path: str, output_path: str, password: str) -> None:
    """
    Encrypt `input_path` with AES-256-GCM and write to `output_path`.
    Format: [16-byte salt][12-byte nonce][ciphertext+tag]
    """
    salt = os.urandom(16)
    nonce = os.urandom(12)
    key = _derive_key(password, salt)

    with open(input_path, "rb") as f:
        plaintext = f.read()

    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)

    with open(output_path, "wb") as f:
        f.write(salt + nonce + ciphertext)


def decrypt_file(input_path: str, output_path: str, password: str) -> None:
    """
    Decrypt an AES-256-GCM encrypted file back to plaintext.
    Raises ValueError if the authentication tag is invalid.
    """
    with open(input_path, "rb") as f:
        data = f.read()

    salt = data[:16]
    nonce = data[16:28]
    ciphertext = data[28:]

    key = _derive_key(password, salt)
    aesgcm = AESGCM(key)

    plaintext = aesgcm.decrypt(nonce, ciphertext, None)

    with open(output_path, "wb") as f:
        f.write(plaintext)


def sha256_checksum(file_path: str) -> str:
    """Return the SHA-256 hex digest of a file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()
