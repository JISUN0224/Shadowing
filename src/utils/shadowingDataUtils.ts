import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

// 쉐도잉 세션 타입 정의
export interface ShadowingSession {
  id?: string;
  userId: string;
  date: string;
  skill: 'accuracy' | 'fluency' | 'completeness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  practiceCount: number;
  studyTime: number; // 초 단위
  averageScore: number;
  text: string;
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number;
  pauseCount: number;
  confidenceScore: number;
  createdAt?: any;
}

// 사용자 프로필 타입 정의
export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  totalPractices: number;
  averageScore: number;
  totalStudyTime: number; // 초 단위
  totalSessions: number;
  bestScore: number;
  favoriteTexts: string[];
  lastActiveDate: string;
  createdAt?: any;
  updatedAt?: any;
}

// 사용자의 쉐도잉 세션 가져오기
export const getUserShadowingSessions = async (limitCount: number = 50): Promise<ShadowingSession[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인하지 않았습니다.');
    }

    const sessionsRef = collection(db, 'shadowingSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const sessions: ShadowingSession[] = [];

    querySnapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data()
      } as ShadowingSession);
    });

    return sessions;
  } catch (error) {
    console.error('쉐도잉 세션 가져오기 실패:', error);
    return [];
  }
};

// 사용자 프로필 가져오기
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인하지 않았습니다.');
    }

    const profileRef = doc(db, 'userProfiles', user.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data() as UserProfile;
    } else {
      // 프로필이 없으면 기본 프로필 생성
      const defaultProfile: UserProfile = {
        userId: user.uid,
        displayName: user.displayName || '사용자',
        email: user.email || '',
        totalPractices: 0,
        averageScore: 0,
        totalStudyTime: 0,
        totalSessions: 0,
        bestScore: 0,
        favoriteTexts: [],
        lastActiveDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(profileRef, defaultProfile);
      return defaultProfile;
    }
  } catch (error) {
    console.error('사용자 프로필 가져오기 실패:', error);
    return null;
  }
};

// 쉐도잉 세션 저장
export const saveShadowingSession = async (sessionData: Omit<ShadowingSession, 'id' | 'userId' | 'createdAt'>): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인하지 않았습니다.');
    }

    const session: Omit<ShadowingSession, 'id'> = {
      ...sessionData,
      userId: user.uid,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'shadowingSessions'), session);
    
    // 사용자 프로필 업데이트
    await updateUserProfile(sessionData);
    
    return docRef.id;
  } catch (error) {
    console.error('쉐도잉 세션 저장 실패:', error);
    return null;
  }
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (sessionData: Omit<ShadowingSession, 'id' | 'userId' | 'createdAt'>): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인하지 않았습니다.');
    }

    const profileRef = doc(db, 'userProfiles', user.uid);
    const currentProfile = await getUserProfile();

    if (currentProfile) {
      const updatedProfile: Partial<UserProfile> = {
        totalPractices: currentProfile.totalPractices + sessionData.practiceCount,
        totalStudyTime: currentProfile.totalStudyTime + sessionData.studyTime,
        totalSessions: currentProfile.totalSessions + 1,
        bestScore: Math.max(currentProfile.bestScore, sessionData.overallScore),
        lastActiveDate: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      // 평균 점수 계산
      const newTotalScore = (currentProfile.averageScore * currentProfile.totalSessions) + sessionData.overallScore;
      updatedProfile.averageScore = Math.round((newTotalScore / (currentProfile.totalSessions + 1)) * 10) / 10;

      await updateDoc(profileRef, updatedProfile);
    }
  } catch (error) {
    console.error('사용자 프로필 업데이트 실패:', error);
  }
};

// 즐겨찾기 텍스트 추가/제거
export const toggleFavoriteText = async (text: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인하지 않았습니다.');
    }

    const profileRef = doc(db, 'userProfiles', user.uid);
    const currentProfile = await getUserProfile();

    if (currentProfile) {
      const favoriteTexts = [...currentProfile.favoriteTexts];
      const textIndex = favoriteTexts.indexOf(text);

      if (textIndex > -1) {
        // 이미 즐겨찾기에 있으면 제거
        favoriteTexts.splice(textIndex, 1);
      } else {
        // 즐겨찾기에 없으면 추가
        favoriteTexts.push(text);
      }

      await updateDoc(profileRef, {
        favoriteTexts,
        updatedAt: serverTimestamp()
      });

      return textIndex === -1; // true면 추가됨, false면 제거됨
    }

    return false;
  } catch (error) {
    console.error('즐겨찾기 텍스트 토글 실패:', error);
    return false;
  }
};

// 사용자 통계 가져오기
export const getUserStats = async (): Promise<{
  totalPractices: number;
  averageScore: number;
  totalStudyTime: number;
  totalSessions: number;
  bestScore: number;
  streakDays: number;
  weeklyGoal: number;
} | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('사용자가 로그인하지 않았습니다.');
    }

    const profile = await getUserProfile();
    if (!profile) {
      return null;
    }

    // 연속 학습일 계산
    const sessions = await getUserShadowingSessions(100);
    const uniqueDays = [...new Set(sessions.map(s => s.date.split('T')[0]))];
    uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streakDays = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);
    
    for (let i = 0; i < uniqueDays.length; i++) {
      const sessionDate = currentDate.toISOString().split('T')[0];
      if (uniqueDays.includes(sessionDate)) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 주간 목표 진행도
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekSessions = sessions.filter(s => new Date(s.date) >= weekStart);
    const weeklyGoal = Math.min((thisWeekSessions.length / 5) * 100, 100);

    return {
      totalPractices: profile.totalPractices,
      averageScore: profile.averageScore,
      totalStudyTime: profile.totalStudyTime,
      totalSessions: profile.totalSessions,
      bestScore: profile.bestScore,
      streakDays,
      weeklyGoal
    };
  } catch (error) {
    console.error('사용자 통계 가져오기 실패:', error);
    return null;
  }
};
