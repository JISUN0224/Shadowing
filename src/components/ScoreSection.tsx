import React from 'react';
import { getScoreColor } from '../utils/evaluationUtils';

interface ScoreSectionProps {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number;
  pauseCount: number;
}

const ScoreSection: React.FC<ScoreSectionProps> = ({
  accuracyScore,
  fluencyScore,
  completenessScore,
  prosodyScore,
  pauseCount
}) => {
  const confidenceScore = Math.max(0, 100 - pauseCount * 10);

  const scoreItems = [
    { label: '정확도', value: accuracyScore, icon: '🎯', description: '발음의 정확성' },
    { label: '유창성', value: fluencyScore, icon: '⚡', description: '말하기 속도와 리듬' },
    { label: '완전성', value: completenessScore, icon: '✅', description: '문장 완성도' },
    { label: '자신감', value: confidenceScore, icon: '💪', description: '망설임 없는 발음', special: true }
  ];

  // 사각형 레이더 차트를 위한 SVG 생성 (4개 축)
  const createRadarChart = () => {
    const centerX = 200;
    const centerY = 150;
    const radius = 120;
    const angles = [0, 90, 180, 270]; // 360도 / 4개 축 = 90도씩
    
    // 점수들을 0-100 범위로 정규화 (NaN 방지)
    const normalizedScores = scoreItems.map(item => {
      const value = isNaN(item.value) ? 0 : Math.min(100, Math.max(0, item.value));
      return value / 100;
    });
    
    // 각 점의 좌표 계산
    const points = angles.map((angle, index) => {
      const radian = (angle - 90) * Math.PI / 180; // -90도 회전하여 정확도가 위쪽에 오도록
      const x = centerX + radius * normalizedScores[index] * Math.cos(radian);
      const y = centerY + radius * normalizedScores[index] * Math.sin(radian);
      return { x: isNaN(x) ? centerX : x, y: isNaN(y) ? centerY : y };
    });

    // 다각형 경로 생성
    const polygonPath = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    // 축 선들 생성
    const axisLines = angles.map((angle, index) => {
      const radian = (angle - 90) * Math.PI / 180;
      const endX = centerX + radius * Math.cos(radian);
      const endY = centerY + radius * Math.sin(radian);
      return { x1: centerX, y1: centerY, x2: endX, y2: endY };
    });

    // 등급선들 생성 (20%, 40%, 60%, 80%, 100%)
    const gradeLines = [0.2, 0.4, 0.6, 0.8, 1.0].map(grade => {
      const points = angles.map(angle => {
        const radian = (angle - 90) * Math.PI / 180;
        const x = centerX + radius * grade * Math.cos(radian);
        const y = centerY + radius * grade * Math.sin(radian);
        return { x, y };
      });
      
      const path = points.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      ).join(' ') + ' Z';
      
      return { path, grade };
    });

    return { polygonPath, axisLines, gradeLines, points };
  };

  const { polygonPath, axisLines, gradeLines, points } = createRadarChart();

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        📊 세부 점수 분석
      </h3>
      
      {/* 점수 카드들 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {scoreItems.map((item, index) => (
          <div
            key={index}
            className={`text-center p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
              item.special 
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : getScoreColor(item.value)
            }`}
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-2xl font-bold mb-1">
              {(isNaN(item.value) ? 0 : item.value).toFixed(1)}
            </div>
            <div className="text-sm font-medium mb-1">{item.label}</div>
            <div className="text-xs opacity-75">{item.description}</div>
          </div>
        ))}
      </div>

             {/* 사각형 레이더 차트 */}
       <div className="bg-white rounded-xl p-6 border border-gray-200">
         <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
           📈 시각적 분석
         </h4>
         
         <div className="flex justify-center">
           <div className="relative">
             <svg width="400" height="300" viewBox="0 0 400 300" className="mx-auto">
              {/* 등급선들 (배경) */}
              {gradeLines.map((line, index) => (
                <path
                  key={index}
                  d={line.path}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ))}
              
              {/* 축 선들 */}
              {axisLines.map((line, index) => (
                <line
                  key={index}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#d1d5db"
                  strokeWidth="1"
                />
              ))}
              
              {/* 점수 다각형 */}
              <path
                d={polygonPath}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              
              {/* 점수 점들 */}
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
              
                             {/* 축 라벨들 */}
               {scoreItems.map((item, index) => {
                 const angle = (index * 90 - 90) * Math.PI / 180;
                 const labelRadius = 140;
                 const x = 200 + labelRadius * Math.cos(angle);
                 const y = 150 + labelRadius * Math.sin(angle);
                
                return (
                  <text
                    key={index}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-gray-600"
                  >
                    {item.label}
                  </text>
                );
              })}
            </svg>
            
                         {/* 중앙 점수 표시 */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: '200px' }}>
              <div className="text-2xl font-bold text-blue-600">
                {((accuracyScore + fluencyScore + completenessScore + confidenceScore) / 4).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">평균</div>
            </div>
          </div>
        </div>

        {/* 망설임 횟수 별도 표시 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏸️</span>
              <span className="font-medium text-blue-800">망설임 횟수</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{pauseCount}회</div>
          </div>
          <p className="text-sm text-blue-600 mt-2 text-center">
            {pauseCount === 0 ? '매우 유창하게 말씀하셨네요!' :
             pauseCount <= 2 ? '자연스러운 수준입니다.' :
             pauseCount <= 5 ? '조금 더 연습하면 더 유창해질 거예요.' :
             '천천히 연습하며 자신감을 기르세요.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScoreSection; 