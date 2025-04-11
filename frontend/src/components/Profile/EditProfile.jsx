import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  VStack,
  Heading,
  Spinner,
  Divider,
  Flex,
  useToast,
  Text,
} from '@chakra-ui/react';

function EditProfile() {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const parsedInfo = JSON.parse(storedUserInfo);
      setCurrentUser(parsedInfo);
      setUsername(parsedInfo.username || '');
      setEmail(parsedInfo.email || '');
    } else {
      toast({ title: "로그인 필요", status: "warning", duration: 2000, isClosable: true });
      navigate('/login');
    }
    setInitialLoading(false);
  }, [navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') setUsername(value);
    else if (name === 'email') setEmail(value);
    else if (name === 'currentPassword') setCurrentPassword(value);
    else if (name === 'newPassword') setNewPassword(value);
    else if (name === 'confirmNewPassword') setConfirmNewPassword(value);
  };

  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    if (username === currentUser.username && email === currentUser.email) {
      toast({ description: '변경 사항이 없습니다.', status: 'info', duration: 1500 });
      setProfileLoading(false);
      return;
    }
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/users/me`, { username, email });
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      setCurrentUser(response.data.user);
      toast({ title: "정보 수정 완료", description: response.data.message, status: "success", duration: 2000, isClosable: true });
    } catch (error) {
       const errorMsg = error.response?.data?.message || '정보 수정 중 오류 발생';
       toast({ title: "수정 실패", description: errorMsg, status: "error", duration: 3000, isClosable: true });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    if (newPassword !== confirmNewPassword) {
      toast({ description: '새 비밀번호가 일치하지 않습니다.', status: 'error', duration: 2000, isClosable: true });
      setPasswordLoading(false);
      return;
    }
    if (newPassword.length < 6) {
       toast({ description: '새 비밀번호는 6자 이상이어야 합니다.', status: 'warning', duration: 2000, isClosable: true });
       setPasswordLoading(false);
       return;
    }
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/users/me/password`, { currentPassword, newPassword });
      toast({ title: "변경 완료", description: response.data.message, status: "success", duration: 2000, isClosable: true });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
       const errorMsg = error.response?.data?.message || '비밀번호 변경 중 오류 발생';
       toast({ title: "변경 실패", description: errorMsg, status: "error", duration: 3000, isClosable: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (initialLoading) {
    return (
        <Flex justify="center" align="center" minHeight="400px">
            <Spinner size="xl" color="teal.500" />
        </Flex>
    );
  }

  return (
    <Box p={8} maxWidth="600px" mx="auto">
      <Heading as="h2" size="xl" mb={8} textAlign="center">개인 정보 수정</Heading>

      <VStack spacing={8} align="stretch">
        <Box as="form" onSubmit={handleProfileUpdateSubmit}>
          <Heading as="h3" size="lg" mb={5}>기본 정보</Heading>
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
              mt={2}
              type="submit"
              colorScheme="teal"
              isLoading={profileLoading}
              spinner={<Spinner size="sm" />}
              alignSelf="flex-start"
            >
              기본 정보 저장
            </Button>
          </VStack>
        </Box>

        <Divider />

        <Box as="form" onSubmit={handlePasswordChangeSubmit}>
          <Heading as="h3" size="lg" mb={5}>비밀번호 변경</Heading>
          <VStack spacing={4} align="stretch">
            <FormControl id="current-password-edit" isRequired isDisabled={passwordLoading}>
              <FormLabel>현재 비밀번호</FormLabel>
              <Input type="password" name="currentPassword" value={currentPassword} onChange={handleChange} focusBorderColor="teal.400" placeholder="변경하려면 현재 비밀번호 입력"/>
            </FormControl>
            <FormControl id="new-password-edit" isRequired isDisabled={passwordLoading}>
              <FormLabel>새 비밀번호</FormLabel>
              <Input type="password" name="newPassword" value={newPassword} onChange={handleChange} focusBorderColor="teal.400"/>
              <FormHelperText>6자 이상 입력해주세요.</FormHelperText>
            </FormControl>
            <FormControl id="confirm-new-password-edit" isRequired isDisabled={passwordLoading} isInvalid={newPassword !== confirmNewPassword && confirmNewPassword !== ''}>
              <FormLabel>새 비밀번호 확인</FormLabel>
              <Input type="password" name="confirmNewPassword" value={confirmNewPassword} onChange={handleChange} focusBorderColor="teal.400"/>
              {newPassword !== confirmNewPassword && confirmNewPassword !== '' && (
                  <FormHelperText color="red.500">새 비밀번호가 일치하지 않습니다.</FormHelperText>
              )}
            </FormControl>
            <Button
              mt={2}
              type="submit"
              colorScheme="teal"
              isLoading={passwordLoading}
              spinner={<Spinner size="sm" />}
              alignSelf="flex-start"
            >
              비밀번호 변경
            </Button>
          </VStack>
        </Box>

        <Divider />

        <Button variant="link" colorScheme="gray" onClick={() => navigate('/profile')} alignSelf="center">
            프로필 페이지로 돌아가기
        </Button>

      </VStack>
    </Box>
  );
}

export default EditProfile;
