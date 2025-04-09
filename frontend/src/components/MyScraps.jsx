import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function MyScraps() {
  const navigate = useNavigate();
  const [scrappedPosts, setScrappedPosts] = useState([]); // 스크랩한 게시글 목록
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 날짜 형식 변환 함수 (다른 곳과 동일)
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  // 스크랩 목록 불러오기 함수
  const fetchScrappedPosts = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
        // 백엔드 API 호출 (인증 필요, axios 기본 헤더에 토큰 포함됨)
        const response = await axios.get('http://localhost:5000/api/posts/scraps/me');
        setScrappedPosts(response.data);
    } catch (error) {
        console.error('스크랩 목록 로딩 오류:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            setMessage('스크랩 목록을 보려면 로그인이 필요합니다.');
            // 로그인 페이지로 리디렉션 (선택적)
            // setTimeout(() => navigate('/login'), 1500);
        } else {
            setMessage('스크랩 목록을 불러오는 중 오류가 발생했습니다.');
        }
        setScrappedPosts([]);
    } finally {
        setLoading(false);
    }
  }, [navigate]); // navigate 의존성 추가 (리디렉션 시 필요)

  // 컴포넌트 마운트 시 스크랩 목록 불러오기
  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
        setMessage('스크랩 목록을 보려면 로그인이 필요합니다.');
        setLoading(false);
        // 로그인 페이지로 리디렉션
        // navigate('/login');
        return; // 로그인 안 했으면 API 호출 안 함
    }
    fetchScrappedPosts();
  }, [fetchScrappedPosts]); // fetchScrappedPosts 함수가 생성될 때 실행

  return (
    <div>
      <h2>내 스크랩 목록 (REQ06_NOTICE_BOARD_10)</h2>

      {loading && <p>로딩 중...</p>}
      {message && <p style={{ color: 'red' }}>{message}</p>}

      {!loading && !message && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>제목</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', width: '100px' }}>작성자</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', width: '120px' }}>작성일</th>
              {/* 스크랩 시간 표시 필요 시 백엔드 API 및 테이블에 추가 */}
            </tr>
          </thead>
          <tbody>
            {scrappedPosts.length > 0 ? (
              scrappedPosts.map(post => (
                <tr key={post.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <Link to={`/board/${post.id}`}>{post.title}</Link>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{post.username}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(post.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                  스크랩한 게시글이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyScraps;
