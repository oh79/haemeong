import React from 'react';
import { Box, Flex, Link as ChakraLink, Button, Spacer, Heading } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('authToken'); // 로그인 상태 확인

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login'); // 로그아웃 후 로그인 페이지로 이동
    // 필요시 상태 업데이트 로직 추가 (예: Context API 사용 시)
  };

  return (
    <Box bg="teal.500" p={4} color="white" position="fixed" top="0" width="100%" zIndex="1000">
      <Flex maxW="container.xl" mx="auto" align="center">
        <Heading size="md" mr={8}>
          <ChakraLink as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            꿈 해몽 서비스
          </ChakraLink>
        </Heading>
        <Spacer />
        <Flex align="center">
          <ChakraLink as={RouterLink} to="/interpret" mr={4}>꿈 해몽하기</ChakraLink>
          <ChakraLink as={RouterLink} to="/board" mr={4}>해몽 게시판</ChakraLink>

          {isLoggedIn ? (
            <>
              {/* --- 새로운 링크 추가 --- */}
              <ChakraLink as={RouterLink} to="/my-dreams" mr={4}>내 해몽 기록</ChakraLink>
              {/* ----------------------- */}
              <ChakraLink as={RouterLink} to="/my-scraps" mr={4}>내 스크랩</ChakraLink>
              <ChakraLink as={RouterLink} to="/profile" mr={4}>내 프로필</ChakraLink>
              <Button onClick={handleLogout} colorScheme="teal" variant="outline" size="sm" _hover={{ bg: 'teal.600' }}>로그아웃</Button>
            </>
          ) : (
            <>
              <ChakraLink as={RouterLink} to="/login" mr={4}>로그인</ChakraLink>
              <ChakraLink as={RouterLink} to="/signup">회원가입</ChakraLink>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

export default Navbar;
