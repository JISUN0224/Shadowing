import { WordAnalysis, ErrorAnalysis } from '../types';

// 점수별 색상 클래스 반환
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-green-50 border-green-200 text-green-700';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  return 'bg-red-50 border-red-200 text-red-700';
};

// 점수별 배경 색상 클래스 반환
export const getScoreBackgroundColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
};

// 에러 타입을 한국어로 변환
export const getErrorTypeInKorean = (errorType: string): string => {
  const errorTypeMap: Record<string, string> = {
    'None': '정확',
    'Mispronunciation': '발음 오류',
    'Omission': '생략',
    'Insertion': '삽입',
    'UnexpectedBreak': '부자연스러운 끊어짐'
  };
  return errorTypeMap[errorType] || errorType;
};

// 음소 에러 분석
export const analyzePhonemeErrors = (word: WordAnalysis): ErrorAnalysis => {
  const { accuracyScore, errorType, phonemes = [] } = word;
  
  let severity: 'low' | 'medium' | 'high' = 'low';
  let koreanPattern = '';
  let problematicPhonemes: string[] = [];
  let improvementMethod = '';
  let practiceExample = '';

  // 심각도 결정
  if (accuracyScore < 50) severity = 'high';
  else if (accuracyScore < 70) severity = 'medium';

  // 문제 음소 찾기
  problematicPhonemes = phonemes
    .filter(p => p.accuracyScore < 70)
    .map(p => p.phoneme);

  // 에러 타입별 분석
  switch (errorType) {
    case 'Mispronunciation':
      koreanPattern = '발음이 부정확합니다. 성조나 음소가 틀렸을 가능성이 높습니다.';
      improvementMethod = '천천히 발음하며 성조를 정확히 구분해보세요.';
      practiceExample = '음성을 들으며 따라 말하기를 반복하세요.';
      break;
    case 'Omission':
      koreanPattern = '일부 음소나 음절이 생략되었습니다.';
      improvementMethod = '각 음절을 명확히 구분하여 발음하세요.';
      practiceExample = '단어를 음절별로 나누어 연습해보세요.';
      break;
    case 'Insertion':
      koreanPattern = '불필요한 음소가 추가되었습니다.';
      improvementMethod = '간결하고 정확한 발음을 연습하세요.';
      practiceExample = '원어민 발음을 들으며 정확한 길이를 익히세요.';
      break;
    case 'UnexpectedBreak':
      koreanPattern = '단어 중간에 부자연스러운 끊어짐이 있습니다.';
      improvementMethod = '단어를 한 번에 자연스럽게 발음해보세요.';
      practiceExample = '단어 전체를 하나의 단위로 연습하세요.';
      break;
    default:
      koreanPattern = '전반적으로 좋은 발음이지만 미세한 개선이 가능합니다.';
      improvementMethod = '성조와 음소를 더 정확히 구분해보세요.';
      practiceExample = '원어민 발음과 비교하며 연습하세요.';
  }

  return {
    severity,
    koreanPattern,
    problematicPhonemes,
    improvementMethod,
    practiceExample
  };
};

// 종합 점수 계산
export const calculateOverallScore = (
  accuracyScore: number,
  fluencyScore: number,
  completenessScore: number,
  prosodyScore: number
): number => {
  return Math.round((accuracyScore + fluencyScore + completenessScore + prosodyScore) / 4);
};

// 점수별 조언 생성
export const generateScoreAdvice = (overallScore: number): string => {
  if (overallScore >= 90) return '원어민 수준에 근접했습니다! 다양한 주제로 연습을 확장해보세요.';
  if (overallScore >= 80) return '매우 좋은 발음이에요. 성조와 억양을 조금 더 다듬으면 완벽해질 것 같아요.';
  if (overallScore >= 70) return '좋은 발음이지만 몇 가지 개선점이 있어요. 성조와 음소 구분을 연습해보세요.';
  if (overallScore >= 60) return '기본기는 갖추었지만 더 많은 연습이 필요해요. 성조와 기본 음소를 반복 연습하세요.';
  if (overallScore >= 40) return '발음에 상당한 개선이 필요합니다. 성조와 기본 음소부터 차근차근 연습해보세요.';
  return '기초부터 다시 시작하는 것을 권장합니다. 성조와 기본 음소의 개념부터 학습하세요.';
};

// 강점과 개선점 분석
export const analyzeStrengthsAndWeaknesses = (
  accuracyScore: number,
  fluencyScore: number,
  completenessScore: number,
  prosodyScore: number
) => {
  const strongPoints: string[] = [];
  const improvementAreas: string[] = [];

  if (accuracyScore >= 80) strongPoints.push('정확한 발음');
  else if (accuracyScore < 60) improvementAreas.push('기본 발음 정확성');

  if (fluencyScore >= 80) strongPoints.push('좋은 유창성');
  else if (fluencyScore < 60) improvementAreas.push('말하기 속도와 리듬');

  if (completenessScore >= 80) strongPoints.push('완전한 문장 구사');
  else if (completenessScore < 60) improvementAreas.push('문장 완성도');

  if (prosodyScore >= 80) strongPoints.push('자연스러운 억양');
  else if (prosodyScore < 60) improvementAreas.push('성조와 억양');

  return { strongPoints, improvementAreas };
}; 