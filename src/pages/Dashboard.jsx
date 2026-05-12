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
    <div className="min-h-screen bg-diary-cream flex flex-col max-w-md mx-auto">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-diary-green/5 px-4 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-diary-green text-xl tracking-tight leading-tight">
            우리들의 공간
          </h1>
          <p className="text-[11px] text-diary-green/40 font-medium mt-0.5 ml-0.5">
            {userProfile?.name ? `${userProfile.name}님의 숲` : '나의 숲'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-diary-green/40 text-xs hover:text-diary-brown transition-colors font-medium"
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
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-md border-t border-diary-green/5 flex shadow-lg shadow-diary-green/5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id
                ? 'text-diary-green transform scale-105'
                : 'text-diary-green/30 hover:text-diary-green/60'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === tab.id ? 'text-diary-green' : ''}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-1 w-1 h-1 bg-diary-brown rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
