import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Divider,
  Badge,
  UnorderedList,
  ListItem,
  Alert,
  AlertIcon
} from '@chakra-ui/react';

// 꿈 종류에 따라 Badge 색상 결정
const getDreamTypeColorScheme = (dreamType) => {
  if (!dreamType) return 'gray';
  const lowerCaseType = dreamType.toLowerCase();
  if (lowerCaseType.includes('길몽')) return 'green';
  if (lowerCaseType.includes('흉몽')) return 'red';
  if (lowerCaseType.includes('태몽')) return 'blue';
  if (lowerCaseType.includes('심리')) return 'purple';
  return 'gray'; // 기타
};

function InterpretationDisplay({ interpretationData }) {

  // interpretationData가 없거나 객체가 아닌 경우 처리
  if (!interpretationData || typeof interpretationData !== 'object') {
    console.error('Invalid interpretationData prop:', interpretationData);
    // interpretationData가 null이면 (백엔드 파싱 실패 등) 조용한 에러 표시
    if (interpretationData === null) {
        return (
         <Alert status="warning" variant="subtle">
            <AlertIcon />
            해몽 결과를 불러오는 중 문제가 발생했습니다.
         </Alert>
       );
    }
    // 그 외의 잘못된 타입이면 좀 더 명확한 에러 표시
    return (
      <Alert status="error">
        <AlertIcon />
        해몽 결과를 표시할 수 없습니다. (데이터 형식 오류)
      </Alert>
    );
  }

  // interpretationData에서 각 필드 추출 (기본값 처리 포함)
  const {
    dreamType = '정보 없음',
    symbolAnalysis = [],
    culturalInterpretation = '',
    psychologicalInterpretation = '',
    advice = ''
  } = interpretationData;

  // 모든 분석 내용이 비어있는지 확인
  const isContentEmpty =
    symbolAnalysis.length === 0 &&
    !culturalInterpretation &&
    !psychologicalInterpretation &&
    !advice;

  // 내용이 아예 없는 경우 (타입 정보만 있거나 그것도 없을 때)
  if (isContentEmpty && dreamType === '정보 없음') {
     return (
      <Alert status="info" variant="subtle">
        <AlertIcon />
        표시할 해몽 내용이 없습니다.
      </Alert>
    );
  }

  return (
    // 전체 VStack: 테두리, 배경, 그림자 제거하고 반응형 패딩 적용
    <VStack spacing={5} align="stretch" width="100%" p={{ base: 3, md: 5 }}>
      {/* 1. 꿈 종류 */}
      {dreamType !== '정보 없음' && ( // dreamType이 있을 때만 표시
        <Box textAlign="center">
          <Badge
            fontSize="md" // 크기 증가
            px={4} // 좌우 패딩 증가
            py={1} // 상하 패딩
            borderRadius="full" // 둥근 모서리
            colorScheme={getDreamTypeColorScheme(dreamType)}
            variant="solid" // 배경색 채우기
          >
            {dreamType}
          </Badge>
        </Box>
      )}

      {/* 내용이 있을 경우에만 나머지 섹션 렌더링 */}
      {!isContentEmpty && (
        <VStack spacing={5} align="stretch">
          {/* 2. 상징 분석 */}
          {symbolAnalysis.length > 0 && (
            <Box>
              <Heading size="sm" mb={3} color="gray.700">상징 분석</Heading>
              <UnorderedList spacing={2} pl={4}> {/* 들여쓰기 및 간격 */}
                {symbolAnalysis.map((symbol, index) => (
                  <ListItem key={index} fontSize="sm">{symbol}</ListItem>
                ))}\
              </UnorderedList>
              <Divider my={4} /> {/* 구분선 */}
            </Box>
          )}

          {/* 3. 문화적 해석 */}
          {culturalInterpretation && (
            <Box>
              <Heading size="sm" mb={3} color="gray.700">문화적 해석</Heading>
              <Text fontSize="sm" lineHeight="tall">{culturalInterpretation}</Text>
              <Divider my={4} />
            </Box>
          )}

          {/* 4. 심리적 분석 */}
          {psychologicalInterpretation && (
            <Box>
              <Heading size="sm" mb={3} color="gray.700">심리적 분석</Heading>
              <Text fontSize="sm" lineHeight="tall">{psychologicalInterpretation}</Text>
              <Divider my={4} />
            </Box>
          )}

          {/* 5. 조언 */}
          {advice && (
            <Box>
              <Heading size="sm" mb={3} color="teal.700">⭐ 조언</Heading> {/* 조언은 다른 색상 강조 + 아이콘 */}
              <Text fontSize="sm" lineHeight="tall">{advice}</Text>
            </Box>
          )}
        </VStack>
      )}
    </VStack>
  );
}

export default InterpretationDisplay;
