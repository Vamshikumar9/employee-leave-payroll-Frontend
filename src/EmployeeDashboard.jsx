import { useCallback, useEffect, useState } from 'react'
import { BriefcaseBusiness, LogOut, Wallet, UserRound, Building2, Mail, BadgeCheck, CalendarDays, Clock3, CheckCircle2, Send, RefreshCw } from 'lucide-react'
import api, { employeePortalApi } from './services/api'

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0))
const initials = name => (name || 'Employee').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
const today = () => new Date().toLocaleDateString('en-CA')
const dateLabel = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const timeLabel = value => value ? String(value).slice(0, 5) : '—'

export default function EmployeeDashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [attendance, setAttendance] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'Casual Leave', startDate: today(), endDate: today(), reason: '' })

  const refreshRecords = useCallback(async () => {
    const [leaveResult, attendanceResult] = await Promise.all([employeePortalApi.myLeaves(), employeePortalApi.attendance()])
    setLeaves(leaveResult.data || [])
    setAttendance(attendanceResult.data || [])
  }, [])

  useEffect(() => {
    Promise.all([api.get('/me'), employeePortalApi.myLeaves(), employeePortalApi.attendance()])
      .then(([profileResult, leaveResult, attendanceResult]) => {
        setProfile(profileResult.data)
        setLeaves(leaveResult.data || [])
        setAttendance(attendanceResult.data || [])
      })
      .catch(e => setError(e?.response?.data?.message || 'Unable to load your employee records. Please sign in again.'))
      .finally(() => setLoading(false))
  }, [])

  const submitLeave = async event => {
    event.preventDefault(); setSubmitting(true); setError(''); setNotice('')
    try {
      await employeePortalApi.applyLeave(leaveForm)
      setLeaveForm({ leaveType: 'Casual Leave', startDate: today(), endDate: today(), reason: '' })
      await refreshRecords()
      setNotice('Leave application submitted. Your administrator can now review it.')
    } catch (e) { setError(e?.response?.data?.message || 'Could not submit the leave application.') }
    finally { setSubmitting(false) }
  }

  const doAttendance = async action => {
    setError(''); setNotice('')
    try {
      if (action === 'in') await employeePortalApi.checkIn()
      else await employeePortalApi.checkOut()
      await refreshRecords()
      setNotice(action === 'in' ? 'Check-in recorded successfully.' : 'Check-out recorded successfully.')
    } catch (e) { setError(e?.response?.data?.message || e?.response?.data?.error || 'Could not update attendance.') }
  }

  const todayRecord = attendance.find(r => r.attendanceDate === today())

  return <main className="employee-page">
    <header className="employee-topbar"><div className="employee-brand"><div className="auth-brand-icon"><BriefcaseBusiness size={22}/></div><div><strong>People<span>Flow</span></strong><small>EMPLOYEE PORTAL</small></div></div><div className="employee-top-actions"><span className="employee-signed-in">{user.email}</span><button className="btn btn-secondary" onClick={onLogout}><LogOut size={16}/> Sign out</button></div></header>
    <section className="employee-content">
      <div className="employee-welcome"><div><span className="eyebrow">EMPLOYEE WORKSPACE</span><h1>Your personal dashboard</h1><p>Apply for leave, record your attendance, and review your employee information.</p></div><div className="employee-avatar">{initials(profile?.name || user.email)}</div></div>
      {loading && <div className="employee-panel">Loading your records…</div>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      {notice && <div className="employee-notice" role="status">{notice}</div>}
      {profile && <>
        <div className="employee-stat-grid"><article className="employee-stat"><span className="employee-stat-icon"><Wallet size={20}/></span><small>Monthly gross salary</small><strong>{money(profile.salary)}</strong><p>Before any deductions</p></article><article className="employee-stat"><span className="employee-stat-icon"><BadgeCheck size={20}/></span><small>Employment status</small><strong>{profile.status || 'Active'}</strong><p>Contact HR if this is incorrect</p></article><article className="employee-stat"><span className="employee-stat-icon"><Clock3 size={20}/></span><small>Today's attendance</small><strong>{todayRecord?.checkIn ? (todayRecord?.checkOut ? 'Completed' : 'Checked in') : 'Not checked in'}</strong><p>{todayRecord?.checkIn ? `In: ${timeLabel(todayRecord.checkIn)}` : 'Record your workday below'}</p></article></div>
        <section className="employee-panel"><div className="employee-panel-heading"><div><h2>My attendance</h2><p>Use check-in when you start work and check-out when you finish.</p></div><Clock3 size={22}/></div><div className="attendance-actions"><button className="btn btn-primary" disabled={Boolean(todayRecord?.checkIn)} onClick={() => doAttendance('in')}><CheckCircle2 size={16}/> Check in</button><button className="btn btn-secondary" disabled={!todayRecord?.checkIn || Boolean(todayRecord?.checkOut)} onClick={() => doAttendance('out')}><LogOut size={16}/> Check out</button><span className="attendance-today">Today: {dateLabel(today())}</span></div><div className="employee-table-wrap"><table><thead><tr><th>DATE</th><th>CHECK IN</th><th>CHECK OUT</th><th>STATUS</th></tr></thead><tbody>{attendance.map(r=><tr key={r.id}><td>{dateLabel(r.attendanceDate)}</td><td>{timeLabel(r.checkIn)}</td><td>{timeLabel(r.checkOut)}</td><td>{r.status}</td></tr>)}</tbody></table>{attendance.length===0 && <p className="employee-empty">No attendance records yet. Check in to create today's record.</p>}</div></section>
        <section className="employee-panel"><div className="employee-panel-heading"><div><h2>Apply for leave</h2><p>Submit a request for your administrator to approve or reject.</p></div><CalendarDays size={22}/></div><form className="employee-leave-form" onSubmit={submitLeave}><label>Leave type<select value={leaveForm.leaveType} onChange={e=>setLeaveForm({...leaveForm,leaveType:e.target.value})}><option>Casual Leave</option><option>Sick Leave</option><option>Annual Leave</option><option>Personal Leave</option><option>Unpaid Leave</option></select></label><label>Start date<input required type="date" min={today()} value={leaveForm.startDate} onChange={e=>setLeaveForm({...leaveForm,startDate:e.target.value, endDate: leaveForm.endDate < e.target.value ? e.target.value : leaveForm.endDate})}/></label><label>End date<input required type="date" min={leaveForm.startDate || today()} value={leaveForm.endDate} onChange={e=>setLeaveForm({...leaveForm,endDate:e.target.value})}/></label><label className="leave-reason-field">Reason<textarea required minLength={3} maxLength={1000} rows={3} value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm,reason:e.target.value})} placeholder="Briefly explain your leave request"/></label><div className="leave-form-submit"><button className="btn btn-primary" type="submit" disabled={submitting}><Send size={16}/>{submitting?'Submitting…':'Submit leave request'}</button></div></form></section>
        <section className="employee-panel"><div className="employee-panel-heading"><div><h2>My leave requests</h2><p>Track the status of the requests you submitted.</p></div><RefreshCw size={20}/></div><div className="employee-table-wrap"><table><thead><tr><th>TYPE</th><th>DATES</th><th>DAYS</th><th>REASON</th><th>STATUS</th></tr></thead><tbody>{leaves.map(l=><tr key={l.id}><td>{l.leaveType}</td><td>{dateLabel(l.startDate)} – {dateLabel(l.endDate)}</td><td>{l.days}</td><td>{l.reason}</td><td><span className={`employee-leave-status status-${String(l.status).toLowerCase()}`}>{l.status}</span></td></tr>)}</tbody></table>{leaves.length===0 && <p className="employee-empty">You have not submitted any leave requests yet.</p>}</div></section>
        <section className="employee-panel"><div className="employee-panel-heading"><div><h2>My employee profile</h2><p>Only your own profile is shown here.</p></div><UserRound size={22}/></div><div className="employee-details-grid"><div className="employee-detail"><UserRound size={18}/><div><small>Full name</small><strong>{profile.name}</strong></div></div><div className="employee-detail"><Mail size={18}/><div><small>Work email</small><strong>{profile.email}</strong></div></div><div className="employee-detail"><Building2 size={18}/><div><small>Department</small><strong>{profile.department}</strong></div></div><div className="employee-detail"><BriefcaseBusiness size={18}/><div><small>Job title</small><strong>{profile.role || 'Not specified'}</strong></div></div></div></section>
        <p className="employee-security-note">Your account is protected by role-based access. For account changes or password resets, contact your administrator.</p>
      </>}
    </section>
  </main>
}
