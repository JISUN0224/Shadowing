// 음소 분석 결과
export interface Phoneme {
  phoneme: string;
  accuracyScore: number;
}

// 음절 분석 결과 (Azure API 데이터 포함)
export interface Syllable {
  syllable?: string;
  accuracyScore?: number;
  // Azure API에서 제공하는 실제 필드들
  Syllable?: string;
  Grapheme?: string;
  PronunciationAssessment?: {
    AccuracyScore: number;
  };
  Offset?: number;
  Duration?: number;
}

// Azure API Prosody 데이터 타입들
export interface ProsodyBreak {
  errorTypes?: string[];
  confidence?: number;
  duration?: number;
}

export interface ProsodyIntonation {
  monotone?: {
    confidence: number;
    detected: boolean;
  };
  pitchRange?: {
    min: number;
    max: number;
    average: number;
  };
}

export interface ProsodyFeedback {
  break?: ProsodyBreak;
  intonation?: ProsodyIntonation;
}

// 단어 분석 결과 (Azure API 데이터 포함)
export interface WordAnalysis {
  word: string;
  accuracyScore: number;
  errorType: 'None' | 'Mispronunciation' | 'Omission' | 'Insertion' | 'UnexpectedBreak';
  syllables?: Syllable[];
  phonemes?: Phoneme[];
  feedback?: {
    prosody?: ProsodyFeedback;
  };
}

// 운율 분석 결과
export interface ProsodyAnalysis {
  breakAnalysis: {
    unexpectedBreaks: WordAnalysis[];
    missingBreaks: WordAnalysis[];
    normalBreaks: WordAnalysis[];
  };
  intonationAnalysis: {
    monotoneWords: WordAnalysis[];
    naturalWords: WordAnalysis[];
  };
}

// 전체 평가 결과
export interface EvaluationResult {
  // 기본 점수들
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number;
  overallScore: number;
  
  // 단어별 분석
  words: WordAnalysis[];
  
  // 추가 메트릭
  pauseCount: number;
  confidenceScore: number;
  
  // 분석된 피드백
  strongPoints: string[];
  improvementAreas: string[];
  problematicWords: string[];
  scoreAdvice: string;
}

// 에러 분석 결과
export interface ErrorAnalysis {
  severity: 'low' | 'medium' | 'high';
  koreanPattern: string;
  problematicPhonemes: string[];
  improvementMethod: string;
  practiceExample: string;
}

// 컴포넌트 Props
export interface EvaluationResultProps {
  evaluation: EvaluationResult;
  originalText: string;
  onRetryPractice: () => void;
  onNewText: () => void;
} 