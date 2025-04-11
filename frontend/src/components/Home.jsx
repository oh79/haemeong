import React from 'react';
import { Link } from 'react-router-dom';
import DreamInterpreter from './Dream/DreamInterpreter';
import { Box, Heading, Text, VStack, Flex, Spacer, Button, HStack, Link as ChakraLink, SimpleGrid, Image, Card, CardBody, Stack, Divider, CardFooter, ButtonGroup } from '@chakra-ui/react';

function Home() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const isLoggedIn = !!localStorage.getItem('authToken');

  // 추천 해몽 예시 데이터 수정
  const exampleItems = [
    { id: 1, title: '오늘의 해몽', description: '매일 업데이트되는 인기 해몽 풀이', image: '/src/assets/cha_v2_nobg.png' },
    { id: 2, title: '애정운 상담', description: '꿈으로 알아보는 나의 연애/결혼운', image: '/src/assets/cha_v2_nobg.png' },
    { id: 3, title: '재물운 분석', description: '대박 꿈? 쪽박 꿈? 돈과 관련된 꿈 분석', image: '/src/assets/cha_v2_nobg.png' },
    { id: 4, title: '악몽/불길한 꿈 상담', description: '나쁜 꿈의 의미와 극복 방법 알아보기', image: '/src/assets/cha_v2_nobg.png' },
  ];

  return (
    <Box maxW="container.xl"> {/* 최대 너비 제한 */}
      <VStack spacing={8} align="stretch">
        {/* --- 상단 환영 메시지 및 메인 기능 --- */}
        <Box textAlign="center" p={5} shadow="md" borderWidth="1px" borderRadius="lg">
          <Heading as="h1" size="xl" color="teal.600" mb={4}>
            AI 꿈 해몽
          </Heading>
          {isLoggedIn && userInfo ? (
            <Text fontSize="lg" color="gray.600" mb={6}>
              안녕하세요, <Text as="span" fontWeight="bold">{userInfo.username}</Text>님! 어떤 꿈을 꾸셨나요?
            </Text>
          ) : (
            <Text fontSize="lg" color="gray.500" mb={6}>
              로그인하고 꿈 해몽 서비스를 이용해보세요.
            </Text>
          )}

          {isLoggedIn ? (
            <DreamInterpreter />
          ) : (
            <Button as={Link} to="/login" colorScheme="teal" size="lg">
              로그인하고 시작하기
            </Button>
          )}
        </Box>

        {/* --- 추천 서비스/콘텐츠 섹션 (쿠팡의 상품 그리드처럼) --- */}
        <Box>
          <Heading size="lg" mb={4} mt={8} borderBottomWidth="2px" pb={2}>추천 해몽</Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {exampleItems.map((item) => (
              <Card
                key={item.id}
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                transition="all 0.2s ease-in-out"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: 'lg',
                }}
              >
                <Image
                  objectFit='cover'
                  width="100%"
                  maxH={{ base: "120px", md: "150px" }}
                  src={item.image}
                  alt={item.title}
                  borderTopRadius="lg"
                />
                <CardBody py={4} px={4}>
                  <Stack spacing='2'>
                    <Heading size='sm' noOfLines={1}>{item.title}</Heading>
                    <Text fontSize="xs" color="gray.600" noOfLines={2} minHeight="2.5em">
                      {item.description}
                    </Text>
                  </Stack>
                </CardBody>
                <Divider />
                <CardFooter py={2} px={4} justify="flex-end">
                  <ButtonGroup spacing='2'>
                    <Button variant='solid' colorScheme='teal' size="xs">
                      자세히 보기
                    </Button>
                    <Button variant='ghost' colorScheme='teal' size="xs">
                      스크랩
                    </Button>
                  </ButtonGroup>
                </CardFooter>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* --- 추가 섹션 (카테고리, 이벤트 배너 등) --- */}
        {/* 필요에 따라 여기에 더 많은 섹션을 추가할 수 있습니다. */}
        {/* 예: <Box mt={8}> <Heading size="lg">카테고리</Heading> ... </Box> */}
        {/* 예: <Box mt={8}> <Image src="배너이미지URL" alt="이벤트 배너" /> </Box> */}

      </VStack>
    </Box>
  );
}

export default Home;
