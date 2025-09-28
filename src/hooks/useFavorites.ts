import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './useAuth';

export interface FavoriteScript {
  id: string;
  text: string;
  createdAt: Date;
  title?: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteScript[]>([]);
  const [loading, setLoading] = useState(false);

  // 즐겨찾기 목록 불러오기
  const loadFavorites = async () => {
    if (!user) {
      // 사용자가 로그인하지 않음
      return;
    }

    // 즐겨찾기 목록 불러오기 시작
    setLoading(true);
    
    try {
      // 인덱스 없이 작동하도록 쿼리 수정
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const favoritesList: FavoriteScript[] = [];
      
      // Firestore에서 가져온 문서 수
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favoritesList.push({
          id: doc.id,
          text: data.text,
          title: data.title || '제목 없음',
          createdAt: data.createdAt.toDate()
        });
      });
      
      // 클라이언트에서 정렬 (최신순)
      favoritesList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // 즐겨찾기 목록 설정
      setFavorites(favoritesList);
    } catch (error) {
      console.error('즐겨찾기 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 즐겨찾기 추가
  const addFavorite = async (text: string, title?: string) => {
    if (!user) return { success: false, error: '로그인이 필요합니다.' };

    // 즐겨찾기 추가 시작

    try {
      const docRef = await addDoc(collection(db, 'favorites'), {
        userId: user.uid,
        text,
        title: title || '제목 없음',
        createdAt: Timestamp.now()
      });

      // Firestore에 즐겨찾기 추가 성공

      const newFavorite: FavoriteScript = {
        id: docRef.id,
        text,
        title: title || '제목 없음',
        createdAt: new Date()
      };

      // 로컬 상태 업데이트
      setFavorites(prev => {
        const updated = [newFavorite, ...prev];
        // 로컬 상태 업데이트
        return updated;
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('즐겨찾기 추가 실패:', error);
      return { success: false, error: error.message };
    }
  };

  // 즐겨찾기 삭제
  const removeFavorite = async (favoriteId: string) => {
    if (!user) return { success: false, error: '로그인이 필요합니다.' };

    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      return { success: true };
    } catch (error: any) {
      console.error('즐겨찾기 삭제 실패:', error);
      return { success: false, error: error.message };
    }
  };

  // 즐겨찾기 제목 수정
  const updateFavoriteTitle = async (favoriteId: string, newTitle: string) => {
    if (!user) return { success: false, error: '로그인이 필요합니다.' };

    try {
      const favoriteRef = doc(db, 'favorites', favoriteId);
      await updateDoc(favoriteRef, {
        title: newTitle.trim() || '제목 없음'
      });

      // 로컬 상태 업데이트
      setFavorites(prev => prev.map(fav => 
        fav.id === favoriteId 
          ? { ...fav, title: newTitle.trim() || '제목 없음' }
          : fav
      ));

      return { success: true };
    } catch (error: any) {
      console.error('즐겨찾기 제목 수정 실패:', error);
      return { success: false, error: error.message };
    }
  };

  // 즐겨찾기 확인
  const isFavorite = (text: string) => {
    // 정확한 텍스트 매칭 (공백, 줄바꿈 등도 고려)
    const trimmedText = text.trim();
    const isFav = favorites.some(fav => fav.text.trim() === trimmedText);
    
    // 즐겨찾기 확인
    
    return isFav;
  };

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    updateFavoriteTitle,
    isFavorite,
    loadFavorites
  };
};
