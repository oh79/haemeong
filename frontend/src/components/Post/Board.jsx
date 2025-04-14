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
  // Table 관련 컴포넌트 제거
  // Table,
  // Thead,
  // Tbody,
  // Tr,
  // Th,
  // Td,
  // TableContainer,
  Alert,
  AlertIcon,
  Text,
  VStack, // 카드 목록을 위한 수직 스택
  HStack, // 카드 내부 요소 가로 배치
  Image, // 게시글 이미지 (추후 사용)
  IconButton, // IconButton 추가
  // AspectRatio, // 사용하지 않으면 제거
} from '@chakra-ui/react';
// 아이콘 추가
import { AddIcon, EditIcon, SearchIcon } from '@chakra-ui/icons'; // EditIcon 추가 (데스크탑 버튼용), SearchIcon 추가

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
      // API 호출 시 search 쿼리 파라미터 추가 및 헤더 추가
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/posts?search=${encodeURIComponent(searchQuery)}`, {
        headers: { // 헤더 객체 추가
          'ngrok-skip-browser-warning': 'true'
        }
      });
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

  // 날짜 형식 변환 함수 (간단하게 시간 포함하도록 변경)
  const formatDate = (dateString) => {
    // 입력값 유효성 검사 추가
    if (!dateString || isNaN(new Date(dateString).getTime())) {
        return '날짜 없음'; // 또는 다른 기본값
    }
    const date = new Date(dateString);
    // 간단한 상대 시간 또는 YYYY.MM.DD 형식으로 표시 (당근마켓 스타일과 유사하게)
    // 여기서는 일단 간단하게 YYYY-MM-DD 유지
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
    <Box pb={{ base: '80px', md: 4 }}> {/* 모바일 하단 여백, 데스크탑은 줄임 */}
      {/* 상단 바 */} 
      <Flex
        as="header"
        position="sticky"
        top="0"
        zIndex={50}
        bg="white"
        p={4}
        boxShadow="sm"
        mb={4}
        align="center" // 세로 정렬 추가
      >
        <Heading as="h1" size="md" mr={4} flexShrink={0}>해멍 게시판</Heading> {/* 제목 변경, 축소 방지 */}

         {/* 검색 폼 (Flex로 감싸서 Input과 Button 배치) */}
        <Flex as="form" onSubmit={handleSearch} flexGrow={1} mr={{ base: 0, md: 4 }} align="center">
          <Input
            placeholder="게시글 검색"
            value={searchTerm}
            onChange={handleSearchInputChange}
            focusBorderColor="teal.400" // 색상 변경
            bg="gray.100"
            borderRadius="md"
            mr={2} // 버튼과의 간격
          />
          <IconButton
            aria-label="검색"
            icon={<SearchIcon />}
            type="submit" // 폼 제출 트리거
            colorScheme="teal" // 테마 색상
            variant="ghost" // 배경 없는 스타일
          />
        </Flex>

        {/* 데스크탑용 글쓰기 버튼 (md 사이즈 이상에서 보임) */}
        <Button
          as={RouterLink}
          to="/board/write"
          colorScheme="teal" // 색상 변경
          leftIcon={<EditIcon />} // 아이콘 변경
          display={{ base: 'none', md: 'inline-flex' }} // md 이상에서 보임
        >
          글쓰기
        </Button>
      </Flex>

      {/* 로딩 및 메시지 처리 */} 
      {loading && (
        <Flex justify="center" align="center" minHeight="200px">
          <Spinner size="xl" color="teal.500" /> {/* 색상 변경 */}
        </Flex>
      )}
      {message && !loading && (
        <Alert status="error" variant="subtle" borderRadius="md" m={4}>
          <AlertIcon />
          {message}
        </Alert>
      )}

      {/* 게시글 카드 목록 */} 
      {!loading && !message && (
        <VStack spacing={0} align="stretch"> {/* 카드 사이 간격 제거, 수직 정렬 */}
          {Array.isArray(posts) && posts.length > 0 ? (
            posts.map(post => (
              <ChakraLink
                as={RouterLink}
                to={`/board/${post.id}`}
                key={post.id}
                _hover={{ textDecoration: 'none', bg: 'gray.50' }}
              >
                <Box
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                  p={4}
                >
                  <HStack spacing={4} align="start">
                    {/* 이미지 영역 */} 
                    {post.imageUrl ? (
                       <Image
                         src={`${import.meta.env.VITE_API_BASE_URL}${post.imageUrl}`}
                         alt={post.title}
                         boxSize={{ base: "70px", md: "80px" }}
                         objectFit="cover"
                         borderRadius="md"
                         fallbackSrc='/cha_v2_scalup.png'
                       />
                    ) : (
                      <Image
                        src='/cha_v2_scalup.png'
                        alt="기본 이미지"
                        boxSize={{ base: "70px", md: "80px" }}
                        objectFit="cover"
                        borderRadius="md"   
                      />
                    )}

                    <VStack align="stretch" spacing={1} flex={1} minW={0}> {/* 제목, 정보, 내용 등 */}
                      <Heading as="h3" size="sm" noOfLines={2}>
                        {post.title}
                      </Heading>
                      <Text fontSize="xs" color="gray.500">
                        {/* 사용자 이름, 날짜 표시 (location 제거) */}
                        {post.username || '익명'} · {formatDate(post.created_at)}
                      </Text>
                      {/* 좋아요, 댓글 수 표시 (데이터 구조에 맞게 수정) */}
                      <HStack justify="flex-end" spacing={2} pt={1}>
                         {post.likeCount > 0 && (
                           <Text fontSize="xs" color="gray.500">🤍 {post.likeCount}</Text>
                         )}
                         {post.commentCount > 0 && (
                            <Text fontSize="xs" color="gray.500">💬 {post.commentCount}</Text>
                         )}
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              </ChakraLink>
            ))
          ) : (
             <Flex justify="center" align="center" minHeight="200px">
               <Text color="gray.500">
                 {!Array.isArray(posts) ? "게시글 데이터를 불러오는 데 문제가 발생했습니다." :
                  currentSearch ? `'${currentSearch}'에 대한 검색 결과가 없습니다.` : '아직 게시글이 없어요.'
                 }
               </Text>
             </Flex>
          )}
        </VStack>
      )}

      {/* 모바일용 새 글 작성 플로팅 버튼 (md 사이즈 미만에서 보임) */}
      <Button
        as={RouterLink}
        to="/board/write"
        position="fixed"
        bottom={`${55 + 15}px`} // 하단 네비 높이(55px) + 여백(15px)
        right="15px" // 오른쪽 여백도 약간 조정
        colorScheme="teal"
        borderRadius="full"
        boxShadow="lg"
        w="50px" // 크기도 약간 줄임
        h="50px" // 크기도 약간 줄임
        aria-label="새 글 작성"
        zIndex="docked"
        display={{ base: 'flex', md: 'none' }}
        justifyContent="center" // 아이콘 중앙 정렬
        alignItems="center"   // 아이콘 중앙 정렬
      >
        <AddIcon w={5} h={5} /> {/* 아이콘 크기 명시 */}
      </Button>
    </Box>
  );
}

export default Board;
