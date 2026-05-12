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
    const q = query(
      collection(db, 'routines'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'asc')
    )
    const snap = await getDocs(q)
    setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
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
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-diary-pink h-2 rounded-full transition-all duration-500"
            style={{ width: routines.length ? `${(doneCount / routines.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* 루틴 추가 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addRoutine()}
          placeholder="새 루틴 추가..."
          className="flex-1 text-sm focus:outline-none placeholder-gray-300 text-gray-700"
        />
        <button
          onClick={addRoutine}
          className="bg-diary-pink text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-diary-rose transition-colors"
        >
          추가
        </button>
      </div>

      {/* 루틴 목록 */}
      {loading ? (
        <p className="text-center text-gray-400 text-sm">불러오는 중...</p>
      ) : (
        <div className="space-y-2">
          {routines.map(routine => (
            <div
              key={routine.id}
              className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3"
            >
              <button
                onClick={() => toggleDone(routine.id, routine.done)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  routine.done
                    ? 'bg-diary-pink border-diary-pink text-white'
                    : 'border-gray-200 hover:border-diary-pink'
                }`}
              >
                {routine.done && <span className="text-xs">✓</span>}
              </button>
              <span className={`flex-1 text-sm ${
                routine.done ? 'line-through text-gray-300' : 'text-gray-700'
              }`}>
                {routine.name}
              </span>
              <button
                onClick={() => deleteRoutine(routine.id)}
                className="text-gray-200 hover:text-red-300 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}

          {routines.length === 0 && (
            <div className="text-center py-8 text-gray-300 text-sm">
              루틴을 추가해보세요 ✨
            </div>
          )}
        </div>
      )}
    </div>
  )
}
