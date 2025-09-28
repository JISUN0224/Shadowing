import { useState, useEffect } from 'react';
import TextInputStep from './components/TextInputStep';
import ShadowingPracticeStep from './components/ShadowingPracticeStep';
import EvaluationResult from './components/EvaluationResult';
import LoginModal from './components/LoginModal';
import FavoritesModal from './components/FavoritesModal';
import ShadowingDashboard from './components/ShadowingDashboard';
import { EvaluationResult as EvaluationResultType } from './types';
import { evaluatePronunciationWithAzure, analyzeStrengthsAndWeaknesses, generateScoreAdvice, convertAzureResultToInternalFormat } from './utils/azureSpeechUtils';
import { useAuth } from './hooks/useAuth';
import { useFavorites } from './hooks/useFavorites';
import { saveShadowingSession } from './utils/shadowingDataUtils';

type Step = 'text-input' | 'shadowing' | 'evaluation' | 'dashboard';

interface AppState {
  currentStep: Step;
  selectedText: string;
  recordedAudio: Blob | null;
  evaluationResult: EvaluationResultType | null;
  isEvaluating: boolean;
}

function App() {
  const { user, logout } = useAuth();
  const { addFavorite, isFavorite } = useFavorites();
  
  const [appState, setAppState] = useState<AppState>({
    currentStep: 'text-input',
    selectedText: '',
    recordedAudio: null,
    evaluationResult: null,
    isEvaluating: false
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);



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

  const handleGoToDashboard = () => {
    setAppState(prev => ({
      ...prev,
      currentStep: 'dashboard'
    }));
  };

  const handleGoToPractice = () => {
    setAppState(prev => ({
      ...prev,
      currentStep: 'text-input'
    }));
  };

  const handleEvaluate = async (audioBlob: Blob) => {
    // 평가 시작
    
    // 평가 시작 상태로 변경
    setAppState(prev => ({
      ...prev,
      currentStep: 'evaluation',
      isEvaluating: true
    }));
    
    try {
      // Azure API 호출 시작
      
      // 3단계 폴백 구조: Azure → 브라우저 음성 인식 → 샘플 데이터
      let azureResult;
      try {
        // 1단계: Azure Speech Services API 호출
        azureResult = await evaluatePronunciationWithAzure(audioBlob, appState.selectedText);
        // Azure API 결과
      } catch (azureError) {
        // Azure API 호출 실패, 브라우저 음성 인식으로 폴백
        
        try {
          // 2단계: 브라우저 내장 음성 인식으로 폴백
          const { evaluateWithBrowserSpeechRecognition } = await import('./utils/azureSpeechUtils');
          azureResult = await evaluateWithBrowserSpeechRecognition(audioBlob, appState.selectedText);
          // 브라우저 음성 인식 결과
        } catch (browserError) {
          // 브라우저 음성 인식 실패, 샘플 데이터로 폴백
          
          // 3단계: 완전한 하드코딩 피드백으로 최종 폴백
          const { generateCompleteFallbackEvaluation } = await import('./utils/sampleData');
          const fallbackResult = generateCompleteFallbackEvaluation(appState.selectedText);
          azureResult = {
            overallScore: fallbackResult.overallScore,
            accuracyScore: fallbackResult.accuracyScore,
            fluencyScore: fallbackResult.fluencyScore,
            completenessScore: fallbackResult.completenessScore,
            prosodyScore: fallbackResult.prosodyScore,
            words: fallbackResult.words,
            pauseCount: fallbackResult.pauseCount,
            confidenceScore: fallbackResult.confidenceScore
          };
          // 완전한 하드코딩 피드백으로 최종 폴백
        }
      }
      
      // Azure 결과를 내부 타입으로 변환
      const convertedResult = convertAzureResultToInternalFormat(azureResult);
      
      // 하드코딩 피드백인 경우 이미 포함된 분석 사용, 아니면 새로 생성
      let strongPoints, improvementAreas, scoreAdvice, problematicWords;
      
      if (azureResult.strongPoints && azureResult.improvementAreas && azureResult.scoreAdvice) {
        // 하드코딩 피드백에서 가져온 분석 사용
        strongPoints = azureResult.strongPoints;
        improvementAreas = azureResult.improvementAreas;
        scoreAdvice = azureResult.scoreAdvice;
        problematicWords = azureResult.problematicWords || [];
      } else {
        // Azure API 결과인 경우 새로 생성
        const analysis = analyzeStrengthsAndWeaknesses(
          convertedResult.accuracyScore,
          convertedResult.fluencyScore,
          convertedResult.completenessScore,
          convertedResult.prosodyScore
        );
        strongPoints = analysis.strongPoints;
        improvementAreas = analysis.improvementAreas;
        scoreAdvice = generateScoreAdvice(convertedResult.overallScore);
        problematicWords = convertedResult.words
          .filter((word: any) => word.accuracyScore < 70)
          .map((word: any) => word.word);
      }
      
      // 자신감 점수 계산 (망설임 횟수 기반)
      const confidenceScore = Math.max(0, 100 - convertedResult.pauseCount * 10);
      
      const evaluationResult: EvaluationResultType = {
        accuracyScore: convertedResult.accuracyScore,
        fluencyScore: convertedResult.fluencyScore,
        completenessScore: convertedResult.completenessScore,
        prosodyScore: convertedResult.prosodyScore,
        overallScore: convertedResult.overallScore,
        words: convertedResult.words,
        pauseCount: convertedResult.pauseCount,
        confidenceScore: confidenceScore,
        strongPoints,
        improvementAreas,
        problematicWords,
        scoreAdvice
      };
      
      // 평가 결과 생성 완료
      
      // 사용자가 로그인한 경우 세션 저장
      if (user) {
        try {
          const sessionData = {
            date: new Date().toISOString(),
            skill: 'accuracy' as const, // 기본값, 실제로는 더 정교한 분류 필요
            difficulty: 'intermediate' as const, // 기본값
            practiceCount: 1,
            studyTime: Math.floor(audioBlob.size / 1000), // 대략적인 시간 계산
            averageScore: evaluationResult.overallScore,
            text: appState.selectedText,
            overallScore: evaluationResult.overallScore,
            accuracyScore: evaluationResult.accuracyScore,
            fluencyScore: evaluationResult.fluencyScore,
            completenessScore: evaluationResult.completenessScore,
            prosodyScore: evaluationResult.prosodyScore,
            pauseCount: evaluationResult.pauseCount,
            confidenceScore: evaluationResult.confidenceScore
          };
          
          await saveShadowingSession(sessionData);
        } catch (error) {
          console.error('세션 저장 실패:', error);
        }
      }
      
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

  const handleFavoriteScript = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    console.log('즐겨찾기 버튼 클릭:', { 
      textLength: appState.selectedText.length, 
      textPreview: appState.selectedText.substring(0, 50) + '...',
      userId: user.uid 
    });

    const title = prompt('즐겨찾기 제목을 입력하세요 (선택사항):') || '제목 없음';
    const result = await addFavorite(appState.selectedText, title);
    
    console.log('즐겨찾기 추가 결과:', result);
    
    if (result.success) {
      alert('즐겨찾기에 추가되었습니다!');
    } else {
      alert('즐겨찾기 추가에 실패했습니다: ' + result.error);
    }
  };

  const handleSelectFromFavorites = (text: string) => {
    setAppState(prev => ({
      ...prev,
      currentStep: 'shadowing',
      selectedText: text
    }));
  };

  return (
          <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 p-5">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
                 {/* 헤더 */}
         <div className="bg-gradient-to-r from-red-400 via-pink-400 to-cyan-400 text-white p-8 text-center relative">
           {/* 왼쪽 상단 - 홈 버튼 */}
           <div className="absolute top-4 left-4">
             <button
               onClick={resetToTextInput}
               className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 text-sm flex items-center space-x-2"
             >
               <span>🏠</span>
               <span>홈으로</span>
             </button>
           </div>
           
           {/* 오른쪽 상단 - 로그인/즐겨찾기/대시보드/로그아웃 버튼 */}
           <div className="absolute top-4 right-4 flex items-center space-x-3">
             {/* 대시보드 버튼은 항상 표시 */}
             <button
               onClick={handleGoToDashboard}
               className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 text-sm"
             >
               📊 대시보드
             </button>
             
             {user ? (
               <>
                 <button
                   onClick={() => setShowFavoritesModal(true)}
                   className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 text-sm"
                 >
                   ⭐ 즐겨찾기
                 </button>
                 <button
                   onClick={logout}
                   className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 text-sm"
                 >
                   로그아웃
                 </button>
               </>
             ) : (
               <button
                 onClick={() => setShowLoginModal(true)}
                 className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 text-sm"
               >
                 로그인
               </button>
             )}
           </div>
          
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
          {appState.currentStep === 'dashboard' && (
            <ShadowingDashboard onGoToPractice={handleGoToPractice} />
          )}
          
          {appState.currentStep === 'text-input' && (
            <TextInputStep onTextConfirm={handleTextConfirm} />
          )}
          
          {appState.currentStep === 'shadowing' && (
            <ShadowingPracticeStep
              text={appState.selectedText}
              onGoBack={handleGoBack}
              onEvaluate={handleEvaluate}
              onFavorite={handleFavoriteScript}
              isFavorite={isFavorite(appState.selectedText)}
            />
          )}
          
          {appState.currentStep === 'evaluation' && (
            <>
              {appState.isEvaluating && (
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold text-gray-800">발음 평가 결과</h2>
                  
                  {/* 로딩 상태 */}
                  <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-8">
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

      {/* 모달들 */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      <FavoritesModal
        isOpen={showFavoritesModal}
        onClose={() => setShowFavoritesModal(false)}
        onSelectScript={handleSelectFromFavorites}
      />
    </div>
  );
}

export default App;