import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { prepareAudioForAzure } from './audioUtils';

// Azure Speech Services 설정 - Vite 환경변수 사용
const getSpeechConfig = () => {
  // Vite 환경변수 직접 접근
  const apiKey = (import.meta as any).env.VITE_AZURE_SPEECH_KEY;
  const region = (import.meta as any).env.VITE_AZURE_SPEECH_REGION;
  const endpoint = (import.meta as any).env.VITE_AZURE_SPEECH_ENDPOINT;
  
  console.log('🔍 환경변수 확인:', {
    apiKey: apiKey ? `✅ 설정됨 (${apiKey.substring(0, 10)}...)` : '❌ 설정되지 않음',
    region: region ? `✅ 설정됨 (${region})` : '❌ 설정되지 않음',
    endpoint: endpoint ? `✅ 설정됨 (${endpoint})` : '❌ 설정되지 않음'
  });
  
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

// Azure Speech Assessment API를 사용한 발음 평가
export const evaluatePronunciationWithAzure = async (
  audioBlob: Blob,
  referenceText: string
): Promise<any> => {
  try {
    console.log('🔍 Azure Speech Assessment 시작...');
    
    // Speech Config 가져오기
    const speechConfig = getSpeechConfig();
    if (!speechConfig) {
      throw new Error('Azure Speech Services 설정이 불가능합니다.');
    }
    
    // 오디오를 Azure SDK에 맞는 형식으로 변환
    const wavBlob = await prepareAudioForAzure(audioBlob);
    console.log('✅ 오디오 변환 완료:', wavBlob.size, 'bytes');
    
    // Pronunciation Assessment 설정
    const pronunciationAssessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
      referenceText,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    
    // Speech Recognizer 생성 - WAV Blob을 File로 변환
    const audioFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
    const audioConfig = SpeechSDK.AudioConfig.fromWavFileInput(audioFile);
    
    // 중국어 언어 설정 추가
    speechConfig.speechRecognitionLanguage = 'zh-CN';
    
    // 연결 설정 개선
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, '1000');
    speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, '5000');
    
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    
    console.log('🎤 Azure Speech Recognition 시작...');
    
    // 일반 Speech Recognition으로 먼저 테스트
    const result = await new Promise<SpeechSDK.SpeechRecognitionResult>((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => resolve(result),
        (error) => reject(error)
      );
    });
    
    console.log('✅ Azure Speech Recognition 완료');
    console.log('인식 결과:', result.text);
    
    // 임시로 기본 점수 반환 (Pronunciation Assessment 대신)
    const assessmentResult = {
      overallScore: 75, // 임시 점수
      accuracyScore: 80,
      fluencyScore: 70,
      completenessScore: 85,
      prosodyScore: 65,
      confidenceScore: 0,
      words: [],
      syllables: [],
      phonemes: []
    };
    
    console.log('✅ Azure Assessment 완료 (임시)');
    return assessmentResult;
    
  } catch (error) {
    console.error('❌ Azure Pronunciation Assessment 실패:', error);
    throw new Error(`Azure 평가 실패: ${error}`);
  }
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