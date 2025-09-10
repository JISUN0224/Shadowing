import React, { useState } from 'react';
import { useFavorites, FavoriteScript } from '../hooks/useFavorites';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScript: (text: string) => void;
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectScript 
}) => {
  const { favorites, loading, removeFavorite, updateFavoriteTitle } = useFavorites();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // 디버깅용 로그
  console.log('FavoritesModal 렌더링:', { 
    isOpen, 
    favoritesCount: favorites.length, 
    loading,
    selectedItemsCount: selectedItems.size,
    favorites: favorites.map(f => ({ id: f.id, title: f.title, textPreview: f.text.substring(0, 30) }))
  });

  // 체크박스 토글
  const toggleSelection = (favoriteId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(favoriteId)) {
      newSelected.delete(favoriteId);
    } else {
      newSelected.add(favoriteId);
    }
    setSelectedItems(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedItems.size === favorites.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(favorites.map(f => f.id)));
    }
  };

  // 선택된 항목들 삭제
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`선택된 ${selectedItems.size}개 항목을 삭제하시겠습니까?`)) return;
    
    for (const id of Array.from(selectedItems)) {
      setDeletingId(id);
      try {
        await removeFavorite(id);
      } catch (error) {
        console.error('삭제 실패:', id, error);
      }
    }
    setDeletingId(null);
    setSelectedItems(new Set());
  };

  // 개별 삭제
  const handleDelete = async (favorite: FavoriteScript) => {
    setDeletingId(favorite.id);
    try {
      await removeFavorite(favorite.id);
    } finally {
      setDeletingId(null);
    }
  };

  // 제목 수정 시작
  const startEditTitle = (favorite: FavoriteScript) => {
    setEditingTitle(favorite.id);
    setEditingText(favorite.title || '');
  };

  // 제목 수정 완료
  const handleSaveTitle = async (favorite: FavoriteScript) => {
    try {
      await updateFavoriteTitle(favorite.id, editingText);
      setEditingTitle(null);
      setEditingText('');
    } catch (error) {
      console.error('제목 수정 실패:', error);
      alert('제목 수정에 실패했습니다.');
    }
  };

  // 제목 수정 취소
  const cancelEditTitle = () => {
    setEditingTitle(null);
    setEditingText('');
  };

  const handleSelect = (text: string) => {
    onSelectScript(text);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">즐겨찾기 스크립트</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 선택된 항목 삭제 버튼 */}
        {selectedItems.size > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-red-700 font-medium">
                {selectedItems.size}개 항목 선택됨
              </span>
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                선택 삭제
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">불러오는 중...</span>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">⭐</div>
              <p>아직 즐겨찾기한 스크립트가 없습니다.</p>
              <p className="text-sm mt-2">쉐도잉 연습 중에 하트 버튼을 눌러 스크립트를 저장해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 전체 선택 체크박스 */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedItems.size === favorites.length && favorites.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  전체 선택 ({selectedItems.size}/{favorites.length})
                </label>
              </div>

              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className={`border-2 rounded-xl p-4 transition-colors ${
                    selectedItems.has(favorite.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-3 mb-3">
                    {/* 체크박스 */}
                    <input
                      type="checkbox"
                      checked={selectedItems.has(favorite.id)}
                      onChange={() => toggleSelection(favorite.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
                    />
                    
                    {/* 제목 영역 */}
                    <div className="flex-1">
                      {editingTitle === favorite.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="제목을 입력하세요"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveTitle(favorite)}
                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                          >
                            저장
                          </button>
                          <button
                            onClick={cancelEditTitle}
                            className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <h3 
                          className="font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                          onClick={() => startEditTitle(favorite)}
                          title="클릭하여 제목 수정"
                        >
                          {favorite.title}
                        </h3>
                      )}
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelect(favorite.text)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        선택
                      </button>
                      <button
                        onClick={() => handleDelete(favorite)}
                        disabled={deletingId === favorite.id}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {deletingId === favorite.id ? '삭제중...' : '삭제'}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed ml-7">
                    {favorite.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 ml-7">
                    저장일: {favorite.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesModal;
