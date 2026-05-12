// src/components/ViewTab.jsx
// 나 & 친구 메모 보기 + 댓글 기능
// 핵심: friendId 기반으로 두 사람의 데이터만 필터링

import { useState, useEffect } from 'react'
import {
  collection, query, where, getDocs,
  orderBy, doc, updateDoc, arrayUnion,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function ViewTab() {
  const { currentUser, userProfile } = useAuth()
  const [memos,      setMemos]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [commentMap, setCommentMap] = useState({})  // memoId → 입력 중인 댓글

  useEffect(() => {
    if (!currentUser || !userProfile) return
    loadMemos()
  }, [currentUser, userProfile])

  async function loadMemos() {
    setLoading(true)
    try {
      // ⭐ 핵심: 나의 메모 + 친구의 메모만 가져오기
      const q = query(
        collection(db, 'memos'),
        where('authorId', 'in', [currentUser.uid, userProfile.friendId].filter(Boolean))
      )
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      
      // 인덱스 설정 없이도 작동하도록 JS에서 내림차순 정렬
      data.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      })
      
      setMemos(data)
    } catch (err) {
      console.error('메모 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  async function addComment(memoId) {
    const text = commentMap[memoId]?.trim()
    if (!text) return

    const comment = {
      text,
      authorId:   currentUser.uid,
      authorName: userProfile?.name || '나',
      createdAt:  new Date().toISOString(),
    }

    await updateDoc(doc(db, 'memos', memoId), {
      comments: arrayUnion(comment),
    })

    // 로컬 상태 업데이트
    setMemos(prev => prev.map(m =>
      m.id === memoId
        ? { ...m, comments: [...(m.comments || []), comment] }
        : m
    ))
    setCommentMap(prev => ({ ...prev, [memoId]: '' }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-diary-green/40 text-sm">
      우편함을 확인하는 중... 🌿
    </div>
  )

  if (memos.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 gap-3">
      <span className="text-4xl">🍃</span>
      <p className="text-diary-green/30 text-sm font-medium">아직 채워진 이야기가 없어요</p>
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      {memos.map(memo => {
        const isMe = memo.authorId === currentUser.uid
        const dateStr = memo.date?.toDate
          ? memo.date.toDate().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
          : ''

        return (
          <div key={memo.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-diary-green/5">
            {/* 메모 헤더 */}
            <div className={`px-4 py-3 flex items-center justify-between ${
              isMe ? 'bg-diary-green/10' : 'bg-diary-brown/10'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{isMe ? '🌱' : '🪵'}</span>
                <span className={`font-bold text-xs uppercase tracking-tighter ${
                  isMe ? 'text-diary-green' : 'text-diary-brown'
                }`}>
                  {memo.authorName}
                </span>
              </div>
              <span className="text-[10px] font-bold text-diary-green/30">{dateStr}</span>
            </div>

            {/* 메모 본문 */}
            <div className="px-5 py-5">
              <p className="text-sm text-diary-dark leading-relaxed whitespace-pre-wrap font-medium">
                {memo.content}
              </p>
            </div>

            {/* 댓글 목록 */}
            {(memo.comments || []).length > 0 && (
              <div className="bg-diary-cream/50 px-5 py-4 space-y-3">
                {memo.comments.map((c, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <span className={`text-[10px] font-bold ${
                      c.authorId === currentUser.uid ? 'text-diary-green' : 'text-diary-brown'
                    }`}>
                      {c.authorName}
                    </span>
                    <span className="text-xs text-diary-dark/80 leading-snug">{c.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 댓글 입력 */}
            <div className="px-4 py-3 flex gap-2 bg-white">
              <input
                type="text"
                value={commentMap[memo.id] || ''}
                onChange={e => setCommentMap(prev => ({ ...prev, [memo.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addComment(memo.id)}
                placeholder="따뜻한 한마디를 남겨주세요..."
                className="flex-1 text-xs text-diary-dark focus:outline-none placeholder-diary-green/20 py-1"
              />
              <button
                onClick={() => addComment(memo.id)}
                className="text-diary-green text-xs font-bold hover:text-diary-brown transition-colors px-2"
              >
                전송
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
