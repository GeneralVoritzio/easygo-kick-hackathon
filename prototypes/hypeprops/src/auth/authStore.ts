import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SIM_CHANNEL_STATS } from '../engine/interactionStore'
import { validateBirthday, validateEmail, validatePassword, validateUsername } from './validation'

/** Shaped like the API's user object (`GET /public/v1/users`): snake_case,
 * `user_id`/`name`/`email`/`profile_picture`, extensions in the same style. */
export type KickUser = {
  user_id: number
  name: string
  email: string
  profile_picture: string | null
  created_at: string
  is_verified: boolean
}

/** ⚠️ Demo-only account record: the password is stored in plaintext in
 * localStorage, deliberately and visibly — this is mock auth for a hackathon
 * prototype, not a security boundary. A real product would never do this. */
export type StoredAccount = {
  user: KickUser
  password: string
  birthday: string | null
}

/** the pre-seeded streamer whose dashboard is fully backed by live engine
 * data — the demo credentials shown in the login modal */
export const DEMO_CREDENTIALS = { name: 'HypeKing', password: 'kickhype2026' }

const HYPEKING_ACCOUNT: StoredAccount = {
  user: {
    user_id: 730_921,
    name: 'HypeKing',
    email: 'hypeking.live@gmail.com',
    profile_picture: null,
    created_at: '2024-03-18T21:04:00Z',
    is_verified: true,
  },
  password: DEMO_CREDENTIALS.password,
  birthday: '1998-06-11',
}

export type AuthModalMode = 'login' | 'signup'

export type AuthStore = {
  accounts: StoredAccount[]
  /** user_id of the signed-in account; null when signed out */
  session_user_id: number | null
  authModal: AuthModalMode | null

  signIn: (identifier: string, password: string) => string | null
  signUp: (input: { email: string; name: string; password: string; birthday: string }) => string | null
  signOut: () => void
  openAuthModal: (mode: AuthModalMode) => void
  closeAuthModal: () => void
}

/** names a new signup may not claim: existing accounts + the mock channels */
export function takenNames(accounts: StoredAccount[]): string[] {
  return [...accounts.map((a) => a.user.name), ...Object.keys(SIM_CHANNEL_STATS)]
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      accounts: [HYPEKING_ACCOUNT],
      session_user_id: null,
      authModal: null,

      signIn: (identifier, password) => {
        const needle = identifier.trim().toLowerCase()
        const account = get().accounts.find(
          (a) => a.user.name.toLowerCase() === needle || a.user.email.toLowerCase() === needle,
        )
        if (!account || account.password !== password) return 'Incorrect username or password'
        set({ session_user_id: account.user.user_id, authModal: null })
        return null
      },

      signUp: ({ email, name, password, birthday }) => {
        const { accounts } = get()
        const error =
          validateEmail(email, accounts.map((a) => a.user.email)) ??
          validateUsername(name, takenNames(accounts)) ??
          validatePassword(password) ??
          validateBirthday(birthday)
        if (error) return error

        const account: StoredAccount = {
          user: {
            // mock id space well above the seeded account, unique per store
            user_id: 900_000 + accounts.length,
            name: name.trim(),
            email: email.trim(),
            profile_picture: null,
            created_at: new Date().toISOString(),
            is_verified: false,
          },
          password,
          birthday,
        }
        set({ accounts: [...accounts, account], session_user_id: account.user.user_id, authModal: null })
        return null
      },

      signOut: () => set({ session_user_id: null }),
      openAuthModal: (mode) => set({ authModal: mode }),
      closeAuthModal: () => set({ authModal: null }),
    }),
    {
      name: 'hypeprops-auth',
      // the modal is UI state, not session state
      partialize: (s) => ({ accounts: s.accounts, session_user_id: s.session_user_id }),
      // a stored payload from before a reseed could lack HypeKing — the demo
      // account must always be able to sign in
      merge: (persisted, current) => {
        const stored = (persisted as Partial<AuthStore> | undefined) ?? {}
        const accounts = stored.accounts ?? []
        if (!accounts.some((a) => a.user.name === HYPEKING_ACCOUNT.user.name)) {
          accounts.unshift(HYPEKING_ACCOUNT)
        }
        return { ...current, ...stored, accounts }
      },
    },
  ),
)

/** the signed-in user, or null — the one selector most components need */
export const useAuthUser = (): KickUser | null =>
  useAuth((s) => s.accounts.find((a) => a.user.user_id === s.session_user_id)?.user ?? null)
