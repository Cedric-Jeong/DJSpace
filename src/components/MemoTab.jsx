// src/components/MemoTab.jsx
// 달력 + 일기 작성 기능

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import {
  collection, addDoc, query, where, getDocs,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function MemoTab() {
  const { currentUser, userProfile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [content,      setContent]      = useState('')
  const [memoDates,    setMemoDates]    = useState([])  // 메모가 있는 날짜들 (toDateString 모음)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [savedMsg,     setSavedMsg]     = useState('')

  // 데이터 로드 (달력 점 + 현재 선택된 날짜의 메모)
  useEffect(() => {
    if (!currentUser || !userProfile) return

    async function fetchData() {
      setLoading(true)
      try {
        // 1. 모든 메모 날짜 가져오기 (본인 것 우선)
        const q = query(
          collection(db, 'memos'),
          where('authorId', '==', currentUser.uid)
        )
        const snap = await getDocs(q)
        
        // 데이터 파싱
        const myMemos = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          dateStr: d.data().date?.toDate().toDateString()
        }))

        // 2. 달력에 표시할 날짜들 설정 (중복 제거)
        const dates = myMemos.map(m => m.dateStr).filter(Boolean)
        setMemoDates([...new Set(dates)])

        // 3. 현재 선택된 날짜의 메모 내용 설정
        const todayMemo = myMemos.find(m => m.dateStr === selectedDate.toDateString())
        setContent(todayMemo ? todayMemo.content : '')

      } catch (err) {
        console.error("데이터 로드 실패:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser, userProfile, selectedDate.toDateString()])

  async function saveMemo() {
    if (!content.trim()) return
    setSaving(true)
    try {
      // 기록 저장
      await addDoc(collection(db, 'memos'), {
        content:    content.trim(),
        authorId:   currentUser.uid,
        authorName: userProfile?.name || '나',
        friendId:   userProfile?.friendId || '',
        date:       selectedDate,
        createdAt:  serverTimestamp(),
        comments:   [],
      })
      
      setSavedMsg('기록이 저장되었습니다 ✨')
      setTimeout(() => setSavedMsg(''), 2500)
      
      // 즉시 점 추가
      const dStr = selectedDate.toDateString()
      setMemoDates(prev => prev.includes(dStr) ? prev : [...prev, dStr])
    } catch (err) {
      console.error("저장 실패:", err)
    } finally {
      setSaving(false)
    }
  }

  // 달력 타일에 점 추가
  const tileClassName = ({ date }) => {
    return memoDates.includes(date.toDateString()) ? 'has-memo' : null
  }

  const dateStr = selectedDate.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })

  return (
    <div className="p-4 space-y-4">
      {/* 달력 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-diary-green/5">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          locale="ko-KR"
          tileClassName={tileClassName}
          calendarType="gregory"
          formatDay={(locale, date) => date.getDate()} // '일' 글자 제거
        />
      </div>

      {/* 선택 날짜 표시 */}
      <div className="bg-diary-green/5 rounded-2xl px-4 py-3 border border-diary-green/5 flex justify-between items-center">
        <p className="text-diary-green font-bold text-sm">{dateStr}</p>
        {memoDates.includes(selectedDate.toDateString()) && (
          <span className="text-[10px] bg-diary-green text-white px-2 py-0.5 rounded-full font-bold">기록있음</span>
        )}
      </div>

      {/* 일기 작성 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-diary-green/5">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={loading ? "기록을 불러오는 중..." : "오늘의 조각을 남겨보세요... 🌿"}
          rows={7}
          disabled={loading || saving}
          className="w-full text-sm text-diary-dark resize-none focus:outline-none leading-relaxed placeholder-diary-green/20 disabled:opacity-50"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-diary-green/5">
          <span className="text-xs text-diary-green/20">{content.length}자</span>
          <button
            onClick={saveMemo}
            disabled={saving || !content.trim() || loading}
            className="bg-diary-green hover:bg-diary-leaf disabled:opacity-40 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
          >
            {saving ? '기록 중...' : '기록하기'}
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="text-center text-diary-brown text-sm font-bold animate-pulse">
          {savedMsg}
        </div>
      )}
    </div>
  )
}
