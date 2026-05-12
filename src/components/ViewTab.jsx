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
      // Firestore OR 쿼리는 'in' 연산자로 처리
      const q = query(
        collection(db, 'memos'),
        where('authorId', 'in', [currentUser.uid, userProfile.friendId].filter(Boolean)),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      setMemos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
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
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      불러오는 중...
    </div>
  )

  if (memos.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 gap-2">
      <span className="text-4xl">📭</span>
      <p className="text-gray-400 text-sm">아직 일기가 없어요</p>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      {memos.map(memo => {
        const isMe = memo.authorId === currentUser.uid
        const dateStr = memo.date?.toDate
          ? memo.date.toDate().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
          : ''

        return (
          <div key={memo.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* 메모 헤더 */}
            <div className={`px-4 py-3 flex items-center justify-between ${
              isMe ? 'bg-diary-peach' : 'bg-blue-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{isMe ? '🌸' : '💙'}</span>
                <span className="font-medium text-sm text-diary-dark">
                  {memo.authorName}
                </span>
              </div>
              <span className="text-xs text-gray-400">{dateStr}</span>
            </div>

            {/* 메모 본문 */}
            <div className="px-4 py-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {memo.content}
              </p>
            </div>

            {/* 댓글 목록 */}
            {(memo.comments || []).length > 0 && (
              <div className="border-t border-gray-50 px-4 py-3 space-y-2">
                {memo.comments.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-xs text-diary-rose font-medium shrink-0">
                      {c.authorName}
                    </span>
                    <span className="text-xs text-gray-600">{c.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 댓글 입력 */}
            <div className="border-t border-gray-50 px-4 py-3 flex gap-2">
              <input
                type="text"
                value={commentMap[memo.id] || ''}
                onChange={e => setCommentMap(prev => ({ ...prev, [memo.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addComment(memo.id)}
                placeholder="댓글 남기기..."
                className="flex-1 text-xs text-gray-600 focus:outline-none placeholder-gray-300"
              />
              <button
                onClick={() => addComment(memo.id)}
                className="text-diary-rose text-xs font-medium hover:text-diary-dark transition-colors"
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
