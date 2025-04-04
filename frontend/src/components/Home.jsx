import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import DreamInterpreter from './DreamInterpreter';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (token && userInfo) {
      setIsLoggedIn(true);
      setCurrentUser(userInfo);
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, []);

  return (
    <VStack spacing={6} align="stretch">
      <Heading as="h1" size="xl" textAlign="center">
        AI 꿈 해몽 서비스
      </Heading>

      {isLoggedIn ? (
        <Box>
          <Text fontSize="lg" mb={4}>
            안녕하세요, **{currentUser?.username}**님! 어떤 꿈을 꾸셨나요?
          </Text>
          <DreamInterpreter />
        </Box>
      ) : (
        <Text fontSize="lg" textAlign="center">
          로그인하여 AI 꿈 해몽 서비스를 이용해보세요. 🔮
        </Text>
      )}
    </VStack>
  );
}

export default Home;
