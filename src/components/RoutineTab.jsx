// src/components/RoutineTab.jsx
// 루틴 목록 관리 (추가 / 완료 체크 / 삭제)

import { useState, useEffect } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, updateDoc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function RoutineTab() {
  const { currentUser, userProfile } = useAuth()
  const [routines,  setRoutines]  = useState([])
  const [newName,   setNewName]   = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!currentUser) return
    loadRoutines()
  }, [currentUser])

  async function loadRoutines() {
    try {
      const q = query(
        collection(db, 'routines'),
        where('userId', '==', currentUser.uid)
      )
      const snap = await getDocs(q)
      // Firestore 인덱스 설정 없이도 작동하도록 JS에서 정렬
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
      setRoutines(data)
    } catch (err) {
      console.error("루틴 로드 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  async function addRoutine() {
    if (!newName.trim()) return
    const docRef = await addDoc(collection(db, 'routines'), {
      name:      newName.trim(),
      userId:    currentUser.uid,
      done:      false,
      createdAt: serverTimestamp(),
    })
    setRoutines(prev => [...prev, { id: docRef.id, name: newName.trim(), done: false }])
    setNewName('')
  }

  async function toggleDone(id, current) {
    await updateDoc(doc(db, 'routines', id), { done: !current })
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, done: !current } : r))
  }

  async function deleteRoutine(id) {
    await deleteDoc(doc(db, 'routines', id))
    setRoutines(prev => prev.filter(r => r.id !== id))
  }

  const doneCount = routines.filter(r => r.done).length

  return (
    <div className="p-4 space-y-4">
      {/* 진행 현황 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-diary-dark">오늘의 루틴</span>
          <span className="text-xs text-gray-400">{doneCount} / {routines.length}</span>
        </div>
        <div className="w-full bg-diary-green/5 rounded-full h-2">
          <div
            className="bg-diary-green h-2 rounded-full transition-all duration-500"
            style={{ width: routines.length ? `${(doneCount / routines.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* 루틴 추가 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-2 border border-diary-green/5">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addRoutine()}
          placeholder="새로운 습관을 심어보세요... 🌱"
          className="flex-1 text-sm focus:outline-none placeholder-diary-green/20 text-diary-dark"
        />
        <button
          onClick={addRoutine}
          className="bg-diary-green text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-diary-leaf transition-all shadow-sm active:scale-95"
        >
          추가
        </button>
      </div>

      {/* 루틴 목록 */}
      {loading ? (
        <p className="text-center text-diary-green/40 text-sm">숲을 가꾸는 중...</p>
      ) : (
        <div className="space-y-2">
          {routines.map(routine => (
            <div
              key={routine.id}
              className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 border border-diary-green/5"
            >
              <button
                onClick={() => toggleDone(routine.id, routine.done)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  routine.done
                    ? 'bg-diary-green border-diary-green text-white'
                    : 'border-diary-green/10 hover:border-diary-green/40'
                }`}
              >
                {routine.done && <span className="text-xs">✓</span>}
              </button>
              <span className={`flex-1 text-sm ${
                routine.done ? 'line-through text-diary-green/20' : 'text-diary-dark font-medium'
              }`}>
                {routine.name}
              </span>
              <button
                onClick={() => deleteRoutine(routine.id)}
                className="text-diary-green/10 hover:text-red-400 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}

          {routines.length === 0 && (
            <div className="text-center py-8 text-diary-green/20 text-sm">
              작은 습관부터 시작해볼까요? 🍃
            </div>
          )}
        </div>
      )}
    </div>
  )
}
