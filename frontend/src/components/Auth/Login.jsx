import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
// Chakra UI 컴포넌트 임포트
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack, // 수직 스택
  Heading,
  Text,
  Link as ChakraLink, // Chakra의 Link
  Spinner,
  useToast // Toast 메시지
} from '@chakra-ui/react';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  // const [message, setMessage] = useState(''); // Toast 사용
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setMessage('');
    setLoading(true);

    if (!formData.username || !formData.password) {
        toast({ title: "입력 오류", description: "사용자 이름과 비밀번호를 모두 입력해주세요.", status: "warning", duration: 2000 });
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, formData);
      // setMessage(response.data.message); // Toast 사용

      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast({
          title: "로그인 성공",
          description: `환영합니다, ${user.username}님!`,
          status: "success",
          duration: 2000,
          isClosable: true,
       });

      setTimeout(() => { // Toast가 보일 시간을 주고 이동
          navigate('/');
          window.location.reload(); // 상태 업데이트 위해 유지
      }, 1000);


    } catch (error) {
      console.error('로그인 오류:', error);
      const errorMsg = error.response?.data?.message || '로그인 중 오류가 발생했습니다.';
       toast({
          title: "로그인 실패",
          description: errorMsg,
          status: "error",
          duration: 3000,
          isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Box로 감싸고 최대 너비, 마진, 패딩 등 설정
    <Box maxW="md" mx="auto" mt={10} p={8} borderWidth={1} borderRadius="lg" shadow="md">
      <Heading as="h2" size="lg" textAlign="center" mb={6}>로그인</Heading>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={5}> {/* VStack으로 폼 요소 배치 */}
          <FormControl id="login-username" isRequired isDisabled={loading}>
            <FormLabel>사용자 아이디</FormLabel>
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              focusBorderColor="teal.400"
            />
          </FormControl>

          <FormControl id="login-password" isRequired isDisabled={loading}>
            <FormLabel>비밀번호</FormLabel>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              focusBorderColor="teal.400"
            />
          </FormControl>

          <Button
            mt={4}
            type="submit"
            colorScheme="teal"
            width="full" // 버튼 너비 100%
            isLoading={loading}
            spinner={<Spinner size="sm" />}
          >
            로그인
          </Button>
        </VStack>
      </Box>
      {/* 회원가입 링크 */}
      <Text mt={4} textAlign="center">
        계정이 없으신가요?{' '}
        <ChakraLink as={RouterLink} to="/signup" color="teal.500" fontWeight="semibold">
          회원가입
        </ChakraLink>
      </Text>
       {/* 메시지는 Toast로 표시 */}
       {/* {message && <Alert status={message.includes('성공') ? 'success' : 'error'} ... />} */}
    </Box>
  );
}

export default Login;
