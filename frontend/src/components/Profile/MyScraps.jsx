import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
// Chakra UI 컴포넌트 임포트
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Link as ChakraLink, // Chakra의 Link 컴포넌트
  Flex, // Flexbox 레이아웃
  useToast // Toast 메시지 (선택적)
} from '@chakra-ui/react';

function MyScraps() {
  const navigate = useNavigate();
  const [scrappedPosts, setScrappedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // 오류 메시지 상태 (기존 message 대신)
  const toast = useToast(); // Toast 사용 (선택적)

  // 날짜 형식 변환 함수 (다른 컴포넌트와 통일 권장)
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  // 스크랩 목록 불러오기 함수
  const fetchScrappedPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('로그인이 필요합니다.'); // 로그인 필요 에러 발생
      }
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/posts/scraps/me`, {
        headers: { Authorization: `Bearer ${token}` } // 명시적으로 헤더 추가 (axios 기본값에 의존하지 않음)
      });
      setScrappedPosts(response.data);
    } catch (err) {
      console.error('스크랩 목록 로딩 오류:', err);
      const errorMsg = err.response?.data?.message || err.message || '스크랩 목록을 불러오는 중 오류가 발생했습니다.';
      setError(errorMsg);
      // Toast 사용 시
      // toast({ title: "오류", description: errorMsg, status: "error", duration: 3000 });
      if (err.message === '로그인이 필요합니다.' || err.response?.status === 401) {
         // 필요시 로그인 페이지로 리디렉션
         // setTimeout(() => navigate('/login'), 1500);
      }
      setScrappedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]); // navigate 의존성 유지

  // 컴포넌트 마운트 시 스크랩 목록 불러오기
  useEffect(() => {
    fetchScrappedPosts();
  }, [fetchScrappedPosts]); // fetchScrappedPosts가 변경될 때 실행 (마운트 시 1회)

  // 로딩 상태 표시
  if (loading) {
    return (
      <Flex justify="center" align="center" minHeight="200px">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  // 오류 상태 표시
  if (error) {
    return (
      <Alert status="error" variant="subtle" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  // 메인 콘텐츠 렌더링 (기존 div 대신 Box 사용, 스타일 제거)
  return (
    <Box>
      {/* 페이지 제목 */}
      <Heading as="h2" size="lg" mb={6}>내 스크랩 목록</Heading>

      {/* 스크랩 목록 테이블 (Chakra UI Table 사용) */}
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>제목</Th>
              {/* 작성자: 모바일에서는 숨김 (Board.jsx 와 동일하게) */}
              <Th display={{ base: 'none', sm: 'table-cell' }}>작성자</Th>
              <Th isNumeric>작성일</Th>
            </Tr>
          </Thead>
          <Tbody>
            {scrappedPosts.length > 0 ? (
              scrappedPosts.map(post => (
                <Tr key={post.id}>
                  <Td>
                    {/* ChakraLink 사용 */}
                    <ChakraLink as={RouterLink} to={`/board/${post.id}`} color="teal.600" _hover={{ textDecoration: 'underline' }}>
                      {post.title}
                    </ChakraLink>
                  </Td>
                  {/* 작성자 Td: 모바일 숨김 */}
                  <Td display={{ base: 'none', sm: 'table-cell' }}>{post.username}</Td>
                  <Td isNumeric>{formatDate(post.created_at)}</Td>
                </Tr>
              ))
            ) : (
              <Tr>
                 {/* colSpan 값은 보이는 열의 개수에 맞게 조정 (Board.jsx 와 동일하게) */}
                 <Td colSpan={{ base: 2, sm: 3 }} textAlign="center" py={10}>
                   <Text color="gray.500">스크랩한 게시글이 없습니다.</Text>
                 </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>
      {/* 페이지네이션 필요 시 추가 */}
    </Box>
  );
}

export default MyScraps;
