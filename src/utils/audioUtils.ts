// 오디오 Blob을 WAV 형식으로 변환하는 유틸리티 함수들

// Blob을 WAV 형식으로 변환 (개선된 버전)
export const convertBlobToWav = async (blob: Blob): Promise<Blob> => {
  // 이미 WAV 형식인 경우 그대로 반환
  if (blob.type === 'audio/wav') {
    // 이미 WAV 형식
    return blob;
  }

  try {
    // 오디오 변환 시작
    
    // AudioContext를 사용하여 오디오 데이터 변환
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000 // Azure SDK 권장 샘플레이트
    });
    
    // AudioContext 생성 완료
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    // 오디오 디코딩 완료
    
    // WAV 형식으로 인코딩
    const wavBlob = await encodeAudioBufferToWav(audioBuffer);
    // WAV 변환 완료
    
    return wavBlob;
  } catch (error) {
    console.error('오디오 형식 변환 실패:', error);
    
    // 변환 실패 시 원본을 그대로 반환하되 경고
    console.warn('변환 실패로 원본 오디오를 사용합니다. Azure API에서 오류가 발생할 수 있습니다.');
    return blob;
  }
};

// AudioBuffer를 WAV 형식으로 인코딩 (개선된 버전)
const encodeAudioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const fileSize = 36 + dataSize;

  // WAV 헤더 정보

  // WAV 헤더 생성
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF 헤더
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize, true);
  writeString(view, 8, 'WAVE');

  // fmt 청크
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt 청크 크기
  view.setUint16(20, 1, true); // PCM 형식
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data 청크
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // 오디오 데이터 복사 (개선된 버전)
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

// 문자열을 DataView에 쓰기
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// 녹음된 오디오를 Azure SDK에 맞는 형식으로 변환 (개선된 버전)
export const prepareAudioForAzure = async (blob: Blob): Promise<Blob> => {
  try {
    console.log('Azure용 오디오 준비 시작:', {
      type: blob.type,
      size: blob.size
    });
    
    // WAV 형식으로 변환
    const wavBlob = await convertBlobToWav(blob);
    
    // Azure용 오디오 준비 완료
    
    return wavBlob;
  } catch (error) {
    console.error('Azure용 오디오 준비 실패:', error);
    throw new Error('오디오 형식 변환에 실패했습니다.');
  }
}; 