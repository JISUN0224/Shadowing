import React, { useState } from 'react';

interface FeedbackSectionProps {
  strongPoints: string[];
  improvementAreas: string[];
  problematicWords: string[];
  scoreAdvice: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  strongPoints,
  improvementAreas,
  problematicWords,
  scoreAdvice
}) => {
  const [selectedWordForPractice, setSelectedWordForPractice] = React.useState<string | null>(null);
  // 문장을 단어로 분리하는 함수
  const splitSentencesToWords = (sentences: string[]): string[] => {
    const words: string[] = [];
    sentences.forEach(sentence => {
      // 중국어 문장에서 단어 분리 (공백, 구두점 기준)
      const sentenceWords = sentence
        .replace(/[，。！？；：、]/g, ' ') // 중국어 구두점을 공백으로 변경
        .split(/\s+/) // 공백으로 분리
        .filter(word => word.trim().length > 0); // 빈 문자열 제거
      words.push(...sentenceWords);
    });
    return words;
  };

  // 문제 단어들을 단어 단위로 분리
  const individualProblematicWords = splitSentencesToWords(problematicWords);
  return (
    <div className="space-y-6">
      {/* 맞춤형 학습 조언 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
          <span className="text-2xl mr-3">💡</span>
          맞춤형 학습 조언
        </h3>
        <div className="text-blue-700 font-medium text-lg leading-relaxed">
          {scoreAdvice}
        </div>
      </div>

      {/* 강점과 개선점 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 강점 */}
        {strongPoints.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
            <h4 className="font-bold text-green-800 mb-4 flex items-center text-lg">
              <span className="text-2xl mr-3">✨</span>
              잘하고 있는 부분
            </h4>
            <div className="space-y-3">
              {strongPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-green-700 font-medium">{point}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-green-800 text-sm">
                🎉 이 부분들을 계속 유지하면서 다른 영역도 개선해보세요!
              </p>
            </div>
          </div>
        )}

        {/* 개선점 */}
        {improvementAreas.length > 0 && (
          <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
            <h4 className="font-bold text-orange-800 mb-4 flex items-center text-lg">
              <span className="text-2xl mr-3">📈</span>
              개선이 필요한 부분
            </h4>
            <div className="space-y-3">
              {improvementAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-orange-500 text-xl">▲</span>
                  <span className="text-orange-700 font-medium">{area}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-orange-800 text-sm">
                💪 이 부분들을 집중적으로 연습하면 빠른 향상을 기대할 수 있어요!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 문제 단어 집중 분석 */}
      {problematicWords.length > 0 && (
        <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
          <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">🔍</span>
            집중 연습이 필요한 단어들
          </h3>
          
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {individualProblematicWords.map((word, index) => (
                <span 
                  key={index} 
                  className="px-4 py-2 bg-yellow-200 text-yellow-800 rounded-full font-medium text-lg hover:bg-yellow-300 transition-colors cursor-pointer"
                  title="클릭하여 개별 연습"
                  style={{ fontFamily: 'Noto Sans CJK SC, Noto Sans CJK TC, Noto Sans CJK JP, SimSun, Microsoft YaHei, sans-serif' }}
                  onClick={() => setSelectedWordForPractice(word)}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
              <span className="text-lg mr-2">📚</span>
              연습 방법
            </h4>
            <div className="space-y-2 text-yellow-700">
              <div className="flex items-start gap-3">
                <span className="text-yellow-500 font-bold">1.</span>
                <span>위 단어들을 개별적으로 천천히 반복 연습하세요</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-500 font-bold">2.</span>
                <span>원어민 발음을 들으며 성조와 음소를 정확히 구분하세요</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-500 font-bold">3.</span>
                <span>개별 연습 후 문장 안에서 자연스럽게 발음해보세요</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
            <p className="text-yellow-800 text-sm font-medium">
              💡 <strong>팁:</strong> 이 단어들만 별도로 10-15회 반복 연습한 후 다시 전체 문장을 읽어보세요!
            </p>
          </div>
        </div>
      )}


      {/* 개별 단어 연습 모달 */}
      {selectedWordForPractice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">개별 단어 연습</h3>
              <div 
                className="text-4xl font-bold text-blue-600 mb-4"
                style={{ fontFamily: 'Noto Sans CJK SC, Noto Sans CJK TC, Noto Sans CJK JP, SimSun, Microsoft YaHei, sans-serif' }}
              >
                {selectedWordForPractice}
              </div>
              <p className="text-gray-600">이 단어를 집중적으로 연습해보세요</p>
            </div>

            <div className="space-y-4">
              {/* 연습 방법 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <span className="text-lg mr-2">📝</span>
                  연습 방법
                </h4>
                <div className="space-y-2 text-blue-700 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">1.</span>
                    <span>단어를 천천히 3-5회 반복 발음</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">2.</span>
                    <span>성조와 음소를 정확히 구분하여 발음</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">3.</span>
                    <span>원어민 발음을 듣고 따라하기</span>
                  </div>
                </div>
              </div>

              {/* 발음 듣기 버튼 */}
              <div className="flex justify-center">
                <button 
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  onClick={() => {
                    // TTS 재생 기능 (실제 구현에서는 Azure TTS 호출)
                    const utterance = new SpeechSynthesisUtterance(selectedWordForPractice);
                    utterance.lang = 'zh-CN';
                    speechSynthesis.speak(utterance);
                  }}
                >
                  🔊 발음 듣기
                </button>
              </div>

              {/* 닫기 버튼 */}
              <button 
                className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                onClick={() => setSelectedWordForPractice(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackSection; 