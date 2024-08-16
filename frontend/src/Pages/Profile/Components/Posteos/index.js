import React, { useEffect, useState } from "react";
import supabase from "../../../../Configs/supabaseClient";
import { FaHeart, FaComment, FaPlus, FaTrash } from "react-icons/fa";
import NewTweetModal from "../NewTweetModal";
import PostDetail from "../PostDetail";
import NewCommentModal from "../NewCommentModal";
import "./index.css";

const Posteos = () => {
    const [posts, setPosts] = useState([]);
    const [likedPosts, setLikedPosts] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDeleteCommentConfirmOpen, setIsDeleteCommentConfirmOpen] = useState(false);
    const [selectedCommentId, setSelectedCommentId] = useState(null);

    useEffect(() => {
        fetchPosts();
        loadLikedPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posteos')
                .select(`
                    *,
                    usuarios (
                        id,
                        nombre,
                        apellido,
                        perfil_jugadores (
                            avatar_url
                        )
                    ),
                    respuestas_posteos (count)
                `)
                .order('fechapublicacion', { ascending: false });
            if (error) throw error;
            setPosts(data);
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    };

    const loadLikedPosts = () => {
        const storedLikes = localStorage.getItem('likedPosts');
        if (storedLikes) {
            setLikedPosts(JSON.parse(storedLikes));
        }
    };

    const saveLikedPosts = (newLikedPosts) => {
        localStorage.setItem('likedPosts', JSON.stringify(newLikedPosts));
    };

    const handleLike = async (event, postId, currentLikes) => {
        event.stopPropagation();
        try {
            const isLiked = likedPosts[postId];
            const newLikeCount = isLiked ? currentLikes - 1 : currentLikes + 1;
            const { data, error } = await supabase
                .from('posteos')
                .update({ likes: newLikeCount })
                .eq('id', postId)
                .select();

            if (error) throw error;

            setPosts(posts.map(post =>
                post.id === postId ? { ...post, likes: data[0].likes } : post
            ));

            const newLikedPosts = {
                ...likedPosts,
                [postId]: !isLiked
            };
            setLikedPosts(newLikedPosts);
            saveLikedPosts(newLikedPosts);
        } catch (error) {
            console.error("Error updating likes:", error);
        }
    };

    const handleDeleteTweet = async () => {
        try {
            const { error } = await supabase
                .from('posteos')
                .delete()
                .eq('id', selectedPostId);

            if (error) throw error;

            setPosts(posts.filter(post => post.id !== selectedPostId));
            setSelectedPost(null);
            setIsConfirmModalOpen(false);
        } catch (error) {
            console.error("Error deleting tweet:", error);
        }
    };

    const handleDeleteComment = async () => {
        try {
            const { error } = await supabase
                .from('respuestas_posteos')
                .delete()
                .eq('id', selectedCommentId);

            if (error) throw error;

            setPosts(posts.map(post => {
                if (post.id === selectedPostId) {
                    return {
                        ...post,
                        respuestas_posteos: [
                            { count: post.respuestas_posteos[0].count - 1 }
                        ]
                    };
                }
                return post;
            }));
            setIsDeleteCommentConfirmOpen(false);
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const handleTweetCreated = (newTweet) => {
        setPosts([newTweet, ...posts]);
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
    };

    const handleCommentClick = (event, postId) => {
        event.stopPropagation();
        setSelectedPostId(postId);
        setIsCommentModalOpen(true);
    };

    const handleCommentCreated = (newComment) => {
        setPosts(posts.map(post =>
            post.id === newComment.posteoid
                ? { ...post, respuestas_posteos: [{ count: (post.respuestas_posteos[0]?.count || 0) + 1 }] }
                : post
        ));
    };

    const openConfirmModal = (event, postId) => {
        event.stopPropagation();
        setSelectedPostId(postId);
        setIsConfirmModalOpen(true);
    };

    const openDeleteCommentConfirmModal = (event, commentId) => {
        event.stopPropagation();
        setSelectedCommentId(commentId);
        setIsDeleteCommentConfirmOpen(true);
    };

    return (
        <div className="posteos-container">
            <button className="new-tweet-button" onClick={() => setIsModalOpen(true)}>
                <FaPlus />
            </button>
            <NewTweetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTweetCreated={handleTweetCreated}
            />
            <div className="posts-scroll-container">
                {posts.map(post => (
                    <div key={post.id} className="post" onClick={() => handlePostClick(post)} style={{ cursor: 'pointer' }}>
                        <div className="post-header">
                            <img
                                src={post.usuarios?.perfil_jugadores?.[0]?.avatar_url || 'default-avatar.png'}
                                alt="Avatar del usuario"
                                className="user-avatar"
                            />
                            <div className="dxd">
                                <h3>{post.usuarios?.nombre || 'Unknown'} {post.usuarios?.apellido || 'User'}</h3>
                                <p>{new Date(post.fechapublicacion).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={(event) => openConfirmModal(event, post.id)}
                                className="delete-button"
                            >
                                <FaTrash />
                            </button>
                        </div>
                        <p className="post-content">{post.contenido}</p>
                        <div className="post-footerA">
                            <button
                                onClick={(event) => handleLike(event, post.id, post.likes)}
                                className={`ytr-button ${likedPosts[post.id] ? 'liked' : ''}`}
                            >
                                <FaHeart className="ytr" /> {post.likes || 0}
                            </button>
                            <button
                                onClick={(event) => handleCommentClick(event, post.id)}
                                className="ytr-button"
                            >
                                <FaComment className="ytr" /> {post.respuestas_posteos[0]?.count || 0}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {selectedPost && (
                <PostDetail
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onDelete={handleDeleteTweet}
                    onLike={handleLike}
                    likedPosts={likedPosts}
                    fetchPosts={fetchPosts}
                />
            )}
            <NewCommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                onCommentCreated={handleCommentCreated}
                postId={selectedPostId}
            />
            {isConfirmModalOpen && (
                <div className="confirm-modal">
                    <div className="confirm-modal-content">
                        <h3>¿Estás seguro de que deseas eliminar este post?</h3>
                        <div className="confirm-modal-buttons">
                            <button onClick={() => setIsConfirmModalOpen(false)} className="cancel-button">
                                Cancelar
                            </button>
                            <button onClick={handleDeleteTweet} className="delete-confirm-button">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isDeleteCommentConfirmOpen && (
                <div className="confirm-modal">
                    <div className="confirm-modal-content">
                        <h3>¿Estás seguro de que deseas eliminar este comentario?</h3>
                        <div className="confirm-modal-buttons">
                            <button onClick={() => setIsDeleteCommentConfirmOpen(false)} className="cancel-button">
                                Cancelar
                            </button>
                            <button onClick={handleDeleteComment} className="delete-confirm-button">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Posteos;
