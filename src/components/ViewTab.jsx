// src/components/ViewTab.jsx
// 메모 탭: 일기 작성 + 나와 친구의 일기 목록 보기

import { useState, useEffect } from 'react'
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp, doc, updateDoc, arrayUnion
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function ViewTab() {
  const { currentUser, userProfile } = useAuth()
  const [memos,      setMemos]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [content,    setContent]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [commentMap, setCommentMap] = useState({})

  useEffect(() => {
    if (!currentUser || !userProfile) return
    loadMemos()
  }, [currentUser, userProfile])

  async function loadMemos() {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'memos'),
        where('authorId', 'in', [currentUser.uid, userProfile.friendId].filter(Boolean))
      )
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      
      data.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0)
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0)
        return dateB - dateA
      })
      
      setMemos(data)
    } catch (err) {
      console.error('메모 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveMemo() {
    if (!content.trim()) return
    setSaving(true)
    try {
      const newDoc = {
        content:    content.trim(),
        authorId:   currentUser.uid,
        authorName: userProfile?.name || '나',
        friendId:   userProfile?.friendId || '',
        date:       new Date(), // 오늘 날짜로 기록
        createdAt:  serverTimestamp(),
        comments:   [],
      }
      await addDoc(collection(db, 'memos'), newDoc)
      setContent('')
      loadMemos() // 목록 새로고침
    } catch (err) {
      console.error("저장 실패:", err)
    } finally {
      setSaving(false)
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

    setMemos(prev => prev.map(m =>
      m.id === memoId
        ? { ...m, comments: [...(m.comments || []), comment] }
        : m
    ))
    setCommentMap(prev => ({ ...prev, [memoId]: '' }))
  }

  return (
    <div className="p-4 space-y-6">
      {/* 일기 작성란 (상단 고정 느낌) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-diary-green/5 space-y-3">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="새로운 조각을 남겨보세요... 🌿"
          rows={4}
          className="w-full text-sm text-diary-dark resize-none focus:outline-none leading-relaxed placeholder-diary-green/20"
        />
        <div className="flex items-center justify-between pt-3 border-t border-diary-green/5">
          <span className="text-xs text-diary-green/20">{content.length}자</span>
          <button
            onClick={saveMemo}
            disabled={saving || !content.trim()}
            className="bg-diary-green hover:bg-diary-leaf disabled:opacity-40 text-white text-xs font-bold px-6 py-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            {saving ? '기록 중...' : '기록하기'}
          </button>
        </div>
      </div>

      {/* 구분선 */}
      <div className="flex items-center gap-4 px-2">
        <div className="h-px bg-diary-green/5 flex-1" />
        <span className="text-[10px] font-bold text-diary-green/20 uppercase tracking-widest">History</span>
        <div className="h-px bg-diary-green/5 flex-1" />
      </div>

      {/* 메모 목록 */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-diary-green/40 text-sm">
          우편함을 확인하는 중... 🌿
        </div>
      ) : memos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <span className="text-4xl">🍃</span>
          <p className="text-diary-green/30 text-sm font-medium">아직 채워진 이야기가 없어요</p>
        </div>
      ) : (
        <div className="space-y-6">
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
      )}
    </div>
  )
}
