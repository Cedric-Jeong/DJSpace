// src/components/MemoTab.jsx
// 홈 탭: 순수 달력 뷰 (나와 친구의 기록 표시)

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function MemoTab() {
  const { currentUser, userProfile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [memoDates,    setMemoDates]    = useState([])  // 메모가 있는 날짜들
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!currentUser || !userProfile) return

    async function fetchDots() {
      setLoading(true)
      try {
        const ids = [currentUser.uid, userProfile.friendId].filter(Boolean)
        const q = query(
          collection(db, 'memos'),
          where('authorId', 'in', ids)
        )
        const snap = await getDocs(q)
        const dates = snap.docs.map(d => d.data().date?.toDate().toDateString()).filter(Boolean)
        setMemoDates([...new Set(dates)])
      } catch (err) {
        console.error("달력 점 로드 실패:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDots()
  }, [currentUser, userProfile])

  const tileClassName = ({ date }) => {
    return memoDates.includes(date.toDateString()) ? 'has-memo' : null
  }

  const dateStr = selectedDate.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })

  return (
    <div className="p-4 space-y-4">
      {/* 달력 카드 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-diary-green/5">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          locale="ko-KR"
          tileClassName={tileClassName}
          calendarType="gregory"
          formatDay={(locale, date) => date.getDate()}
        />
      </div>

      {/* 선택된 날짜 안내 */}
      <div className="bg-white rounded-2xl p-4 border border-diary-green/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-diary-green/10 rounded-xl flex items-center justify-center text-diary-green">
            📅
          </div>
          <div>
            <p className="text-[10px] text-diary-green/40 font-bold uppercase tracking-wider">Selected Date</p>
            <p className="text-sm font-bold text-diary-green">{dateStr}</p>
          </div>
        </div>
        {memoDates.includes(selectedDate.toDateString()) ? (
          <span className="text-[10px] bg-diary-green text-white px-3 py-1 rounded-full font-bold">기록 있음</span>
        ) : (
          <span className="text-[10px] bg-diary-green/5 text-diary-green/30 px-3 py-1 rounded-full font-bold">기록 없음</span>
        )}
      </div>

      <p className="text-center text-[11px] text-diary-green/30 font-medium px-8 leading-relaxed">
        달력의 점은 당신과 소중한 사람이 함께 남긴 조각들입니다.<br/>
        '메모' 탭에서 새로운 조각을 남겨보세요.
      </p>
    </div>
  )
}
