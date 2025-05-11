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
  useToast,
  IconButton,
  Text
} from '@chakra-ui/react';
// 아이콘 추가
import { ArrowBackIcon, CheckIcon } from '@chakra-ui/icons';

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
          toast({ title: "권한 없음", description: "이 게시글을 수정할 권한이 없습니다.", status: "error" });
          navigate(-1);
          return;
      }
      setTitle(postData.title);
      setContent(postData.content);
    } catch (error) {
      console.error('게시글 로딩 오류:', error);
      let errorMsg = '게시글 정보를 불러오는 중 오류가 발생했습니다.';
      if (error.response && error.response.status === 404) {
        errorMsg = '게시글을 찾을 수 없습니다.';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMsg = '게시글을 불러올 권한이 없습니다.';
      }
      setInitialLoadingError(errorMsg);
      toast({ title: "로딩 실패", description: errorMsg, status: "error" });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [postId, navigate, toast]);

  // 컴포넌트 마운트 시 데이터 로드 및 로그인 확인
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        setInitialLoadingError('수정하려면 로그인이 필요합니다.');
        setLoading(false);
        toast({ title: "로그인 필요", description: "수정하려면 로그인이 필요합니다.", status: "warning" });
        navigate('/login', { state: { from: `/board/edit/${postId}` } });
        return;
    }
    fetchPostData();
  }, [fetchPostData, navigate, toast, postId]); // postId 의존성 추가

  // 수정 내용 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (!title.trim() || !content.trim()) {
      toast({ title: "입력 오류", description: "제목과 내용을 모두 입력해주세요.", status: "warning", duration: 2000 });
      setSaving(false);
      return;
    }

    const token = localStorage.getItem('authToken'); // 토큰 가져오기
    if (!token) { // 토큰 재확인
        toast({ title: "인증 오류", description: "로그인이 필요합니다. 다시 로그인해주세요.", status: "error" });
        setSaving(false);
        navigate('/login');
        return;
    }

    try {
      const response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}`,
          { title, content },
          { headers: { 'Authorization': `Bearer ${token}` } } // 헤더 추가
      );
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
      let errorMsg = '게시글 수정 중 오류가 발생했습니다.';
      if (error.response?.status === 401) {
          errorMsg = "세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.";
          toast({ title: "인증 실패", description: errorMsg, status: "error" });
          localStorage.removeItem('authToken');
          localStorage.removeItem('userInfo');
          navigate('/login');
      } else if (error.response?.status === 403) {
          errorMsg = "이 게시글을 수정할 권한이 없습니다.";
          toast({ title: "권한 없음", description: errorMsg, status: "error" });
      } else if (error.response?.status === 404) {
          errorMsg = "수정하려는 게시글을 찾을 수 없습니다.";
          toast({ title: "수정 실패", description: errorMsg, status: "error" });
          navigate('/board'); // 목록으로 이동
      } else {
          errorMsg = error.response?.data?.message || errorMsg;
          toast({
              title: "수정 실패",
              description: errorMsg,
              status: "error",
              duration: 3000,
              isClosable: true,
          });
      }
    } finally {
      setSaving(false);
    }
  };

  // --- 로딩 및 에러 처리 ---
  if (loading) {
    return (
      <Box>
        {/* 임시 상단 바 (로딩 중에도 표시) */}
        <Flex
            as="header"
            position="sticky"
            top="0"
            zIndex="sticky"
            bg="white"
            p={2}
            justifyContent="space-between"
            alignItems="center"
            borderBottomWidth="1px"
            borderColor="gray.200"
        >
            <IconButton icon={<ArrowBackIcon />} aria-label="뒤로가기" variant="ghost" isDisabled />
            <Text fontWeight="bold">글 수정</Text>
            <IconButton icon={<CheckIcon />} aria-label="수정 완료" variant="ghost" isDisabled />
        </Flex>
        <Flex justify="center" align="center" minHeight="calc(100vh - 60px)"> {/* 상단 바 높이 제외 */} 
          <Spinner size="xl" color="teal.500" />
        </Flex>
      </Box>
    );
  }
  // 초기 로딩 에러는 useEffect에서 toast와 navigate로 처리하므로 별도 Alert 불필요
  // if (initialLoadingError) { ... }
  // -------------------------

  return (
    <Box>
      {/* --- 상단 바 (뒤로가기, 완료 버튼) --- */}
      <Flex
        as="header"
        position="sticky"
        top="0"
        zIndex="sticky"
        bg="white"
        p={2}
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth="1px"
        borderColor="gray.200"
      >
        <IconButton
          icon={<ArrowBackIcon />} // 뒤로가기 아이콘
          aria-label="뒤로가기"
          variant="ghost"
          onClick={() => navigate(-1)} // 이전 페이지로 이동
          isDisabled={saving} // 저장 중 비활성화
        />
        <Text fontWeight="bold">글 수정</Text> {/* 페이지 제목 */}
        <Button
            leftIcon={<CheckIcon />} // 완료 아이콘
            colorScheme="teal" // 테마 색상 적용
            variant="ghost"
            size="sm"
            onClick={handleSubmit} // 완료 버튼 클릭 시 제출
            isLoading={saving}
            isDisabled={saving || !title.trim() || !content.trim()} // 저장 중이거나 내용 없으면 비활성화
        >
            완료
        </Button>
      </Flex>

      {/* --- 수정 폼 --- */}
      <Box as="form" onSubmit={handleSubmit} p={4}> {/* 폼 영역에 패딩 추가 */}
        <VStack spacing={4} align="stretch">
          <FormControl id="post-edit-title" isRequired isDisabled={saving}>
            {/* <FormLabel>제목</FormLabel> */}
            <Input
              placeholder="글 제목"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              focusBorderColor="teal.400" // 테마 색상 적용
              variant="flushed" // 밑줄 스타일
              size="lg" // 제목은 좀 더 크게
              fontWeight="bold"
            />
          </FormControl>

          <FormControl id="post-edit-content" isRequired isDisabled={saving}>
            {/* <FormLabel>내용</FormLabel> */}
            <Textarea
              placeholder="내용을 입력하세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              focusBorderColor="teal.400" // 테마 색상 적용
              variant="unstyled" // 테두리 없는 스타일
            />
          </FormControl>

          {/* 버튼 그룹은 상단 바로 이동 */}
          {/* <Flex justify="flex-end" gap={3}> ... </Flex> */}
        </VStack>
      </Box>
    </Box>
  );
}

export default PostEdit;
