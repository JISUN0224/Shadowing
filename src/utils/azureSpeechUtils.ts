import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { prepareAudioForAzure } from './audioUtils';

// Azure Speech Services 설정 - Vite 환경변수 사용
const getSpeechConfig = () => {
  // Vite 환경변수 직접 접근
  const apiKey = (import.meta as any).env.VITE_AZURE_SPEECH_KEY;
  const region = (import.meta as any).env.VITE_AZURE_SPEECH_REGION;
  const endpoint = (import.meta as any).env.VITE_AZURE_SPEECH_ENDPOINT;
  
  // 환경변수 확인
  
  if (!apiKey || !region) {
    console.error('필요한 환경변수:', 'VITE_AZURE_SPEECH_KEY, VITE_AZURE_SPEECH_REGION');
    throw new Error('Azure Speech Services 설정이 불가능합니다.');
  }
  
  // Azure Speech Config 생성
  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
  
  // TTS 음성 설정 - 남자 뉴스 목소리
  speechConfig.speechSynthesisVoiceName = 'zh-CN-YunxiNeural';
  
  return speechConfig;
};

// 브라우저 내장 음성 인식을 사용한 폴백 평가
export const evaluateWithBrowserSpeechRecognition = async (
  audioBlob: Blob,
  referenceText: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    // 브라우저 내장 음성 인식 시작
    
    // Web Speech API 지원 확인
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('브라우저가 음성 인식을 지원하지 않습니다.'));
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // 중국어 설정
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // 브라우저 인식 결과
      
      // 간단한 평가 로직 (실제로는 더 정교한 알고리즘 필요)
      const accuracy = calculateSimpleAccuracy(transcript, referenceText);
      const fluency = calculateSimpleFluency(transcript, referenceText);
      const completeness = calculateSimpleCompleteness(transcript, referenceText);
      
      const result = {
        overallScore: Math.round((accuracy + fluency + completeness) / 3),
        accuracyScore: accuracy,
        fluencyScore: fluency,
        completenessScore: completeness,
        prosodyScore: 0,
        confidenceScore: 0,
        pauseCount: 0,
        words: [],
        syllables: [],
        phonemes: []
      };
      
      // 브라우저 평가 결과
      resolve(result);
    };

    recognition.onerror = (event: any) => {
      console.error('브라우저 음성 인식 오류:', event.error);
      reject(new Error(`브라우저 음성 인식 실패: ${event.error}`));
    };

    recognition.onend = () => {
      // 브라우저 음성 인식 종료
    };

    // 오디오 재생 후 음성 인식 시작
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioBlob);
    audio.onended = () => {
      recognition.start();
    };
    audio.play();
  });
};

// 간단한 정확도 계산
const calculateSimpleAccuracy = (transcript: string, reference: string): number => {
  const transcriptChars = transcript.replace(/\s/g, '').split('');
  const referenceChars = reference.replace(/\s/g, '').split('');
  
  let matches = 0;
  const maxLength = Math.max(transcriptChars.length, referenceChars.length);
  
  for (let i = 0; i < Math.min(transcriptChars.length, referenceChars.length); i++) {
    if (transcriptChars[i] === referenceChars[i]) {
      matches++;
    }
  }
  
  return Math.round((matches / maxLength) * 100);
};

// 간단한 유창성 계산
const calculateSimpleFluency = (transcript: string, reference: string): number => {
  const transcriptWords = transcript.split(/\s+/).length;
  const referenceWords = reference.split(/\s+/).length;
  
  // 단어 수가 비슷하면 유창성 점수 높음
  const ratio = Math.min(transcriptWords, referenceWords) / Math.max(transcriptWords, referenceWords);
  return Math.round(ratio * 100);
};

// 간단한 완성도 계산
const calculateSimpleCompleteness = (transcript: string, reference: string): number => {
  const transcriptLength = transcript.replace(/\s/g, '').length;
  const referenceLength = reference.replace(/\s/g, '').length;
  
  const ratio = Math.min(transcriptLength, referenceLength) / Math.max(transcriptLength, referenceLength);
  return Math.round(ratio * 100);
};

// Azure Speech Assessment API를 사용한 발음 평가
export const evaluatePronunciationWithAzure = async (
  audioBlob: Blob,
  referenceText: string
): Promise<any> => {
  try {
    // Azure Speech Assessment 시작
    
    // Speech Config 가져오기
    const speechConfig = getSpeechConfig();
    if (!speechConfig) {
      throw new Error('Azure Speech Services 설정이 불가능합니다.');
    }
    
    // 오디오를 Azure SDK에 맞는 형식으로 변환
    const wavBlob = await prepareAudioForAzure(audioBlob);
    // 오디오 변환 완료
    
    // Pronunciation Assessment 설정
    const pronunciationAssessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
      referenceText,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    
    // 운율 평가 활성화 (제거됨 - 중국어에서 지원하지 않음)
    // try {
    //   pronunciationAssessmentConfig.enableProsodyAssessment = true;
    // } catch (error) {
    //   console.log('운율 평가 활성화 실패, 기본 설정으로 진행:', error);
    // }
    
    // Speech Recognizer 생성 - WAV Blob을 File로 변환
    const audioFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
    const audioConfig = SpeechSDK.AudioConfig.fromWavFileInput(audioFile);
    
    // 중국어 언어 설정 추가
    speechConfig.speechRecognitionLanguage = 'zh-CN';
    
    // 연결 설정 개선
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, '1000');
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, '5000');
    
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    
    // Azure Speech Recognition 시작
    
    // 일반 Speech Recognition으로 먼저 테스트
    const result = await new Promise<SpeechSDK.SpeechRecognitionResult>((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => resolve(result),
        (error) => reject(error)
      );
    });
    
    // Azure Speech Recognition 완료
    
    // Pronunciation Assessment 실행
    const pronunciationRecognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(pronunciationRecognizer);
    
    const assessmentResult = await new Promise<any>((resolve, reject) => {
      pronunciationRecognizer.recognizeOnceAsync(
        (result) => {
          const pronunciationAssessmentResult = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
          
          // Azure API 응답 처리
          
          // 휴지 횟수 계산
          const calculatePauseCount = (words: any[]) => {
            let pauseCount = 0;
            for (let i = 0; i < words.length - 1; i++) {
              const currentWord = words[i];
              const nextWord = words[i + 1];
              
              if (currentWord.Duration && nextWord.Offset) {
                const currentEndTime = currentWord.Offset + currentWord.Duration;
                const nextStartTime = nextWord.Offset;
                const pauseDuration = (nextStartTime - currentEndTime) / 1000000; // 나노초 → 밀리초
                
                if (pauseDuration > 300) { // 300ms 이상의 휴지를 카운트
                  pauseCount++;
                }
              }
            }
            return pauseCount;
          };
          
          const pauseCount = calculatePauseCount(pronunciationAssessmentResult.detailResult.Words);
          
          const assessmentData = {
            overallScore: pronunciationAssessmentResult.detailResult.PronunciationAssessment.PronScore,
            accuracyScore: pronunciationAssessmentResult.detailResult.PronunciationAssessment.AccuracyScore,
            fluencyScore: pronunciationAssessmentResult.detailResult.PronunciationAssessment.FluencyScore,
            completenessScore: pronunciationAssessmentResult.detailResult.PronunciationAssessment.CompletenessScore,
            prosodyScore: 0, // 운율 평가 제거
            confidenceScore: 0, // Azure SDK에서 제공하지 않는 속성
            pauseCount: pauseCount, // 실제 계산된 휴지 횟수
            words: pronunciationAssessmentResult.detailResult.Words || [],
            syllables: [], // Azure SDK에서 제공하지 않는 속성
            phonemes: [] // Azure SDK에서 제공하지 않는 속성
          };
          
          // 최종 Assessment Data
          
          resolve(assessmentData);
        },
        (error) => reject(error)
      );
    });
    
    // Azure Assessment 완료
    return assessmentResult;
    
  } catch (error) {
    console.error('❌ Azure Pronunciation Assessment 실패:', error);
    throw new Error(`Azure 평가 실패: ${error}`);
  }
};

// Azure API 결과를 내부 타입으로 변환하는 함수
export const convertAzureResultToInternalFormat = (azureResult: any) => {
  return {
    overallScore: azureResult.overallScore,
    accuracyScore: azureResult.accuracyScore,
    fluencyScore: azureResult.fluencyScore,
    completenessScore: azureResult.completenessScore,
    prosodyScore: 0, // 운율 평가 제거
    confidenceScore: 0, // App.tsx에서 계산됨
    pauseCount: azureResult.pauseCount || 0, // 실제 계산된 휴지 횟수 사용
    words: azureResult.words.map((word: any) => ({
      word: word.Word, // 대문자 → 소문자
      accuracyScore: word.PronunciationAssessment.AccuracyScore, // 중첩 구조에서 추출
      errorType: word.PronunciationAssessment.ErrorType,
      syllables: word.Syllables || []
    })),
    syllables: [],
    phonemes: []
  };
};

// 강점과 개선점 분석 (실제 점수 기반)
export const analyzeStrengthsAndWeaknesses = (
  accuracyScore: number,
  fluencyScore: number,
  completenessScore: number,
  prosodyScore: number
) => {
  const strongPoints: string[] = [];
  const improvementAreas: string[] = [];

  if (accuracyScore >= 80) strongPoints.push('정확한 발음');
  else if (accuracyScore < 60) improvementAreas.push('기본 발음 정확성');

  if (fluencyScore >= 80) strongPoints.push('좋은 유창성');
  else if (fluencyScore < 60) improvementAreas.push('말하기 속도와 리듬');

  if (completenessScore >= 80) strongPoints.push('완전한 문장 구사');
  else if (completenessScore < 60) improvementAreas.push('문장 완성도');

  if (prosodyScore >= 80) strongPoints.push('자연스러운 억양');
  else if (prosodyScore < 60) improvementAreas.push('성조와 억양');

  return { strongPoints, improvementAreas };
};

// 점수별 조언 생성
export const generateScoreAdvice = (overallScore: number): string => {
  if (overallScore >= 90) {
    return '원어민 수준에 근접했습니다! 다양한 주제로 연습을 확장해보세요.';
  } else if (overallScore >= 80) {
    return '매우 좋은 발음이에요. 성조와 억양을 조금 더 다듬으면 완벽해질 것 같아요.';
  } else if (overallScore >= 70) {
    return '좋은 기반을 갖추고 있어요. 더 많은 연습으로 완성도를 높여보세요.';
  } else if (overallScore >= 60) {
    return '기본기는 갖추었지만 더 많은 연습이 필요해요. 성조와 기본 음소를 반복 연습하세요.';
  } else {
    return '기초부터 차근차근 연습해보세요. 천천히 정확하게 발음하는 것에 집중하세요.';
  }
}; 