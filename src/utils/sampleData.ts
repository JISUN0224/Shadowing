import { EvaluationResult } from '../types';
import { 
  calculateOverallScore, 
  generateScoreAdvice, 
  analyzeStrengthsAndWeaknesses 
} from './evaluationUtils';

// 샘플 평가 데이터 생성 함수
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