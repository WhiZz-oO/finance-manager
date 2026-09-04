// WebAuthn Biometric & PIN Security Helper for Mobile & Desktop

const CREDENTIAL_ID_KEY = 'fm_bio_cred_id'
const PIN_HASH_KEY = 'fm_lock_pin_hash'
const LOCK_ENABLED_KEY = 'fm_lock_enabled'
const UNLOCKED_SESSION_KEY = 'fm_session_unlocked'

// Simple robust hashing for local PIN
export async function hashPin(pin) {
  const enc = new TextEncoder().encode(pin + '_finance_manager_salt')
  const hashBuf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Check if device supports WebAuthn Biometrics (Fingerprint / Face ID / Windows Hello)
export async function isBiometricAvailable() {
  try {
    if (window.PublicKeyCredential && 
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    }
  } catch {
    return false
  }
  return false
}

// Check if App Lock is currently enabled by user
export function isLockEnabled() {
  return localStorage.getItem(LOCK_ENABLED_KEY) === 'true'
}

// Check if session is currently unlocked
export function isSessionUnlocked() {
  return sessionStorage.getItem(UNLOCKED_SESSION_KEY) === 'true'
}

// Set session unlocked
export function setSessionUnlocked(unlocked = true) {
  if (unlocked) {
    sessionStorage.setItem(UNLOCKED_SESSION_KEY, 'true')
  } else {
    sessionStorage.removeItem(UNLOCKED_SESSION_KEY)
  }
}

// Register Biometric Credential on Device
export async function registerBiometric(username = 'Albin') {
  try {
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    const userId = new Uint8Array(16)
    window.crypto.getRandomValues(userId)

    const createOptions = {
      publicKey: {
        challenge,
        rp: {
          name: 'Finance Manager',
          id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
        user: {
          id: userId,
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Hardware fingerprint/Face ID
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    }

    const credential = await navigator.credentials.create(createOptions)
    if (credential) {
      localStorage.setItem(CREDENTIAL_ID_KEY, btoa(String.fromCharCode(...new Uint8Array(credential.rawId))))
      localStorage.setItem(LOCK_ENABLED_KEY, 'true')
      setSessionUnlocked(true)
      return { success: true }
    }
  } catch (err) {
    return { success: false, error: err.message || 'Biometric registration cancelled or unsupported' }
  }
  return { success: false, error: 'Registration failed' }
}

// Verify Fingerprint / Biometric
export async function authenticateBiometric() {
  try {
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    const rawIdStr = localStorage.getItem(CREDENTIAL_ID_KEY)
    const allowCredentials = []

    if (rawIdStr) {
      const rawId = Uint8Array.from(atob(rawIdStr), c => c.charCodeAt(0))
      allowCredentials.push({
        id: rawId,
        type: 'public-key',
        transports: ['internal'],
      })
    }

    const getOptions = {
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      },
    }

    const assertion = await navigator.credentials.get(getOptions)
    if (assertion) {
      setSessionUnlocked(true)
      return { success: true }
    }
  } catch (err) {
    return { success: false, error: err.message || 'Biometric verification cancelled' }
  }
  return { success: false, error: 'Verification failed' }
}

// Enable PIN Lock
export async function setLockPin(pin) {
  const hash = await hashPin(pin)
  localStorage.setItem(PIN_HASH_KEY, hash)
  localStorage.setItem(LOCK_ENABLED_KEY, 'true')
  setSessionUnlocked(true)
}

// Verify PIN
export async function verifyLockPin(pin) {
  const hash = await hashPin(pin)
  const savedHash = localStorage.getItem(PIN_HASH_KEY)
  const match = hash === savedHash
  if (match) {
    setSessionUnlocked(true)
  }
  return match
}

// Disable App Lock
export function disableAppLock() {
  localStorage.removeItem(LOCK_ENABLED_KEY)
  localStorage.removeItem(CREDENTIAL_ID_KEY)
  localStorage.removeItem(PIN_HASH_KEY)
  setSessionUnlocked(true)
}
