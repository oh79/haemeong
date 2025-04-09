import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link as RouterLink, useSearchParams } from 'react-router-dom'; // RouterLink로 별칭
// Chakra UI 컴포넌트 임포트
import {
  Box,
  Button,
  Flex, // Flexbox 레이아웃
  Heading,
  Input, // 검색 입력창
  Link as ChakraLink, // Chakra의 Link
  Spinner, // 로딩 스피너
  Table, // 테이블 관련 컴포넌트
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer, // 테이블 감싸기 (반응형 스크롤 등)
  Alert,
  AlertIcon,
  Text
} from '@chakra-ui/react';

function Board() {
  const [posts, setPosts] = useState([]); // 게시글 목록 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [message, setMessage] = useState(''); // 오류 메시지 상태
  // --- 검색 관련 상태 추가 ---
  const [searchParams, setSearchParams] = useSearchParams(); // URL 쿼리 파라미터 관리 훅
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || ''); // 검색어 입력 상태
  const currentSearch = searchParams.get('search') || ''; // 현재 URL의 검색어
  // -------------------------

  // 게시글 목록 불러오기 함수 (useCallback으로 감싸고 검색어 파라미터 추가)
  const fetchPosts = useCallback(async (searchQuery) => {
    setLoading(true);
    setMessage('');
    try {
      // API 호출 시 search 쿼리 파라미터 추가
      const response = await axios.get(`http://localhost:5000/api/posts?search=${encodeURIComponent(searchQuery)}`);
      setPosts(response.data);
    } catch (error) {
      console.error('게시글 목록 로딩 오류:', error);
      if (error.response) {
        setMessage(error.response.data.message || '게시글 목록을 불러오는 중 오류가 발생했습니다.');
      } else if (error.request) {
        setMessage('서버에 연결할 수 없습니다.');
      } else {
        setMessage('요청 중 오류가 발생했습니다.');
      }
      setPosts([]); // 오류 시 목록 비우기
    } finally {
      setLoading(false);
    }
  }, []); // 빈 배열: 함수 자체는 마운트 시 1회만 생성

  // 컴포넌트 마운트 또는 URL 검색어가 변경될 때 게시글 목록 불러오기
  useEffect(() => {
    fetchPosts(currentSearch); // 현재 URL의 검색어로 데이터 요청
  }, [fetchPosts, currentSearch]); // fetchPosts 또는 currentSearch 변경 시 실행

  // 날짜 형식 변환 함수 (Y-m-d 형식으로 변경)
  const formatDate = (dateString) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  // --- 검색 실행 핸들러 ---
  const handleSearch = (e) => {
    e.preventDefault(); // 폼 기본 제출 방지
    // URL 쿼리 파라미터 업데이트 -> useEffect 트리거 -> fetchPosts 실행
    setSearchParams({ search: searchTerm });
  };
  // -----------------------

  // --- 검색어 입력 변경 핸들러 ---
  const handleSearchInputChange = (e) => {
      setSearchTerm(e.target.value);
  };
  // --------------------------

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}> {/* mb: 아래쪽 마진 */}
        <Heading as="h2" size="lg">게시판</Heading>
        <Button as={RouterLink} to="/board/write" colorScheme="teal" size="sm"> {/* RouterLink와 통합 */}
          새 글 작성
        </Button>
      </Flex>

      {/* 검색 폼 */}
      <Box as="form" onSubmit={handleSearch} mb={6}>
        <Flex>
          <Input
            placeholder="제목 또는 내용 검색"
            value={searchTerm}
            onChange={handleSearchInputChange}
            mr={2} // 오른쪽 마진
            focusBorderColor="teal.400"
          />
          <Button type="submit" colorScheme="teal" px={6}> {/* px: 좌우 패딩 */}
            검색
          </Button>
        </Flex>
      </Box>

      {/* 로딩 및 메시지 처리 */}
      {loading && (
        <Flex justify="center" align="center" minHeight="200px">
          <Spinner size="xl" color="teal.500" />
        </Flex>
      )}
      {message && !loading && (
        <Alert status="error" variant="subtle" borderRadius="md">
          <AlertIcon />
          {message}
        </Alert>
      )}

      {/* 게시글 목록 테이블 */}
      {!loading && !message && (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>제목</Th>
                <Th isNumeric>작성자</Th>
                <Th isNumeric>좋아요</Th>
                <Th isNumeric>작성일</Th>
              </Tr>
            </Thead>
            <Tbody>
              {posts.length > 0 ? (
                posts.map(post => (
                  <Tr key={post.id}>
                    <Td>
                      <ChakraLink as={RouterLink} to={`/board/${post.id}`} color="teal.600" _hover={{ textDecoration: 'underline' }}>
                        {post.title}
                      </ChakraLink>
                    </Td>
                    <Td isNumeric>{post.username}</Td>
                    <Td isNumeric>{post.likeCount || 0}</Td>
                    <Td isNumeric>{formatDate(post.created_at)}</Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={4} textAlign="center" py={10}>
                    <Text color="gray.500">
                      {currentSearch ? `'${currentSearch}'에 대한 검색 결과가 없습니다.` : '게시글이 없습니다.'}
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      )}
      {/* 페이지네이션은 나중에 추가 */}
    </Box>
  );
}

export default Board;
