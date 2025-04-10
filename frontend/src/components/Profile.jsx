import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Chakra UI 컴포넌트 임포트
import {
  Box,
  Button,
  VStack,
  Heading,
  Spinner,
  Flex,
  useToast,
  Text,
  Icon,
  Spacer,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';

function Profile() {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const parsedInfo = JSON.parse(storedUserInfo);
      setCurrentUser(parsedInfo);
      console.log(parsedInfo);
    } else {
      toast({ title: "로그인 필요", status: "warning", duration: 2000, isClosable: true });
      navigate('/login');
    }
    setInitialLoading(false);
  }, [navigate, toast]);

  if (initialLoading || !currentUser) {
    return (
        <Flex justify="center" align="center" minHeight="400px">
            <Spinner size="xl" color="teal.500" />
        </Flex>
    );
  }

  return (
    <Box p={5}>
      <Heading as="h2" size="lg" mb={8} textAlign="center">내 정보</Heading>

      {/* --- 내 프로필 정보 표시 --- */}
      <Box borderWidth="1px" borderRadius="lg" p={5} mb={8} boxShadow="sm">
        <Heading as="h3" size="md" mb={4}>내 프로필</Heading>
        <VStack spacing={3} align="stretch">
           <Flex>
             <Text fontWeight="bold" mr={2} minWidth="80px">사용자 이름:</Text>
             <Text>{currentUser.username}</Text>
           </Flex>
           <Flex>
             <Text fontWeight="bold" mr={2} minWidth="80px">이메일:</Text>
             <Text>{currentUser.email || '이메일 정보 없음'}</Text>
           </Flex>
        </VStack>
      </Box>
      {/* ------------------------- */}

      {/* --- 설정 섹션 목록 --- */}
      <VStack spacing={0} align="stretch" mt={8}>
        {/* 개인 정보 변경 섹션 */}
        <Flex
          as={Link}
          to="/verify-password"
          align="center"
          p={4}
          borderWidth="1px"
          borderRadius="md"
          boxShadow="sm"
          _hover={{ boxShadow: 'md', bg: 'gray.50' }}
          cursor="pointer"
        >
          <Text fontWeight="medium">개인 정보 변경</Text>
          <Spacer />
          <Icon as={ChevronRightIcon} w={6} h={6} color="gray.400" />
        </Flex>
        {/*꿈 해몽 정보 보러가기(임시)*/}
        <Flex
          as={Link}
          to="/dream-info"
          align="center"
          p={4}
          borderWidth="1px"
          borderRadius="md"
          boxShadow="sm"
          _hover={{ boxShadow: 'md', bg: 'gray.50' }}
          cursor="pointer"
        >
          <Text fontWeight="medium">꿈 해몽 정보 보러가기(기능 미구현)</Text>
          <Spacer />
          <Icon as={ChevronRightIcon} w={6} h={6} color="gray.400" />
        </Flex>
      </VStack>
      
      {/* ----------------------- */}

    </Box>
  );
}

export default Profile;
