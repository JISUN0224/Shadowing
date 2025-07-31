import React, { useState, useEffect, useRef } from 'react';
import ScriptDisplay from './ScriptDisplay';
import AudioControls from './AudioControls';
import { evaluatePronunciationWithAzure } from '../utils/azureSpeechUtils';

interface ShadowingPracticeStepProps {
  text: string;
  onGoBack: () => void;
  onEvaluate: (audioBlob: Blob) => void;
}

interface AudioState {
  isPlaying: boolean;
  isRecording: boolean;
  hasRecording: boolean;
  currentWordIndex: number;
  audioBlob: Blob | null;
}

const ShadowingPracticeStep: React.FC<ShadowingPracticeStepProps> = ({
  text,
  onGoBack,
  onEvaluate
}) => {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isRecording: false,
    hasRecording: false,
    currentWordIndex: -1,
    audioBlob: null
  });

  const [pinyin, setPinyin] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const synthesizedAudioRef = useRef<HTMLAudioElement | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 마운트 시 병음 생성 및 TTS 음성 생성
  useEffect(() => {
    generatePinyin();
    generateTTSAudio();
  }, [text]);

  // 병음 생성 (실제로는 API 호출)
  const generatePinyin = () => {
    // 실제 구현에서는 Azure Translator나 다른 중국어 처리 API 사용
    const mockPinyin = convertToPinyin(text);
    setPinyin(mockPinyin);
  };

  // TTS 음성 생성
  const generateTTSAudio = async () => {
    setIsLoadingAudio(true);
    try {
      // Azure Speech Services API 호출
      const audioUrl = await generateAzureTTS(text);
      synthesizedAudioRef.current = new Audio(audioUrl);
      
      // 오디오 로드 완료 후 이벤트 리스너 추가
      synthesizedAudioRef.current.addEventListener('loadeddata', () => {
        console.log('Azure TTS 오디오 로드 완료');
      });
      
      // 오디오 재생 완료 시 하이라이트 리셋
      synthesizedAudioRef.current.addEventListener('ended', () => {
        setAudioState(prev => ({ ...prev, isPlaying: false, currentWordIndex: -1 }));
      });

      // 오디오 로드 실패 시 처리
      synthesizedAudioRef.current.addEventListener('error', (e) => {
        console.error('Azure TTS 오디오 로드 실패:', e);
        alert('Azure 음성 생성에 실패했습니다. 다시 시도해주세요.');
      });
    } catch (error) {
      console.error('Azure TTS 생성 실패:', error);
      alert('Azure 음성 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // 음성 재생
  const playAudio = async () => {
    if (!synthesizedAudioRef.current) {
      alert('음성이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setAudioState(prev => ({ ...prev, isPlaying: true }));
    
    try {
      // 오디오가 로드되었는지 확인
      if (synthesizedAudioRef.current.readyState < 2) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('오디오 로드 시간 초과'));
          }, 5000);
          
          synthesizedAudioRef.current!.addEventListener('canplaythrough', () => {
            clearTimeout(timeout);
            resolve(true);
          }, { once: true });
          
          synthesizedAudioRef.current!.addEventListener('error', () => {
            clearTimeout(timeout);
            reject(new Error('오디오 로드 실패'));
          }, { once: true });
        });
      }
      
      await synthesizedAudioRef.current.play();
      startTextHighlight();
    } catch (error) {
      console.error('오디오 재생 실패:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
      
      if (error instanceof Error) {
        if (error.message.includes('사용자')) {
          alert('브라우저에서 오디오 재생을 차단했습니다. 브라우저 설정을 확인해주세요.');
        } else {
          alert('음성 재생에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        alert('음성 재생에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 음성 중지
  const stopAudio = () => {
    if (synthesizedAudioRef.current) {
      synthesizedAudioRef.current.pause();
      synthesizedAudioRef.current.currentTime = 0;
    }
    
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentWordIndex: -1 
    }));
  };

  // 텍스트 하이라이트 애니메이션
  const startTextHighlight = () => {
    const words = text.replace(/[，。！？；：]/g, ' ').split(/\s+/).filter(word => word.length > 0);
    let currentIndex = 0;

    const highlightNext = () => {
      if (currentIndex < words.length && audioState.isPlaying) {
        setAudioState(prev => ({ ...prev, currentWordIndex: currentIndex }));
        currentIndex++;
        
        // 각 단어당 약 500ms 간격으로 하이라이트 (실제로는 음성 길이에 맞춰 조정)
        highlightTimeoutRef.current = setTimeout(highlightNext, 500);
      }
    };

    highlightNext();
  };

  // 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // 지원되는 오디오 형식 확인
      const supportedTypes = [
        'audio/wav',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4'
      ];
      
      let selectedType = 'audio/webm;codecs=opus'; // 기본값
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedType = type;
          break;
        }
      }
      
      console.log('선택된 오디오 형식:', selectedType);
      
      const options = {
        mimeType: selectedType,
        audioBitsPerSecond: 16000
      };
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedType });
        setAudioState(prev => ({ 
          ...prev, 
          hasRecording: true, 
          audioBlob 
        }));
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setAudioState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setAudioState(prev => ({ ...prev, isRecording: false }));
    }
  };

  // 녹음 토글
  const toggleRecording = () => {
    if (audioState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 발음 평가 시작
  const handleEvaluate = () => {
    if (audioState.audioBlob) {
      onEvaluate(audioState.audioBlob);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">쉐도잉 연습</h2>
        <p className="text-gray-600">음성을 듣고 따라 말해보세요</p>
      </div>

      {/* 스크립트 표시 영역 */}
      <ScriptDisplay 
        text={text}
        currentWordIndex={audioState.currentWordIndex}
        isPlaying={audioState.isPlaying}
        audioElement={synthesizedAudioRef.current}
        onWordHighlight={(wordIndex) => {
          setAudioState(prev => ({ ...prev, currentWordIndex: wordIndex }));
        }}
      />

      {/* 오디오 컨트롤 */}
      <AudioControls
        isPlaying={audioState.isPlaying}
        isRecording={audioState.isRecording}
        hasRecording={audioState.hasRecording}
        isLoadingAudio={isLoadingAudio}
        onPlay={playAudio}
        onStop={stopAudio}
        onToggleRecording={toggleRecording}
        onEvaluate={handleEvaluate}
      />

      {/* 하단 네비게이션 */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onGoBack}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all duration-300"
        >
          <span>←</span>
          <span>돌아가기</span>
        </button>

        <div className="text-center">
          {audioState.isRecording && (
            <div className="flex items-center space-x-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">녹음 중...</span>
            </div>
          )}
          {audioState.hasRecording && !audioState.isRecording && (
            <div className="flex items-center space-x-2 text-green-500">
              <span>✓</span>
              <span className="text-sm font-medium">녹음 완료</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 유틸리티 함수들 (실제 구현에서는 별도 파일로 분리)
const convertToPinyin = (text: string): string => {
  // 실제로는 중국어 처리 라이브러리나 API 사용
  const pinyinMap: { [key: string]: string } = {
    '你': 'nǐ', '好': 'hǎo', '我': 'wǒ', '是': 'shì', '来': 'lái', '自': 'zì',
    '韩': 'hán', '国': 'guó', '的': 'de', '学': 'xué', '生': 'shēng',
    '正': 'zhèng', '在': 'zài', '习': 'xí', '中': 'zhōng', '文': 'wén'
  };
  
  return text.split('').map(char => pinyinMap[char] || char).join(' ');
};

const generateAzureTTS = async (text: string): Promise<string> => {
  // 환경 변수 검증
  const subscriptionKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
  const region = import.meta.env.VITE_AZURE_SPEECH_REGION || 'eastasia';

  console.log('🔍 환경변수 확인:', {
    subscriptionKey: subscriptionKey ? `✅ 설정됨 (${subscriptionKey.substring(0, 10)}...)` : '❌ 설정되지 않음',
    region: region ? `✅ 설정됨 (${region})` : '❌ 설정되지 않음'
  });

  if (!subscriptionKey) {
    throw new Error('VITE_AZURE_SPEECH_KEY가 설정되지 않았습니다.');
  }

  // XML 이스케이프 처리
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const ssml = `<speak version='1.0' xml:lang='zh-CN'><voice xml:lang='zh-CN' xml:gender='Male' name='zh-CN-YunyangNeural'>${escapedText}</voice></speak>`;

  try {
    // API 키 검증 및 정리
    const cleanKey = subscriptionKey?.trim().replace(/[^\x00-\x7F]/g, '');
    
    console.log('Azure TTS request started:', {
      region,
      textLength: text.length,
      keyLength: cleanKey?.length,
      keyPreview: cleanKey?.substring(0, 10) + '...'
    });

    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': cleanKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '응답을 읽을 수 없음');
      
      if (response.status === 401) {
        throw new Error(`인증 실패: API 키를 확인하세요 (${response.status})`);
      } else if (response.status === 403) {
        throw new Error(`권한 거부: 구독 상태를 확인하세요 (${response.status})`);
      } else {
        throw new Error(`TTS 요청 실패: ${response.status} - ${errorText}`);
      }
    }

    const audioBlob = await response.blob();
    if (audioBlob.size === 0) {
      throw new Error('빈 오디오 파일이 반환되었습니다.');
    }

    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error('Azure TTS 오류:', error);
    throw error;
  }
};

export default ShadowingPracticeStep; 