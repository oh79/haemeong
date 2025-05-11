import React, { useState, useEffect } from 'react';
import { Box, Flex, Link as ChakraLink, Button, Spacer, Heading, Menu, MenuButton, MenuList, MenuItem, Avatar, useBreakpointValue, IconButton, Text, Icon } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
// 아이콘 예시 (react-icons 설치 필요: npm install react-icons)
import { FaHome, FaMoon, FaClipboardList, FaUserCircle, FaSignInAlt } from 'react-icons/fa';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // 현재 경로 확인용
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 로컬 스토리지에서 토큰과 사용자 정보 가져오기
    const token = localStorage.getItem('authToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (token && userInfo) {
      setIsLoggedIn(true);
      setCurrentUser(userInfo);
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
    // 의존성 배열을 비워두면 컴포넌트 마운트 시 한 번만 실행됨
  }, []);

  const handleLogout = () => {
    // 로그아웃 처리
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate('/'); // 로그아웃 후 홈으로 이동
    window.location.reload(); // 페이지 새로고침 (상태 초기화 위해)
  };

  // Chakra UI의 useBreakpointValue를 사용하여 현재 breakpoint 값 가져오기
  // base: 모바일, md: 태블릿/데스크탑 시작점
  const displayMode = useBreakpointValue({ base: 'mobile', md: 'desktop' });
  const isMobile = displayMode === 'mobile';

  // --- 모바일용 상단 헤더 ---
  const renderMobileHeader = () => (
    <Box
      as="header"
      bg="white"
      p={3} // 패딩 약간 줄임
      color="gray.800"
      position="fixed"
      top="0"
      width="100%"
      zIndex="1000"
      boxShadow="sm"
      borderBottomWidth="1px"
      borderColor="gray.200"
      height="50px" // 높이 축소 (예: 60px -> 50px)
    >
      <Flex maxW="container.xl" mx="auto" align="center" h="100%">
        <Heading size="lg" color="teal.600"> {/* 크기 약간 줄임 */}
          <ChakraLink as={RouterLink} to="/" _hover={{ textDecoration: 'none', color: 'teal.700' }}>
            해멍 - 꿈 해몽 서비스
          </ChakraLink>
        </Heading>
        <Spacer />
        {/* 오른쪽 프로필 메뉴 또는 로그인 버튼 (모바일 헤더용) */}
        {isLoggedIn && currentUser ? (
          <Menu>
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'ghost'}
              colorScheme="teal"
              cursor={'pointer'}
              minW={0}
              w="40px"
              h="40px" // 크기 조정 
              p={0}
            >
              <Avatar
                size={'sm'}
                name={currentUser.username}
                bg="teal.500"
                color="white"
              />
            </MenuButton>
            <MenuList color="black" zIndex={2000}>
              <MenuItem as={RouterLink} to="/profile">내 정보</MenuItem>
              <MenuItem as={RouterLink} to="/my-dreams">내 해몽 기록</MenuItem>
              <MenuItem as={RouterLink} to="/my-scraps">내 스크랩</MenuItem>
              <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button as={RouterLink} to="/login" size="sm" variant="ghost" colorScheme="teal">로그인</Button>
        )}
      </Flex>
    </Box>
  );
  // --- 모바일용 상단 헤더 끝 ---

  // 데스크탑 네비게이션 (헤더 스타일)
  const renderDesktopNav = () => (
    <Box
      as="header"
      bg="white" // 배경 흰색
      p={4}
      color="gray.800" // 기본 글자색 변경
      position="fixed"
      top="0"
      width="100%"
      zIndex="1000"
      boxShadow="sm" // 그림자 유지
      borderBottomWidth="1px" // 하단 테두리 추가
      borderColor="gray.200"
      height="70px" // 데스크탑 헤더 높이
    >
      <Flex maxW="container.xl" mx="auto" align="center" h="100%">
        <Heading size="md" mr={8} color="teal.600"> {/* 로고 색상 */}
          <ChakraLink as={RouterLink} to="/" _hover={{ textDecoration: 'none', color: 'teal.700' }}>
            꿈 해몽 서비스
          </ChakraLink>
        </Heading>
        {/* 데스크탑 메뉴 링크 - 일단 유지 */}
        <ChakraLink as={RouterLink} to="/interpret" mr={4} fontWeight="medium" _hover={{ textDecoration: 'underline', color: 'teal.600' }}>꿈 해몽하기</ChakraLink>
        <ChakraLink as={RouterLink} to="/board" mr={4} fontWeight="medium" _hover={{ textDecoration: 'underline', color: 'teal.600' }}>해몽 게시판</ChakraLink>
        <Spacer /> {/* 공간 채우기 */}

        {/* 오른쪽 프로필 메뉴 또는 로그인/가입 버튼 */}
        {isLoggedIn && currentUser ? (
          <Menu>
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'ghost'} // 배경 없는 버튼
              colorScheme="teal" // 호버 효과 색상
              cursor={'pointer'}
              minW={0}
              p={0} // 내부 패딩 제거
            >
              <Avatar
                size={'sm'}
                name={currentUser.username}
                // src={currentUser.profileImageUrl || '기본 해멍 캐릭터 이미지 URL'} // 기본 이미지 URL 추가 가능
                bg="teal.500" // 이미지 없을 때 배경색
                color="white" // 이름 글자색
              />
            </MenuButton>
            <MenuList color="black" zIndex={2000}>
              <MenuItem as={RouterLink} to="/profile">내 정보</MenuItem>
              <MenuItem as={RouterLink} to="/my-dreams">내 해몽 기록</MenuItem>
              <MenuItem as={RouterLink} to="/my-scraps">내 스크랩</MenuItem>
              <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Flex align="center">
            <Button as={RouterLink} to="/login" mr={2} size="sm" variant="ghost" colorScheme="teal">로그인</Button>
            <Button as={RouterLink} to="/signup" size="sm" colorScheme="teal" variant="solid">회원가입</Button>
          </Flex>
        )}
      </Flex>
    </Box>
  );

  // 모바일 네비게이션 (하단 고정, 둥근 디자인)
  const renderMobileNav = () => (
    <Box
      as="nav"
      bg="white" // 배경 흰색
      color="gray.700" // 기본 아이콘/텍스트 색상
      position="fixed"
      bottom="0"
      width="100%"
      zIndex="1000"
      boxShadow="0 -2px 10px rgba(0,0,0,0.08)" // 그림자 좀 더 부드럽게
      borderTopRadius="2xl" // 상단 모서리 둥글게
      overflow="hidden" // Radius 적용 위해
      height="50px" // 높이 축소 (예: 65px -> 55px)
    >
      <Flex justify="space-around" align="center" height="100%" pt={1} pb={1}> {/* 패딩 조정 */}
        {/* 모바일 하단 메뉴 아이템 (해몽, 홈, 게시판만) */}
        {[
          { path: '/interpret', label: '해몽하기', icon: FaMoon },
          { path: '/', label: '홈', icon: FaHome },
          { path: '/board', label: '게시판', icon: FaClipboardList },
        ].map((item) => (
          <ChakraLink
            key={item.path}
            as={RouterLink}
            to={item.path}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            flex="1" // 공간 균등 분할
            color={location.pathname === item.path ? 'teal.500' : 'gray.500'} // 활성 경로 색상 변경
            fontWeight={location.pathname === item.path ? 'bold' : 'normal'}
            _hover={{ textDecoration: 'none', color: 'teal.400' }}
            transition="color 0.2s"
            position="relative"
            h="100%" // 높이 꽉 채우기
          >
            <Icon as={item.icon} w={5} h={5} mb={0} />
            <Text fontSize="10px" lineHeight="1.1">{item.label}</Text> {/* 라인 높이 조정 */}
            {/* 활성 상태 표시 (선택 사항) */}
            {location.pathname === item.path && (
              <Box position="absolute" bottom="0px" left="0" right="0" height="2px" bg="teal.500" borderTopRadius="full" />
            )}
          </ChakraLink>
        ))}
      </Flex>
    </Box>
  );

  // 화면 크기에 따라 다른 네비게이션 렌더링
  return isMobile ? (
    <>
      {renderMobileHeader()}
      {renderMobileNav()}
    </>
  ) : (
    renderDesktopNav()
  );
}

export default Navbar;
