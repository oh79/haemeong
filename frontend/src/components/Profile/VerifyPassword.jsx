import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  VStack,
  Heading,
  Spinner,
  useToast,
  Flex,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Text as ChakraText } from '@chakra-ui/react';

function VerifyPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // 에러 메시지 상태

  const handleChange = (e) => {
    setPassword(e.target.value);
    setError(''); // 입력 시 에러 메시지 초기화
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 백엔드에 비밀번호 확인 요청 (엔드포인트는 실제 구현에 맞게 조정 필요)
      await axios.post('http://localhost:5000/api/users/me/verify-password', { password });

      // 성공 시 EditProfile 페이지로 이동 (리다이렉션과 함께 상태 전달은 필요 없을 수 있음)
      // 성공했다는 상태를 EditProfile에서 알 필요가 있다면 location.state 등을 사용할 수 있음
      toast({ title: "비밀번호 확인 성공", status: "success", duration: 1500, isClosable: true });
      navigate('/edit-profile'); // 정보 수정 페이지로 이동

    } catch (err) {
      const errorMsg = err.response?.data?.message || '비밀번호 확인 중 오류가 발생했습니다.';
      setError(errorMsg); // 에러 메시지 표시
      // 실패 시 사용자에게 알림 (Toast 사용 가능)
      toast({ title: "비밀번호 확인 실패", description: errorMsg, status: "error", duration: 3000, isClosable: true });
      // 실패 시 프로필 페이지로 돌려보낼 수도 있음 (선택 사항)
      // navigate('/profile');
      setIsLoading(false); // 로딩 상태 해제
    }
    // setIsLoading(false); // 성공 시 페이지 이동하므로 여기서 해제할 필요 없음
  };

  return (
    <Flex justify="center" align="center" minHeight="calc(100vh - 150px)"> {/* 헤더 높이 등을 고려하여 조정 */}
      <Box
        p={8}
        maxWidth="400px"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
      >
        <VStack spacing={6}>
          <Heading as="h2" size="lg" textAlign="center">비밀번호 확인</Heading>
          <ChakraText textAlign="center" color="gray.600">
            개인 정보를 변경하려면 현재 비밀번호를 입력해주세요.
          </ChakraText>
          <Box as="form" onSubmit={handleSubmit} width="100%">
            <VStack spacing={4}>
              <FormControl id="verify-password-input" isRequired isInvalid={!!error}>
                <FormLabel>현재 비밀번호</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={handleChange}
                  focusBorderColor="teal.400"
                  isDisabled={isLoading}
                />
                {error && <FormHelperText color="red.500">{error}</FormHelperText>}
              </FormControl>
              <Button
                type="submit"
                colorScheme="teal"
                width="full"
                isLoading={isLoading}
                spinner={<Spinner size="sm" />}
              >
                확인
              </Button>
            </VStack>
          </Box>
          <Button variant="link" colorScheme="gray" onClick={() => navigate('/profile')}>
            취소하고 프로필로 돌아가기
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}

export default VerifyPassword;
