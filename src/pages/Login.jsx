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
    <div className="min-h-screen bg-diary-peach flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📖</div>
          <h1 className="text-2xl font-bold text-diary-dark">교환 일기</h1>
          <p className="text-gray-400 text-sm mt-1">소중한 사람과 나누는 일기</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">아이디</label>
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-diary-pink transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-diary-pink transition-colors"
            />
          </div>

          {err && (
            <p className="text-red-400 text-xs text-center">{err}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-diary-pink hover:bg-diary-rose text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          계정이 없나요?{' '}
          <Link to="/register" className="text-diary-rose font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
