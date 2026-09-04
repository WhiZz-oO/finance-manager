import { useState, useEffect } from 'react'
import { Fingerprint, Lock, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react'
import {
  authenticateBiometric,
  verifyLockPin,
  setSessionUnlocked,
} from '../../utils/biometrics'
import toast from 'react-hot-toast'

export default function BiometricLockScreen({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [usePinMode, setUsePinMode] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [verifying, setVerifying] = useState(false)

  const hasPin = Boolean(localStorage.getItem('fm_lock_pin_hash'))
  const hasBiometric = Boolean(localStorage.getItem('fm_bio_cred_id'))

  const triggerBiometric = async () => {
    setErrorMsg('')
    setVerifying(true)
    try {
      const res = await authenticateBiometric()
      if (res.success) {
        toast.success('Fingerprint Verified!', { icon: '🔓' })
        onUnlock()
      } else {
        if (hasPin) {
          setUsePinMode(true)
          setErrorMsg('Biometric cancelled. Please enter your PIN.')
        } else {
          setErrorMsg(res.error || 'Fingerprint verification failed')
        }
      }
    } catch {
      if (hasPin) setUsePinMode(true)
    } finally {
      setVerifying(false)
    }
  }

  // Auto-trigger fingerprint prompt on initial mount
  useEffect(() => {
    if (hasBiometric) {
      triggerBiometric()
    } else if (hasPin) {
      setUsePinMode(true)
    }
  }, [])

  const handleKeypadPress = async (num) => {
    setErrorMsg('')
    if (pin.length < 6) {
      const newPin = pin + num
      setPin(newPin)

      // If length is 4 or 6, attempt verification
      if (newPin.length >= 4) {
        const isMatch = await verifyLockPin(newPin)
        if (isMatch) {
          toast.success('PIN Verified!', { icon: '🔓' })
          onUnlock()
        } else if (newPin.length === 6) {
          setErrorMsg('Incorrect PIN. Please try again.')
          setPin('')
        }
      }
    }
  }

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1))
    setErrorMsg('')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #131238 0%, #080816 100%)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        color: 'var(--text-primary)',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      {/* App Header Badge */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 0 30px var(--primary-glow)',
          }}
        >
          <Lock size={26} color="#fff" />
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
          Finance Manager
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Protected by Biometric Security
        </p>
      </div>

      {/* Mode 1: Fingerprint Biometric Prompt */}
      {!usePinMode && hasBiometric && (
        <div style={{ textAlign: 'center', maxWidth: 300, width: '100%' }}>
          <button
            type="button"
            onClick={triggerBiometric}
            disabled={verifying}
            style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '2px solid var(--primary)',
              color: 'var(--primary-light)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              cursor: 'pointer',
              boxShadow: '0 0 35px rgba(99, 102, 241, 0.35)',
              transition: 'transform 0.15s ease',
              animation: 'pulse-glow 2s infinite',
            }}
          >
            <Fingerprint size={52} />
          </button>

          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {verifying ? 'Touch Fingerprint Sensor...' : 'Tap to Unlock'}
          </p>

          {errorMsg && (
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--expense)',
                background: 'var(--expense-dim)',
                padding: '8px 12px',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {errorMsg}
            </div>
          )}

          {hasPin && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setUsePinMode(true)}
              style={{ marginTop: 12 }}
            >
              <KeyRound size={15} /> Use PIN Instead
            </button>
          )}
        </div>
      )}

      {/* Mode 2: Keypad PIN Code Unlock */}
      {(usePinMode || !hasBiometric) && (
        <div style={{ width: '100%', maxWidth: 280, textAlign: 'center' }}>
          {/* PIN Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: i < pin.length ? 'var(--primary-light)' : 'rgba(255,255,255,0.15)',
                  boxShadow: i < pin.length ? '0 0 10px var(--primary)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
            ))}
          </div>

          {errorMsg && (
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--expense)',
                marginBottom: 14,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* 3x4 Number Keypad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(String(num))}
                style={{
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)',
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  margin: '0 auto',
                  width: 60,
                }}
              >
                {num}
              </button>
            ))}

            {/* Bottom row: Fingerprint switch, 0, Backspace */}
            {hasBiometric ? (
              <button
                type="button"
                onClick={() => {
                  setUsePinMode(false)
                  triggerBiometric()
                }}
                style={{
                  height: 60,
                  width: 60,
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  margin: '0 auto',
                }}
                title="Use Fingerprint"
              >
                <Fingerprint size={28} />
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              style={{
                height: 60,
                width: 60,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)',
                fontSize: '1.4rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                margin: '0 auto',
              }}
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              style={{
                height: 60,
                width: 60,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                margin: '0 auto',
              }}
            >
              ⌫
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
