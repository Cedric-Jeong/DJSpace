// src/pages/Login.jsx
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [id,  setId]       = useState('')   // 이메일 형식으로 처리
  const [pw,  setPw]       = useState('')
  const [err, setErr]      = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      // ID를 이메일처럼 변환 (예: id@diary.app)
      const email = id.includes('@') ? id : `${id}@diary.app`
      await signInWithEmailAndPassword(auth, email, pw)
      navigate('/')
    } catch {
      setErr('아이디 또는 비밀번호가 올바르지 않아요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-diary-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-sm w-full max-w-sm p-8 border border-diary-green/5">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌿</div>
          <h1 className="text-2xl font-bold text-diary-green">우리들의 공간</h1>
          <p className="text-diary-green/40 text-xs mt-1 font-medium tracking-tight">Space of Us</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-diary-green/40 uppercase tracking-widest mb-1.5 ml-1">ID</label>
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              className="w-full bg-diary-cream/30 border border-diary-green/5 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-diary-green/20 transition-all placeholder-diary-green/20 text-diary-dark"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-diary-green/40 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full bg-diary-cream/30 border border-diary-green/5 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-diary-green/20 transition-all placeholder-diary-green/20 text-diary-dark"
            />
          </div>

          {err && (
            <p className="text-red-400 text-[11px] font-medium text-center">{err}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-diary-green hover:bg-diary-leaf text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-60 shadow-lg shadow-diary-green/10 active:scale-[0.98] mt-2"
          >
            {loading ? '연결 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-xs text-diary-green/30 mt-8 font-medium">
          처음 오셨나요?{' '}
          <Link to="/register" className="text-diary-brown font-bold hover:underline ml-1">
            공간 만들기
          </Link>
        </p>
      </div>
    </div>
  )
}
