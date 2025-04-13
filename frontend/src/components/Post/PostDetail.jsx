import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'; // RouterLink 별칭
// Chakra UI 컴포넌트 임포트
import {
  Avatar, // 작성자 프로필 이미지
  Box,
  Button,
  Divider,
  Flex,
  FormControl, // FormControl 추가
  Heading,
  HStack, // 가로 스택
  IconButton, // 아이콘 버튼 (옵션)
  Image, // 게시글 이미지
  Link as ChakraLink,
  Menu, // 수정/삭제 메뉴
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Text,
  Textarea,
  VStack, // 수직 스택
  Alert,
  AlertIcon,
  useToast, // Toast 메시지
  SimpleGrid, // 이미지 여러 개 표시용
} from '@chakra-ui/react';
// 아이콘 사용 예시 (옵션)
import { ArrowBackIcon, EditIcon, DeleteIcon, ChatIcon, StarIcon as ChakraStarIcon, LinkIcon } from '@chakra-ui/icons'; // Chakra StarIcon은 이름 충돌 피하기 위해 별칭 사용
import { FiMoreVertical } from "react-icons/fi"; // 더보기 아이콘
// Carousel 라이브러리 import
import "react-responsive-carousel/lib/styles/carousel.min.css"; // 캐러셀 CSS
import { Carousel } from 'react-responsive-carousel';
// react-icons import 추가
import { FaHeart, FaRegHeart, FaStar, FaRegStar } from 'react-icons/fa';

// 날짜 형식 변환 함수 (Board.jsx와 동일하게)
const formatDate = (dateString) => {
    // 입력값 유효성 검사 추가
    if (!dateString || isNaN(new Date(dateString).getTime())) {
        return '날짜 없음'; // 또는 다른 기본값
    }
    const date = new Date(dateString);
    // YYYY-MM-DD 형식 (Board.jsx와 동일)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const toast = useToast(); // Toast 훅 사용

  // --- 상태 변수들 (기존과 동일) ---
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  // const [message, setMessage] = useState(''); // Alert 대신 Toast 사용
  const [commentMessage, setCommentMessage] = useState(''); // 댓글 폼 관련 메시지 (Toast로 변경 가능)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editErrorMessage, setEditErrorMessage] = useState('');
  // 좋아요 상태
  const [likeCount, setLikeCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  // 스크랩 상태
  const [scrappedByUser, setScrappedByUser] = useState(false);
  const [scrapLoading, setScrapLoading] = useState(false);
  // const [scrapMessage, setScrapMessage] = useState(''); // Toast 사용
  // 공유 상태
  // const [shareMessage, setShareMessage] = useState(''); // Toast 사용
  // -------------------------------

  // 데이터 로드 함수 (조건부 토큰 헤더 추가)
  const fetchPostData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    const headers = {};
    // 로그인 상태일 때만 토큰 추가
    if (token && isLoggedIn) { // isLoggedIn 조건 추가
        headers.Authorization = `Bearer ${token}`;
    }

    try {
      // headers 객체를 axios 요청에 포함
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}`, { headers });
      setPost(response.data);
      setComments(response.data.comments || []);
      setLikeCount(response.data.likeCount || 0);
      // likedByUser, scrappedByUser는 로그인 상태이고 토큰이 유효할 때만 설정
      if (isLoggedIn) {
          setLikedByUser(response.data.likedByUser || false);
          setScrappedByUser(response.data.scrappedByUser || false);
      } else {
          setLikedByUser(false);
          setScrappedByUser(false);
      }
    } catch (error) {
       console.error('게시글 로딩 오류:', error);
       const errorMsg = error.response?.data?.message || '게시글을 불러오는 중 오류 발생';
       // 401 오류는 여기서 특별히 처리하지 않아도 됨 (로그인 상태 아니면 토큰 안보냈으므로)
       // 만약 로그인 상태인데 401 -> 토큰 만료 케이스 (이 경우는 likedByUser 등을 false로)
       if (error.response?.status === 401 && isLoggedIn) {
           toast({ title: "인증 오류", description: "세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.", status: "warning", duration: 3000 });
           // 로그아웃 처리 또는 상태 초기화
           localStorage.removeItem('authToken');
           localStorage.removeItem('userInfo');
           setIsLoggedIn(false);
           setCurrentUser(null);
           setLikedByUser(false);
           setScrappedByUser(false);
           // 필요시 로그인 페이지로 리디렉션
           // navigate('/login');
       } else if (error.response?.status === 404) {
           toast({ title: "게시글 없음", description: "해당 게시글을 찾을 수 없습니다.", status: "error" });
           navigate('/board'); // 목록으로
       } else {
           // 기타 오류
           toast({ title: "로딩 실패", description: errorMsg, status: "error" });
           setPost(null); // post를 null로 설정하여 에러 메시지 표시 유도
       }
    } finally {
      setLoading(false);
    }
  }, [postId, navigate, toast, isLoggedIn]); // isLoggedIn 의존성 추가

  // 컴포넌트 마운트 시 로그인 상태 먼저 확인 후 데이터 로드
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);
    setCurrentUser(userInfo);
    // 로그인 상태 설정 후 fetchPostData 호출 (isLoggedIn 값이 반영된 상태로)
    fetchPostData();
  }, [fetchPostData]); // fetchPostData는 isLoggedIn에 의존하므로, 마운트 시 한 번만 호출됨

  // 로그인 필요 알림 및 리디렉션 함수
  const requireLogin = () => {
      if (!isLoggedIn) {
          toast({ title: "로그인 필요", description: "로그인이 필요한 기능입니다.", status: "warning", duration: 2000 });
          navigate('/login', { state: { from: `/board/${postId}` } }); // 로그인 후 돌아올 경로 전달
          return true; // 리디렉션 했음을 알림
      }
      return false; // 로그인 되어 있음
  };

  // --- 핸들러 함수들에 Authorization 헤더 추가 --- 
  const handleLikeToggle = async () => {
      if (requireLogin()) return; 
      if (likeLoading) return;
      setLikeLoading(true);
      const token = localStorage.getItem('authToken'); // 토큰 가져오기
      try {
          const response = await axios({
              method: likedByUser ? 'delete' : 'post', // 메서드 동적 설정
              url: `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/like`,
              headers: { 'Authorization': `Bearer ${token}` } // 헤더 추가
          });
          setLikedByUser(!likedByUser);
          setLikeCount(response.data.likeCount);
      } catch (error) {
          const errorMsg = error.response?.data?.message || '좋아요 처리 오류';
          toast({ title: "오류 발생", description: errorMsg, status: "error" });
      } finally {
          setLikeLoading(false);
      }
  };

  const handleScrapToggle = async () => {
      if (requireLogin()) return;
      if (scrapLoading) return;
      setScrapLoading(true);
      const token = localStorage.getItem('authToken'); // 토큰 가져오기
      try {
          const response = await axios({
              method: scrappedByUser ? 'delete' : 'post', // 메서드 동적 설정
              url: `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/scrap`,
              headers: { 'Authorization': `Bearer ${token}` } // 헤더 추가
          });
          setScrappedByUser(!scrappedByUser);
          toast({ description: response.data.message, status: "success", duration: 1500 });
      } catch (error) {
          const errorMsg = error.response?.data?.message || '스크랩 처리 오류';
          toast({ title: "오류 발생", description: errorMsg, status: "error" });
      } finally {
          setScrapLoading(false);
      }
  };

  const handleCommentSubmit = async (e) => {
      e.preventDefault();
      if (requireLogin()) return;
      setCommentMessage('');
      if (!newComment.trim()) return setCommentMessage('댓글 내용을 입력해주세요.');

      const token = localStorage.getItem('authToken'); // 토큰 가져오기
      if (!token) { // 토큰 없으면 재확인 및 리디렉션
          toast({ title: "인증 오류", description: "댓글을 작성하려면 로그인이 필요합니다.", status: "error" });
          navigate('/login');
          return;
      }

      try {
          // API 호출 시 Authorization 헤더 추가
          const response = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/comments`,
              { content: newComment },
              { headers: { 'Authorization': `Bearer ${token}` } } // 헤더 추가
          );
          setComments(prev => [...prev, response.data]);
          setNewComment('');
          toast({ title: "댓글 등록 완료", status: "success", duration: 1500 });
      } catch (error) {
          console.error('댓글 등록 오류:', error);
          if (error.response?.status === 401) {
              // 401 에러 처리: 토큰 만료 또는 무효
              toast({ title: "인증 실패", description: "세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.", status: "error", duration: 3000 });
              localStorage.removeItem('authToken');
              localStorage.removeItem('userInfo');
              setIsLoggedIn(false);
              setCurrentUser(null);
              navigate('/login');
          } else if (error.response?.status === 403) {
              toast({ title: "권한 없음", description: "댓글을 작성할 권한이 없습니다.", status: "error", duration: 3000 });
          } else if (error.response?.status === 404) {
                toast({ title: "게시글 없음", description: "댓글을 작성할 게시글을 찾을 수 없습니다.", status: "error" });
          } else {
              // 기타 오류
              const errorMsg = error.response?.data?.message || '댓글 등록 중 오류가 발생했습니다.';
              toast({ title: "오류 발생", description: errorMsg, status: "error" });
          }
      }
  };

  const handleEditCommentClick = (comment) => {
     if (requireLogin()) return;
     setEditingCommentId(comment.id);
     setEditedContent(comment.content);
     setEditErrorMessage('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedContent('');
    setEditErrorMessage('');
  };

  const handleSaveComment = async (commentId) => {
      if (requireLogin()) return;
      setEditErrorMessage('');
      if (!editedContent.trim()) return setEditErrorMessage('내용을 입력하세요.');

      const token = localStorage.getItem('authToken'); // 토큰 가져오기
      if (!token) {
          toast({ title: "인증 오류", description: "댓글을 수정하려면 로그인이 필요합니다.", status: "error" });
          navigate('/login');
          return;
      }

      try {
          // API 호출 시 Authorization 헤더 추가
          const response = await axios.put(
              `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/comments/${commentId}`,
              { content: editedContent },
              { headers: { 'Authorization': `Bearer ${token}` } } // 헤더 추가
          );
          setComments(prev => prev.map(c => c.id === commentId ? response.data : c));
          handleCancelEdit();
          toast({ title: "댓글 수정 완료", status: "success", duration: 1500 });
      } catch (error) {
          console.error('댓글 수정 오류:', error);
          if (error.response?.status === 401) {
              toast({ title: "인증 실패", description: "세션이 만료되었거나 유효하지 않습니다.", status: "error" });
              localStorage.removeItem('authToken');
              localStorage.removeItem('userInfo');
              setIsLoggedIn(false);
              setCurrentUser(null);
              navigate('/login');
          } else if (error.response?.status === 403) {
              setEditErrorMessage('댓글을 수정할 권한이 없습니다.');
          } else if (error.response?.status === 404) {
              setEditErrorMessage('수정할 댓글이나 게시글을 찾을 수 없습니다.');
          } else {
              const errorMsg = error.response?.data?.message || '댓글 수정 중 오류가 발생했습니다.';
              setEditErrorMessage(errorMsg); // 수정 폼 내부에 에러 표시
          }
      }
  };

  const handleDeleteComment = async (commentId) => {
      if (requireLogin()) return;
      if (window.confirm('정말 이 댓글을 삭제하시겠습니까?')) {
          const token = localStorage.getItem('authToken'); // 토큰 가져오기
          if (!token) {
              toast({ title: "인증 오류", description: "댓글을 삭제하려면 로그인이 필요합니다.", status: "error" });
              navigate('/login');
              return;
          }

          try {
              // API 호출 시 Authorization 헤더 추가
              await axios.delete(
                  `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/comments/${commentId}`,
                  { headers: { 'Authorization': `Bearer ${token}` } } // 헤더 추가
              );
              setComments(prev => prev.filter(c => c.id !== commentId));
              toast({ title: "댓글 삭제 완료", status: "success", duration: 1500 });
          } catch (error) {
              console.error('댓글 삭제 오류:', error);
              if (error.response?.status === 401) {
                  toast({ title: "인증 실패", description: "세션이 만료되었거나 유효하지 않습니다.", status: "error" });
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userInfo');
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                  navigate('/login');
              } else if (error.response?.status === 403) {
                  toast({ title: "권한 없음", description: "댓글을 삭제할 권한이 없습니다.", status: "error" });
              } else if (error.response?.status === 404) {
                  toast({ title: "찾을 수 없음", description: "삭제할 댓글이나 게시글을 찾을 수 없습니다.", status: "error" });
              } else {
                  const errorMsg = error.response?.data?.message || '댓글 삭제 중 오류가 발생했습니다.';
                  toast({ title: "오류 발생", description: errorMsg, status: "error" });
              }
          }
      }
  };

  const handleEditPost = () => {
     if (requireLogin()) return;
     navigate(`/board/edit/${postId}`);
  };

  const handleDeletePost = async () => {
      if (requireLogin()) return;
      if (window.confirm('정말 이 게시글을 삭제하시겠습니까? 댓글도 모두 함께 삭제됩니다.')) {
          const token = localStorage.getItem('authToken'); // 토큰 가져오기
          if (!token) {
              toast({ title: "인증 오류", description: "게시글을 삭제하려면 로그인이 필요합니다.", status: "error" });
              navigate('/login');
              return;
          }

          try {
              // API 호출 시 Authorization 헤더 추가
              await axios.delete(
                  `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}`,
                  { headers: { 'Authorization': `Bearer ${token}` } } // 헤더 추가
              );
              toast({ title: "게시글 삭제 완료", status: "success", duration: 2000 });
              navigate('/board');
          } catch (error) {
              console.error('게시글 삭제 오류:', error);
               if (error.response?.status === 401) {
                  toast({ title: "인증 실패", description: "세션이 만료되었거나 유효하지 않습니다.", status: "error" });
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userInfo');
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                  navigate('/login');
              } else if (error.response?.status === 403) {
                  toast({ title: "권한 없음", description: "게시글을 삭제할 권한이 없습니다.", status: "error" });
              } else if (error.response?.status === 404) {
                  toast({ title: "찾을 수 없음", description: "삭제할 게시글을 찾을 수 없습니다.", status: "error" });
              } else {
                  const errorMsg = error.response?.data?.message || '게시글 삭제 중 오류가 발생했습니다.';
                  toast({ title: "삭제 실패", description: errorMsg, status: "error" });
              }
          }
      }
  };

  // 공유 (게시글 링크 복사) 핸들러
  const handleSharePostLink = async () => {
      const postUrl = window.location.href;
      try {
          await navigator.clipboard.writeText(postUrl);
          toast({ description: "게시글 링크가 복사되었습니다!", status: "success", duration: 1500 });
      } catch (err) {
          toast({ description: "링크 복사에 실패했습니다.", status: "error" });
      }
  };

  // --- 로딩 및 초기 에러 처리 --- (로딩 스피너 색상 변경)
  if (loading) {
    return (
      <Flex justify="center" align="center" minHeight="400px">
        <Spinner size="xl" color="teal.500" /> {/* 테마 색상 적용 */}
      </Flex>
    );
  }
  if (!post) {
    // 로딩 끝났는데 post 없으면 (fetchData에서 오류 처리 및 리디렉션 가정)
    return (
      <Box p={4}>
        <Alert status="error">
          <AlertIcon />
          게시글 정보를 불러오지 못했습니다. 네트워크 연결을 확인하거나 다시 시도해주세요.
        </Alert>
      </Box>
    );
  }
  // ---------------------------

  const isAuthor = isLoggedIn && currentUser && post.user_id === currentUser.id;
  // 이미지 URL 배열 가져오기 (백엔드 응답 구조에 따라)
  const imageUrls = post.imageUrls || [];

  return (
    <Box pb="80px"> {/* 하단 고정 바 공간 확보 */}
      {/* --- 상단 바 (뒤로가기, 메뉴) --- */}
      <Flex
        as="header"
        position="sticky" // 상단 고정
        top="0"
        zIndex="10"
        bg="white"
        p={2}
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth="1px"
        borderColor="gray.200"
      >
        <IconButton
          icon={<ArrowBackIcon />} // 뒤로가기 아이콘
          aria-label="뒤로가기"
          variant="ghost"
          onClick={() => navigate(-1)} // 이전 페이지로 이동
        />
        <Text fontWeight="bold">상세보기</Text> {/* 페이지 제목 */}
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FiMoreVertical />} // 더보기 아이콘
            variant="ghost"
            aria-label="옵션"
          />
          <MenuList>
            {isAuthor ? (
              <>
                <MenuItem icon={<EditIcon />} onClick={handleEditPost}>수정하기</MenuItem>
                <MenuItem icon={<DeleteIcon />} onClick={handleDeletePost} color="red.500">삭제하기</MenuItem>
                <Divider />
              </>
            ) : null}
            <MenuItem icon={<LinkIcon />} onClick={handleSharePostLink}>링크 복사</MenuItem>
            {/* <MenuItem>신고하기</MenuItem> */} {/* 추후 기능 */} 
          </MenuList>
        </Menu>
      </Flex>

      {/* --- 게시글 내용 영역 --- */}
      <Box p={4}>
         {/* --- 작성자 정보 --- */}
         <Flex align="center" mb={4}>
           <Avatar name={post.username} size="md" mr={3} /> {/* 기본 아바타 */}
           <VStack align="start" spacing={0}>
             <Text fontWeight="bold">{post.username}</Text>
             <Text fontSize="sm" color="gray.500">
               {formatDate(post.created_at)}
               {post.created_at !== post.updated_at && ` (수정됨)`}
             </Text>
           </VStack>
           {/* <Text fontSize="sm" color="orange.500" ml="auto">매너온도</Text> */} {/* 매너온도 표시 (옵션) */} 
         </Flex>

         <Divider mb={4} />

         {/* --- 제목 및 본문 --- */}
         <VStack align="stretch" spacing={4} mb={6}>
            {/* --- 이미지 표시 영역 --- */}
            {imageUrls.length > 0 && (
              <Box mb={4}>
                {/* 이미지가 여러 장이면 캐러셀, 한 장이면 단일 이미지 표시 */}
                {imageUrls.length > 1 ? (
                    <Carousel 
                      showThumbs={false} // 하단 썸네일 숨김
                      infiniteLoop // 무한 루프
                      useKeyboardArrows // 키보드 화살표로 제어
                      showStatus={false} // "1 of 3" 같은 상태 표시 숨김
                      // autoPlay // 자동 재생 (선택 사항)
                      // interval={5000} // 자동 재생 간격 (ms)
                    >
                        {imageUrls.map((url, index) => (
                            <div key={index}> {/* 각 슬라이드는 div로 감싸기 */} 
                                <Image 
                                  src={`${import.meta.env.VITE_API_BASE_URL}${url}`}
                                  alt={`${post.title} 이미지 ${index + 1}`}
                                  borderRadius="md"
                                  objectFit="contain" // contain으로 변경하여 이미지가 잘리지 않게 함 (또는 cover 유지)
                                  maxH="500px" // 최대 높이 조정
                                  w="full"
                                  onError={(e) => { e.target.style.display='none'; }}
                                />
                            </div>
                        ))}
                    </Carousel>
                ) : (
                  // 이미지가 한 장일 때
                  <Image
                      src={`${import.meta.env.VITE_API_BASE_URL}${imageUrls[0]}`}
                      alt={post.title}
                      borderRadius="md"
                      objectFit="contain" // contain으로 변경
                      maxH="500px"
                      w="full"
                      onError={(e) => { e.target.style.display='none'; }}
                   />
                )}
              </Box>
            )}
            {/* ----------------------- */}

            <Heading as="h2" size="lg">{post.title}</Heading>
            <Box minHeight="150px" whiteSpace="pre-wrap" lineHeight="tall">
                {post.content}
            </Box>
         </VStack>

         {/* --- 좋아요/스크랩 버튼 (게시글 내용 아래로 이동) --- */}
         <HStack spacing={3} mt={6} mb={6}> {/* 위아래 여백 추가 */}
             {/* 로그인 상태일 때만 버튼 표시 */}
             {isLoggedIn && (
               <>
                  <Button
                      leftIcon={likedByUser ? <FaHeart color="red" /> : <FaRegHeart />} // 하트 아이콘 사용
                      aria-label="좋아요"
                      variant="outline"
                      onClick={handleLikeToggle}
                      isLoading={likeLoading}
                      size="sm"
                      colorScheme={likedByUser ? "red" : "gray"} // 좋아요 상태따라 색 변경
                  >
                    좋아요 {likeCount > 0 ? likeCount : ''}
                  </Button>
                  <Button
                      leftIcon={scrappedByUser ? <FaStar color="#ECC94B" /> : <FaRegStar />} // 별 아이콘 사용 (노란색)
                      aria-label="스크랩"
                      variant="outline"
                      onClick={handleScrapToggle}
                      isLoading={scrapLoading}
                      size="sm"
                      colorScheme={scrappedByUser ? "yellow" : "gray"} // 스크랩 상태따라 색 변경
                  >
                      스크랩
                  </Button>
               </>
             )}
             {/* 비로그인 시에는 버튼 숨김 또는 다른 내용 표시 가능 */} 
         </HStack>

         {/* --- 좋아요/댓글 수 정보 (버튼 위로 이동 또는 제거) --- */}
         {/* <HStack spacing={4} color="gray.500" fontSize="sm" mb={6}>
            <Text>좋아요 {likeCount}</Text>
            <Text>댓글 {comments.length}</Text>
         </HStack> */}
         {/* 좋아요 수는 버튼에 표시되므로 여기선 댓글 수만 남기거나 제거 */}
         <HStack spacing={4} color="gray.500" fontSize="sm" mb={6}>
             <Text>댓글 {comments.length}</Text>
         </HStack>

      </Box>

      <Divider />

       {/* --- 댓글 섹션 --- */}
       <Box p={4}>
         <Heading as="h3" size="md" mb={4}>댓글 ({comments.length})</Heading>
         {/* 댓글 목록 */}
         <VStack spacing={4} align="stretch" mb={6}>
           {comments.length > 0 ? (
             comments.map(comment => (
               <Box key={comment.id} borderBottomWidth="1px" borderColor="gray.100" pb={4}>
                 {editingCommentId === comment.id ? (
                   // 댓글 수정 폼
                   <VStack as="form" onSubmit={(e) => { e.preventDefault(); handleSaveComment(comment.id); }} spacing={2} align="stretch">
                     <Textarea
                       value={editedContent}
                       onChange={(e) => setEditedContent(e.target.value)}
                       rows={3}
                       focusBorderColor="teal.400" // 테마 색상 적용
                     />
                      {editErrorMessage && <Text color="red.500" fontSize="sm">{editErrorMessage}</Text>}
                     <HStack justify="flex-end">
                       <Button type="submit" size="sm" colorScheme="teal">저장</Button> {/* 테마 색상 적용 */}
                       <Button onClick={handleCancelEdit} size="sm" variant="ghost">취소</Button>
                     </HStack>
                   </VStack>
                 ) : (
                   // 댓글 표시
                   <VStack align="start" spacing={1}>
                     <HStack spacing={2} align="center">
                         <Avatar name={comment.username} size="xs" /> {/* 기본 아바타 */}
                         <Text fontWeight="bold" fontSize="sm">{comment.username}</Text>
                         <Text fontSize="xs" color="gray.500">{formatDate(comment.created_at)}</Text>
                     </HStack>
                     <Text pl={8} fontSize="sm" whiteSpace="pre-wrap">{comment.content}</Text> {/* 들여쓰기 */}
                     {isLoggedIn && currentUser && comment.user_id === currentUser.id && (
                       <HStack pl={8} justify="flex-start" spacing={1}>
                          <Button onClick={() => handleEditCommentClick(comment)} size="xs" variant="ghost">수정</Button>
                          <Button onClick={() => handleDeleteComment(comment.id)} size="xs" variant="ghost" colorScheme="red">삭제</Button>
                       </HStack>
                     )}
                   </VStack>
                 )}
               </Box>
             ))
           ) : (
             <Text color="gray.500" fontSize="sm">가장 먼저 댓글을 남겨보세요!</Text>
           )}
         </VStack>

         {/* --- 댓글 입력 폼 (모바일/데스크탑 공통) --- */}
         <Box mt={6}> {/* 위쪽 여백 */}
           {isLoggedIn ? (
             <Flex as="form" onSubmit={handleCommentSubmit} alignItems="flex-start"> {/* align flex-start로 변경 */}
                 {/* 아바타는 모바일/데스크탑 모두 표시 */}
                 <Avatar name={currentUser?.username} size="sm" mr={3} mt={1} /> {/* 기본 아바타 */}
                 <VStack flex={1} align="stretch"> {/* Textarea와 버튼 수직 배치 */}
                   <Textarea
                       placeholder="댓글을 남겨보세요..."
                       value={newComment}
                       onChange={(e) => setNewComment(e.target.value)}
                       size="sm"
                       bg="gray.100"
                       focusBorderColor="teal.400"
                       _placeholder={{ fontSize: 'sm' }}
                       rows={2} // 여러 줄 입력 가능하도록
                   />
                   {/* 댓글 폼 메시지 (필요 시) */}
                   {commentMessage && <Text color="red.500" fontSize="xs" mt={1}>{commentMessage}</Text>}
                   <Button
                      type="submit"
                      size="xs" // 버튼 크기 줄임
                      colorScheme="teal"
                      variant="solid"
                      isDisabled={!newComment.trim()} // 내용 없으면 비활성화
                      alignSelf="flex-end" // 오른쪽 정렬
                      mt={2} // Textarea와의 간격
                   >
                      등록
                   </Button>
                 </VStack>
             </Flex>
           ) : (
             <Text color="gray.500" fontSize="sm">댓글을 작성하려면 <ChakraLink as={RouterLink} to="/login" color="teal.500" fontWeight="bold">로그인</ChakraLink>해주세요.</Text>
           )}
         </Box>

       </Box>

    </Box>
  );
}

export default PostDetail;
