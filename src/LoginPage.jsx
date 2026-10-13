import { useState } from 'react'
import { BriefcaseBusiness, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import api from './services/api'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password })
      onLogin(data)
    } catch (e) {
      setError(e?.response?.status === 401 ? 'Email or password is incorrect.' : (e?.response?.data?.message || 'Could not reach the server. Check that Spring Boot is running.'))
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><div className="auth-brand-icon"><BriefcaseBusiness size={23}/></div><div><strong>People<span>Flow</span></strong><small>WORKFORCE SUITE</small></div></div>
      <div className="auth-intro"><div className="auth-shield"><ShieldCheck size={22}/></div><span className="eyebrow">SECURE WORKSPACE</span><h1>Welcome back</h1><p>Sign in with the account created for you by your administrator.</p></div>
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="login-email">Work email</label>
        <div className="auth-input"><Mail size={18}/><input id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"/></div>
        <label htmlFor="login-password">Password</label>
        <div className="auth-input"><LockKeyhole size={18}/><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/></div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button>
      </form>
      <div className="auth-footnote">Employee accounts are created by your administrator. Self-registration is disabled.</div>
    </section>
    <p className="auth-copyright">© 2026 PeopleFlow · Employee Leave & Payroll</p>
  </main>
}
