// src/pages/Register.jsx
import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const [name,      setName]      = useState('')
  const [id,        setId]        = useState('')
  const [friendId,  setFriendId]  = useState('')
  const [pw,        setPw]        = useState('')
  const [err,       setErr]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const navigate = useNavigate()

  async function handleRegister(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const email = `${id}@diary.app`
      const { user } = await createUserWithEmailAndPassword(auth, email, pw)

      // Firestore에 사용자 프로필 저장
      await setDoc(doc(db, 'users', user.uid), {
        name,
        userId: id,
        friendId,          // 친구 아이디 (연결용)
        createdAt: new Date(),
      })

      navigate('/')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErr('이미 사용 중인 아이디예요.')
      } else if (err.code === 'auth/weak-password') {
        setErr('비밀번호는 6자 이상이어야 해요.')
      } else {
        setErr('회원가입에 실패했어요. 다시 시도해 주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-diary-peach flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">✉️</div>
          <h1 className="text-2xl font-bold text-diary-dark">회원가입</h1>
          <p className="text-gray-400 text-sm mt-1">함께할 친구의 아이디를 입력해주세요</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {[
            { label: '이름', value: name,     setter: setName,     type: 'text',     placeholder: '실제 이름' },
            { label: '아이디', value: id,       setter: setId,       type: 'text',     placeholder: '영문 소문자 + 숫자' },
            { label: '친구 아이디', value: friendId, setter: setFriendId, type: 'text', placeholder: '친구의 아이디' },
            { label: '비밀번호', value: pw,       setter: setPw,       type: 'password', placeholder: '6자 이상' },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                placeholder={field.placeholder}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-diary-pink transition-colors"
              />
            </div>
          ))}

          {err && <p className="text-red-400 text-xs text-center">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-diary-pink hover:bg-diary-rose text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          이미 계정이 있나요?{' '}
          <Link to="/login" className="text-diary-rose font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
