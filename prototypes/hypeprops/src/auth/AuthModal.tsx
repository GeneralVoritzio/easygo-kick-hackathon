import { useEffect, useState } from 'react'
import { DEMO_CREDENTIALS, takenNames, useAuth } from './authStore'
import { validateEmail, validatePassword, validateUsername } from './validation'

/** the "verification code" the demo inbox instantly hands back */
const MOCK_CODE = '304 215'

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoFocus,
  readOnly,
}: {
  label: string
  type?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  readOnly?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-kick-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        readOnly={readOnly}
        className={`w-full rounded-lg border border-kick-border bg-kick-panel-2 px-3 py-2.5 text-[14px] text-kick-text placeholder:text-kick-muted focus:border-kick/60 focus:outline-none ${
          readOnly ? 'text-kick-muted' : ''
        }`}
      />
    </label>
  )
}

function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null
  return <p className="text-[12px] font-medium text-red-400">{error}</p>
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="submit"
      onClick={onClick}
      className="w-full rounded-lg bg-kick px-4 py-2.5 text-[14px] font-bold text-black transition-colors hover:bg-kick-dim"
    >
      {children}
    </button>
  )
}

function LoginForm() {
  const signIn = useAuth((s) => s.signIn)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => setError(signIn(identifier, password))

  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <Field label="Email or username" value={identifier} onChange={setIdentifier} autoFocus />
      <Field label="Password" type="password" value={password} onChange={setPassword} />
      <ErrorLine error={error} />
      <PrimaryButton onClick={submit}>Log In</PrimaryButton>

      {/* hackathon demo affordance — a real login modal would not ship this */}
      <div className="flex items-center justify-between rounded-lg border border-kick-border bg-kick-panel-2 px-3 py-2">
        <div className="text-[11px] leading-snug text-kick-muted">
          <span className="font-semibold text-kick-text">Demo account</span>
          <br />
          {DEMO_CREDENTIALS.name} / {DEMO_CREDENTIALS.password}
        </div>
        <button
          type="button"
          onClick={() => {
            setIdentifier(DEMO_CREDENTIALS.name)
            setPassword(DEMO_CREDENTIALS.password)
            setError(null)
          }}
          className="shrink-0 rounded-lg border border-kick-border px-2.5 py-1.5 text-[12px] font-semibold text-kick-muted transition-colors hover:text-kick-text"
        >
          Fill
        </button>
      </div>
    </form>
  )
}

function SignupForm() {
  const signUp = useAuth((s) => s.signUp)
  const accounts = useAuth((s) => s.accounts)
  const [step, setStep] = useState(0) // 0 email · 1 code · 2 identity · 3 birthday
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [birthday, setBirthday] = useState('')
  const [error, setError] = useState<string | null>(null)

  const advance = () => {
    setError(null)
    if (step === 0) {
      const err = validateEmail(email, accounts.map((a) => a.user.email))
      if (err) return setError(err)
      setCode(MOCK_CODE) // the demo inbox delivers instantly, pre-filled
      setStep(1)
    } else if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      const err = validateUsername(name, takenNames(accounts)) ?? validatePassword(password)
      if (err) return setError(err)
      setStep(3)
    } else {
      setError(signUp({ email, name, password, birthday }))
    }
  }

  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-kick' : 'bg-kick-border'}`} />
        ))}
      </div>

      {step === 0 && <Field label="Email" type="email" value={email} onChange={setEmail} autoFocus />}

      {step === 1 && (
        <>
          <p className="text-[12px] leading-snug text-kick-muted">
            We sent a 6-digit code to <span className="font-semibold text-kick-text">{email}</span>. Demo inbox — it
            arrives instantly, already filled in.
          </p>
          <Field label="Verification code" value={code} readOnly />
        </>
      )}

      {step === 2 && (
        <>
          <Field label="Username" value={name} onChange={setName} autoFocus />
          <Field label="Password" type="password" value={password} onChange={setPassword} />
        </>
      )}

      {step === 3 && <Field label="Birthday" type="date" value={birthday} onChange={setBirthday} autoFocus />}

      <ErrorLine error={error} />
      <PrimaryButton onClick={advance}>
        {step === 1 ? 'Verify' : step === 3 ? 'Create account' : 'Continue'}
      </PrimaryButton>
    </form>
  )
}

/**
 * Kick-style auth modal: mounted once at the app root, opened from anywhere
 * via `useAuth().openAuthModal('login' | 'signup')`. Escape and backdrop
 * clicks close it; Escape is captured so page-level handlers (e.g. the
 * Discovery popover peel) don't also fire.
 */
export default function AuthModal() {
  const mode = useAuth((s) => s.authModal)
  const openAuthModal = useAuth((s) => s.openAuthModal)
  const closeAuthModal = useAuth((s) => s.closeAuthModal)

  useEffect(() => {
    if (!mode) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      closeAuthModal()
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [mode, closeAuthModal])

  if (!mode) return null

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={closeAuthModal} aria-hidden="true" />
      <section
        aria-label={mode === 'login' ? 'Log in to Kick' : 'Sign up for Kick'}
        className="relative w-full max-w-[400px] rounded-2xl border border-kick-border bg-kick-panel p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-kick-text">{mode === 'login' ? 'Welcome back' : 'Join Kick'}</h1>
            <p className="mt-0.5 text-[12px] text-kick-muted">
              {mode === 'login' ? 'Log in to your account' : 'Create your account'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-kick-muted transition-colors hover:bg-white/5 hover:text-kick-text"
          >
            ✕
          </button>
        </div>

        {mode === 'login' ? <LoginForm /> : <SignupForm />}

        <p className="mt-4 text-center text-[12px] text-kick-muted">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => openAuthModal('signup')} className="font-semibold text-kick hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => openAuthModal('login')} className="font-semibold text-kick hover:underline">
                Log in
              </button>
            </>
          )}
        </p>
      </section>
    </div>
  )
}
