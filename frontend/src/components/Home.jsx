import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  Image,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';

function Home() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const isLoggedIn = !!localStorage.getItem('authToken');

  // FAQ 데이터 수정
  const faqItems = [
    { question: '다시 보면 결과가 달라질 수 있나요?', answer: '네, AI 모델은 계속 학습하고 발전하기 때문에 같은 꿈이라도 시간이 지나 다시 해몽하면 다른 결과가 나올 수 있습니다. 또한, 입력하는 꿈 내용의 상세함에 따라서도 결과가 달라질 수 있습니다.' },
    { question: '이미지도 보여주나요?', answer: '현재는 텍스트 기반의 해몽 결과만 제공하고 있습니다. 추후 업데이트를 통해 꿈 내용과 관련된 이미지를 함께 제공하는 기능을 고려하고 있습니다.' },
    { question: '해몽은 어떤 관점에서 해석하나요?', answer: '저희 AI 해몽은 방대한 동양 전통 해몽 데이터와 칼 융, 프로이트 등의 서양 심리학 이론을 기반으로 학습되었습니다. 꿈에 나타난 상징의 문화적 의미와 개인의 심리적 맥락을 종합적으로 분석하여 깊이 있는 해석을 제공하려 노력합니다. 하지만 해몽은 매우 주관적인 영역이며, 개인의 경험과 상황에 따라 의미가 달라질 수 있습니다. 따라서 저희 결과는 100% 정답이라기보다는, 자신의 내면을 탐색하고 성찰하는 데 도움을 주는 참고 자료로 활용하시는 것이 가장 좋습니다. 귀여운 댕댕이들도 여러분의 해석을 응원할 거예요! 🐾' }, // 답변 수정
    { question: '강아지들은 정말 해몽을 도와주나요?', answer: '하하, 아쉽지만 강아지들은 귀여움과 응원을 담당하고 있어요! 실제 해몽 분석은 저희 최첨단 AI가 담당한답니다. 댕댕이들은 여러분의 꿈 여정에 즐거움을 더해주는 역할이에요!' } // 새 질문 추가
  ];

  return (
    <Box maxW="container.xl" mx="auto"> {/* 콘텐츠 최대 너비 조정 */}
      <VStack spacing={10} align="stretch" py={8}>
        {/* --- 상단 환영 메시지 및 해몽 시작 버튼 --- */}
        <Box textAlign="center" p={6} shadow="md" borderWidth="1px" borderRadius="lg">
          <Heading as="h1" size="xl" color="teal.600" mb={4}>
            멍멍! 꿈 해몽 탐험대 ✨ {/* 제목 수정 */}
          </Heading>
          {isLoggedIn && userInfo ? (
            <Text fontSize="lg" color="gray.600" mb={6}>
              <Text as="span" fontWeight="bold">{userInfo.username}</Text>님, 궁금한 꿈! AI 해몽가와 댕댕이 조수들이 풀어드려요! {/* 메시지 수정 */}
            </Text>
          ) : (
            <Text fontSize="lg" color="gray.500" mb={6}>
              로그인하고 댕댕이들과 함께 꿈 속 비밀을 파헤쳐 보세요! {/* 메시지 수정 */}
            </Text>
          )}
          <Button as={RouterLink} to="/interpret" colorScheme="teal" size="lg">
            {isLoggedIn ? '내 꿈 탐험하기 🐶' : '로그인하고 시작하기'} {/* 버튼 텍스트 수정 */}
          </Button>
        </Box>

        {/* --- AI 해몽 소개 섹션 (수정) --- */}
        <Box>
          <Heading size="lg" mb={4} borderBottomWidth="2px" pb={2}>꿈, 무의식의 비밀 지도: AI가 길을 찾아드려요!</Heading>
          <Text lineHeight="1.8" mb={4}>
            어젯밤 꿈, 혹시 단순한 잠꼬대가 아닐지도 몰라요! 동양의 지혜와 서양 심리학의 깊이를 아우르는 저희 AI는 꿈을 단순한 현상이 아닌, <Text as="span" fontWeight="bold">내면 세계의 메시지</Text>로 해석합니다.
          </Text>
          <Text lineHeight="1.8" mb={4}>
            <Text as="span" fontWeight="semibold" color="teal.700">동양적 관점:</Text> 예로부터 꿈은 길흉화복을 점치는 중요한 단서였죠. 저희 AI는 다양한 문화권의 전통적인 꿈 상징과 해몽 데이터베이스를 학습하여, 꿈에 담긴 복(福)과 화(禍)의 기운을 섬세하게 포착합니다.
          </Text>
          <Text lineHeight="1.8" mb={4}>
            <Text as="span" fontWeight="semibold" color="teal.700">서양 심리학적 접근:</Text> 칼 융의 <Text as="span" fontWeight="bold">원형(Archetype)</Text> 이론부터 프로이트의 <Text as="span" fontWeight="bold">무의식(Unconscious)</Text> 개념까지, 현대 심리학은 꿈을 자기 이해의 도구로 봅니다. AI는 꿈 속 상징들이 개인의 심리 상태, 숨겨진 욕망, 해결되지 않은 과제들과 어떻게 연결되는지 분석하여, 단순한 길흉 판단을 넘어 <Text as="span" fontWeight="bold">성찰과 성장의 기회</Text>를 제공합니다.
          </Text>
           <Text lineHeight="1.8">
             <Text as="span" fontWeight="semibold" color="teal.700">종합적 해석:</Text> 저희는 이 두 가지 관점을 통합하여 꿈을 입체적으로 분석합니다. 당신의 꿈이 미래에 대한 예지적 단서인지, 현재 심리 상태를 반영하는 거울인지, 아니면 둘 다인지, AI 해몽가가 명쾌하게 알려드릴게요. 귀여운 멍멍이 조수들의 응원은 덤! 🦴
          </Text>
        </Box>

        <Divider my={6} />

        {/* --- 자주 묻는 질문 (FAQ) 섹션 (수정) --- */}
        <Box>
          <Heading size="lg" mb={6}>궁금한 점이 있다면? 멍멍백과! 📖</Heading> {/* 제목 수정 */}
          <Accordion allowToggle defaultIndex={[0]}> {/* 첫 번째 항목 열린 상태로 시작 */} 
            {faqItems.map((item, index) => (
              <AccordionItem key={index} borderTopWidth={index === 0 ? 0 : "1px"}>
                <h2>
                  <AccordionButton _expanded={{ bg: 'teal.50', color: 'teal.800' }}>
                    <Box flex='1' textAlign='left' fontWeight="medium">
                      <Text as="span" role="img" aria-label="paw">🐾</Text> Q. {item.question} {/* 아이콘 추가 */}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4} bg="gray.50">
                  {item.answer}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>

        {/* --- 추가 섹션 (인공지능 꿈 해몽 예시 등) --- */}
        {/* <Box mt={10}>
          <Heading size="lg" mb={4}>인공지능 꿈 해몽 예시</Heading>
          <Text> 여기에 예시 내용이나 이미지를 추가할 수 있습니다. </Text>
        </Box> */}
      </VStack>
    </Box>
  );
}

export default Home;
