import React, { useState } from 'react';

type InputMode = 'manual' | 'ai';

interface TextInputStepProps {
  onTextConfirm: (text: string) => void;
}

const TextInputStep: React.FC<TextInputStepProps> = ({ onTextConfirm }) => {
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [manualText, setManualText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleModeSelect = (mode: InputMode) => {
    setInputMode(mode);
    // 모드 변경 시 상태 초기화
    setManualText('');
    setAiPrompt('');
    setGeneratedText('');
  };

  const generateAIText = async () => {
    if (!aiPrompt.trim()) {
      alert('주제를 입력해주세요!');
      return;
    }

    setIsGenerating(true);
    
    try {
      // API 키 설정
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `중국어 학습용 텍스트를 생성해주세요. 주제: ${aiPrompt}. 
                     요구사항: 
                     - 중국어로만 작성
                     - 학습용으로 적합한 난이도
                     - 3-5문장 정도
                     - 병음이나 번역 없이 순수 중국어만`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedText = data.candidates[0].content.parts[0].text;
        setGeneratedText(generatedText);
      } else {
        throw new Error('AI 응답 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('AI 생성 오류:', error);
      
      // API 오류 시 대체 텍스트 제공
      const fallbackTexts = [
        `当前，全球经济面临诸多挑战。各国政府正积极采取措施，以稳定市场信心。预计未来一段时间内，经济走势仍将复杂多变。`
      ];
      
      const randomText = fallbackTexts[Math.floor(Math.random() * fallbackTexts.length)];
      setGeneratedText(randomText);
      alert('AI API 연결에 실패했습니다. 대체 텍스트를 제공합니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getCurrentText = () => {
    return inputMode === 'manual' ? manualText : generatedText;
  };

  const handleStartShadowing = () => {
    const currentText = getCurrentText();
    if (!currentText.trim()) {
      alert('텍스트를 입력하거나 생성해주세요!');
      return;
    }
    onTextConfirm(currentText);
  };

  const isTextAvailable = getCurrentText().trim().length > 0;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        연습할 텍스트 선택
      </h2>
      
      {/* 입력 옵션 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => handleModeSelect('manual')}
          className={`p-6 border-2 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
            inputMode === 'manual' 
              ? 'border-cyan-400 bg-gradient-to-br from-cyan-50 to-cyan-100 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-cyan-300'
          }`}
        >
          <div className="text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">직접 입력</h3>
            <p className="text-gray-600">원하는 중국어 텍스트를 직접 입력하세요</p>
          </div>
        </button>

        <button
          onClick={() => handleModeSelect('ai')}
          className={`p-6 border-2 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
            inputMode === 'ai' 
              ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-pink-100 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-pink-300'
          }`}
        >
          <div className="text-center">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">AI 생성</h3>
            <p className="text-gray-600">AI가 학습용 텍스트를 생성해드립니다</p>
          </div>
        </button>
      </div>

      {/* 텍스트 입력 영역 */}
      <div className="bg-gray-50 rounded-2xl p-6">
        {inputMode === 'manual' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              중국어 텍스트 입력
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="연습하고 싶은 중국어 텍스트를 입력하세요...&#10;예: 你好，我是来自韩国的学生。我正在学习中文。"
              className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-cyan-400 focus:outline-none transition-colors text-base"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              AI 텍스트 생성
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="어떤 주제의 중국어 텍스트를 원하시나요? (예: 자기소개, 음식 주문, 여행 대화)"
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none transition-colors"
                disabled={isGenerating}
              />
              <button
                onClick={generateAIText}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-6 py-3 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-xl hover:from-pink-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>생성중...</span>
                  </div>
                ) : (
                  '✨ 생성하기'
                )}
              </button>
            </div>

            {generatedText && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  생성된 텍스트
                </label>
                <div className="p-4 bg-white border-2 border-pink-200 rounded-xl">
                  <textarea
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                    className="w-full h-32 resize-none focus:outline-none text-base"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  💡 생성된 텍스트를 수정할 수 있습니다
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 진행 버튼 */}
      <div className="text-center pt-4">
        <button
          onClick={handleStartShadowing}
          disabled={!isTextAvailable}
          className={`px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform ${
            isTextAvailable
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600 hover:scale-105 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isTextAvailable ? '🎯 쉐도잉 연습하기' : '텍스트를 입력해주세요'}
        </button>
      </div>

      {/* 입력 가이드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <span className="text-lg mr-2">💡</span>
          연습 팁
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 처음에는 짧고 간단한 문장으로 시작하세요</li>
          <li>• 발음이 어려운 단어가 포함된 텍스트를 선택하면 더 효과적입니다</li>
          <li>• AI 생성 시에는 구체적인 주제를 입력하면 더 좋은 결과를 얻을 수 있어요</li>
        </ul>
      </div>
    </div>
  );
};

export default TextInputStep;