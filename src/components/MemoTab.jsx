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
    if (!currentUser || !userProfile) return
    async function loadMemoDates() {
      try {
        // 복합 인덱스 문제 방지를 위해 작성자 필터링만 먼저 수행
        // 나와 친구의 메모를 모두 가져와서 달력에 표시
        const q = query(
          collection(db, 'memos'),
          where('authorId', 'in', [currentUser.uid, userProfile.friendId].filter(Boolean))
        )
        const snap = await getDocs(q)
        
        // 가져온 데이터에서 이번 달에 해당하는 날짜만 추출
        const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        const end   = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
        
        const dates = snap.docs
          .map(d => d.data().date.toDate())
          .filter(date => date >= start && date <= end)
          .map(date => date.toDateString())

        setMemoDates([...new Set(dates)])
      } catch (err) {
        console.error("메모 날짜 로드 실패:", err)
      }
    }
    loadMemoDates()
  }, [currentUser, userProfile, selectedDate.getMonth()])

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
      <div className="bg-diary-green/5 rounded-2xl px-4 py-3 border border-diary-green/5">
        <p className="text-diary-green font-semibold text-sm">{dateStr}</p>
      </div>

      {/* 일기 작성 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-diary-green/5">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="오늘의 조각을 남겨보세요... 🌿"
          rows={7}
          className="w-full text-sm text-diary-dark resize-none focus:outline-none leading-relaxed placeholder-diary-green/20"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-diary-green/5">
          <span className="text-xs text-diary-green/20">{content.length}자</span>
          <button
            onClick={saveMemo}
            disabled={saving || !content.trim()}
            className="bg-diary-green hover:bg-diary-leaf disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            {saving ? '기록 중...' : '기록하기'}
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="text-center text-diary-brown text-sm font-medium animate-pulse">
          {savedMsg.replace('💕', '✨')}
        </div>
      )}
    </div>
  )
}
