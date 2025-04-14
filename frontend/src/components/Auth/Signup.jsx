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
  VStack,
  Heading,
  Text,
  Link as ChakraLink,
  Spinner,
  useToast
} from '@chakra-ui/react';

function Signup() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  // const [message, setMessage] = useState(''); // Toast 사용
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //setMessage('');
    setLoading(true);

    // 간단한 클라이언트 측 검증 (백엔드 검증도 중요)
    if (!formData.username || !formData.email || !formData.password) {
        toast({ title: "입력 오류", description: "모든 필드를 입력해주세요.", status: "warning", duration: 2000 });
        setLoading(false);
        return;
    }
     if (formData.password.length < 6) {
        toast({ title: "입력 오류", description: "비밀번호는 6자 이상이어야 합니다.", status: "warning", duration: 2000 });
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/signup`, formData);
      //setMessage(response.data.message);

      toast({
          title: "회원가입 성공",
          description: response.data.message + " 로그인 페이지로 이동합니다.",
          status: "success",
          duration: 2000,
          isClosable: true,
      });

      setTimeout(() => {
          navigate('/login'); // 회원가입 성공 후 로그인 페이지로 이동
      }, 1500);

    } catch (error) {
      console.error('회원가입 오류:', error);
      const errorMsg = error.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
       toast({
          title: "회원가입 실패",
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
    <Box maxW="md" mx="auto" mt={10} p={8} borderWidth={1} borderRadius="lg" shadow="md">
      <Heading as="h2" size="lg" textAlign="center" mb={6}>회원가입</Heading>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={5}>
          <FormControl id="signup-username" isRequired isDisabled={loading}>
            <FormLabel>사용자 아이디</FormLabel>
            <Input type="text" name="username" value={formData.username} onChange={handleChange} focusBorderColor="teal.400"/>
          </FormControl>

          <FormControl id="signup-email" isRequired isDisabled={loading}>
            <FormLabel>이메일</FormLabel>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} focusBorderColor="teal.400"/>
          </FormControl>

          <FormControl id="signup-password" isRequired isDisabled={loading}>
            <FormLabel>비밀번호</FormLabel>
            <Input type="password" name="password" value={formData.password} onChange={handleChange} focusBorderColor="teal.400"/>
            {/* 비밀번호 확인 필드 추가 가능 */}
          </FormControl>

          <Button
            mt={4}
            type="submit"
            colorScheme="teal"
            width="full"
            isLoading={loading}
            spinner={<Spinner size="sm" />}
          >
            가입하기
          </Button>
        </VStack>
      </Box>
      <Text mt={4} textAlign="center">
        이미 계정이 있으신가요?{' '}
        <ChakraLink as={RouterLink} to="/login" color="teal.500" fontWeight="semibold">
          로그인
        </ChakraLink>
      </Text>
      {/* {message && <Alert status={message.includes('성공') ? 'success' : 'error'} ... />} */}
    </Box>
  );
}

export default Signup;
