import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Chakra UI 컴포넌트 임포트
import {
  Box,
  Button,
  FormControl,
  Input,
  Textarea,
  VStack,
  Spinner,
  useToast,
  Flex,
  IconButton,
  Text,
  HStack,
  Image,
  SimpleGrid
} from '@chakra-ui/react';
// 아이콘 추가
import { ArrowBackIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

function PostWrite() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast(); // Toast 훅 사용
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 추가
  const fileInputRef = useRef(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 로그인 상태 확인
    const token = localStorage.getItem('authToken');
    if (!token) {
        toast({
            title: "로그인 필요",
            description: "글을 작성하려면 로그인이 필요합니다.",
            status: "warning",
            duration: 3000,
            isClosable: true,
        });
        setIsLoggedIn(false);
        // 로그인 페이지로 리디렉션 (필수)
        navigate('/login');
    } else {
        setIsLoggedIn(true);
    }
  }, [toast, navigate]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast({ title: "이미지 개수 초과", description: "최대 5개의 이미지만 업로드할 수 있습니다.", status: "warning" });
      return;
    }

    const newFiles = [...images, ...files];
    setImages(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    const previewToRemove = imagePreviews[indexToRemove];
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    URL.revokeObjectURL(previewToRemove);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!title.trim() || !content.trim()) {
        toast({ title: "입력 오류", description: "제목과 내용을 모두 입력해주세요.", status: "warning", duration: 2000 });
        setLoading(false);
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        toast({ title: "인증 오류", description: "로그인이 필요합니다. 다시 로그인해주세요.", status: "error" });
        setLoading(false);
        navigate('/login');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/posts`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      toast({ title: "게시글 작성 완료", status: "success", duration: 1500 });

      imagePreviews.forEach(url => URL.revokeObjectURL(url));

      if (response.data && typeof response.data.id === 'number') {
          navigate(`/board/${response.data.id}`);
      } else {
          console.warn('새 게시글 ID를 응답에서 찾을 수 없습니다. 응답 데이터:', response.data);
          toast({ title: "등록은 되었으나 ID 확인 불가", description: "게시글 목록으로 이동합니다.", status: "warning" });
          navigate('/board');
      }

    } catch (error) {
      console.error('게시글 작성 오류:', error);
       if (error.response?.status === 401) {
           toast({ title: "인증 실패", description: "세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.", status: "error", duration: 3000 });
           localStorage.removeItem('authToken');
           localStorage.removeItem('userInfo');
           setIsLoggedIn(false);
           navigate('/login');
       } else if (error.response?.status === 403) {
           toast({ title: "권한 없음", description: "글을 작성할 권한이 없습니다.", status: "error", duration: 3000 });
       } else if (error.response?.data?.message?.includes('파일 크기')) {
           toast({ title: "업로드 실패", description: "파일 크기가 너무 큽니다 (최대 5MB).", status: "error"});
       } else if (error.message?.includes('Network Error')) {
           toast({ title: "네트워크 오류", description: "서버에 연결할 수 없습니다.", status: "error" });
       } else {
           const errorMsg = error.response?.data?.message || '게시글 작성 중 오류가 발생했습니다.';
           toast({
               title: "작성 실패",
               description: errorMsg,
               status: "error",
               duration: 3000,
               isClosable: true,
           });
       }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn && !localStorage.getItem('authToken')) {
      return (
          <Flex justify="center" align="center" minHeight="100vh">
              <Spinner size="xl" color="teal.500" />
          </Flex>
      );
  }

  return (
    <Box>
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
           icon={<ArrowBackIcon />}
           aria-label="뒤로가기"
           variant="ghost"
           onClick={() => navigate(-1)}
           isDisabled={loading}
         />
         <Text fontWeight="bold">글쓰기</Text>
         <Button
             leftIcon={<CheckIcon />}
             colorScheme="teal"
             variant="ghost"
             size="sm"
             onClick={handleSubmit}
             isLoading={loading}
             isDisabled={loading || !title.trim() || !content.trim() || !isLoggedIn}
         >
             완료
         </Button>
       </Flex>

       <Box as="form" onSubmit={handleSubmit} p={4}>
        <VStack spacing={4} align="stretch">
          <FormControl id="post-title" isRequired isDisabled={loading || !isLoggedIn}>
            <Input
              placeholder="글 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              focusBorderColor="teal.400"
              variant="flushed"
              size="lg"
              fontWeight="bold"
            />
          </FormControl>

          <FormControl id="post-content" isRequired isDisabled={loading || !isLoggedIn}>
            <Textarea
              placeholder="내용을 입력하세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              focusBorderColor="teal.400"
              variant="unstyled"
              mt={4}
            />
          </FormControl>

          <FormControl isDisabled={loading || !isLoggedIn}>
            <Button
                as="label"
                htmlFor="post-images-input"
                variant="outline"
                cursor="pointer"
                size="sm"
                mb={2}
                isDisabled={images.length >= 5}
            >
                이미지 추가 ({images.length}/5)
            </Button>
            <Input
                id="post-images-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                display="none"
            />
            {imagePreviews.length > 0 && (
              <SimpleGrid columns={{ base: 3, sm: 4, md: 5 }} spacing={2} mt={2}>
                {imagePreviews.map((previewUrl, index) => (
                  <Box key={index} position="relative" >
                    <Image src={previewUrl} alt={`미리보기 ${index + 1}`} boxSize="100px" objectFit="cover" borderRadius="md" />
                    <IconButton
                      icon={<CloseIcon />}
                      size="xs"
                      colorScheme="red"
                      variant="solid"
                      isRound
                      position="absolute"
                      top="-5px"
                      right="-5px"
                      aria-label="이미지 제거"
                      onClick={() => handleRemoveImage(index)}
                      isDisabled={loading}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </FormControl>
        </VStack>
      </Box>
    </Box>
  );
}

export default PostWrite;
