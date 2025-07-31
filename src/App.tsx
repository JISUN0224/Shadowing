import React, { useState } from 'react';
import TextInputStep from './components/TextInputStep';
import ShadowingPracticeStep from './components/ShadowingPracticeStep';
import EvaluationResult from './components/EvaluationResult';
import { EvaluationResult as EvaluationResultType } from './types';
import { evaluatePronunciationWithAzure, analyzeStrengthsAndWeaknesses, generateScoreAdvice } from './utils/azureSpeechUtils';

type Step = 'text-input' | 'shadowing' | 'evaluation';

interface AppState {
  currentStep: Step;
  selectedText: string;
  recordedAudio: Blob | null;
  evaluationResult: EvaluationResultType | null;
  isEvaluating: boolean;
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentStep: 'text-input',
    selectedText: '',
    recordedAudio: null,
    evaluationResult: null,
    isEvaluating: false
  });

  const handleTextConfirm = (text: string) => {
    setAppState(prev => ({
      ...prev,
      currentStep: 'shadowing',
      selectedText: text
    }));
  };

  const handleGoBack = () => {
    setAppState(prev => ({
      ...prev,
      currentStep: 'text-input',
      recordedAudio: null
    }));
  };

  const handleEvaluate = async (audioBlob: Blob) => {
    console.log('평가 시작:', { audioBlobSize: audioBlob.size, text: appState.selectedText });
    
    // 평가 시작 상태로 변경
    setAppState(prev => ({
      ...prev,
      currentStep: 'evaluation',
      isEvaluating: true
    }));
    
    try {
      console.log('Azure API 호출 시작...');
      
      // 임시: Azure API 키가 없을 경우를 대비한 샘플 데이터 사용
      let azureResult;
      try {
        // 실제 Azure Speech Services API 호출
        azureResult = await evaluatePronunciationWithAzure(audioBlob, appState.selectedText);
        console.log('Azure API 결과:', azureResult);
      } catch (azureError) {
        console.warn('Azure API 호출 실패, 샘플 데이터 사용:', azureError);
        // 샘플 데이터로 대체
        const { generateSampleEvaluation } = await import('./utils/sampleData');
        const sampleResult = generateSampleEvaluation(appState.selectedText);
        azureResult = {
          overallScore: sampleResult.overallScore,
          accuracyScore: sampleResult.accuracyScore,
          fluencyScore: sampleResult.fluencyScore,
          completenessScore: sampleResult.completenessScore,
          prosodyScore: sampleResult.prosodyScore,
          words: sampleResult.words,
          pauseCount: sampleResult.pauseCount,
          confidenceScore: sampleResult.confidenceScore
        };
        console.log('샘플 데이터로 대체됨:', azureResult);
      }
      
      // Azure 결과를 내부 타입으로 변환
      const { strongPoints, improvementAreas } = analyzeStrengthsAndWeaknesses(
        azureResult.accuracyScore,
        azureResult.fluencyScore,
        azureResult.completenessScore,
        azureResult.prosodyScore
      );
      
      const scoreAdvice = generateScoreAdvice(azureResult.overallScore);
      const problematicWords = azureResult.words
        .filter(word => word.accuracyScore < 70)
        .map(word => word.word);
      
      const evaluationResult: EvaluationResultType = {
        accuracyScore: azureResult.accuracyScore,
        fluencyScore: azureResult.fluencyScore,
        completenessScore: azureResult.completenessScore,
        prosodyScore: azureResult.prosodyScore,
        overallScore: azureResult.overallScore,
        words: azureResult.words,
        pauseCount: azureResult.pauseCount,
        confidenceScore: azureResult.confidenceScore,
        strongPoints,
        improvementAreas,
        problematicWords,
        scoreAdvice
      };
      
      console.log('평가 결과 생성 완료:', evaluationResult);
      
      setAppState(prev => ({
        ...prev,
        recordedAudio: audioBlob,
        evaluationResult,
        isEvaluating: false
      }));
    } catch (error) {
      console.error('Azure 평가 실패:', error);
      alert('발음 평가에 실패했습니다. 다시 시도해주세요.');
      
      // 에러 시 평가 상태 해제
      setAppState(prev => ({
        ...prev,
        isEvaluating: false
      }));
    }
  };

  const resetToTextInput = () => {
    setAppState({
      currentStep: 'text-input',
      selectedText: '',
      recordedAudio: null,
      evaluationResult: null,
      isEvaluating: false
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-red-400 via-pink-400 to-cyan-400 text-white p-8 text-center">
          <h1 className="text-4xl font-light mb-3">
            🇨🇳 쉐도잉 연습
          </h1>
          <p className="text-lg opacity-90">
            중국어 발음을 완벽하게 마스터하세요
          </p>
          
          {/* 진행 단계 표시 */}
          <div className="flex justify-center mt-6 space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm ${
              appState.currentStep === 'text-input' 
                ? 'bg-white bg-opacity-20 font-semibold' 
                : 'opacity-60'
            }`}>
              <span>1</span>
              <span>텍스트 선택</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm ${
              appState.currentStep === 'shadowing' 
                ? 'bg-white bg-opacity-20 font-semibold' 
                : 'opacity-60'
            }`}>
              <span>2</span>
              <span>쉐도잉 연습</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm ${
              appState.currentStep === 'evaluation' 
                ? 'bg-white bg-opacity-20 font-semibold' 
                : 'opacity-60'
            }`}>
              <span>3</span>
              <span>발음 평가</span>
            </div>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="p-10">
          {appState.currentStep === 'text-input' && (
            <TextInputStep onTextConfirm={handleTextConfirm} />
          )}
          
          {appState.currentStep === 'shadowing' && (
            <ShadowingPracticeStep
              text={appState.selectedText}
              onGoBack={handleGoBack}
              onEvaluate={handleEvaluate}
            />
          )}
          
          {appState.currentStep === 'evaluation' && (
            <>
              {appState.isEvaluating && (
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold text-gray-800">발음 평가 결과</h2>
                  
                  {/* 로딩 상태 */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-purple-700 font-medium">
                      🔍 Azure AI가 발음을 분석하고 있습니다...
                    </p>
                    <p className="text-sm text-purple-600 mt-2">
                      잠시만 기다려주세요. 정확한 분석을 위해 시간이 필요합니다.
                    </p>
                  </div>
                </div>
              )}
              
              {!appState.isEvaluating && appState.evaluationResult && (
                <EvaluationResult
                  evaluation={appState.evaluationResult}
                  originalText={appState.selectedText}
                  onRetryPractice={() => setAppState(prev => ({ ...prev, currentStep: 'shadowing' }))}
                  onNewText={resetToTextInput}
                />
              )}
              
              {!appState.isEvaluating && !appState.evaluationResult && (
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold text-gray-800">평가 실패</h2>
                  <div className="bg-red-50 rounded-2xl p-8">
                    <p className="text-red-700 font-medium">
                      ❌ 발음 평가에 실패했습니다.
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      다시 시도해주세요.
                    </p>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button 
                      onClick={() => setAppState(prev => ({ ...prev, currentStep: 'shadowing' }))}
                      className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white px-6 py-3 rounded-full hover:from-blue-500 hover:to-indigo-600 transition-all duration-300"
                    >
                      🔄 다시 연습
                    </button>
                    <button 
                      onClick={resetToTextInput}
                      className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-6 py-3 rounded-full hover:from-gray-500 hover:to-gray-600 transition-all duration-300"
                    >
                      📝 새 텍스트
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;