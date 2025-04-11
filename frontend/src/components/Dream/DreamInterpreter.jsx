import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { marked } from 'marked'; // marked 임포트
import DOMPurify from 'dompurify'; // DOMPurify 임포트
import { CopyIcon } from '@chakra-ui/icons'; // CopyIcon 임포트 추가
import InterpretationDisplay from './InterpretationDisplay'; // InterpretationDisplay 컴포넌트 임포트
// Chakra UI 컴포넌트 임포트
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input, // 제목 입력용
  Textarea,
  VStack,
  Heading,
  Text,
  Alert, // 오류 표시에 사용
  AlertIcon,
  AlertDescription,
  Spinner, // 로딩 표시에 사용
  CircularProgress, // 다른 로딩 표시 옵션
  useToast,
  Flex,    // Flex 추가
  HStack, // HStack 유지
  Divider, // Divider 추가
  Card, CardHeader, CardBody // Card 관련 컴포넌트 추가
} from '@chakra-ui/react';

function DreamInterpreter() {
  const toast = useToast();

  // --- 단계 관리 상태 --- (결과 표시 단계를 하나로 통합)
  const [step, setStep] = useState(1); // 1: 제목, 2: 내용, 3: 로딩, 4: 결과 표시
  // ---------------------

  // --- 입력 데이터 상태 ---
  const [title, setTitle] = useState('');
  const [dreamContent, setDreamContent] = useState('');
  // -----------------------

  // --- 결과 및 로딩 상태 --- (결과 상태 통합)
  const [interpretationResult, setInterpretationResult] = useState(''); // 통합된 해몽 결과
  const [loading, setLoading] = useState(false);
  const [resultDreamContent, setResultDreamContent] = useState(''); // 결과에 해당하는 꿈 내용
  const [resultTitle, setResultTitle] = useState(''); // 결과에 해당하는 제목
  // const [copyMessage, setCopyMessage] = useState(''); // copyMessage 상태 제거 (Toast 사용)
  // -----------------------

  // --- 문장별 상태 제거 ---
  // const [sentenceInterpretations, setSentenceInterpretations] = useState([]);
  // const [overallSummary, setOverallSummary] = useState('');
  // const [sentencePage, setSentencePage] = useState(0);
  // -----------------------

  // 로그인 상태 확인 (필요 시)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
      setIsLoggedIn(!!localStorage.getItem('authToken'));
  }, []);

  // --- 단계 이동 함수 --- (동일)
  const handleNextStep = () => {
    if (step === 1 && title.trim() === '') {
        toast({ title: "제목 필요", description: "꿈 제목을 입력해주세요.", status: "warning", duration: 2000 });
        return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
      setStep(step - 1);
  }
  // ---------------------

  // --- 꿈 내용 글자 수 제한 --- (동일)
  const MAX_CONTENT_LENGTH = 300;
  const handleContentChange = (e) => {
      const newContent = e.target.value;
      if (newContent.length <= MAX_CONTENT_LENGTH) {
          setDreamContent(newContent);
      } else {
           toast({
              description: `꿈 내용은 ${MAX_CONTENT_LENGTH}자까지만 입력 가능합니다.`,
              status: 'info',
              duration: 1500,
            });
      }
  };
  const remainingChars = MAX_CONTENT_LENGTH - dreamContent.length;
  // --------------------------

  // --- 해몽 요청 제출 핸들러 (파싱 로직 연동 수정) ---
  const handleSubmitDream = async () => {
    if (dreamContent.trim() === '') {
        toast({ title: "내용 필요", description: "꿈 내용을 입력해주세요.", status: "warning", duration: 2000 });
        return;
    }
    if (!isLoggedIn) {
         toast({ title: "로그인 필요", status: "warning", duration: 2000 });
         return;
    }

    setLoading(true);
    setStep(3);
    setInterpretationResult(''); // 결과 상태 초기화
    setResultDreamContent('');
    setResultTitle('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/dreams`, {
        title: title.trim(),
        dream_content: dreamContent
      });

      const rawInterpretation = response.data.dream.interpretation;

      // --- 백엔드에서 이미 파싱된 JSON 객체를 받으므로 바로 상태에 저장 --- //
      if (typeof rawInterpretation !== 'object' || rawInterpretation === null) {
          console.error("Received invalid interpretation data from backend:", rawInterpretation);
          throw new Error("백엔드로부터 잘못된 형식의 해몽 데이터를 받았습니다.");
      }
      setInterpretationResult(rawInterpretation);
      // -------------------------------------------

      setResultDreamContent(dreamContent);
      setResultTitle(title.trim());
      setStep(4); // 결과 표시 단계로 이동

    } catch (error) {
       console.error('꿈 해몽 오류:', error);
       const errorMsg = error.response?.data?.message || '꿈 해몽 중 오류가 발생했습니다.';
       toast({ title: "해몽 실패", description: errorMsg, status: "error", duration: 3000 });
       setStep(2); // 오류 발생 시 내용 입력 단계로 복귀
    } finally {
      setLoading(false);
    }
  };
  // ---------------------------------------------

  // --- 클립보드 복사 핸들러 (Toast 사용) ---
  const handleCopyToClipboard = async () => {
       // interpretationResult를 직접 사용 (이제 객체임)
       // 클립보드 복사용 텍스트 생성 (interpretationResult 객체 내용을 활용)
       const resultText = interpretationResult
         ? `꿈 종류: ${interpretationResult.dreamType || '-'}\n\n상징 분석:\n${(interpretationResult.symbolAnalysis || []).map(s => `- ${s}`).join('\n') || '-'}\n\n문화적 해석:\n${interpretationResult.culturalInterpretation || '-'}\n\n심리적 분석:\n${interpretationResult.psychologicalInterpretation || '-'}\n\n조언:\n${interpretationResult.advice || '-'}`
         : "(해몽 결과 없음)";

       const textToCopy = `[꿈 제목]\n${resultTitle}\n\n[나의 꿈 이야기]\n${resultDreamContent}\n\n[꿈 해몽 결과]\n${resultText}\n\n--- 꿈 해몽 서비스 ---`;

       try {
          await navigator.clipboard.writeText(textToCopy.trim());
          // Toast로 성공 피드백
          toast({
            title: "복사 완료",
            description: "꿈 해몽 결과가 클립보드에 복사되었습니다.",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            // Toast로 실패 피드백
            toast({
              title: "복사 실패",
              description: "결과를 클립보드에 복사하는 중 오류가 발생했습니다.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
        }
  };
  // ---------------------------------------

  // --- 단계별 UI 렌더링 (UI 개선 및 단계 통합) ---
  const renderStepContent = () => {
    switch (step) {
      case 1: // 제목 입력
        return (
          <VStack spacing={6} align="stretch">
            <FormControl id="dream-title" isRequired>
              <FormLabel>꿈 제목</FormLabel>
              <Input
                placeholder="예) 용이 하늘로 승천하는 꿈"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                focusBorderColor="teal.400"
                maxLength={100}
              />
            </FormControl>
            <Button colorScheme="teal" onClick={handleNextStep} alignSelf="flex-end">
              다음 (내용 입력)
            </Button>
          </VStack>
        );

      case 2: // 내용 입력
        return (
          <VStack spacing={6} align="stretch">
             <FormControl id="dream-content" isRequired>
               <FormLabel>꿈 내용</FormLabel>
               <Textarea
                 value={dreamContent}
                 onChange={handleContentChange}
                 placeholder="기억나는 대로 최대한 상세하게 적어주세요..."
                 rows={12}
                 focusBorderColor="teal.400"
               />
               <Text fontSize="sm" color={remainingChars < 0 ? 'red.500' : 'gray.500'} textAlign="right">
                 {MAX_CONTENT_LENGTH - remainingChars} / {MAX_CONTENT_LENGTH}자
               </Text>
             </FormControl>
             <Flex justify="space-between"> {/* 이전/다음 버튼 배치 */}
                <Button variant="outline" onClick={handlePrevStep}>이전 (제목 수정)</Button>
                <Button colorScheme="teal" onClick={handleSubmitDream} isDisabled={!dreamContent.trim()}>
                  해몽 요청하기
                </Button>
             </Flex>
          </VStack>
        );

      case 3: // 로딩 중
        return (
          <VStack spacing={6} justify="center" minHeight="300px">
            <Heading as="h3" size="md" textAlign="center">AI가 꿈을 해몽하고 있어요...</Heading>
            <CircularProgress isIndeterminate color="teal.300" size="80px" thickness="4px" />
            <Text color="gray.500">잠시만 기다려주세요. 평균 5초 ~ 15초 소요됩니다.</Text>
          </VStack>
        );

      case 4: // 결과 표시 (통합된 UI)
            if (loading) { // 혹시 모를 로딩 상태 처리
                return <CircularProgress isIndeterminate color="teal.300" />; // 간단한 로딩 표시
            }
            if (!interpretationResult) {
                 console.error("Error: Interpretation result is not available.");
                 return (
                     <VStack spacing={4}>
                         <Alert status="error">
                            <AlertIcon />
                            <AlertDescription>해몽 결과를 불러오지 못했습니다.</AlertDescription>
                         </Alert>
                         <Button onClick={() => { setTitle(''); setDreamContent(''); setStep(1); }} variant="outline">
                             새로운 꿈 해몽하기
                         </Button>
                     </VStack>
                 );
            }

            return (
                <VStack spacing={6} align="stretch">
                    {/* 원본 꿈 내용 섹션 */}
                    <Box>
                        <Heading as="h4" size="sm" mb={2} color="black.700">나의 꿈 이야기</Heading>
                        <Text p={4} bg="gray.50" borderRadius="mㅋd" whiteSpace="pre-wrap" border="1px" borderColor="gray.200">
                            {resultDreamContent || '(꿈 내용 없음)'}
                        </Text>
                    </Box>

                    <Divider my={2} />

                    {/* AI 해석 섹션 (InterpretationDisplay 사용) */}
                    <Box>
                        <Heading as="h4" size="sm" mb={2}>AI 해몽</Heading>
                        {/* InterpretationDisplay 컴포넌트 사용 */}
                        <InterpretationDisplay interpretationData={interpretationResult} />
                    </Box>

                    <Divider my={2} />

                    {/* 액션 버튼 (오른쪽 정렬) */}
                    <Flex justify="flex-end" align="center" wrap="wrap" gap={3} mt={4}>
                        <Button onClick={handleCopyToClipboard} size="sm" variant="ghost" colorScheme="gray" leftIcon={<CopyIcon />}>
                            결과 복사
                        </Button>
                        <Button onClick={() => { setTitle(''); setDreamContent(''); setStep(1); }} size="sm" variant="outline" colorScheme="teal">
                            새로운 꿈 해몽하기
                        </Button>
                    </Flex>
                </VStack>
            );

      default:
        return null;
    }
  };
  // --------------------------------------------

  return (
    // 전체 컴포넌트 중앙 정렬 및 최대 너비 설정 (패딩 제거)
    <Box maxWidth="700px" mx="auto">
        {renderStepContent()}
    </Box>
  );
}

export default DreamInterpreter;
