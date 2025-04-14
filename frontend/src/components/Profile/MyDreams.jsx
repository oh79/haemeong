import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Heading, Text, Spinner, Alert, AlertIcon, VStack,
  List, ListItem, ListIcon, Link as ChakraLink, Divider, Flex, Spacer,
  Image
} from '@chakra-ui/react';
import { MdBookmark, MdCalendarToday } from 'react-icons/md'; // 아이콘 추가
import { Link as RouterLink } from 'react-router-dom'; // 상세 보기용 링크 (추후 구현 시)

function MyDreams() {
  const [myDreams, setMyDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyDreams = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('로그인이 필요합니다.'); // 로그인 안되어 있으면 에러
        }

        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/dreams/my`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        setMyDreams(response.data);
      } catch (err) {
        console.error("내 해몽 기록 로딩 실패:", err);
        setError(err.response?.data?.message || err.message || '기록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyDreams();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 날짜 포맷 함수 (간단 버전)
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minHeight="200px">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Heading as="h2" size="xl" mb={6} textAlign="center">나의 꿈 해몽 기록</Heading>
      {!loading && !error && Array.isArray(myDreams) && myDreams.length === 0 ? (
        <Text textAlign="center">아직 저장된 꿈 해몽 기록이 없습니다.</Text>
      ) : !loading && !error && !Array.isArray(myDreams) ? (
        <Alert status="warning">
          <AlertIcon />
          꿈 해몽 기록 데이터를 불러오는 데 문제가 발생했습니다.
        </Alert>
      ) : !loading && !error ? (
        <List spacing={5}>
          {myDreams.map((dream) => {
            // interpretation 필드를 JSON으로 파싱
            let parsedInterpretation = {};
            try {
              if (dream.interpretation) {
                parsedInterpretation = JSON.parse(dream.interpretation);
              }
            } catch (parseError) {
              console.error("Interpretation JSON 파싱 오류:", parseError, dream.interpretation);
              // 파싱 오류 시 빈 객체로 유지
            }

            return (
              <ListItem key={dream.id} p={4} shadow="md" borderWidth="1px" borderRadius="lg">
                <Flex align="start">
                  <Image
                    src="/src/assets/cha_v2_nobg.png"
                    alt="해멍 캐릭터"
                    boxSize="120px"
                    objectFit="contain"
                    mr={4}
                    borderRadius="md"
                  />
                  <VStack align="stretch" spacing={2} flex="1">
                    <Heading as="h3" size="md">
                      <ListIcon as={MdBookmark} color="teal.500" />
                      <ChakraLink as={RouterLink} to={`/dreams/${dream.id}`} _hover={{ textDecoration: 'underline', color: 'teal.600' }}>
                        {dream.title || '제목 없음'}
                      </ChakraLink>
                    </Heading>
                    {/* dreamType 표시 */}
                    <Text fontSize="sm" color="blue.600" fontWeight="bold">
                      {parsedInterpretation.dreamType || '타입 정보 없음'}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      <ListIcon as={MdCalendarToday} color="gray.400" />
                      {formatDate(dream.created_at)}
                    </Text>
                    <Divider pt={2} />
                    {/* 원본 꿈 내용(dream_content) 표시 */}
                    <Text noOfLines={3} color="gray.700" mt={2} whiteSpace="pre-wrap">
                      {dream.dream_content || '(입력된 꿈 내용 없음)'}
                    </Text>
                  </VStack>
                </Flex>
              </ListItem>
            );
          })}
        </List>
      ) : null}
    </Box>
  );
}

export default MyDreams;
