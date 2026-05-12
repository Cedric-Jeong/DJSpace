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
    <div className="min-h-screen bg-diary-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-sm w-full max-w-sm p-8 border border-diary-green/5">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍃</div>
          <h1 className="text-2xl font-bold text-diary-green">공간 만들기</h1>
          <p className="text-diary-green/40 text-xs mt-1 font-medium tracking-tight">함께할 친구의 아이디를 입력해주세요</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {[
            { label: 'Name', value: name,     setter: setName,     type: 'text',     placeholder: '실제 이름' },
            { label: 'ID', value: id,       setter: setId,       type: 'text',     placeholder: '영문 소문자 + 숫자' },
            { label: 'Friend ID', value: friendId, setter: setFriendId, type: 'text', placeholder: '친구의 아이디' },
            { label: 'Password', value: pw,       setter: setPw,       type: 'password', placeholder: '6자 이상' },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-[10px] font-bold text-diary-green/40 uppercase tracking-widest mb-1.5 ml-1">{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                placeholder={field.placeholder}
                required
                className="w-full bg-diary-cream/30 border border-diary-green/5 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-diary-green/20 transition-all placeholder-diary-green/20 text-diary-dark"
              />
            </div>
          ))}

          {err && <p className="text-red-400 text-[11px] font-medium text-center">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-diary-green hover:bg-diary-leaf text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-60 shadow-lg shadow-diary-green/10 active:scale-[0.98] mt-2"
          >
            {loading ? '씨앗 심는 중...' : '공간 만들기'}
          </button>
        </form>

        <p className="text-center text-xs text-diary-green/30 mt-8 font-medium">
          이미 공간이 있나요?{' '}
          <Link to="/login" className="text-diary-brown font-bold hover:underline ml-1">
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  )
}
