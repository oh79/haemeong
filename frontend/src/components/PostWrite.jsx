import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Chakra UI 컴포넌트 임포트
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Heading,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  useToast // Toast 메시지 사용
} from '@chakra-ui/react';

function PostWrite() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  // const [message, setMessage] = useState(''); // Alert 대신 Toast 사용 예정
  const navigate = useNavigate();
  const toast = useToast(); // Toast 훅 사용
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 추가

  useEffect(() => {
    // 컴포넌트 마운트 시 로그인 상태 확인
    if (!localStorage.getItem('authToken')) {
        toast({
            title: "로그인 필요",
            description: "글을 작성하려면 로그인이 필요합니다.",
            status: "warning",
            duration: 3000,
            isClosable: true,
        });
        // navigate('/login'); // 필요 시 리디렉션
        setIsLoggedIn(false);
    } else {
        setIsLoggedIn(true);
    }
  }, [toast, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    // setMessage(''); // Toast 사용으로 제거
    setLoading(true);

    if (!isLoggedIn) { // 버튼 클릭 시점 재확인
         toast({ title: "로그인 필요", status: "error", duration: 2000 });
         setLoading(false);
         return;
    }
    if (!title.trim() || !content.trim()) {
        toast({ title: "입력 오류", description: "제목과 내용을 모두 입력해주세요.", status: "error", duration: 2000 });
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/posts', { title, content });
      console.log('새 글 작성 성공:', response.data);
      toast({
          title: "작성 완료",
          description: "게시글이 성공적으로 등록되었습니다.",
          status: "success",
          duration: 2000,
          isClosable: true,
      });
      // 작성된 글로 이동 (PostDetail 구현 후)
      // navigate(`/board/${response.data.id}`);
      // 목록 페이지로 이동
      setTimeout(() => navigate('/board'), 1000);

    } catch (error) {
      console.error('게시글 작성 오류:', error);
      const errorMsg = error.response?.data?.message || '게시글 작성 중 오류가 발생했습니다.';
      toast({
          title: "작성 실패",
          description: errorMsg,
          status: "error",
          duration: 3000,
          isClosable: true,
      });
       if (error.response?.status === 401 || error.response?.status === 403) {
           // 토큰 만료 등 처리
       }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Heading as="h2" size="lg" mb={6}>새 글 작성</Heading>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl id="post-title" isRequired isDisabled={loading || !isLoggedIn}>
            <FormLabel>제목</FormLabel>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              focusBorderColor="teal.400"
            />
          </FormControl>

          <FormControl id="post-content" isRequired isDisabled={loading || !isLoggedIn}>
            <FormLabel>내용</FormLabel>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              focusBorderColor="teal.400"
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="teal"
            isLoading={loading}
            spinner={<Spinner size="sm" />}
            isDisabled={loading || !isLoggedIn} // 로딩 중 또는 비로그인 시 비활성화
            alignSelf="flex-end" // 버튼을 오른쪽으로 정렬
          >
            등록하기
          </Button>
        </VStack>
      </Box>
      {/* Alert 대신 Toast 메시지 사용 */}
      {/* {message && <Alert status={message.includes('성공') ? 'success' : 'error'} ... />} */}
    </Box>
  );
}

export default PostWrite;
