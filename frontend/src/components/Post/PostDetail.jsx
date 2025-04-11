import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'; // RouterLink 별칭
// Chakra UI 컴포넌트 임포트
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl, // FormControl 추가
  Heading,
  HStack, // 가로 스택
  IconButton, // 아이콘 버튼 (옵션)
  Link as ChakraLink,
  Spinner,
  Text,
  Textarea,
  VStack, // 수직 스택
  Alert,
  AlertIcon,
  useToast // Toast 메시지
} from '@chakra-ui/react';
// 아이콘 사용 예시 (옵션)
// import { EditIcon, DeleteIcon } from '@chakra-ui/icons';

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

  // 날짜 형식 변환 함수 (변경 없음)
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  // 데이터 로드 함수 (변경 없음)
  const fetchPostData = useCallback(async () => {
    setLoading(true);
    // setMessage('');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}`);
      setPost(response.data);
      setComments(response.data.comments || []);
      setLikeCount(response.data.likeCount || 0);
      setLikedByUser(response.data.likedByUser || false);
      setScrappedByUser(response.data.scrappedByUser || false);
    } catch (error) {
       console.error('게시글 로딩 오류:', error);
       const errorMsg = error.response?.data?.message || '게시글을 불러오는 중 오류 발생';
       toast({ title: "로딩 실패", description: errorMsg, status: "error", duration: 3000 });
       if (error.response?.status === 404) navigate('/board'); // 없는 글이면 목록으로
    } finally {
      setLoading(false);
    }
  }, [postId, navigate, toast]); // toast, navigate 의존성 추가

  // 컴포넌트 마운트 시 데이터 로드 (변경 없음)
  useEffect(() => {
    fetchPostData();
    const token = localStorage.getItem('authToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    setIsLoggedIn(!!token);
    setCurrentUser(userInfo);
  }, [fetchPostData]);

  // --- 핸들러 함수들 (API 호출 후 메시지는 Toast 사용으로 변경) ---

  // 새 댓글 제출 핸들러
  const handleCommentSubmit = async (e) => {
      e.preventDefault();
      setCommentMessage(''); // 내부 에러 메시지 초기화
      if (!isLoggedIn) return toast({ title: "로그인 필요", status: "warning" });
      if (!newComment.trim()) return setCommentMessage('댓글 내용을 입력해주세요.'); // 이건 내부 메시지 유지

      try {
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/comments`, {
            content: newComment
          });
          setComments(prev => [...prev, response.data]);
          setNewComment('');
          toast({ title: "댓글 등록 완료", status: "success", duration: 1500 });
      } catch (error) {
          const errorMsg = error.response?.data?.message || '댓글 등록 오류';
          toast({ title: "오류 발생", description: errorMsg, status: "error" });
      }
  };

  // 댓글 수정 관련 핸들러들
  const handleEditCommentClick = (comment) => {
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
      setEditErrorMessage('');
      if (!editedContent.trim()) return setEditErrorMessage('내용을 입력하세요.');

      try {
          const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/comments/${commentId}`, {
            content: editedContent
          });
          setComments(prev => prev.map(c => c.id === commentId ? response.data : c));
          handleCancelEdit();
          toast({ title: "댓글 수정 완료", status: "success", duration: 1500 });
      } catch (error) {
          const errorMsg = error.response?.data?.message || '댓글 수정 오류';
          setEditErrorMessage(errorMsg); // 수정 폼 내부에 에러 표시
      }
  };
  const handleDeleteComment = async (commentId) => {
      if (window.confirm('정말 이 댓글을 삭제하시겠습니까?')) {
          try {
              await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/comments/${commentId}`);
              setComments(prev => prev.filter(c => c.id !== commentId));
              toast({ title: "댓글 삭제 완료", status: "success", duration: 1500 });
          } catch (error) {
              const errorMsg = error.response?.data?.message || '댓글 삭제 오류';
              toast({ title: "오류 발생", description: errorMsg, status: "error" });
          }
      }
  };

  // 게시글 수정/삭제 버튼 핸들러
  const handleEditPost = () => navigate(`/board/edit/${postId}`);
  const handleDeletePost = async () => {
      if (window.confirm('정말 이 게시글을 삭제하시겠습니까? 댓글도 모두 함께 삭제됩니다.')) {
          try {
              await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}`);
              toast({ title: "게시글 삭제 완료", status: "success", duration: 2000 });
              navigate('/board');
          } catch (error) {
              const errorMsg = error.response?.data?.message || '게시글 삭제 오류';
              toast({ title: "삭제 실패", description: errorMsg, status: "error" });
          }
      }
  };

  // 좋아요 토글 핸들러
  const handleLikeToggle = async () => {
      if (!isLoggedIn) return toast({ title: "로그인 필요", status: "warning" });
      if (likeLoading) return;
      setLikeLoading(true);
      try {
          const response = likedByUser ? await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/like`) : await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/like`);
          setLikedByUser(!likedByUser);
          setLikeCount(response.data.likeCount);
          // toast({ description: response.data.message, status: "info", duration: 1000 }); // 메시지는 생략해도 무방
      } catch (error) {
          const errorMsg = error.response?.data?.message || '좋아요 처리 오류';
          toast({ title: "오류 발생", description: errorMsg, status: "error" });
      } finally {
          setLikeLoading(false);
      }
  };

  // 스크랩 토글 핸들러
  const handleScrapToggle = async () => {
      if (!isLoggedIn) return toast({ title: "로그인 필요", status: "warning" });
      if (scrapLoading) return;
      setScrapLoading(true);
      try {
          const response = scrappedByUser ? await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/scrap`) : await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/scrap`);
          setScrappedByUser(!scrappedByUser);
          toast({ description: response.data.message, status: "success", duration: 1500 });
      } catch (error) {
          const errorMsg = error.response?.data?.message || '스크랩 처리 오류';
          toast({ title: "오류 발생", description: errorMsg, status: "error" });
      } finally {
          setScrapLoading(false);
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

  // --- 로딩 및 초기 에러 처리 ---
  if (loading) {
    return (
      <Flex justify="center" align="center" minHeight="400px">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }
  if (!post) {
    // 로딩 끝났는데 post 없으면 (fetchData에서 오류 처리 및 리디렉션 가정)
    return null; // 또는 <NotFound> 컴포넌트 등
  }
  // ---------------------------

  const isAuthor = isLoggedIn && currentUser && post.user_id === currentUser.id;

  return (
    <Box>
      {/* --- 게시글 헤더 --- */}
      <VStack align="stretch" spacing={1} mb={4}>
          <Heading as="h2" size="xl">{post.title}</Heading>
          <Flex justify="space-between" align="center" color="gray.500" fontSize="sm">
              <Text>작성자: {post.username}</Text>
              <Text>
                  작성일: {formatDate(post.created_at)}
                  {post.created_at !== post.updated_at && ` (수정: ${formatDate(post.updated_at)})`}
              </Text>
          </Flex>
      </VStack>

      {/* --- 작성자 메뉴 (수정/삭제 버튼) --- */}
      {isAuthor && (
          <HStack spacing={2} mb={4} justify="flex-end"> {/* HStack: 가로 배치, justify: 오른쪽 정렬 */}
              <Button onClick={handleEditPost} size="sm" colorScheme="gray" variant="outline">수정</Button>
              <Button onClick={handleDeletePost} size="sm" colorScheme="red" variant="outline">삭제</Button>
          </HStack>
      )}

      <Divider mb={6} />

      {/* --- 게시글 본문 --- */}
      <Box minHeight="200px" mb={6} whiteSpace="pre-wrap" lineHeight="tall"> {/* lineHeight: 줄 간격 */}
        {post.content}
      </Box>

      {/* --- 액션 버튼들 (좋아요, 스크랩, 공유) --- */}
      <HStack spacing={4} mb={6} justify="center">
          <Button
              onClick={handleLikeToggle}
              isLoading={likeLoading}
              leftIcon={likedByUser ? '❤️' : '🤍'} // 아이콘 대신 이모지 사용
              colorScheme={likedByUser ? "pink" : "gray"}
              variant="outline"
              size="sm"
          >
              좋아요 {likeCount}
          </Button>
          <Button
              onClick={handleScrapToggle}
              isLoading={scrapLoading}
              leftIcon={scrappedByUser ? '🔖' : '📑'}
              colorScheme={scrappedByUser ? "yellow" : "gray"}
              variant="outline"
              size="sm"
          >
              스크랩 {scrappedByUser ? '취소' : ''}
          </Button>
          <Button onClick={handleSharePostLink} leftIcon="🔗" variant="outline" size="sm">
              링크 복사
          </Button>
      </HStack>

      <Divider mb={6} />

      {/* --- 댓글 섹션 --- */}
      <Box>
        <Heading as="h3" size="lg" mb={4}>댓글 ({comments.length})</Heading>
        {/* 댓글 목록 */}
        <VStack spacing={4} align="stretch" mb={6}>
          {comments.length > 0 ? (
            comments.map(comment => (
              <Box key={comment.id} p={4} borderWidth="1px" borderRadius="md" shadow="sm">
                {editingCommentId === comment.id ? (
                  // 댓글 수정 폼
                  <VStack as="form" onSubmit={(e) => { e.preventDefault(); handleSaveComment(comment.id); }} spacing={2} align="stretch">
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={3}
                      focusBorderColor="teal.400"
                    />
                     {editErrorMessage && <Text color="red.500" fontSize="sm">{editErrorMessage}</Text>}
                    <HStack justify="flex-end">
                      <Button type="submit" size="sm" colorScheme="teal">저장</Button>
                      <Button onClick={handleCancelEdit} size="sm" variant="ghost">취소</Button>
                    </HStack>
                  </VStack>
                ) : (
                  // 댓글 표시
                  <Box>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontWeight="bold">{comment.username}</Text>
                      <Text fontSize="xs" color="gray.500">{formatDate(comment.created_at)}</Text>
                    </Flex>
                    <Text mb={2} whiteSpace="pre-wrap">{comment.content}</Text>
                    {isLoggedIn && currentUser && comment.user_id === currentUser.id && (
                      <HStack justify="flex-end" spacing={1}>
                         {/* 아이콘 버튼 사용 예시 (설치 필요 시: npm install @chakra-ui/icons) */}
                         {/* <IconButton onClick={() => handleEditCommentClick(comment)} size="xs" variant="ghost" aria-label="수정" icon={<EditIcon />} /> */}
                         {/* <IconButton onClick={() => handleDeleteComment(comment.id)} size="xs" variant="ghost" aria-label="삭제" icon={<DeleteIcon />} /> */}
                         <Button onClick={() => handleEditCommentClick(comment)} size="xs" variant="ghost">수정</Button>
                         <Button onClick={() => handleDeleteComment(comment.id)} size="xs" variant="ghost" colorScheme="red">삭제</Button>
                      </HStack>
                    )}
                  </Box>
                )}
              </Box>
            ))
          ) : (
            <Text color="gray.500">등록된 댓글이 없습니다.</Text>
          )}
        </VStack>

        {/* 댓글 작성 폼 */}
        {isLoggedIn ? (
          <Box as="form" onSubmit={handleCommentSubmit}>
            <FormControl id="new-comment">
              {/* <FormLabel>댓글 작성</FormLabel> */}
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="따뜻한 댓글을 남겨주세요..."
                rows={3}
                focusBorderColor="teal.400"
                isDisabled={!isLoggedIn}
              />
              {commentMessage && <Text color="red.500" fontSize="sm" mt={1}>{commentMessage}</Text>}
              <Button type="submit" colorScheme="teal" mt={2} size="sm" float="right"> 댓글 등록</Button>
            </FormControl>
          </Box>
        ) : (
          <Text color="gray.500">
            댓글을 작성하려면 <ChakraLink as={RouterLink} to="/login" color="teal.500">로그인</ChakraLink>이 필요합니다.
          </Text>
        )}
      </Box>

    </Box>
  );
}

export default PostDetail;
