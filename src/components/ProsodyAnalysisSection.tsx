import React from 'react';
import { WordAnalysis } from '../types';

interface ProsodyAnalysisSectionProps {
  words: WordAnalysis[];
}

const ProsodyAnalysisSection: React.FC<ProsodyAnalysisSectionProps> = ({ words }) => {
  // Azure API의 실제 Prosody.Break 데이터 활용
  const unexpectedBreaks = words.filter(word => 
    word.feedback?.prosody?.break?.errorTypes?.includes('UnexpectedBreak')
  );
  
  const missingBreaks = words.filter(word =>
    word.feedback?.prosody?.break?.errorTypes?.includes('MissingBreak')
  );
  
  const monotoneIssues = words.filter(word =>
    (word.feedback?.prosody?.intonation?.monotone?.confidence ?? 0) > 0.7
  );

  // 분석 결과가 없으면 표시하지 않음
  if (unexpectedBreaks.length === 0 && missingBreaks.length === 0 && monotoneIssues.length === 0) {
    return (
      <div className="bg-purple-50 p-6 rounded-xl">
        <h4 className="text-lg font-semibold mb-4 flex items-center">
          <span className="text-xl mr-2">🎵</span>
          운율 분석 (실제 Azure 데이터)
        </h4>
        <div className="text-center text-gray-600 py-8">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-lg font-medium">훌륭한 운율입니다!</p>
          <p className="text-sm mt-2">자연스러운 억양과 적절한 끊어읽기를 보여주셨네요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 p-6 rounded-xl">
      <h4 className="text-lg font-semibold mb-4 flex items-center">
        <span className="text-xl mr-2">🎵</span>
        운율 분석 (실제 Azure 데이터)
      </h4>
      
      {unexpectedBreaks.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 rounded-lg border border-red-200">
          <h5 className="font-medium text-red-800 flex items-center mb-2">
            <span className="text-lg mr-2">⚠️</span>
            불필요한 끊어읽기가 감지된 단어들
          </h5>
          <div className="flex flex-wrap gap-2">
            {unexpectedBreaks.map((word, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-red-200 text-red-700 rounded font-medium"
                style={{ fontFamily: 'Noto Sans CJK SC, Noto Sans CJK TC, Noto Sans CJK JP, SimSun, Microsoft YaHei, sans-serif' }}
              >
                {word.word}
              </span>
            ))}
          </div>
          <p className="text-sm text-red-700 mt-2">
            💡 이 단어들에서 불필요하게 멈추셨어요. 더 자연스럽게 연결해서 발음해보세요.
          </p>
        </div>
      )}

      {missingBreaks.length > 0 && (
        <div className="mb-4 p-4 bg-orange-100 rounded-lg border border-orange-200">
          <h5 className="font-medium text-orange-800 flex items-center mb-2">
            <span className="text-lg mr-2">📍</span>
            끊어읽기가 필요한 단어들
          </h5>
          <div className="flex flex-wrap gap-2">
            {missingBreaks.map((word, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-orange-200 text-orange-700 rounded font-medium"
                style={{ fontFamily: 'Noto Sans CJK SC, Noto Sans CJK TC, Noto Sans CJK JP, SimSun, Microsoft YaHei, sans-serif' }}
              >
                {word.word}
              </span>
            ))}
          </div>
          <p className="text-sm text-orange-700 mt-2">
            💡 이 단어들 앞뒤로 적절한 쉼을 넣어주시면 더 자연스러워집니다.
          </p>
        </div>
      )}

      {monotoneIssues.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-100 rounded-lg border border-yellow-200">
          <h5 className="font-medium text-yellow-800 flex items-center mb-2">
            <span className="text-lg mr-2">📊</span>
            억양 변화가 필요한 단어들
          </h5>
          <div className="flex flex-wrap gap-2">
            {monotoneIssues.map((word, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-yellow-200 text-yellow-700 rounded font-medium"
                style={{ fontFamily: 'Noto Sans CJK SC, Noto Sans CJK TC, Noto Sans CJK JP, SimSun, Microsoft YaHei, sans-serif' }}
              >
                {word.word}
              </span>
            ))}
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            💡 이 단어들에서 억양이 단조롭게 들렸어요. 성조 변화를 더 크게 해보세요.
          </p>
        </div>
      )}

      {/* 개선 팁 */}
      <div className="mt-6 p-4 bg-purple-100 rounded-lg border border-purple-200">
        <h5 className="font-medium text-purple-800 flex items-center mb-2">
          <span className="text-lg mr-2">💡</span>
          운율 개선 팁
        </h5>
        <div className="space-y-2 text-sm text-purple-700">
          <div className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>문장 끝에서는 억양을 낮춰주세요</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>중요한 단어는 높은 톤으로 강조하세요</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>자연스러운 속도로 말하기 연습을 해보세요</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProsodyAnalysisSection; 