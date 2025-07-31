# Shadowing Practice Web Application

중국어 쉐도잉 연습을 위한 웹 애플리케이션입니다.

## 환경변수 설정

1. `.env.example` 파일을 복사하여 `.env` 파일을 생성하세요:
```bash
cp .env.example .env
```

2. `.env` 파일을 열고 실제 API 키들을 입력하세요:
- `VITE_AZURE_SPEECH_KEY`: Azure Speech Services 구독 키
- `VITE_PPLX_API_KEY`: Perplexity API 키 (선택사항)
- `VITE_OPENAI_API_KEY`: OpenAI API 키 (선택사항)
- `VITE_GEMINI_API_KEY`: Google Gemini API 키 (선택사항)

⚠️ **중요**: `.env` 파일은 절대 Git에 커밋하지 마세요!

## 설치 및 실행

```bash
npm install
npm run dev
```

## 기능

- Azure TTS를 이용한 중국어 음성 생성
- 음성 녹음 및 재생
- 실시간 텍스트 하이라이트
- 발음 평가 (예정)
