// src/components/MemoTab.jsx
// 달력 + 일기 작성 기능

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import {
  collection, addDoc, query, where, getDocs,
  orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function MemoTab() {
  const { currentUser, userProfile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [content,      setContent]      = useState('')
  const [memoDates,    setMemoDates]    = useState([])  // 메모가 있는 날짜들
  const [saving,       setSaving]       = useState(false)
  const [savedMsg,     setSavedMsg]     = useState('')

  // 이 달의 메모 날짜 목록 가져오기
  useEffect(() => {
    if (!currentUser) return
    async function loadMemoDates() {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      const end   = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      const q = query(
        collection(db, 'memos'),
        where('authorId', '==', currentUser.uid),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'asc')
      )
      const snap = await getDocs(q)
      setMemoDates(snap.docs.map(d => d.data().date.toDate().toDateString()))
    }
    loadMemoDates()
  }, [currentUser, selectedDate.getMonth()])

  async function saveMemo() {
    if (!content.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'memos'), {
        content:    content.trim(),
        authorId:   currentUser.uid,
        authorName: userProfile?.name || '나',
        friendId:   userProfile?.friendId || '',
        date:       selectedDate,
        createdAt:  serverTimestamp(),
        comments:   [],
      })
      setContent('')
      setSavedMsg('일기가 저장됐어요 💕')
      setTimeout(() => setSavedMsg(''), 2500)
      setMemoDates(prev => [...new Set([...prev, selectedDate.toDateString()])])
    } finally {
      setSaving(false)
    }
  }

  // 달력 타일에 점 추가
  function tileClassName({ date }) {
    return memoDates.includes(date.toDateString()) ? 'has-memo' : null
  }

  const dateStr = selectedDate.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })

  return (
    <div className="p-4 space-y-4">
      {/* 달력 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          locale="ko-KR"
          tileClassName={tileClassName}
          calendarType="gregory"
        />
      </div>

      {/* 선택 날짜 표시 */}
      <div className="bg-diary-peach rounded-2xl px-4 py-3">
        <p className="text-diary-dark font-medium text-sm">{dateStr}</p>
      </div>

      {/* 일기 작성 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="오늘 있었던 일을 적어봐요 💭"
          rows={7}
          className="w-full text-sm text-gray-700 resize-none focus:outline-none leading-relaxed placeholder-gray-300"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-300">{content.length}자</span>
          <button
            onClick={saveMemo}
            disabled={saving || !content.trim()}
            className="bg-diary-pink hover:bg-diary-rose disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="text-center text-diary-rose text-sm animate-pulse">
          {savedMsg}
        </div>
      )}
    </div>
  )
}
