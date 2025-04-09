import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { marked } from 'marked'; // marked 임포트
import DOMPurify from 'dompurify'; // DOMPurify 임포트
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
  Alert, // 메시지 표시에 사용
  AlertIcon,
  AlertDescription,
  Spinner, // 로딩 표시에 사용
  Progress, // 로딩 표시용
  CircularProgress, // 다른 로딩 표시 옵션
  useToast,
  Flex,    // Flex 추가
  Spacer,  // Spacer 추가
  HStack,
  Grid, GridItem,
  Divider
} from '@chakra-ui/react';

function DreamInterpreter() {
  const toast = useToast();

  // --- 단계 관리 상태 ---
  const [step, setStep] = useState(1); // 1: 제목 입력, 2: 내용 입력, 3: 로딩, 4: 결과 표시
  // ---------------------

  // --- 입력 데이터 상태 ---
  const [title, setTitle] = useState('');
  const [dreamContent, setDreamContent] = useState('');
  // -----------------------

  // --- 결과 및 로딩 상태 ---
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultDreamContent, setResultDreamContent] = useState(''); // 결과에 해당하는 꿈 내용
  const [resultTitle, setResultTitle] = useState(''); // 결과에 해당하는 제목
  const [copyMessage, setCopyMessage] = useState('');
  // -----------------------

  // --- 수정된 결과 상태 ---
  const [sentenceInterpretations, setSentenceInterpretations] = useState([]); // 문장별 해석 결과 배열
  const [overallSummary, setOverallSummary] = useState('');               // 종합 해몽 결과
  const [sentencePage, setSentencePage] = useState(0);                     // 현재 보고 있는 문장 인덱스
  // -----------------------

  // 로그인 상태 확인 (필요 시)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
      setIsLoggedIn(!!localStorage.getItem('authToken'));
  }, []);

  // --- 단계 이동 함수 ---
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

  // --- 꿈 내용 글자 수 제한 ---
  const MAX_CONTENT_LENGTH = 500;
  const handleContentChange = (e) => {
      const newContent = e.target.value;
      if (newContent.length <= MAX_CONTENT_LENGTH) {
          setDreamContent(newContent);
      } else {
          // 제한 초과 시 사용자에게 알림 (예: Toast)
           toast({
              description: `꿈 내용은 ${MAX_CONTENT_LENGTH}자까지만 입력 가능합니다.`,
              status: 'info',
              duration: 1500,
            });
      }
  };
  const remainingChars = MAX_CONTENT_LENGTH - dreamContent.length;
  // --------------------------

  // --- 해몽 요청 제출 핸들러 ---
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
    setSentenceInterpretations([]); // 초기화
    setSentencePage(0);
    setOverallSummary(''); // 초기화
    setResultDreamContent('');
    setResultTitle('');

    try {
      const response = await axios.post('http://localhost:5000/api/dreams', {
        title: title.trim(),
        dream_content: dreamContent
      });

      const rawInterpretation = response.data.dream.interpretation;

      // --- 여기서 parseInterpretation 호출! ---
      const { sentenceInterpretations: parsedSentences, overallSummary: parsedSummary } = parseInterpretation(rawInterpretation);
      setSentenceInterpretations(parsedSentences);
      setOverallSummary(parsedSummary);
      // ---------------------------------------

      setResultDreamContent(dreamContent);
      setResultTitle(title.trim());
      setStep(4);

    } catch (error) {
       console.error('꿈 해몽 오류:', error);
       const errorMsg = error.response?.data?.message || '꿈 해몽 중 오류가 발생했습니다.';
       toast({ title: "해몽 실패", description: errorMsg, status: "error", duration: 3000 });
       setStep(2); // 오류 발생 시 내용 입력 단계로 복귀
    } finally {
      setLoading(false);
    }
  };
  // -------------------------

  // --- 해몽 결과 파싱 함수 수정 (상태 업데이트 제거) ---
  const parseInterpretation = (markdownText) => {
      console.log("Raw Markdown Response:\n", markdownText);
      const sentenceInterpretations = [];
      let localOverallSummary = ''; // 상태 대신 사용할 지역 변수

      // 1. 종합 해몽 분리 시도
      const parts = markdownText.split('---');
      let summaryPart = '';
      let sentencesPart = markdownText;

      if (parts.length >= 2) {
          summaryPart = parts[parts.length - 1].replace(/###\s*종합\s*해몽[:]*\s*/i, '').trim();
          sentencesPart = parts.slice(0, parts.length - 1).join('---').replace(/###\s*문장별\s*해몽[:]*\s*/i, '').trim();
      } else {
           const summaryMatch = markdownText.match(/###\s*종합\s*해몽[:]*\s*([\s\S]*)/i);
           if (summaryMatch && summaryMatch[1]) {
               summaryPart = summaryMatch[1].trim();
               sentencesPart = markdownText.substring(0, summaryMatch.index).replace(/###\s*문장별\s*해몽[:]*\s*/i, '').trim();
           } else {
               // summaryPart = markdownText; // 구분 못해도 일단 summaryPart에 저장
               sentencesPart = markdownText; // 문장 부분은 전체 텍스트
               summaryPart = ''; // 종합 해몽은 없는 것으로 간주
               console.warn("종합 해몽 구분자 '---' 또는 '### 종합 해몽'을 찾지 못했습니다.");
           }
      }

      // --- setOverallSummary(summaryPart...) 호출 삭제! ---

      // 파싱된 요약을 지역 변수에 할당
      localOverallSummary = summaryPart || ''; // 내용 없으면 빈 문자열

      console.log("Parsed Summary (local):\n", localOverallSummary); // 지역 변수 로그
      console.log("Sentences Part:\n", sentencesPart);

      // 2. 문장별 해석 파싱
      const sentenceRegex = /\*\*문장\s*\d+:\*\*\s*([\s\S]*?)\s*\*\*해석:\*\*\s*([\s\S]*?)(?=\*\*문장\s*\d+:\*\*|\n*$)/g;
      let match;
      while ((match = sentenceRegex.exec(sentencesPart)) !== null) {
           sentenceInterpretations.push({
              original: match[1]?.trim().replace(/\n+/g, ' ') || '?',
              interpretation: match[2]?.trim() || '(해석 없음)'
          });
      }

      // 3. 정규식으로 파싱되지 않은 경우 대비
      if (sentenceInterpretations.length === 0 && sentencesPart.trim() !== '') {
          // 종합 해몽이 아예 없는 경우, sentencesPart 전체를 첫 문장의 해석으로 간주할 수 있음
          if (localOverallSummary === '') {
              sentenceInterpretations.push({ original: '전체 꿈 내용', interpretation: sentencesPart.trim() });
              console.warn("문장별 해석 파싱 실패, 종합 해몽도 없어 전체를 문장 해석으로 간주.");
          } else {
              console.warn("문장별 해석 파싱 실패 (형식 불일치 가능성), 종합 해몽은 존재.");
          }
      }

      // 4. 최종 결과가 비어있으면 원본 전체를 넣음 (이제 불필요하거나 로직 재검토 필요)
      // => 종합 해몽은 localOverallSummary가 빈 문자열이면 없는 것으로 간주.
      // => 문장 해석이 없고 종합도 없으면 위 3번에서 처리됨.

      console.log("Parsed Sentences:", sentenceInterpretations);

      // 파싱된 결과 (지역 변수 사용) 반환
      return { sentenceInterpretations, overallSummary: localOverallSummary }; // localOverallSummary 반환
  };
  // -------------------------

  // --- 클립보드 복사 핸들러 수정 ---
  const handleCopyToClipboard = async () => {
       // sentenceInterpretations와 overallSummary를 사용하여 전체 텍스트 생성
       const sentencesText = sentenceInterpretations.map((s, i) => `[문장 ${i+1}]\n${s.original}\n\n[해석]\n${s.interpretation}`).join('\n\n');
       const fullInterpretationText = `${sentencesText}\n\n---\n[종합 해몽]\n${overallSummary}`; // --- 구분자 추가

       const textToCopy = `[꿈 제목]\n${resultTitle}\n\n[나의 꿈 이야기]\n${resultDreamContent}\n\n[꿈 해몽 결과]\n${fullInterpretationText}\n\n--- 꿈 해몽 서비스 ---`;
       try {
          await navigator.clipboard.writeText(textToCopy.trim());
          setCopyMessage('클립보드에 복사되었습니다!');
          setTimeout(() => setCopyMessage(''), 2000);
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            setCopyMessage('복사 실패');
            setTimeout(() => setCopyMessage(''), 2000);
        }
  };
  // ---------------------------

  // --- 단계별 UI 렌더링 ---
  const renderStepContent = () => {
    switch (step) {
      case 1: // 제목 입력
        return (
          <VStack spacing={4} align="stretch">
            <Heading as="h3" size="md" textAlign="center">어떤 꿈을 꾸셨나요?</Heading>
            <FormControl id="dream-title" isRequired>
              <FormLabel>꿈 제목</FormLabel>
              <Input
                placeholder="예) 용이 하늘로 승천하는 꿈"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                focusBorderColor="teal.400"
                maxLength={100} // 제목 길이 제한 (선택적)
              />
            </FormControl>
            <Button colorScheme="teal" onClick={handleNextStep} alignSelf="flex-end">
              다음 (내용 입력)
            </Button>
          </VStack>
        );

      case 2: // 내용 입력
        return (
          <VStack spacing={4} align="stretch">
             <Heading as="h3" size="md" textAlign="center">꿈 내용을 자세히 적어주세요</Heading>
             <FormControl id="dream-content" isRequired>
               <FormLabel>꿈 내용</FormLabel>
               <Textarea
                 value={dreamContent}
                 onChange={handleContentChange} // 글자 수 제한 핸들러 사용
                 placeholder="기억나는 대로 최대한 상세하게 적어주세요..."
                 rows={12}
                 focusBorderColor="teal.400"
               />
               {/* 글자 수 표시 */}
               <Text fontSize="sm" color={remainingChars < 0 ? 'red.500' : 'gray.500'} textAlign="right">
                 {remainingChars} / {MAX_CONTENT_LENGTH}자
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
            <Text color="gray.500">잠시만 기다려주세요. 평균 10초 ~ 30초 소요됩니다.</Text>
            {/* 로딩 진행률 표시 (Progress 컴포넌트 활용 가능, 실제 진행률 계산 어려움) */}
            {/* <Progress size="xs" isIndeterminate colorScheme="teal" width="80%" /> */}
          </VStack>
        );

      case 4: // 문장별 해석 표시 (세로 레이아웃)
        if (!sentenceInterpretations || sentenceInterpretations.length === 0 || !sentenceInterpretations[sentencePage]) {
            // 데이터 로딩 중이거나 파싱 실패 시 대비
             console.error("Error: sentenceInterpretations data is not available for page.", sentenceInterpretations, sentencePage);
             // 종합 해몽이 있으면 바로 종합으로 넘어갈 수도 있음
             if (overallSummary && step === 4) {
                 setStep(5); // 종합 해몽 단계로 자동 전환
                 return <Text>문장별 해몽 데이터가 없어 종합 해몽으로 넘어갑니다.</Text>;
             }
             return <Text>해석 결과를 준비 중이거나 표시할 수 없습니다.</Text>;
        }
        const currentSentenceData = sentenceInterpretations[sentencePage];
        const isLastSentencePage = sentencePage === sentenceInterpretations.length - 1;

        // --- marked와 DOMPurify 사용 (해석 부분만) ---
        const cleanInterpretationHtml = DOMPurify.sanitize(marked(currentSentenceData.interpretation || ''));
        // ------------------------------------------

        return (
          <Box>
            <Heading as="h3" size="lg" mb={2}>{resultTitle}</Heading>
            <Text color="gray.600" mb={4}>문장별 해몽 ({sentencePage + 1} / {sentenceInterpretations.length})</Text>

            {/* --- VStack으로 세로 배치 --- */}
            <VStack
              spacing={6} // 섹션 간 간격
              p={5} shadow="md" borderWidth="1px" borderRadius="md" mb={4}
              align="stretch" // 내부 요소 너비 채우기
            >
              {/* 원본 문장 섹션 */}
              <Box>
                <Heading as="h4" size="sm" mb={2} color="gray.600">해몽할 문장</Heading>
                {/* 원본 문장 표시 */}
                <Text fontStyle="italic" p={3} bg="gray.50" borderRadius="md">
                  "{currentSentenceData.original}"
                </Text>
              </Box>

              <Divider /> {/* 구분선 */}

              {/* AI 해석 섹션 */}
              <Box>
                 <Heading as="h4" size="sm" mb={2} color="teal.700">AI 해석</Heading>
                 {/* 해석 내용 (HTML) 표시 */}
                 <Box minHeight="100px" className="markdown-output" dangerouslySetInnerHTML={{ __html: cleanInterpretationHtml }} />
              </Box>
            </VStack>
            {/* ----------------------- */}

            {/* 네비게이션 및 액션 버튼 */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                 {/* 페이지 네비게이션 (전체 보기 아닐 때 & 섹션 여러 개일 때) */}
                 {sentenceInterpretations.length > 0 && ( // 문장 해석이 있을 때만 네비게이션 표시
                     <HStack>
                        <Button
                            onClick={() => setSentencePage(prev => Math.max(0, prev - 1))}
                            isDisabled={sentencePage === 0} // 첫 페이지면 비활성화
                            size="sm"
                            variant="outline"
                        >
                            이전 문장
                        </Button>
                        <Button
                            onClick={() => {
                                if (isLastSentencePage) {
                                    setStep(5); // 마지막 페이지면 종합 해몽(Step 5)으로 이동
                                } else {
                                    setSentencePage(prev => Math.min(sentenceInterpretations.length - 1, prev + 1));
                                }
                            }}
                            size="sm"
                            colorScheme="teal"
                        >
                            {isLastSentencePage ? "종합 해몽 보기" : "다음 문장"}
                        </Button>
                     </HStack>
                 )}

                 {/* 공통 액션 버튼 */}
                 <Spacer /> {/* 버튼들을 오른쪽으로 밀기 */}
                 <HStack>
                     <Button onClick={handleCopyToClipboard} size="sm" colorScheme="gray" variant="ghost">
                        결과 클립보드에 복사하기
                     </Button>
                      {/* 새 해몽 시작 시 상태 초기화 */}
                      <Button onClick={() => { setTitle(''); setDreamContent(''); setStep(1); }} variant="outline" size="sm">
                        새로운 꿈 해몽하기
                     </Button>
                 </HStack>
            </Flex>
             {/* 복사 메시지 */}
             {copyMessage && <Text display="block" mt={2} color="blue.600" fontSize="sm" textAlign="right">{copyMessage}</Text>}
          </Box>
        );

      case 5: // 종합 해몽 표시
        // --- 디버깅: marked/DOMPurify 처리 전후 로그 추가 ---
        console.log("Rendering Step 5 - Overall Summary State:", overallSummary);
        const rawSummary = overallSummary || '(종합 해몽 내용 없음)';
        let cleanSummaryHtml;
        try {
            cleanSummaryHtml = DOMPurify.sanitize(marked(rawSummary));
            console.log("Step 5 - Cleaned HTML:", cleanSummaryHtml);
        } catch (error) {
            console.error("Error processing summary with marked/DOMPurify:", error);
            cleanSummaryHtml = '<p>종합 해몽을 표시하는 중 오류가 발생했습니다.</p>'; // 오류 시 대체 텍스트
        }
        // --------------------------------------------

        return (
             <Box>
                <Heading as="h3" size="lg" mb={2}>{resultTitle} - 종합 해몽</Heading>
                <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" mb={4}>
                    <Heading as="h4" size="sm" mb={2} color="purple.700">종합적인 의미</Heading>
                    {/* --- 렌더링 --- */}
                    {cleanSummaryHtml ? (
                        <Box minHeight="100px" className="markdown-output" dangerouslySetInnerHTML={{ __html: cleanSummaryHtml }} />
                    ) : (
                         <Text color="gray.500">{rawSummary}</Text> // HTML 변환 실패 시 원본 텍스트 표시 (대체)
                    )}
                    {/* ------------- */}
                </Box>
                 {/* 네비게이션 및 액션 버튼 */}
                 <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                    <Button
                        onClick={() => {
                            setStep(4);
                            setSentencePage(sentenceInterpretations.length - 1);
                        }}
                        size="sm"
                        variant="outline"
                        isDisabled={sentenceInterpretations.length === 0}
                    >
                        문장별 해몽 다시보기
                    </Button>
                     <Spacer />
                     <HStack>
                         <Button onClick={handleCopyToClipboard} size="sm" colorScheme="gray" variant="ghost">결과 복사</Button>
                         <Button onClick={() => { setTitle(''); setDreamContent(''); setStep(1); }} variant="outline" size="sm">새 해몽</Button>
                     </HStack>
                 </Flex>
                 {copyMessage && <Text display="block" mt={2} color="blue.600" fontSize="sm" textAlign="right">{copyMessage}</Text>}
             </Box>
        );

      default:
        return null;
    }
  };
  // -------------------------

  return (
    // 전체 컴포넌트를 감싸는 Box (스타일 필요 시 추가)
    <Box p={4} borderWidth={step < 3 ? 0 : 1} borderRadius="lg" shadow={step < 3 ? 'none' : 'base'}>
        {renderStepContent()}
    </Box>
  );
}

export default DreamInterpreter;
