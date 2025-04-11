import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Text, Spinner, Alert, AlertIcon, VStack, Divider, Button, Flex, Spacer, useToast,
  Card, CardHeader, CardBody
} from '@chakra-ui/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function DreamDetail() {
  const { id: dreamId } = useParams(); // URL 파라미터에서 꿈 ID 가져오기
  const navigate = useNavigate();
  const toast = useToast();

  const [dream, setDream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- 파싱 로직 수정: 문장별 해석도 배열로 반환 ---
  const parseInterpretationDetail = (markdownText) => {
      if (!markdownText) {
          // 빈 배열과 빈 문자열 반환
          return { sentenceInterpretations: [], summaryPart: '' };
      }
      let sentencesPart = '';
      let summaryPart = '';
      const sentenceInterpretations = []; // 문장별 해석 객체 배열

      const parts = markdownText.split('---');

      if (parts.length >= 2) {
           summaryPart = parts[parts.length - 1].replace(/###\s*종합\s*해몽[:]*\s*/i, '').trim();
           sentencesPart = parts.slice(0, parts.length - 1).join('---').replace(/###\s*문장별\s*해몽[:]*\s*/i, '').trim();
      } else {
           const summaryMatch = markdownText.match(/###\s*종합\s*해몽[:]*\s*([\s\S]*)/i);
           if (summaryMatch && summaryMatch[1]) {
               summaryPart = summaryMatch[1].trim();
               sentencesPart = markdownText.substring(0, summaryMatch.index).replace(/###\s*문장별\s*해몽[:]*\s*/i, '').trim();
           } else {
               sentencesPart = markdownText.replace(/###\s*문장별\s*해몽[:]*\s*/i, '').trim();
               summaryPart = '';
               console.warn("Detailed view: Could not find summary separator.");
           }
      }

      // --- sentencesPart를 파싱하여 sentenceInterpretations 배열 생성 ---
      const sentenceRegex = /\*\*문장\s*\d+:\*\*\s*([\s\S]*?)\s*\*\*해석:\*\*\s*([\s\S]*?)(?=\*\*문장\s*\d+:\*\*|\n*$)/g;
      let match;
      while ((match = sentenceRegex.exec(sentencesPart)) !== null) {
           sentenceInterpretations.push({
              original: match[1]?.trim().replace(/\n+/g, ' ') || '?', // 원본 문장
              interpretation: match[2]?.trim() || '(해석 없음)' // 해석 내용
          });
      }
      // 만약 정규식 매칭 실패 시, sentencesPart 전체를 하나의 해석으로 넣는 예외 처리 (선택적)
      if (sentenceInterpretations.length === 0 && sentencesPart.trim() !== '') {
          sentenceInterpretations.push({ original: '(원본 문장 불명)', interpretation: sentencesPart.trim() });
          console.warn("Detailed view: Failed to parse sentence interpretations using regex.");
      }
      // ----------------------------------------------------------

      // 이제 sentencesPart 대신 sentenceInterpretations 배열을 반환
      return { sentenceInterpretations, summaryPart };
  };
  // --------------------------------------------------

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

  // 해몽 내용을 안전하게 HTML로 변환하는 함수
  const createMarkup = (markdownText) => {
      if (!markdownText) return { __html: '' };
      try {
          return { __html: DOMPurify.sanitize(marked(markdownText)) };
      } catch (e) {
          console.error("Markdown 처리 오류:", e);
          return {__html: '<p>내용을 표시하는 중 오류 발생</p>'};
      }
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

  // --- 파싱된 결과 변수 선언 (위치를 여기로 이동!) ---
  // dream 객체가 null이 아닐 때만 이 코드가 실행됨
  const { sentenceInterpretations, summaryPart } = parseInterpretationDetail(dream.interpretation);
  // ----------------------------------------------

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

        {/* 원본 꿈 내용 Card */}
        <Card variant="outline">
          <CardHeader pb={2}>
            <Heading size='md' color="gray.700">나의 꿈 이야기</Heading>
          </CardHeader>
          <CardBody pt={2}>
            <Text whiteSpace="pre-wrap" lineHeight="tall">{dream.dream_content}</Text>
          </CardBody>
        </Card>

        {/* AI 해몽 결과 Card */}
        <Card variant="outline">
          <CardHeader pb={2}>
            <Heading size='md' color="gray.700">AI 꿈 해몽</Heading>
          </CardHeader>
          <CardBody pt={2}>
            <VStack spacing={6} align="stretch">
              {/* 문장별 해몽 섹션 */}
              {sentenceInterpretations.length > 0 && (
                <Box borderWidth="1px" borderRadius="md" p={4}>
                  <Heading size="sm" mb={4} color="gray.600">문장별 해몽</Heading>
                  <VStack spacing={5} align="stretch">
                    {sentenceInterpretations.map((item, index) => (
                      <Box key={index} borderWidth="1px" borderRadius="md" p={3} bg={index % 2 === 0 ? 'white' : 'gray.50'}>
                        <Heading size="xs" mb={2} color="gray.500">
                          문장 {index + 1}
                        </Heading>
                        <Text fontStyle="italic" mb={2}>"{item.original}"</Text>
                        <Divider mb={2} />
                        <Heading size="xs" mb={2} color="teal.600">
                          해석
                        </Heading>
                        <Box className="markdown-output" dangerouslySetInnerHTML={createMarkup(item.interpretation)} lineHeight="tall"/>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* 종합 해몽 섹션 */}
              {summaryPart && (
                <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50">
                  <Heading size="sm" mb={3} color="gray.600">종합 해몽</Heading>
                  <Box className="markdown-output" dangerouslySetInnerHTML={createMarkup(summaryPart)} lineHeight="tall"/>
                </Box>
              )}

              {/* 둘 다 내용이 없는 경우 */}
              {sentenceInterpretations.length === 0 && !summaryPart && (
                  <Text color="gray.500">(해몽 내용을 불러올 수 없거나 내용이 없습니다.)</Text>
              )}
            </VStack>
          </CardBody>
        </Card>

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

