import React from 'react';

interface AudioControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
  hasRecording: boolean;
  isLoadingAudio: boolean;
  onPlay: () => void;
  onStop: () => void;
  onToggleRecording: () => void;
  onEvaluate: () => void;
  onToggleVoiceSelect: () => void;
  showVoiceSelect: boolean;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  isRecording,
  hasRecording,
  isLoadingAudio,
  onPlay,
  onStop,
  onToggleRecording,
  onEvaluate,
  onToggleVoiceSelect,
  showVoiceSelect
}) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center justify-center">
          <span className="text-2xl mr-3">🎛️</span>
          오디오 컨트롤
        </h3>
      </div>

      {/* 메인 컨트롤 버튼들 */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
        {/* 음성 재생 버튼 */}
        <button
          onClick={isPlaying ? onStop : onPlay}
          disabled={isLoadingAudio}
          className={`flex items-center space-x-3 px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
            isLoadingAudio
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isPlaying
              ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white hover:from-red-500 hover:to-pink-600 shadow-red-200'
              : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-600 shadow-blue-200'
          }`}
        >
          {isLoadingAudio ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>로딩중...</span>
            </>
          ) : isPlaying ? (
            <>
              <span className="text-2xl">⏹️</span>
              <span>재생 중지</span>
            </>
          ) : (
            <>
              <span className="text-2xl">🔊</span>
              <span>음성 재생</span>
            </>
          )}
        </button>

        {/* 음성 선택 토글 버튼 */}
        <button
          onClick={onToggleVoiceSelect}
          className={`flex items-center space-x-3 px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
            showVoiceSelect
              ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:from-purple-500 hover:to-pink-600 shadow-purple-200'
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600 shadow-gray-200'
          }`}
        >
          <span className="text-2xl">🎭</span>
          <span>{showVoiceSelect ? '음성 선택 닫기' : '음성 선택'}</span>
        </button>

        {/* 녹음 버튼 */}
        <button
          onClick={onToggleRecording}
          className={`flex items-center space-x-3 px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
            isRecording
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse shadow-red-300'
              : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 shadow-green-200'
          }`}
        >
          {isRecording ? (
            <>
              <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
              <span>녹음 중지</span>
            </>
          ) : (
            <>
              <span className="text-2xl">🎤</span>
              <span>쉐도잉 녹음</span>
            </>
          )}
        </button>
      </div>

      {/* 녹음 상태 표시 */}
      {isRecording && (
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 border border-red-200 rounded-full px-6 py-3 flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-8 bg-red-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-6 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-10 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-2 h-7 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-red-600 font-medium">음성을 녹음하고 있습니다...</span>
          </div>
        </div>
      )}

      {/* 녹음 완료 상태 */}
      {hasRecording && !isRecording && (
        <div className="flex justify-center mb-6">
          <div className="bg-green-50 border border-green-200 rounded-full px-6 py-3 flex items-center space-x-3">
            <span className="text-green-600 text-xl">✅</span>
            <span className="text-green-600 font-medium">녹음이 완료되었습니다!</span>
          </div>
        </div>
      )}

      {/* 발음 평가 버튼 */}
      <div className="text-center">
        <button
          onClick={onEvaluate}
          disabled={!hasRecording || isRecording}
          className={`px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform ${
            hasRecording && !isRecording
              ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:from-purple-500 hover:to-pink-600 hover:scale-105 shadow-lg shadow-purple-200'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasRecording && !isRecording ? (
            <span className="flex items-center space-x-2">
              <span>📊</span>
              <span>발음 평가하기</span>
            </span>
          ) : (
            '먼저 음성을 녹음해주세요'
          )}
        </button>
      </div>

      {/* 사용 가이드 */}
      <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
          <span className="text-lg mr-2">📋</span>
          사용 가이드
        </h4>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 font-bold">1.</span>
            <span>먼저 <strong>"음성 재생"</strong> 버튼을 눌러 원어민 발음을 들어보세요</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 font-bold">2.</span>
            <span><strong>"쉐도잉 녹음"</strong> 버튼을 눌러 따라 말하며 녹음하세요</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 font-bold">3.</span>
            <span>녹음이 완료되면 <strong>"발음 평가하기"</strong>로 결과를 확인하세요</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioControls; 