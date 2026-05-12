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

  // 날짜/타임스탬프에서 안전하게 시간을 추출하는 함수
  const getTime = (val) => {
    if (!val) return 0
    if (val.toDate) return val.toDate().getTime()
    if (val instanceof Date) return val.getTime()
    return 0
  }

  useEffect(() => {
    if (!currentUser || !userProfile) return
    
    async function init() {
      setLoading(true)
      try {
        let friendUid = null
        if (userProfile.friendId) {
          const qFriend = query(
            collection(db, 'users'),
            where('userId', '==', userProfile.friendId)
          )
          const snapFriend = await getDocs(qFriend)
          if (!snapFriend.empty) {
            friendUid = snapFriend.docs[0].id
          }
        }
        await loadMemos(friendUid)
      } catch (err) {
        console.error("초기 로딩 실패:", err)
      } finally {
        setLoading(false)
      }
    }
    
    init()
  }, [currentUser, userProfile])

  async function loadMemos(fUid = null) {
    try {
      const ids = [currentUser.uid, fUid].filter(Boolean)
      const q = query(
        collection(db, 'memos'),
        where('authorId', 'in', ids)
      )
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      
      // 정렬: 최신순
      data.sort((a, b) => {
        const tA = getTime(a.createdAt) || getTime(a.date) || 0
        const tB = getTime(b.createdAt) || getTime(b.date) || 0
        return tB - tA
      })
      
      setMemos(data)
    } catch (err) {
      console.error('메모 로드 실패:', err)
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
        date:       new Date(), 
        createdAt:  serverTimestamp(),
        comments:   [],
      }
      await addDoc(collection(db, 'memos'), newDoc)
      setContent('')
      
      let fUid = null
      if (userProfile.friendId) {
        const qF = query(collection(db, 'users'), where('userId', '==', userProfile.friendId))
        const sF = await getDocs(qF)
        if (!sF.empty) fUid = sF.docs[0].id
      }
      await loadMemos(fUid)
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

      <div className="flex items-center gap-4 px-2">
        <div className="h-px bg-diary-green/5 flex-1" />
        <span className="text-[10px] font-bold text-diary-green/20 uppercase tracking-widest">History</span>
        <div className="h-px bg-diary-green/5 flex-1" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-diary-green/40 text-sm font-medium animate-pulse">
          숲의 기록을 불러오는 중... 🌿
        </div>
      ) : memos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <span className="text-4xl">🍃</span>
          <p className="text-diary-green/30 text-sm font-medium text-center">
            아직 채워진 이야기가 없어요.<br/>
            첫 번째 조각을 남겨보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {memos.map(memo => {
            const isMe = memo.authorId === currentUser.uid
            
            // 날짜 표시 로직 강화
            let dateObj = null
            if (memo.date?.toDate) dateObj = memo.date.toDate()
            else if (memo.date instanceof Date) dateObj = memo.date
            else if (memo.createdAt?.toDate) dateObj = memo.createdAt.toDate()
            
            const dateStr = dateObj
              ? dateObj.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
              : '알 수 없는 날짜'

            return (
              <div key={memo.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-diary-green/5">
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

                <div className="px-5 py-5">
                  <p className="text-sm text-diary-dark leading-relaxed whitespace-pre-wrap font-medium">
                    {memo.content}
                  </p>
                </div>

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

                <div className="px-4 py-3 flex gap-2 bg-white border-t border-diary-green/5">
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
