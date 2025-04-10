import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Flex, Link as ChakraLink, Button, Spacer, Heading } from '@chakra-ui/react';

function Navigation() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (token && userInfo) {
      setIsLoggedIn(true);
      setCurrentUser(userInfo);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    delete axios.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate('/');
    window.location.reload();
  };

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding="1.5rem"
      bg="teal.500"
      color="white"
    >
      <Flex align="center" mr={5}>
        <Heading as="h1" size="lg" letterSpacing={'-.1rem'}>
          <ChakraLink as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            꿈 해몽 서비스
          </ChakraLink>
        </Heading>
      </Flex>

      <Box display={{ base: 'none', md: 'flex' }} alignItems="center">
        <ChakraLink as={RouterLink} to="/board" px={2} py={1} rounded={'md'} _hover={{ textDecoration: 'none', bg: 'teal.700' }}>
          게시판
        </ChakraLink>
        {isLoggedIn ? (
          <>
            <ChakraLink as={RouterLink} to="/my-scraps" px={2} py={1} rounded={'md'} _hover={{ textDecoration: 'none', bg: 'teal.700' }}>
              내 스크랩
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/profile" px={2} py={1} rounded={'md'} _hover={{ textDecoration: 'none', bg: 'teal.700' }}>
              내 정보 ({currentUser?.username})
            </ChakraLink>
            <Button onClick={handleLogout} variant="outline" _hover={{ bg: 'teal.700', borderColor: 'teal.700' }} ml={4}>
              로그아웃
            </Button>
          </>
        ) : (
          <>
            <ChakraLink as={RouterLink} to="/signup" px={2} py={1} rounded={'md'} _hover={{ textDecoration: 'none', bg: 'teal.700' }}>
              회원가입
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/login" px={2} py={1} rounded={'md'} _hover={{ textDecoration: 'none', bg: 'teal.700' }}>
              로그인
            </ChakraLink>
          </>
        )}
      </Box>
    </Flex>
  );
}

export default Navigation;
