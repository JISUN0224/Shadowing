import React, { useEffect, useRef, useState } from 'react';
import { pinyin } from 'pinyin-pro';

interface CharacterWithPinyin {
  character: string;
  pinyin: string;
  tone: number;
  isPunctuation: boolean;
  wordIndex: number;
  startTime?: number; // 음성 시작 시간
  endTime?: number;   // 음성 종료 시간
}

interface ScriptDisplayProps {
  text: string;
  currentWordIndex: number;
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null; // 오디오 요소 추가
  onWordHighlight?: (wordIndex: number) => void; // 하이라이트 콜백
}

const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ 
  text, 
  currentWordIndex, 
  isPlaying,
  audioElement,
  onWordHighlight
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [audioProgress, setAudioProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 병음 색상 통일 (진한 파란색)
  const getPinyinColor = (): string => {
    return 'text-blue-700';
  };

  // 실제 pinyin-pro 라이브러리를 사용한 병음 변환
  const getCharacterPinyin = (char: string): { pinyin: string; tone: number } => {
    const punctuation = /[，。！？；：、\s]/;
    
    if (punctuation.test(char)) {
      return { pinyin: '', tone: -1 };
    }

    try {
      // pinyin-pro를 사용하여 병음과 성조 추출
      const pinyinResult = pinyin(char, {
        toneType: 'symbol', // 성조 기호 포함 (nǐ, hǎo 등)
        type: 'array'
      })[0];

      const toneNumber = pinyin(char, {
        toneType: 'num', // 성조 숫자 (ni3, hao3 등)
        type: 'array'
      })[0];

      // 성조 숫자 추출
      const toneMatch = toneNumber?.match(/(\d)$/);
      const tone = toneMatch ? parseInt(toneMatch[1]) : 0;

      return {
        pinyin: pinyinResult || char,
        tone: tone
      };
    } catch (error) {
      console.error('병음 변환 오류:', error);
      return { pinyin: char, tone: 0 };
    }
  };

  // 텍스트를 글자별로 분석하고 병음 매칭
  const analyzeTextWithPinyin = (text: string): CharacterWithPinyin[] => {
    const result: CharacterWithPinyin[] = [];
    const punctuation = /[，。！？；：、\s]/;
    const chineseChar = /[\u4e00-\u9fff]/;
    const englishChar = /[a-zA-Z]/;
    let wordIndex = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (punctuation.test(char)) {
        // 구두점 처리
        result.push({
          character: char,
          pinyin: '',
          tone: -1,
          isPunctuation: true,
          wordIndex: -1
        });
      } else if (chineseChar.test(char)) {
        // 중국어 글자 처리
        const pinyinInfo = getCharacterPinyin(char);
        result.push({
          character: char,
          pinyin: pinyinInfo.pinyin,
          tone: pinyinInfo.tone,
          isPunctuation: false,
          wordIndex: wordIndex
        });
        wordIndex++;
      } else if (englishChar.test(char)) {
        // 영어 글자 처리
        result.push({
          character: char,
          pinyin: char, // 영어는 그대로 표시
          tone: 0,
          isPunctuation: false,
          wordIndex: wordIndex
        });
        wordIndex++;
      } else {
        // 기타 문자 처리 (숫자, 특수문자 등)
        result.push({
          character: char,
          pinyin: char,
          tone: 0,
          isPunctuation: false,
          wordIndex: wordIndex
        });
        wordIndex++;
      }
    }

    return result;
  };

  // 오디오 진행률 추적
  useEffect(() => {
    if (isPlaying && audioElement) {
      const updateProgress = () => {
        if (audioElement && !audioElement.paused) {
          const progress = (audioElement.currentTime / audioElement.duration) * 100;
          setAudioProgress(progress);
          
          // 진행률에 따라 하이라이트 인덱스 계산
          const charactersWithPinyin = analyzeTextWithPinyin(text);
          const totalChineseChars = charactersWithPinyin.filter(item => !item.isPunctuation).length;
          const currentIndex = Math.floor((progress / 100) * totalChineseChars);
          
          setHighlightedIndex(Math.min(currentIndex, totalChineseChars - 1));
          
          // 콜백 호출
          if (onWordHighlight) {
            onWordHighlight(currentIndex);
          }
        }
      };

      progressIntervalRef.current = setInterval(updateProgress, 100);
      
      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    } else {
      setHighlightedIndex(-1);
      setAudioProgress(0);
    }
  }, [isPlaying, audioElement, text, onWordHighlight]);

  // 재생 상태 변경 시 하이라이트 업데이트
  useEffect(() => {
    if (!isPlaying) {
      setHighlightedIndex(-1);
      setAudioProgress(0);
    }
  }, [isPlaying]);

  const charactersWithPinyin = analyzeTextWithPinyin(text);
  const totalChineseChars = charactersWithPinyin.filter(item => !item.isPunctuation).length;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-inner border-2 border-blue-100">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center justify-center">
          <span className="text-2xl mr-2">📖</span>
          연습 스크립트
        </h3>
      </div>
      
      <div className="relative">
        {/* 배경 그라데이션 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent opacity-50 rounded-xl"></div>
        
        {/* 텍스트 내용 */}
        <div className="relative bg-white rounded-xl p-8 shadow-lg border border-gray-100">
          <div className="text-center leading-loose">
            {charactersWithPinyin.map((item, index) => {
              if (item.isPunctuation) {
                return (
                  <span 
                    key={index} 
                    className="text-gray-600 mx-1 text-2xl"
                  >
                    {item.character}
                  </span>
                );
              }

              // 음성 동기화된 하이라이트
              const isHighlighted = isPlaying && item.wordIndex === highlightedIndex;
              const isUpcoming = isPlaying && item.wordIndex === highlightedIndex + 1;
              const isCompleted = isPlaying && item.wordIndex < highlightedIndex;

              return (
                <span
                  key={index}
                  className={`inline-flex flex-col items-center mx-2 my-2 p-2 rounded-lg transition-all duration-300 ${
                    isHighlighted
                      ? 'bg-gradient-to-b from-yellow-200 to-orange-200 shadow-lg scale-110 transform animate-pulse'
                      : isUpcoming
                      ? 'bg-blue-100'
                      : isCompleted
                      ? 'bg-green-50 opacity-75'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* 중국어 글자 */}
                  <span 
                    className={`text-3xl font-medium mb-1 font-sans ${
                      isHighlighted ? 'text-gray-800' : 'text-gray-700'
                    }`}
                    style={{ fontFamily: 'Noto Sans CJK SC, Noto Sans CJK TC, Noto Sans CJK JP, SimSun, Microsoft YaHei, sans-serif' }}
                  >
                    {item.character}
                  </span>
                  
                  {/* 병음 */}
                  <span 
                    className={`text-sm font-medium ${getPinyinColor()} ${
                      isHighlighted ? 'font-bold' : ''
                    }`}
                    style={{ fontFamily: 'Noto Sans CJK SC, Noto Sans CJK TC, Noto Sans CJK JP, SimSun, Microsoft YaHei, sans-serif' }}
                  >
                    {item.pinyin}
                  </span>
                </span>
              );
            })}
          </div>

          {/* 재생 상태 표시 */}
          {isPlaying && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>재생 중</span>
              </div>
            </div>
          )}
        </div>

        {/* 진행 표시바 */}
        {isPlaying && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${audioProgress}%` 
                }}
              ></div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-500">
              {highlightedIndex + 1} / {totalChineseChars} 글자 ({audioProgress.toFixed(1)}%)
            </div>
          </div>
        )}
      </div>

      {/* 읽기 가이드 */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-b from-yellow-200 to-orange-200 rounded animate-pulse"></div>
            <span className="text-sm text-gray-600">현재 글자</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span className="text-sm text-gray-600">다음 글자</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span className="text-sm text-gray-600">완료된 글자</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptDisplay; 