import { useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import api from './services/api'
import LoginPage from './LoginPage.jsx'
import EmployeeDashboard from './EmployeeDashboard.jsx'
import {
  LayoutDashboard, Users, CalendarDays, Wallet, Settings, Search,
  Bell, Plus, ArrowUpRight, Clock3, CheckCircle2, XCircle, Menu,
  ChevronDown, Download, CircleHelp, LogOut, BriefcaseBusiness
} from 'lucide-react'
import { employeeApi, leaveApi } from './services/api'

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
const initials = name => (name || 'Employee').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()

function AdminDashboard({ user, onLogout }) {
  const [employees, setEmployees] = useState([])
  const [leaves, setLeaves] = useState([])
  const [connected, setConnected] = useState(false)
  const [query, setQuery] = useState('')
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ name: '', email: '', department: 'Engineering', role: '', salary: '', password: '' })

  const refreshLeaves = () => leaveApi.list().then(({ data }) => {
    const mapped = (Array.isArray(data) ? data : []).map(l => ({
      id: l.id, name: l.employeeName, type: l.leaveType,
      dates: `${l.startDate} – ${l.endDate}`, days: l.days,
      status: l.status, reason: l.reason, email: l.employeeEmail,
    }))
    setLeaves(mapped)
  })

  useEffect(() => {
    Promise.all([employeeApi.list(), refreshLeaves()])
      .then(([{ data }]) => { if (Array.isArray(data)) { setEmployees(data); setConnected(true) } })
      .catch(() => setConnected(false))
  }, [])

  const filteredEmployees = useMemo(() => employees.filter(e =>
    `${e.name} ${e.email} ${e.department} ${e.role}`.toLowerCase().includes(query.toLowerCase())
  ), [employees, query])

  const addEmployee = async (event) => {
    event.preventDefault()
    const payload = { ...form, salary: Number(form.salary), status: 'Active' }
    try {
      const { data } = await employeeApi.create(payload)
      setEmployees(old => [data, ...old])
      setConnected(true)
      setNotice('Employee saved to the database.')
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Could not create employee. Check the backend and try again.'
      setNotice(message)
      setTimeout(() => setNotice(''), 5000)
      return
    }
    setForm({ name: '', email: '', department: 'Engineering', role: '', salary: '', password: '' })
    setShowEmployeeForm(false)
    setTimeout(() => setNotice(''), 4500)
  }

  const changeLeave = async (id, status) => {
    try {
      await leaveApi.review(id, status)
      await refreshLeaves()
      setNotice(`Leave request ${status.toLowerCase()} and saved.`)
    } catch (error) {
      setNotice(error?.response?.data?.message || `Could not ${status.toLowerCase()} this leave request.`)
    }
    setTimeout(() => setNotice(''), 4000)
  }

  const deleteEmployee = async (employee) => {
    if (!window.confirm(`Permanently delete ${employee.name} and their account, leave requests, and attendance records? This cannot be undone.`)) return
    try {
      await employeeApi.remove(employee.id)
      setEmployees(old => old.filter(e => e.id !== employee.id))
      await refreshLeaves()
      setNotice(`${employee.name} was permanently deleted.`)
    } catch (error) {
      setNotice(error?.response?.data?.message || 'Could not delete this employee.')
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><BriefcaseBusiness size={21} /></div>
          <div><strong>People<span>Flow</span></strong><small>WORKFORCE SUITE</small></div>
          <button className="icon-btn close-nav" onClick={() => setMobileNav(false)} aria-label="Close menu"><XCircle size={18}/></button>
        </div>
        <div className="workspace"><div className="workspace-icon">N</div><div><strong>Northstar Studio</strong><small>Workspace</small></div><ChevronDown size={16}/></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-list">
          <NavLink to="/" end onClick={() => setMobileNav(false)}><LayoutDashboard size={18}/> Overview</NavLink>
          <NavLink to="/employees" onClick={() => setMobileNav(false)}><Users size={18}/> Employees <span className="nav-count">{employees.length}</span></NavLink>
          <NavLink to="/leaves" onClick={() => setMobileNav(false)}><CalendarDays size={18}/> Leave management <span className="nav-dot"/></NavLink>
          <NavLink to="/payroll" onClick={() => setMobileNav(false)}><Wallet size={18}/> Payroll</NavLink>
        </nav>
        <div className="nav-label settings-label">PREFERENCES</div>
        <nav className="nav-list">
          <button onClick={() => setNotice('Settings page can be added next.')}><Settings size={18}/> Settings</button>
          <button onClick={() => setNotice('Contact your workspace administrator for support.')}><CircleHelp size={18}/> Help & support</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon">✦</div><strong>Make work flow.</strong><p>Keep your people and processes in sync.</p><button onClick={() => setNotice('You are using the starter workspace.')}>Explore workspace <ArrowUpRight size={14}/></button></div>
          <div className="profile"><div className="avatar avatar-purple">{initials(user?.email)}</div><div className="profile-text"><strong>{user?.email}</strong><small>Administrator</small></div><button className="icon-btn" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut size={16}/></button></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Open menu"><Menu size={21}/></button>
          <div className="breadcrumbs">Workspace <span>/</span> <strong>People operations</strong></div>
          <div className="top-actions">
            <div className={`connection ${connected ? 'is-connected' : ''}`}><span/>{connected ? 'Database connected' : 'Demo preview'}</div>
            <button className="icon-btn notification-btn" aria-label="Notifications" onClick={() => setNotice('You are all caught up.') }><Bell size={19}/><i/></button>
            <div className="top-user"><div className="avatar avatar-purple top-avatar">{initials(user?.email)}</div><span>{user?.email}</span><button className="btn btn-secondary signout-btn" onClick={onLogout}><LogOut size={15}/> Sign out</button></div>
          </div>
        </header>
        <div className="page-content">
          {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
          <Routes>
            <Route path="/" element={<Dashboard user={user} employees={employees} leaves={leaves} setShowEmployeeForm={setShowEmployeeForm} changeLeave={changeLeave}/>} />
            <Route path="/employees" element={<Employees employees={filteredEmployees} query={query} setQuery={setQuery} setShowEmployeeForm={setShowEmployeeForm} deleteEmployee={deleteEmployee}/>} />
            <Route path="/leaves" element={<Leaves leaves={leaves} changeLeave={changeLeave}/>} />
            <Route path="/payroll" element={<Payroll employees={employees}/>} />
          </Routes>
        </div>
      </main>

      {showEmployeeForm && <div className="modal-backdrop" onClick={() => setShowEmployeeForm(false)}>
        <form className="modal" onSubmit={addEmployee} onClick={e => e.stopPropagation()}>
          <div className="modal-heading"><div><span className="eyebrow">PEOPLE DIRECTORY</span><h2>Add employee</h2></div><button type="button" className="icon-btn" onClick={() => setShowEmployeeForm(false)} aria-label="Close"><XCircle size={20}/></button></div>
          <label>Full name<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Ananya Rao"/></label>
          <label>Work email<input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="name@company.com"/></label>
          <div className="form-row"><label>Department<select value={form.department} onChange={e => setForm({...form, department:e.target.value})}><option>Engineering</option><option>Human Resources</option><option>Finance</option><option>Operations</option><option>Design</option><option>Sales</option></select></label><label>Monthly salary (₹)<input required min="0" type="number" value={form.salary} onChange={e => setForm({...form, salary:e.target.value})} placeholder="50000"/></label></div>
          <label>Job title<input required value={form.role} onChange={e => setForm({...form, role:e.target.value})} placeholder="e.g. Software Engineer"/></label>
          <label>Temporary login password<input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="At least 12 characters"/><small className="field-help">Share this password securely with the employee. Never reuse your admin password.</small></label>
          <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEmployeeForm(false)}>Cancel</button><button className="btn btn-primary" type="submit"><Plus size={16}/> Add employee</button></div>
        </form>
      </div>}
    </div>
  )
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>
}
function StatCard({ title, value, note, icon: Icon, tone, trend }) {
  return <div className="stat-card"><div className="stat-top"><span>{title}</span><div className={`stat-icon ${tone}`}><Icon size={19}/></div></div><div className="stat-value">{value}</div><div className="stat-foot"><span className={trend ? 'trend' : 'muted-dot'}>{trend && <ArrowUpRight size={14}/>} {note}</span></div></div>
}
function Dashboard({ user, employees, leaves, setShowEmployeeForm, changeLeave }) {
  const pending = leaves.filter(l => l.status === 'Pending').length
  const payroll = employees.reduce((sum, e) => sum + Number(e.salary || 0), 0)
  return <>
    <PageHeading eyebrow="MONDAY, OCTOBER 12, 2026" title={`Welcome, ${(user?.email || 'Admin').split('@')[0]} 👋`} subtitle="Here's what's happening with your team today." action={<button className="btn btn-primary" onClick={() => setShowEmployeeForm(true)}><Plus size={17}/> Add employee</button>}/>
    <div className="welcome-banner"><div className="welcome-copy"><span className="banner-kicker">YOUR PEOPLE, AT A GLANCE</span><h2>A better day starts with<br/>a better workday.</h2><p>Manage your team, keep leave requests moving, and stay on top of payroll — all in one place.</p><div className="banner-pills"><span><span className="mini-check">✓</span> People first</span><span><span className="mini-check">✓</span> Work made simple</span></div></div><div className="banner-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-card art-card-one"><div className="art-icon"><Users size={19}/></div><div><strong>{employees.length} team members</strong><small>Growing together</small></div></div><div className="art-card art-card-two"><div className="art-icon green"><CalendarDays size={19}/></div><div><strong>{pending} requests to review</strong><small>Keep things moving</small></div></div><div className="art-center"><Users size={44}/></div></div></div>
    <div className="section-heading"><div><h2>Team overview</h2><p>A snapshot of your workforce</p></div><span className="period-label">October 2026 <ChevronDown size={15}/></span></div>
    <div className="stats-grid">
      <StatCard title="Total employees" value={employees.length} note="People in your workspace" icon={Users} tone="purple" trend/>
      <StatCard title="On leave today" value={employees.filter(e=>e.status==='On Leave').length} note="Currently away" icon={CalendarDays} tone="blue"/>
      <StatCard title="Pending requests" value={pending} note="Needs your attention" icon={Clock3} tone="orange"/>
      <StatCard title="Monthly payroll" value={money(payroll)} note="Sum of listed salaries" icon={Wallet} tone="green"/>
    </div>
    <div className="dashboard-columns">
      <section className="panel"><div className="panel-heading"><div><h2>Recent leave requests</h2><p>Review and manage time-off requests</p></div><NavLink to="/leaves" className="text-link">View all <ArrowUpRight size={15}/></NavLink></div><LeaveTable leaves={leaves.slice(0,4)} changeLeave={changeLeave} compact/></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Common tasks, one click away</p></div></div><div className="quick-actions"><button onClick={setShowEmployeeForm}><div className="quick-icon purple"><Users size={19}/></div><span><strong>Add a team member</strong><small>Create a new employee profile</small></span><ArrowUpRight size={16}/></button><NavLink to="/leaves"><div className="quick-icon orange"><CalendarDays size={19}/></div><span><strong>Review leave requests</strong><small>Approve or reject time off</small></span><ArrowUpRight size={16}/></NavLink><NavLink to="/payroll"><div className="quick-icon green"><Wallet size={19}/></div><span><strong>View payroll</strong><small>Check monthly salary totals</small></span><ArrowUpRight size={16}/></NavLink></div><div className="tip-box"><span className="tip-spark">✦</span><div><strong>Small tip</strong><p>Keep employee records up to date for smoother payroll processing.</p></div></div></section>
    </div>
    <footer className="footer">© 2026 PeopleFlow <span>Built for people, powered by good processes.</span></footer>
  </>
}
function Employees({ employees, query, setQuery, setShowEmployeeForm, deleteEmployee }) {
  return <>
    <PageHeading eyebrow="PEOPLE DIRECTORY" title="Employees" subtitle="Manage your team and keep employee information up to date." action={<button className="btn btn-primary" onClick={() => setShowEmployeeForm(true)}><Plus size={17}/> Add employee</button>}/>
    <div className="panel"><div className="table-toolbar"><div><h2>All employees <span className="count-chip">{employees.length}</span></h2><p>Your employee directory</p></div><div className="toolbar-actions"><label className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search employees..."/></label><button className="btn btn-secondary" onClick={()=>window.print()}><Download size={16}/> Export / Print</button></div></div>
      <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>JOB TITLE</th><th>MONTHLY SALARY</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{employees.map(e=><tr key={e.id}><td><div className="person-cell"><div className={`avatar avatar-${Number(e.id)%4}`}>{initials(e.name)}</div><div><strong>{e.name}</strong><small>{e.email}</small></div></div></td><td>{e.department}</td><td>{e.role || '—'}</td><td className="salary-cell">{money(e.salary)}</td><td><Status value={e.status || 'Active'}/></td><td><button className="btn btn-secondary" onClick={() => deleteEmployee(e)} title={`Delete ${e.name}`}><XCircle size={15}/> Delete</button></td></tr>)}</tbody></table>{employees.length===0&&<div className="empty-state">No employees match your search.</div>}</div>
    </div>
  </>
}
function Leaves({ leaves, changeLeave }) {
  return <><PageHeading eyebrow="TIME & ATTENDANCE" title="Leave management" subtitle="Review requests and keep time off fair and transparent." action={<button className="btn btn-secondary" onClick={()=>window.print()}><Download size={16}/> Export list</button>}/><div className="stats-grid leave-stats"><StatCard title="Total requests" value={leaves.length} note="All requests in view" icon={CalendarDays} tone="purple"/><StatCard title="Awaiting review" value={leaves.filter(l=>l.status==='Pending').length} note="Needs your attention" icon={Clock3} tone="orange"/><StatCard title="Approved" value={leaves.filter(l=>l.status==='Approved').length} note="Time off confirmed" icon={CheckCircle2} tone="green"/><StatCard title="Rejected" value={leaves.filter(l=>l.status==='Rejected').length} note="Not approved" icon={XCircle} tone="blue"/></div><section className="panel"><div className="panel-heading"><div><h2>Leave requests</h2><p>Use the actions to review pending requests</p></div></div><LeaveTable leaves={leaves} changeLeave={changeLeave}/></section></>
}
function LeaveTable({ leaves, changeLeave, compact=false }) {
  return <div className="table-wrap"><table className={compact?'compact-table':''}><thead><tr><th>EMPLOYEE</th><th>LEAVE DETAILS</th><th>DURATION</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{leaves.map(l=><tr key={l.id}><td><div className="person-cell"><div className="avatar avatar-2">{initials(l.name)}</div><div><strong>{l.name}</strong><small>{l.id}</small></div></div></td><td><strong className="normal-weight">{l.type}</strong><small className="cell-sub">{l.dates}</small>{l.reason && <small className="cell-sub">Reason: {l.reason}</small>}</td><td>{l.days} {l.days===1?'day':'days'}</td><td><Status value={l.status}/></td><td>{l.status==='Pending'?<div className="row-actions"><button className="approve-btn" onClick={()=>changeLeave(l.id,'Approved')} title="Approve"><CheckCircle2 size={17}/></button><button className="reject-btn" onClick={()=>changeLeave(l.id,'Rejected')} title="Reject"><XCircle size={17}/></button></div>:<span className="muted-dash">—</span>}</td></tr>)}</tbody></table>{leaves.length===0&&<div className="empty-state">No leave requests yet.</div>}</div>
}
function Payroll({ employees }) {
  const total=employees.reduce((sum,e)=>sum+Number(e.salary||0),0)
  return <><PageHeading eyebrow="COMPENSATION" title="Payroll" subtitle="Review monthly salary records for your team." action={<button className="btn btn-secondary" onClick={()=>window.print()}><Download size={16}/> Export / Print</button>}/><div className="stats-grid"><StatCard title="Monthly gross salary" value={money(total)} note="Based on listed employee salaries" icon={Wallet} tone="green"/><StatCard title="Employees in payroll" value={employees.length} note="Listed employee records" icon={Users} tone="purple"/><StatCard title="Estimated annual total" value={money(total*12)} note="Gross annualized estimate" icon={ArrowUpRight} tone="blue"/><StatCard title="Payroll period" value="Oct 2026" note="Sample period" icon={CalendarDays} tone="orange"/></div><section className="panel"><div className="panel-heading"><div><h2>Salary register</h2><p>Salary amounts are sample monthly gross amounts. Tax and statutory deductions are not calculated.</p></div><span className="period-label">Monthly <ChevronDown size={15}/></span></div><div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>GROSS SALARY</th><th>DEDUCTIONS</th><th>NET PAY</th><th>STATUS</th></tr></thead><tbody>{employees.map(e=><tr key={e.id}><td><div className="person-cell"><div className="avatar avatar-1">{initials(e.name)}</div><div><strong>{e.name}</strong><small>{e.email}</small></div></div></td><td>{e.department}</td><td className="salary-cell">{money(e.salary)}</td><td>—</td><td className="salary-cell">{money(e.salary)}</td><td><Status value="Draft"/></td></tr>)}</tbody></table></div><div className="payroll-note"><Wallet size={18}/><p><strong>Payroll starter view</strong><br/>This page currently displays salary register estimates. Real payroll requires verified salary rules, deductions, approvals, and backend persistence.</p></div></section></>
}
function Status({ value }) {
  const key=(value||'active').toLowerCase().replace(/\s/g,'-')
  return <span className={`status status-${key}`}><i/>{value}</span>
}
function App() {
  const navigate = useNavigate()
  const [auth, setAuth] = useState(() => {
    try {
      const token = sessionStorage.getItem('authToken')
      const user = JSON.parse(sessionStorage.getItem('authUser') || 'null')
      return token && user ? user : null
    } catch { return null }
  })

  useEffect(() => {
    const expire = () => {
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('authUser')
      setAuth(null)
    }
    window.addEventListener('auth-expired', expire)
    if (sessionStorage.getItem('authToken')) {
  api.get('/auth/me')
    .then(({ data }) => {
      setAuth(data)
    })
    .catch((error) => {
      console.error('Authentication check failed:', error)
      expire()
    })
}
    return () => window.removeEventListener('auth-expired', expire)
  }, [navigate])

  const handleLogin = ({ token, user }) => {
    sessionStorage.setItem('authToken', token)
    sessionStorage.setItem('authUser', JSON.stringify(user))
    navigate('/', { replace: true })
    setAuth(user)
  }

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* local logout must still complete */ }
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('authUser')
    setAuth(null)
    navigate('/login', { replace: true })
  }

  if (!auth) return <LoginPage onLogin={handleLogin} />
  if (auth.role === 'EMPLOYEE') return <EmployeeDashboard user={auth} onLogout={handleLogout} />
  if (auth.role === 'ADMIN') return <AdminDashboard user={auth} onLogout={handleLogout} />
  return <LoginPage onLogin={handleLogin} />
}

export default App