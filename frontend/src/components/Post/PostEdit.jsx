import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
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
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  useToast
} from '@chakra-ui/react';

function PostEdit() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const toast = useToast(); // Toast 훅 사용

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true); // 초기 데이터 로딩 상태
  const [saving, setSaving] = useState(false); // 저장 중 상태
  const [initialLoadingError, setInitialLoadingError] = useState(''); // 초기 로딩 에러

  // 기존 게시글 데이터 로드 함수
  const fetchPostData = useCallback(async () => {
    setLoading(true);
    setInitialLoadingError('');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}`);
      const postData = response.data;
      const currentUser = JSON.parse(localStorage.getItem('userInfo'));
      if (!currentUser || postData.user_id !== currentUser.id) {
          setInitialLoadingError('이 게시글을 수정할 권한이 없습니다.');
          setTitle('');
          setContent('');
          return;
      }
      setTitle(postData.title);
      setContent(postData.content);
    } catch (error) {
      console.error('게시글 로딩 오류:', error);
      if (error.response && error.response.status === 404) {
        setInitialLoadingError('게시글을 찾을 수 없습니다.');
      } else {
        setInitialLoadingError('게시글 정보를 불러오는 중 오류가 발생했습니다.');
      }
      setTitle('');
      setContent('');
    } finally {
      setLoading(false);
    }
  }, [postId, navigate]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
        setInitialLoadingError('수정하려면 로그인이 필요합니다.');
        setLoading(false);
        return;
    }
    fetchPostData();
  }, [fetchPostData]);

  // 수정 내용 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (!title.trim() || !content.trim()) {
      toast({ title: "입력 오류", description: "제목과 내용을 모두 입력해주세요.", status: "warning", duration: 2000 });
      setSaving(false);
      return;
    }

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}`, { title, content });
      console.log('게시글 수정 성공:', response.data);
      toast({
          title: "수정 완료",
          description: "게시글이 성공적으로 수정되었습니다.",
          status: "success",
          duration: 2000,
          isClosable: true,
      });
      setTimeout(() => navigate(`/board/${postId}`), 1000);

    } catch (error) {
      console.error('게시글 수정 오류:', error);
      const errorMsg = error.response?.data?.message || '게시글 수정 중 오류가 발생했습니다.';
      toast({
          title: "수정 실패",
          description: errorMsg,
          status: "error",
          duration: 3000,
          isClosable: true,
      });
      if (error.response?.status === 403) { /* 권한 없음 처리 */ }
    } finally {
      setSaving(false);
    }
  };

  // --- 로딩 및 에러 처리 ---
  if (loading) {
    return (
      <Box>
        <Heading as="h2" size="lg" mb={6}>게시글 수정</Heading>
        <Box>
          <Spinner size="xl" color="teal.500" />
        </Box>
      </Box>
    );
  }
  if (initialLoadingError) {
      return (
          <Alert status="error" variant="subtle" borderRadius="md">
              <AlertIcon />
              {initialLoadingError}
          </Alert>
      );
  }
  // -------------------------

  return (
    <Box>
      <Heading as="h2" size="lg" mb={6}>게시글 수정</Heading>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl id="post-edit-title" isRequired isDisabled={saving}>
            <FormLabel>제목</FormLabel>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              focusBorderColor="teal.400"
            />
          </FormControl>

          <FormControl id="post-edit-content" isRequired isDisabled={saving}>
            <FormLabel>내용</FormLabel>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              focusBorderColor="teal.400"
            />
          </FormControl>

          {/* 버튼 그룹 */}
          <Flex justify="flex-end" gap={3}> {/* gap: 버튼 사이 간격 */}
             <Button
              onClick={() => navigate(`/board/${postId}`)} // 취소 버튼
              variant="outline" // 테두리만 있는 스타일
              isDisabled={saving}
            >
              취소
            </Button>
            <Button
              type="submit"
              colorScheme="teal"
              isLoading={saving}
              spinner={<Spinner size="sm" />}
              isDisabled={saving}
            >
              수정 완료
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}

export default PostEdit;
