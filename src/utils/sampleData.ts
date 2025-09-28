import { EvaluationResult } from '../types';
import { 
  calculateOverallScore, 
  generateScoreAdvice, 
  analyzeStrengthsAndWeaknesses 
} from './evaluationUtils';

// 사용자 텍스트 기반 완전한 하드코딩 피드백 생성 (Azure API 실패 시 사용)
export const generateCompleteFallbackEvaluation = (text: string): EvaluationResult => {
  // 텍스트 길이와 복잡도 기반 점수 조정
  const textLength = text.length;
  const complexity = calculateTextComplexity(text);
  
  // 기본 점수 범위 (텍스트 복잡도에 따라 조정)
  const baseAccuracy = Math.max(70, 85 - complexity * 5);
  const baseFluency = Math.max(75, 90 - complexity * 3);
  const baseCompleteness = Math.max(80, 95 - textLength * 0.5);
  const baseProsody = Math.max(65, 85 - complexity * 4);
  
  // 랜덤 변동 추가 (±5점)
  const accuracyScore = Math.round(baseAccuracy + (Math.random() - 0.5) * 10);
  const fluencyScore = Math.round(baseFluency + (Math.random() - 0.5) * 10);
  const completenessScore = Math.round(baseCompleteness + (Math.random() - 0.5) * 10);
  const prosodyScore = Math.round(baseProsody + (Math.random() - 0.5) * 10);
  
  // 휴지 횟수 (텍스트 길이 기반)
  const pauseCount = Math.floor(textLength / 20) + Math.floor(Math.random() * 3);
  
  // 종합 점수 계산
  const overallScore = calculateOverallScore(accuracyScore, fluencyScore, completenessScore, prosodyScore);
  
  // 자신감 점수
  const confidenceScore = Math.max(0, 100 - pauseCount * 8);
  
  // 강점과 개선점 분석
  const { strongPoints, improvementAreas } = analyzeStrengthsAndWeaknesses(
    accuracyScore, fluencyScore, completenessScore, prosodyScore
  );
  
  // 점수별 조언
  const scoreAdvice = generateScoreAdvice(overallScore);
  
  // 텍스트를 단어/문자로 분할하고 각각에 대한 상세 분석 생성
  const words = generateWordAnalysis(text, accuracyScore);
  
  // 문제 단어 추출
  const problematicWords = words.filter(w => w.accuracyScore < 70).map(w => w.word);
  
  return {
    accuracyScore,
    fluencyScore,
    completenessScore,
    prosodyScore,
    overallScore,
    words,
    pauseCount,
    confidenceScore,
    strongPoints,
    improvementAreas,
    problematicWords,
    scoreAdvice
  };
};

// 텍스트 복잡도 계산 함수
const calculateTextComplexity = (text: string): number => {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
  const punctuation = text.match(/[。！？，、；：]/g) || [];
  const numbers = text.match(/[0-9]/g) || [];
  
  // 복잡도 점수 (0-5)
  let complexity = 0;
  complexity += Math.min(2, chineseChars.length / 20); // 한자 수
  complexity += Math.min(1, punctuation.length / 5);   // 구두점 수
  complexity += Math.min(1, numbers.length / 3);       // 숫자 수
  complexity += Math.min(1, text.length / 50);         // 전체 길이
  
  return Math.min(5, complexity);
};

// 단어별 상세 분석 생성
const generateWordAnalysis = (text: string, baseAccuracy: number) => {
  // 텍스트를 단어 단위로 분할 (중국어 특성 고려)
  const words = text.split(/[\s，。！？、；：]/).filter(word => word.trim().length > 0);
  
  return words.map(word => {
    // 단어별 점수 (기본 점수에서 변동)
    const wordScore = Math.max(40, Math.min(100, baseAccuracy + (Math.random() - 0.5) * 30));
    const errorTypes = ['None', 'Mispronunciation', 'Omission', 'Insertion', 'UnexpectedBreak'];
    const errorType = wordScore > 80 ? 'None' : errorTypes[Math.floor(Math.random() * errorTypes.length)];
    
    // 음절 생성 (중국어 단어 특성 고려)
    const syllables = word.split('').map(char => ({
      syllable: char,
      accuracyScore: Math.max(30, wordScore + (Math.random() - 0.5) * 20)
    }));
    
    // 음소 생성 (실제 음소 기호 사용)
    const phonemes = generatePhonemes(word, wordScore);
    
    return {
      word,
      accuracyScore: Math.round(wordScore),
      errorType: errorType as any,
      syllables,
      phonemes,
      feedback: generateProsodyFeedback(wordScore)
    };
  });
};

// 음소 생성 함수
const generatePhonemes = (word: string, baseScore: number) => {
  const phonemeMap: { [key: string]: string[] } = {
    '张': ['zh', 'āng'], '老': ['l', 'ǎo'], '师': ['sh', 'ī'], '常': ['ch', 'áng'],
    '常': ['ch', 'áng'], '认': ['r', 'èn'], '真': ['zh', 'ēn'], '地': ['d', 'ì'],
    '教': ['j', 'iào'], '我': ['w', 'ǒ'], '们': ['m', 'én'], '中': ['zh', 'ōng'],
    '文': ['w', 'én'], '他': ['t', 'ā'], '说': ['sh', 'uō'], '学': ['x', 'ué'],
    '习': ['x', 'í'], '需': ['x', 'ū'], '要': ['y', 'ào'], '多': ['d', 'uō'],
    '练': ['l', 'iàn'], '尤': ['y', 'óu'], '其': ['q', 'í'], '是': ['sh', 'ì'],
    '卷': ['j', 'uǎn'], '舌': ['sh', 'é'], '音': ['y', 'īn'], '只': ['zh', 'ǐ'],
    '有': ['y', 'ǒu'], '这': ['zh', 'è'], '样': ['y', 'àng'], '才': ['c', 'ái'],
    '能': ['n', 'éng'], '出': ['ch', 'ū'], '更': ['g', 'èng'], '标': ['b', 'iāo'],
    '准': ['zh', 'ǔn'], '流': ['l', 'iú'], '利': ['l', 'ì'], '的': ['d', 'e'],
    '汉': ['h', 'àn'], '语': ['y', 'ǔ']
  };
  
  return word.split('').map(char => {
    const phonemeList = phonemeMap[char] || [char];
    return phonemeList.map(phoneme => ({
      phoneme,
      accuracyScore: Math.max(20, baseScore + (Math.random() - 0.5) * 25)
    }));
  }).flat();
};

// 운율 피드백 생성
const generateProsodyFeedback = (wordScore: number) => {
  const hasBreakError = Math.random() < 0.3;
  const hasIntonationError = Math.random() < 0.4;
  
  const breakErrorTypes: string[] = [];
  if (hasBreakError) {
    breakErrorTypes.push(Math.random() < 0.5 ? 'UnexpectedBreak' : 'MissingBreak');
  }
  
  return {
    prosody: {
      break: breakErrorTypes.length > 0 ? {
        errorTypes: breakErrorTypes,
        confidence: 0.7 + Math.random() * 0.3,
        duration: 0.1 + Math.random() * 0.5
      } : undefined,
      intonation: hasIntonationError ? {
        monotone: {
          confidence: 0.6 + Math.random() * 0.4,
          detected: true
        },
        pitchRange: {
          min: 100 + Math.random() * 50,
          max: 200 + Math.random() * 100,
          average: 150 + Math.random() * 50
        }
      } : undefined
    }
  };
};

// 기존 샘플 평가 데이터 생성 함수 (간단한 버전)
export const generateSampleEvaluation = (text: string): EvaluationResult => {
  // 기본 점수들 (랜덤하게 생성하되 현실적인 범위)
  const accuracyScore = 75 + Math.random() * 20; // 75-95
  const fluencyScore = 70 + Math.random() * 25;  // 70-95
  const completenessScore = 80 + Math.random() * 15; // 80-95
  const prosodyScore = 65 + Math.random() * 30;  // 65-95
  const pauseCount = Math.floor(Math.random() * 6); // 0-5

  // 종합 점수 계산
  const overallScore = calculateOverallScore(accuracyScore, fluencyScore, completenessScore, prosodyScore);
  
  // 자신감 점수
  const confidenceScore = Math.max(0, 100 - pauseCount * 10);

  // 강점과 개선점 분석
  const { strongPoints, improvementAreas } = analyzeStrengthsAndWeaknesses(
    accuracyScore, fluencyScore, completenessScore, prosodyScore
  );

  // 점수별 조언
  const scoreAdvice = generateScoreAdvice(overallScore);

  // 텍스트를 개별 한자로 분할하고 각 한자에 대한 분석 생성
  const words = text.split('').filter(char => char.trim().length > 0 && /[\u4e00-\u9fff]/.test(char)).map(char => {
    const wordScore = 60 + Math.random() * 35; // 60-95
    const errorTypes = ['None', 'Mispronunciation', 'Omission', 'Insertion', 'UnexpectedBreak'];
    const errorType = wordScore > 80 ? 'None' : errorTypes[Math.floor(Math.random() * errorTypes.length)];

    // 음절 생성 (중국어 단어 특성 고려)
    const syllables = [{
      syllable: char,
      accuracyScore: wordScore + (Math.random() - 0.5) * 20
    }];

    // 음소 생성 (실제 음소 기호 사용)
    const pinyinMap: { [key: string]: string[] } = {
      '当': ['d', 'āng'], '前': ['q', 'ián'], '全': ['q', 'uán'], '球': ['q', 'iú'],
      '经': ['j', 'īng'], '济': ['j', 'ì'], '面': ['m', 'iàn'], '临': ['l', 'ín'],
      '诸': ['zh', 'ū'], '多': ['d', 'uō'], '挑': ['t', 'iǎo'], '战': ['zh', 'àn'],
      '新': ['x', 'īn'], '闻': ['w', 'én'], '内': ['n', 'èi'], '容': ['r', 'óng'],
      '广': ['g', 'uǎng'], '泛': ['f', 'àn'], '包': ['b', 'āo'], '括': ['k', 'uò'],
      '社': ['sh', 'è'], '会': ['h', 'uì'], '科': ['k', 'ē'], '技': ['j', 'ì'],
      '等': ['d', 'ěng'], '个': ['g', 'è'], '方': ['f', 'āng']
    };
    
    const phonemeList = pinyinMap[char] || [char];
    const phonemes = phonemeList.map(phoneme => ({
      phoneme,
      accuracyScore: wordScore + (Math.random() - 0.5) * 25
    }));

    // Azure API Prosody 데이터 시뮬레이션
    const prosodyFeedback = (() => {
      const hasBreakError = Math.random() < 0.3; // 30% 확률로 끊어읽기 오류
      const hasIntonationError = Math.random() < 0.4; // 40% 확률로 억양 오류
      
      const breakErrorTypes: string[] = [];
      if (hasBreakError) {
        if (Math.random() < 0.5) {
          breakErrorTypes.push('UnexpectedBreak');
        } else {
          breakErrorTypes.push('MissingBreak');
        }
      }
      
      return {
        prosody: {
          break: breakErrorTypes.length > 0 ? {
            errorTypes: breakErrorTypes,
            confidence: 0.7 + Math.random() * 0.3,
            duration: 0.1 + Math.random() * 0.5
          } : undefined,
          intonation: hasIntonationError ? {
            monotone: {
              confidence: 0.6 + Math.random() * 0.4,
              detected: true
            },
            pitchRange: {
              min: 100 + Math.random() * 50,
              max: 200 + Math.random() * 100,
              average: 150 + Math.random() * 50
            }
          } : undefined
        }
      };
    })();

    return {
      word: char,
      accuracyScore: wordScore,
      errorType: errorType as any,
      syllables,
      phonemes,
      feedback: prosodyFeedback
    };
  });

  // 문제 단어 추출
  const problematicWords = words.filter(w => w.accuracyScore < 70).map(w => w.word);

  return {
    accuracyScore,
    fluencyScore,
    completenessScore,
    prosodyScore,
    overallScore,
    words,
    pauseCount,
    confidenceScore,
    strongPoints,
    improvementAreas,
    problematicWords,
    scoreAdvice
  };
};

// 미리 정의된 샘플 데이터들
export const sampleEvaluations = {
  excellent: {
    accuracyScore: 92,
    fluencyScore: 89,
    completenessScore: 95,
    prosodyScore: 88,
    overallScore: 91,
    pauseCount: 1,
    confidenceScore: 90,
    strongPoints: ['정확한 발음', '좋은 유창성', '완전한 문장 구사', '자연스러운 억양'],
    improvementAreas: [],
    problematicWords: [],
    scoreAdvice: '원어민 수준에 근접했습니다! 다양한 주제로 연습을 확장해보세요.',
    words: [
      {
        word: '你好',
        accuracyScore: 95,
        errorType: 'None' as const,
        syllables: [
          { syllable: '你', accuracyScore: 94 },
          { syllable: '好', accuracyScore: 96 }
        ],
        phonemes: [
          { phoneme: 'n', accuracyScore: 95 },
          { phoneme: 'i', accuracyScore: 93 },
          { phoneme: 'h', accuracyScore: 97 },
          { phoneme: 'ao', accuracyScore: 95 }
        ]
      }
    ]
  },
  
  good: {
    accuracyScore: 78,
    fluencyScore: 82,
    completenessScore: 85,
    prosodyScore: 75,
    overallScore: 80,
    pauseCount: 3,
    confidenceScore: 70,
    strongPoints: ['좋은 유창성', '완전한 문장 구사'],
    improvementAreas: ['성조와 억양'],
    problematicWords: ['中文', '比较'],
    scoreAdvice: '매우 좋은 발음이에요. 성조와 억양을 조금 더 다듬으면 완벽해질 것 같아요.',
    words: [
      {
        word: '中文',
        accuracyScore: 68,
        errorType: 'Mispronunciation' as const,
        syllables: [
          { syllable: '中', accuracyScore: 72 },
          { syllable: '文', accuracyScore: 64 }
        ],
        phonemes: [
          { phoneme: 'zh', accuracyScore: 70 },
          { phoneme: 'ong', accuracyScore: 74 },
          { phoneme: 'w', accuracyScore: 60 },
          { phoneme: 'en', accuracyScore: 68 }
        ]
      }
    ]
  },

  needsImprovement: {
    accuracyScore: 55,
    fluencyScore: 62,
    completenessScore: 70,
    prosodyScore: 48,
    overallScore: 59,
    pauseCount: 7,
    confidenceScore: 30,
    strongPoints: [],
    improvementAreas: ['기본 발음 정확성', '말하기 속도와 리듬', '성조와 억양'],
    problematicWords: ['学习', '中文', '发音', '比较'],
    scoreAdvice: '기본기는 갖추었지만 더 많은 연습이 필요해요. 성조와 기본 음소를 반복 연습하세요.',
    words: [
      {
        word: '学习',
        accuracyScore: 45,
        errorType: 'Mispronunciation' as const,
        syllables: [
          { syllable: '学', accuracyScore: 48 },
          { syllable: '习', accuracyScore: 42 }
        ],
        phonemes: [
          { phoneme: 'x', accuracyScore: 40 },
          { phoneme: 'ue', accuracyScore: 50 },
          { phoneme: 'x', accuracyScore: 38 },
          { phoneme: 'i', accuracyScore: 46 }
        ]
      }
    ]
  }
}; 