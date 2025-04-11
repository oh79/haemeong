import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Text, Spinner, Alert, AlertIcon, VStack, Divider, Button, Flex, Spacer, useToast,
  Card, CardHeader, CardBody
} from '@chakra-ui/react';
import InterpretationDisplay from './InterpretationDisplay'; // InterpretationDisplay 컴포넌트 임포트

function DreamDetail() {
  const { id: dreamId } = useParams(); // URL 파라미터에서 꿈 ID 가져오기
  const navigate = useNavigate();
  const toast = useToast();

  const [dream, setDream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDreamDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('로그인이 필요합니다.');
        }

        // 백엔드 API 호출 (GET /api/dreams/:dreamId)
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/dreams/${dreamId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDream(response.data);

      } catch (err) {
        console.error("꿈 상세 정보 로딩 실패:", err);
        setError(err.response?.data?.message || err.message || '꿈 정보를 불러오는 중 오류가 발생했습니다.');
        if (err.response?.status === 404) {
             setError('해당 꿈 기록을 찾을 수 없습니다.');
         } else if (err.message === '로그인이 필요합니다.') {
             // 로그인 페이지로 리다이렉트 또는 메시지 표시
             toast({ title: "로그인 필요", status: "error"});
             navigate('/login'); // 예시: 로그인 페이지로 이동
         }
      } finally {
        setLoading(false);
      }
    };

    fetchDreamDetail();
  }, [dreamId, navigate, toast]); // dreamId가 변경될 때마다 다시 불러옴

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
      if (!dateString) return '';
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  // --- 로딩 상태 렌더링 ---
  if (loading) {
    return <Flex justify="center" align="center" minHeight="300px"><Spinner size="xl" /></Flex>;
  }

  // --- 에러 상태 렌더링 ---
  if (error) {
    return (
      <Alert status="error" m={5}>
        <AlertIcon />
        {error}
        <Button ml="auto" onClick={() => navigate('/my-dreams')} size="sm">목록으로</Button>
      </Alert>
    );
  }

  // --- dream 데이터가 없을 경우 렌더링 ---
  if (!dream) {
    // 이 시점 이후에는 dream 객체가 null이 아님이 보장됨
    return <Text p={5}>꿈 정보를 찾을 수 없습니다.</Text>;
  }

  // --- 최종 UI 렌더링 ---
  return (
    <Box p={5} maxW="container.lg" mx="auto">
      <VStack spacing={8} align="stretch">
        {/* 제목 및 날짜 */}
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2} color="teal.700">{dream.title || '제목 없음'}</Heading>
          <Text fontSize="sm" color="gray.500">작성일: {formatDate(dream.created_at)}</Text>
          {/* 작성자 표시 (필요 시) */}
          {/* <Text fontSize="sm" color="gray.500">작성자: {dream.username || '알 수 없음'}</Text> */}
        </Box>

        {/* --- 원본 꿈 내용 (Card 제거) --- */}
        <Box>
            <Heading size='md' color="gray.700" mb={3}>나의 꿈 이야기</Heading>
            <Text whiteSpace="pre-wrap" lineHeight="tall" p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                {dream.dream_content}
            </Text>
        </Box>

        {/* --- AI 해몽 결과 (단순화된 렌더링) --- */}
        <Box>
            <Heading size='md' color="black.700" mb={3}>AI 꿈 해몽</Heading>
            {/* dream.interpretation 전체를 InterpretationDisplay 컴포넌트로 렌더링 */}
            <InterpretationDisplay interpretationData={dream.interpretation} />
        </Box>

        {/* 목록으로 돌아가기 버튼 */}
        <Flex>
          <Spacer />
          <Button onClick={() => navigate('/my-dreams')} variant="solid" colorScheme='gray'>
            목록으로 돌아가기
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
}

export default DreamDetail;

