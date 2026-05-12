// src/pages/Dashboard.jsx ⭐
// 3탭 구조: 루틴 관리 / 메모 작성 / 메모 보기(댓글)

import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import RoutineTab from '../components/RoutineTab'
import MemoTab    from '../components/MemoTab'
import ViewTab    from '../components/ViewTab'

const TABS = [
  { id: 'routine', label: '루틴',  icon: '✅' },
  { id: 'memo',    label: '일기',  icon: '✏️' },
  { id: 'view',    label: '보기',  icon: '💌' },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('memo')
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-diary-dark text-lg">교환 일기 📖</h1>
          <p className="text-xs text-gray-400">
            안녕하세요, {userProfile?.name || '친구'}님
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
        >
          로그아웃
        </button>
      </header>

      {/* 탭 콘텐츠 */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'routine' && <RoutineTab />}
        {activeTab === 'memo'    && <MemoTab />}
        {activeTab === 'view'    && <ViewTab />}
      </main>

      {/* 하단 탭 바 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              activeTab === tab.id
                ? 'text-diary-rose'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-xs font-medium ${activeTab === tab.id ? 'text-diary-rose' : ''}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 w-12 h-0.5 bg-diary-rose rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
