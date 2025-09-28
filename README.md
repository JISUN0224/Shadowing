# Shadowing Practice Web Application

중국어 쉐도잉 연습을 위한 웹 애플리케이션입니다.

## 환경변수 설정

1. 프로젝트 루트에 `.env` 파일을 생성하세요:
```bash
touch .env
```

2. `.env` 파일을 열고 다음 환경변수들을 입력하세요:

### 필수 환경변수
```env
# Azure Speech Services
VITE_AZURE_SPEECH_KEY=your_azure_speech_key_here
VITE_AZURE_SPEECH_REGION=eastasia

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 선택적 환경변수 (AI 텍스트 생성용)
```env
# AI Text Generation APIs
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_PPLX_API_KEY=your_pplx_api_key_here
```

⚠️ **중요**: 
- `.env` 파일은 절대 Git에 커밋하지 마세요!
- API 키는 절대 코드에 하드코딩하지 마세요!
- 프로덕션 환경에서는 환경변수를 안전하게 관리하세요!

## 설치 및 실행

```bash
npm install
npm run dev
```

## 기능

### 🎤 쉐도잉 연습
- Azure TTS를 이용한 중국어 음성 생성
- 음성 녹음 및 재생
- 실시간 텍스트 하이라이트
- 재생 속도 조절 (0.5x, 1x, 1.5x)

### 🎯 발음 평가
- Azure Speech Services를 이용한 실시간 발음 평가
- 정확도, 유창성, 완전성, 운율 분석
- 단어별/음절별/음소별 상세 피드백
- 브라우저 음성 인식 폴백 지원

### 📊 대시보드
- 개인별 학습 진도 및 성과 분석
- 주간/일일 학습 패턴 시각화
- 스킬별 성과 랭킹
- AI 인사이트 및 개선 조언

### 🔐 사용자 관리
- Google 로그인 지원
- 개인별 학습 데이터 저장
- 즐겨찾기 텍스트 관리
- 로그인/비로그인 상태별 맞춤 경험

### 🤖 AI 텍스트 생성
- Gemini, GPT 모델 지원
- 7단계 폴백 시스템
- 다양한 주제별 중국어 텍스트 생성
