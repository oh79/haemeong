import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Chakra UI 컴포넌트 임포트
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText, // 입력 필드 아래 도움말/에러 메시지
  Input,
  VStack,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Divider, // 구분선
  Flex,
  useToast
} from '@chakra-ui/react';

function Profile() {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // 메시지 상태 제거 (Toast 사용)
  // const [profileMessage, setProfileMessage] = useState('');
  // const [passwordMessage, setPasswordMessage] = useState('');

  // 로딩 상태
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // 초기 정보 로딩

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const parsedInfo = JSON.parse(storedUserInfo);
      setCurrentUser(parsedInfo);
      setUsername(parsedInfo.username || '');
      setEmail(parsedInfo.email || '');
    } else {
      toast({ title: "로그인 필요", status: "warning", duration: 2000 });
      navigate('/login');
    }
    setInitialLoading(false); // 초기 로딩 완료
  }, [navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') setUsername(value);
    else if (name === 'email') setEmail(value);
    else if (name === 'currentPassword') setCurrentPassword(value);
    else if (name === 'newPassword') setNewPassword(value);
    else if (name === 'confirmNewPassword') setConfirmNewPassword(value);
  };

  // 프로필 정보 수정 핸들러 (Toast 사용)
  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    if (username === currentUser.username && email === currentUser.email) {
      toast({ description: '변경 사항이 없습니다.', status: 'info', duration: 1500 });
      setProfileLoading(false);
      return;
    }
    try {
      const response = await axios.put('http://localhost:3001/api/users/me', { username, email });
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      setCurrentUser(response.data.user);
      toast({ title: "정보 수정 완료", description: response.data.message, status: "success", duration: 2000 });
    } catch (error) {
       const errorMsg = error.response?.data?.message || '정보 수정 중 오류 발생';
       toast({ title: "수정 실패", description: errorMsg, status: "error", duration: 3000 });
    } finally {
      setProfileLoading(false);
    }
  };

  // 비밀번호 변경 핸들러 (Toast 사용)
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    if (newPassword !== confirmNewPassword) {
      toast({ description: '새 비밀번호가 일치하지 않습니다.', status: 'error', duration: 2000 });
      setPasswordLoading(false);
      return;
    }
    try {
      const response = await axios.put('http://localhost:3001/api/users/me/password', { currentPassword, newPassword });
      toast({ title: "변경 완료", description: response.data.message, status: "success", duration: 2000 });
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (error) {
       const errorMsg = error.response?.data?.message || '비밀번호 변경 중 오류 발생';
       toast({ title: "변경 실패", description: errorMsg, status: "error", duration: 3000 });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (initialLoading || !currentUser) {
    return (
        <Flex justify="center" align="center" minHeight="400px">
            <Spinner size="xl" color="teal.500" />
        </Flex>
    );
  }

  return (
    <Box>
      <Heading as="h2" size="lg" mb={6}>내 정보 수정</Heading>

      {/* --- 기본 정보 수정 폼 --- */}
      <Box as="form" onSubmit={handleProfileUpdateSubmit} mb={10}>
        <Heading as="h3" size="md" mb={4}>기본 정보</Heading>
        <VStack spacing={4} align="stretch">
          <FormControl id="profile-username" isRequired isDisabled={profileLoading}>
            <FormLabel>사용자 이름</FormLabel>
            <Input type="text" name="username" value={username} onChange={handleChange} focusBorderColor="teal.400" />
          </FormControl>
          <FormControl id="profile-email" isRequired isDisabled={profileLoading}>
            <FormLabel>이메일</FormLabel>
            <Input type="email" name="email" value={email} onChange={handleChange} focusBorderColor="teal.400" />
          </FormControl>
          <Button
            type="submit"
            colorScheme="teal"
            isLoading={profileLoading}
            spinner={<Spinner size="sm" />}
            alignSelf="flex-start" // 버튼 왼쪽 정렬
          >
            기본 정보 저장
          </Button>
        </VStack>
      </Box>
      {/* ------------------------- */}

      <Divider my={8} /> {/* my: 상하 마진 */}

      {/* --- 비밀번호 변경 폼 --- */}
      <Box as="form" onSubmit={handlePasswordChangeSubmit}>
        <Heading as="h3" size="md" mb={4}>비밀번호 변경</Heading>
        <VStack spacing={4} align="stretch">
          <FormControl id="current-password" isRequired isDisabled={passwordLoading}>
            <FormLabel>현재 비밀번호</FormLabel>
            <Input type="password" name="currentPassword" value={currentPassword} onChange={handleChange} focusBorderColor="teal.400"/>
          </FormControl>
          <FormControl id="new-password" isRequired isDisabled={passwordLoading}>
            <FormLabel>새 비밀번호</FormLabel>
            <Input type="password" name="newPassword" value={newPassword} onChange={handleChange} focusBorderColor="teal.400"/>
            <FormHelperText>6자 이상 입력해주세요.</FormHelperText>
          </FormControl>
          <FormControl id="confirm-new-password" isRequired isDisabled={passwordLoading} isInvalid={newPassword !== confirmNewPassword && confirmNewPassword !== ''}> {/* 불일치 시 에러 스타일 */}
            <FormLabel>새 비밀번호 확인</FormLabel>
            <Input type="password" name="confirmNewPassword" value={confirmNewPassword} onChange={handleChange} focusBorderColor="teal.400"/>
             {newPassword !== confirmNewPassword && confirmNewPassword !== '' && (
                <FormHelperText color="red.500">새 비밀번호가 일치하지 않습니다.</FormHelperText>
             )}
          </FormControl>
          <Button
            type="submit"
            colorScheme="teal"
            isLoading={passwordLoading}
            spinner={<Spinner size="sm" />}
            isDisabled={passwordLoading}
            alignSelf="flex-start"
          >
            비밀번호 변경
          </Button>
        </VStack>
      </Box>
      {/* ----------------------- */}
    </Box>
  );
}

export default Profile;
