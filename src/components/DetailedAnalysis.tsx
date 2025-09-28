import React, { useState, useRef, useEffect } from 'react';
import { WordAnalysis } from '../types';
import { getScoreColor, analyzePhonemeErrors, getErrorTypeInKorean } from '../utils/evaluationUtils';

// 유창성 분석을 위한 컴포넌트
const FluencySpeedGraph: React.FC<{ words: WordAnalysis[] }> = ({ words }) => {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState(600);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setGraphWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const dataPoints = generateSpeedGraphData(words);
  const height = 200;
  const padding = 40;
  
  const maxSpeed = Math.max(...dataPoints.map(d => d.speed));
  const minTime = Math.min(...dataPoints.map(d => d.time));
  const maxTime = Math.max(...dataPoints.map(d => d.time));
  
  const xScale = (time: number) => 
    padding + (time - minTime) / (maxTime - minTime) * (graphWidth - 2 * padding);
  
  const yScale = (speed: number) => 
    height - padding - (speed / maxSpeed) * (height - 2 * padding);
  
  const getSpeedLevel = (speed: number) => {
    if (speed > 3.0) return 'fast';
    if (speed < 1.5) return 'slow';
    return 'normal';
  };
  
  const getSpeedColor = (level: string) => {
    switch (level) {
      case 'fast': return '#ef4444'; // red
      case 'slow': return '#f59e0b'; // yellow
      default: return '#10b981'; // green
    }
  };
  
  const pathData = dataPoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${xScale(point.time)} ${yScale(point.speed)}`
  ).join(' ');
  
  return (
    <div ref={containerRef} className="relative w-full">
      <svg width={graphWidth} height={height} className="border border-gray-300 rounded-lg bg-white">
        {/* 배경 그리드 */}
        {[0, 1, 2, 3, 4].map(y => (
          <line
            key={y}
            x1={padding}
            y1={height - padding - (y / 4) * (height - 2 * padding)}
            x2={graphWidth - padding}
            y2={height - padding - (y / 4) * (height - 2 * padding)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {/* 속도 범위 구분선 */}
        <line
          x1={padding}
          y1={yScale(3.0)}
          x2={graphWidth - padding}
          y2={yScale(3.0)}
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        <line
          x1={padding}
          y1={yScale(1.5)}
          x2={graphWidth - padding}
          y2={yScale(1.5)}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        
        {/* 속도 변화 라인 */}
        <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />
        
        {/* 데이터 포인트들 */}
        {dataPoints.map((point, index) => {
          const speedLevel = getSpeedLevel(point.speed);
          const color = getSpeedColor(speedLevel);
          return (
            <circle
              key={index}
              cx={xScale(point.time)}
              cy={yScale(point.speed)}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="2"
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
        
        {/* 축 라벨 */}
        <text x={graphWidth / 2} y={height - 10} textAnchor="middle" className="text-xs fill-gray-600">
          시간 (초)
        </text>
        <text x={10} y={height / 2} textAnchor="middle" className="text-xs fill-gray-600" transform={`rotate(-90, 10, ${height / 2})`}>
          속도 (음절/초)
        </text>
      </svg>
      
      {/* 호버 툴팁 */}
      {hoveredPoint && (
        <div 
          className="absolute bg-gray-800 text-white p-2 rounded text-xs pointer-events-none z-10"
          style={{
            left: xScale(hoveredPoint.time) + 10,
            top: yScale(hoveredPoint.speed) - 30
          }}
        >
          <div>단어: {hoveredPoint.word}</div>
          <div>음절: {hoveredPoint.syllable}</div>
          <div>속도: {hoveredPoint.speed.toFixed(2)} 음절/초</div>
          <div>시간: {hoveredPoint.time.toFixed(2)}초</div>
        </div>
      )}
      
      {/* 범례 */}
      <div className="flex justify-center mt-2 space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
          <span>빠름 (&gt;3.0)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span>정상 (1.5-3.0)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
          <span>느림 (&lt;1.5)</span>
        </div>
      </div>
    </div>
  );
};

// 속도 그래프 데이터 생성 함수
const generateSpeedGraphData = (words: WordAnalysis[]) => {
  const dataPoints: any[] = [];
  
  words.forEach((word, wordIndex) => {
    if (word.syllables && word.syllables.length > 0) {
      word.syllables.forEach((syllable: any, syllableIndex: number) => {
        const startTime = syllable.Offset / 1000000000; // 나노초 → 초
        const duration = syllable.Duration / 1000000000;
        
        // 음절당 속도 계산 (1음절 / 시간)
        const speed = 1 / duration;
        
        dataPoints.push({
          time: startTime,
          speed: speed,
          word: word.word,
          syllable: syllable.Grapheme || syllable.Syllable || word.word,
          duration: duration
        });
      });
    }
  });
  
  return dataPoints.sort((a, b) => a.time - b.time);
};

// 휴지 계산 함수들
const calculatePauseCount = (words: WordAnalysis[]) => {
  let pauseCount = 0;
  
  for (let i = 0; i < words.length - 1; i++) {
    const currentWord = words[i];
    const nextWord = words[i + 1];
    
    if (currentWord.syllables && currentWord.syllables.length > 0 && 
        nextWord.syllables && nextWord.syllables.length > 0) {
      
      // 현재 단어의 끝 시간
      const currentEndTime = currentWord.syllables[currentWord.syllables.length - 1].Offset + 
                            currentWord.syllables[currentWord.syllables.length - 1].Duration;
      
      // 다음 단어의 시작 시간
      const nextStartTime = nextWord.syllables[0].Offset;
      
      // 휴지 시간 계산 (밀리초 단위)
      const pauseDuration = (nextStartTime - currentEndTime) / 1000000;
      
      // 300ms 이상의 휴지를 카운트
      if (pauseDuration > 300) {
        pauseCount++;
      }
    }
  }
  
  return pauseCount;
};

const calculateAveragePauseDuration = (words: WordAnalysis[]) => {
  const pauses: number[] = [];
  
  for (let i = 0; i < words.length - 1; i++) {
    const currentWord = words[i];
    const nextWord = words[i + 1];
    
    if (currentWord.syllables && currentWord.syllables.length > 0 && 
        nextWord.syllables && nextWord.syllables.length > 0) {
      
      const currentEndTime = currentWord.syllables[currentWord.syllables.length - 1].Offset + 
                            currentWord.syllables[currentWord.syllables.length - 1].Duration;
      const nextStartTime = nextWord.syllables[0].Offset;
      const pauseDuration = (nextStartTime - currentEndTime) / 1000000;
      
      if (pauseDuration > 300) {
        pauses.push(pauseDuration);
      }
    }
  }
  
  return pauses.length > 0 ? pauses.reduce((sum, pause) => sum + pause, 0) / pauses.length : 0;
};

const calculateLongestPause = (words: WordAnalysis[]) => {
  let longestPause = 0;
  
  for (let i = 0; i < words.length - 1; i++) {
    const currentWord = words[i];
    const nextWord = words[i + 1];
    
    if (currentWord.syllables && currentWord.syllables.length > 0 && 
        nextWord.syllables && nextWord.syllables.length > 0) {
      
      const currentEndTime = currentWord.syllables[currentWord.syllables.length - 1].Offset + 
                            currentWord.syllables[currentWord.syllables.length - 1].Duration;
      const nextStartTime = nextWord.syllables[0].Offset;
      const pauseDuration = (nextStartTime - currentEndTime) / 1000000;
      
      if (pauseDuration > longestPause) {
        longestPause = pauseDuration;
      }
    }
  }
  
  return longestPause;
};

interface DetailedAnalysisProps {
  words: WordAnalysis[];
}

const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ 
  words
}) => {

  // 🔍 임시 디버깅 로그 - 나중에 삭제할 것
  // DetailedAnalysis words 데이터 처리
  
    if (words[0]?.syllables) {
    // Syllables 구조
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
      

      
            {/* 정확도 분석 섹션 */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="text-xl mr-2">🎯</span>
          정확도 분석
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

      {/* 유창성 분석 섹션 */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="text-xl mr-2">⚡</span>
          유창성 분석
        </h4>
        
        {/* 속도 변화 그래프 */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
            <span className="text-base mr-2">📈</span>
            속도 변화 그래프
          </h5>
          <FluencySpeedGraph words={words} />
        </div>
        
        {/* 휴지 분석 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
            <span className="text-lg mr-2">⏸️</span>
            휴지 분석
          </h5>
          <div className="text-sm text-blue-700 space-y-1">
            <div>총 휴지: {calculatePauseCount(words)}회</div>
            <div>평균 휴지 시간: {calculateAveragePauseDuration(words).toFixed(1)}ms</div>
            <div>가장 긴 휴지: {calculateLongestPause(words).toFixed(1)}ms</div>
          </div>
        </div>
      </div>

 
    </div>
  );
};

export default DetailedAnalysis; 