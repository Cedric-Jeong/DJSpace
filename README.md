# 📖 교환 일기 — Vercel 배포 가이드

## Vercel에 입력할 환경 변수 목록

| 변수명 | 값 찾는 곳 |
|--------|-----------|
| `VITE_FIREBASE_API_KEY` | Firebase 콘솔 → 프로젝트 설정 → 내 앱 |
| `VITE_FIREBASE_AUTH_DOMAIN` | 동일 |
| `VITE_FIREBASE_PROJECT_ID` | 동일 |
| `VITE_FIREBASE_STORAGE_BUCKET` | 동일 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 동일 |
| `VITE_FIREBASE_APP_ID` | 동일 |

---

## 배포 순서

### 1. Firebase 설정
1. [Firebase 콘솔](https://console.firebase.google.com) 접속
2. 새 프로젝트 생성
3. **Authentication** → 시작하기 → 이메일/비밀번호 활성화
4. **Firestore** → 데이터베이스 만들기 → 테스트 모드로 시작
5. **프로젝트 설정** → 내 앱 → `</>` 웹 앱 추가 → 설정값 복사

### 2. 로컬에서 설치 및 실행
```bash
# 1. 이 폴더 전체를 컴퓨터에 복사한 후
cd exchange-diary

# 2. .env.example 파일을 복사해서 .env 파일 만들기
cp .env.example .env
# .env 파일 열어서 Firebase 값 입력

# 3. 패키지 설치
npm install

# 4. 로컬 실행
npm run dev
```

### 3. GitHub에 올리기
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_ID/exchange-diary.git
git push -u origin main
```

### 4. Vercel 배포
1. [Vercel](https://vercel.com) 접속 → GitHub으로 로그인
2. **New Project** → 방금 만든 저장소 선택 → **Import**
3. **Environment Variables** 섹션에 위 표의 변수 6개 입력
4. **Deploy** 클릭 → 1~2분 후 URL 생성!

### 5. Firestore 보안 규칙 적용
`firestore.rules` 파일의 내용을 복사해서
Firebase 콘솔 → Firestore → 규칙 탭에 붙여넣기

---

## 친구 연결 방법
1. 두 사람 모두 회원가입
2. 회원가입 시 '친구 아이디' 란에 서로의 아이디를 입력
   - A는 B의 아이디 입력
   - B는 A의 아이디 입력
3. 이후 [보기] 탭에서 두 사람의 일기가 함께 표시됩니다

---

## Vercel 빌드 설정 (자동)
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
# DJSpace
