import React from 'react';
import { WordAnalysis } from '../types';
import { getScoreColor, analyzePhonemeErrors, getErrorTypeInKorean } from '../utils/evaluationUtils';

interface DetailedAnalysisProps {
  words: WordAnalysis[];
}

const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ 
  words
}) => {

  // 🔍 임시 디버깅 로그 - 나중에 삭제할 것
  console.log("=== DetailedAnalysis 받은 words 데이터 ===");
  console.log("words 배열 길이:", words.length);
  console.log("첫 번째 단어 전체 구조:", JSON.stringify(words[0], null, 2));
  
  if (words[0]?.Syllables) {
    console.log("Syllables 구조:", JSON.stringify(words[0].Syllables, null, 2));
  }
  
  if (words[0]?.PronunciationAssessment) {
    console.log("PronunciationAssessment 구조:", JSON.stringify(words[0].PronunciationAssessment, null, 2));
  }
  // 🔍 디버깅 로그 끝

  // 음소를 실제 발음 기호로 변환하는 함수
  const getPhonemeDisplay = (phoneme: string): string => {
    const pinyinMap: { [key: string]: string } = {
      '当': 'dāng', '前': 'qián', '全': 'quán', '球': 'qiú', '经': 'jīng', '济': 'jì',
      '面': 'miàn', '临': 'lín', '诸': 'zhū', '多': 'duō', '挑': 'tiǎo', '战': 'zhàn',
      '新': 'xīn', '闻': 'wén', '内': 'nèi', '容': 'róng', '广': 'guǎng', '泛': 'fàn',
      '包': 'bāo', '括': 'kuò', '社': 'shè', '会': 'huì', '科': 'kē', '技': 'jì', 
      '等': 'děng', '个': 'gè', '方': 'fāng'
    };
    
    return pinyinMap[phoneme] || phoneme;
  };



  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-3xl mr-3">🔍</span>
        상세 분석
      </h3>
      

      
      {/* 문장 피드백 섹션 */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="text-xl mr-2">📝</span>
          문장 피드백
        </h4>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {words.map((word, index) => {
          const errorAnalysis = analyzePhonemeErrors(word);
          return (
            <div
              key={index}
              className={`rounded-xl p-4 border-2 transition-all duration-300 ${
                errorAnalysis.severity === 'high' ? 'bg-red-50 border-red-300' :
                errorAnalysis.severity === 'medium' ? 'bg-orange-50 border-orange-300' :
                'bg-green-50 border-green-200'
              }`}
            >
                <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span 
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Noto Sans CJK SC, Noto Sans CJK TC, Noto Sans CJK JP, SimSun, Microsoft YaHei, sans-serif' }}
                    >
                      {word.word}
                    </span>
                  {word.errorType !== 'None' && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      errorAnalysis.severity === 'high' ? 'bg-red-200 text-red-800' :
                      errorAnalysis.severity === 'medium' ? 'bg-orange-200 text-orange-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {getErrorTypeInKorean(word.errorType)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getScoreColor(word.accuracyScore || 0)}`}>
                    {(word.accuracyScore || 0).toFixed(1)}점
                  </span>
                  </div>
                </div>
              </div>
            );
          })}
                              </div>
                            </div>

      {/* 음절/음소 분석 섹션 */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="text-xl mr-2">🔤</span>
          음절/음소 분석
        </h4>

                  {/* 음절 분석 */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                        <span className="text-base mr-2">📝</span>
            음절 분석
                      </h5>
                      <div className="text-xs text-gray-500 mb-3 text-center">
                        🟢 좋음 (80점 이상) | 🟡 보통 (60-79점) | 🔴 개선 필요 (60점 미만)
                      </div>
                      <div className="flex flex-wrap gap-2">
            {words.flatMap((word, wordIndex) => 
              word.syllables?.map((syllable, sIndex) => (
                          <div
                  key={`word-${wordIndex}-syllable-${sIndex}`}
                            className={`px-3 py-2 rounded-lg text-sm border-2 transition-all duration-200 hover:scale-105 ${getScoreColor(syllable.PronunciationAssessment?.AccuracyScore || 0)}`}
                  title={`${syllable.Syllable || word.word} (${getPhonemeDisplay(syllable.Syllable || word.word)}): ${(syllable.PronunciationAssessment?.AccuracyScore || 0).toFixed(1)}점`}
                >
                  <div 
                    className="font-bold"
                    style={{ fontFamily: 'Noto Sans CJK SC, Noto Sans CJK TC, Noto Sans CJK JP, SimSun, Microsoft YaHei, sans-serif' }}
                          >
                    {syllable.Syllable || word.word}
                      </div>
                  <div className="text-xs">{(syllable.PronunciationAssessment?.AccuracyScore || 0).toFixed(1)}</div>
                </div>
              )) || []
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalysis; 