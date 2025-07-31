import React from 'react';
import { EvaluationResultProps } from '../types';
import { getScoreColor, getScoreBackgroundColor } from '../utils/evaluationUtils';
import ScoreSection from './ScoreSection';
import DetailedAnalysis from './DetailedAnalysis';
import FeedbackSection from './FeedbackSection';
import ProsodyAnalysisSection from './ProsodyAnalysisSection';

const EvaluationResult: React.FC<EvaluationResultProps> = ({
  evaluation,
  originalText,
  onRetryPractice,
  onNewText
}) => {
  const {
    overallScore,
    accuracyScore,
    fluencyScore,
    completenessScore,
    prosodyScore,
    pauseCount,
    strongPoints,
    improvementAreas,
    problematicWords,
    scoreAdvice,
    words
  } = evaluation;

  // TTS 하이라이트를 위한 newsData 생성
  const generateNewsData = () => {
    // originalText를 중국어 문장으로 분할
    const sentences = originalText.split(/([。！？])/).filter(part => part.trim());
    const newsData = [];
    
    for (let i = 0; i < sentences.length; i += 2) {
      const text = sentences[i] + (sentences[i + 1] || '');
      if (text.trim()) {
        // 간단한 병음 생성 (실제로는 더 정교한 라이브러리 사용 권장)
        const pinyin = generateSimplePinyin(text);
        newsData.push({ text: text.trim(), pinyin });
      }
    }
    
    return newsData;
  };

  // 간단한 병음 생성 함수 (임시)
  const generateSimplePinyin = (text: string): string => {
    const pinyinMap: { [key: string]: string } = {
      '人': 'rén', '工': 'gōng', '智': 'zhì', '能': 'néng', '技': 'jì', '术': 'shù',
      '正': 'zhèng', '加': 'jiā', '速': 'sù', '融': 'róng', '入': 'rù', '日': 'rì',
      '常': 'cháng', '生': 'shēng', '活': 'huó', '众': 'zhòng', '多': 'duō',
      '创': 'chuàng', '新': 'xīn', '应': 'yìng', '用': 'yòng', '不': 'bù',
      '断': 'duàn', '涌': 'yǒng', '现': 'xiàn', '为': 'wèi', '社': 'shè',
      '会': 'huì', '带': 'dài', '来': 'lái', '便': 'biàn', '利': 'lì',
      '专': 'zhuān', '家': 'jiā', '指': 'zhǐ', '出': 'chū', '伦': 'lún',
      '理': 'lǐ', '与': 'yǔ', '安': 'ān', '全': 'quán', '问': 'wèn',
      '题': 'tí', '需': 'xū', '同': 'tóng', '步': 'bù', '考': 'kǎo',
      '量': 'liáng', '当': 'dāng', '前': 'qián', '球': 'qiú', '经': 'jīng',
      '济': 'jì', '面': 'miàn', '临': 'lín', '诸': 'zhū', '挑': 'tiǎo',
      '战': 'zhàn', '闻': 'wén', '内': 'nèi', '容': 'róng', '广': 'guǎng',
      '泛': 'fàn', '包': 'bāo', '括': 'kuò', '科': 'kē', '等': 'děng',
      '个': 'gè', '方': 'fāng'
    };
    
    return text.split('').map(char => {
      if (/[\u4e00-\u9fff]/.test(char)) {
        return pinyinMap[char] || 'unknown';
      }
      return '';
    }).filter(p => p).join(' ');
  };

  const newsData = generateNewsData();

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          📊 발음 평가 결과
        </h2>
        <p className="text-gray-600">
          연습한 텍스트: "{originalText.length > 50 ? originalText.substring(0, 50) + '...' : originalText}"
        </p>
      </div>

      {/* 종합 점수 표시 */}
      <div className="bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-400 rounded-3xl p-8 text-white text-center">
        <h3 className="text-2xl font-semibold mb-4">🎉 종합 점수</h3>
        <div className="text-6xl font-bold mb-4 animate-pulse">
          {overallScore}
        </div>
        <div className="text-xl opacity-90 mb-6">
          {overallScore >= 90 ? '완벽해요!' : 
           overallScore >= 80 ? '훌륭해요!' :
           overallScore >= 70 ? '좋아요!' :
           overallScore >= 60 ? '괜찮아요!' : '더 연습해요!'}
        </div>
        
        {/* 프로그레스 바 */}
        <div className="w-full bg-white bg-opacity-20 rounded-full h-4 mb-4">
          <div 
            className="bg-white h-4 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${overallScore}%` }}
          ></div>
        </div>
        
        <p className="text-lg opacity-90">
          계속 연습하면 더욱 향상될 거예요!
        </p>
      </div>

      {/* 세부 점수 섹션 */}
      <ScoreSection 
        accuracyScore={accuracyScore}
        fluencyScore={fluencyScore}
        completenessScore={completenessScore}
        prosodyScore={prosodyScore}
        pauseCount={pauseCount}
      />

      {/* 상세 분석 섹션 - TTS 하이라이트 기능 포함 */}
      <DetailedAnalysis 
        words={words} 
        enableTTSHighlight={true}
        newsData={newsData}
      />

      {/* 운율 분석 섹션 */}
      <ProsodyAnalysisSection words={words} />

      {/* 피드백 섹션 */}
      <FeedbackSection 
        strongPoints={strongPoints}
        improvementAreas={improvementAreas}
        problematicWords={problematicWords}
        scoreAdvice={scoreAdvice}
      />

      {/* 액션 버튼들 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
        <button
          onClick={onRetryPractice}
          className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-lg"
        >
          🔄 다시 연습하기
        </button>
        <button
          onClick={onNewText}
          className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-lg"
        >
          📝 새 텍스트로 연습
        </button>
      </div>

      {/* 연습 팁 */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center text-lg">
          <span className="text-2xl mr-3">💡</span>
          다음 연습을 위한 팁
        </h4>
        <div className="text-blue-700 space-y-2">
          <p>• 낮은 점수를 받은 단어들을 개별적으로 반복 연습해보세요</p>
          <p>• 원어민 발음을 들으며 성조와 억양을 정확히 따라해보세요</p>
          <p>• 천천히 말하면서 각 음절을 명확히 구분해보세요</p>
          <p>• 꾸준한 연습이 발음 향상의 핵심입니다</p>
        </div>
      </div>
    </div>
  );
};

export default EvaluationResult;