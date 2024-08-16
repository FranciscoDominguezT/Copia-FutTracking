import React, { useState, useEffect } from 'react';
import supabase from '../../../../Configs/supabaseClient';
import { FaHeart, FaComment, FaArrowLeft, FaTrash } from 'react-icons/fa';
import NewCommentModal from '../NewCommentModal';
import './index.css';


const PostDetail = ({ post, onClose, onDelete, onLike, likedPosts, fetchPosts }) => {
    const [comments, setComments] = useState([]);
    const [localPost, setLocalPost] = useState(post);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState(null);
    const [likedComments, setLikedComments] = useState({});
    const [isDeleteCommentConfirmOpen, setIsDeleteCommentConfirmOpen] = useState(false);
    const [selectedCommentId, setSelectedCommentId] = useState(null);


    useEffect(() => {
        fetchComments();
    }, [post.id]);


    const fetchComments = async () => {
        try {
            const { data, error } = await supabase
                .from('respuestas_posteos')
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
                    respuestas:respuestas_posteos(count)
                `)
                .eq('posteoid', post.id)
                .order('fechapublicacion', { ascending: true });


            if (error) throw error;
            setComments(data);
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };


    const handleLocalLike = (event) => {
        onLike(event, localPost.id, localPost.likes);
        setLocalPost(prevPost => ({
            ...prevPost,
            likes: likedPosts[prevPost.id] ? prevPost.likes - 1 : prevPost.likes + 1
        }));
    };


    const handleLocalDelete = async (event) => {
        await onDelete(event, localPost.id);
        onClose();
        fetchPosts();
    };


    const handleCommentCreated = (newComment) => {
        setComments([...comments, newComment]);
    };


    const handleDeleteComment = async () => {
        try {
            const { error } = await supabase
                .from('respuestas_posteos')
                .delete()
                .eq('id', selectedCommentId);


            if (error) throw error;


            setComments(comments.filter(comment => comment.id !== selectedCommentId));
            setIsDeleteCommentConfirmOpen(false);
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };


    const convertToLocalTime = (utcDateString) => {
        const date = new Date(utcDateString);
        return date.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    };


    useEffect(() => {
        const storedLikes = localStorage.getItem('likedComments');
        if (storedLikes) {
            setLikedComments(JSON.parse(storedLikes));
        }
    }, []);


    const handleCommentLike = async (commentId, currentLikes) => {
        try {
            const isLiked = likedComments[commentId];
            const newLikeCount = isLiked ? currentLikes - 1 : currentLikes + 1;


            const { data, error } = await supabase
                .from('respuestas_posteos')
                .update({ likes: newLikeCount })
                .eq('id', commentId)
                .select();


            if (error) throw error;


            setComments(comments.map(comment =>
                comment.id === commentId ? { ...comment, likes: data[0].likes } : comment
            ));


            const newLikedComments = {
                ...likedComments,
                [commentId]: !isLiked
            };
            setLikedComments(newLikedComments);
            localStorage.setItem('likedComments', JSON.stringify(newLikedComments));
        } catch (error) {
            console.error("Error updating comment likes:", error);
        }
    };


    const renderComments = (parentId = null, depth = 0) => {
        return comments
            .filter(comment => comment.parentid === parentId)
            .map(comment => (
                <div key={comment.id} className="comment" style={{ marginLeft: `${depth * 20}px` }}>
                    <div className="comment-header">
                        <img
                            src={comment.usuarios?.perfil_jugadores?.[0]?.avatar_url || 'default-avatar.png'}
                            alt="Avatar del usuario"
                            className="user-avatare"
                        />
                        <div className="comment-info">
                            <h4>{comment.usuarios?.nombre || 'Unknown'} {comment.usuarios?.apellido || 'User'}</h4>
                            <p>{new Date(comment.fechapublicacion).toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="comment-content">{comment.contenido}</p>
                    <div className="comment-footer">
                        <button
                            onClick={() => handleCommentLike(comment.id, comment.likes)}
                            className={`comment-likes ${likedComments[comment.id] ? 'liked' : ''}`}
                        >
                            <FaHeart /> {comment.likes || 0}
                        </button>
                        <button onClick={() => {
                            setSelectedParentId(comment.id);
                            setIsCommentModalOpen(true);
                        }} className="reply-button">
                            <FaComment /> {(comment.respuestas && comment.respuestas[0]?.count) || 0}
                        </button>
                        <button onClick={() => openDeleteCommentConfirmModal(comment.id)} className="delete-button">
                            <FaTrash />
                        </button>
                    </div>
                    {renderComments(comment.id, depth + 1)}
                </div>
            ));
    };


    const openDeleteCommentConfirmModal = (commentId) => {
        setSelectedCommentId(commentId);
        setIsDeleteCommentConfirmOpen(true);
    };


    return (
        <div className="post-detail-overlay">
            <div className="post-detail-content">
                <div className="post-detail-header">
                    <button onClick={onClose} className="back-button">
                        <FaArrowLeft />
                    </button>
                    <h2 className="post-detail-title">Post</h2>
                </div>
                <div className="original-post">
                    <div className="post-header">
                        <img
                            src={localPost.usuarios?.perfil_jugadores?.[0]?.avatar_url || 'default-avatar.png'}
                            alt="Avatar del usuario"
                            className="user-avatare"
                        />
                        <div className="post-info">
                            <h3>{localPost.usuarios?.nombre || 'Unknown'} {localPost.usuarios?.apellido || 'User'}</h3>
                            <p>{convertToLocalTime(localPost.fechapublicacion)}</p>
                        </div>
                        <button
                            onClick={handleLocalDelete}
                            className="delete-button"
                        >
                            <FaTrash />
                        </button>
                    </div>
                    <p className="post-content">{localPost.contenido}</p>
                    <div className="post-footer">
                        <button
                            onClick={handleLocalLike}
                            className={`action-button ${likedPosts[localPost.id] ? 'liked' : ''}`}
                        >
                            <FaHeart /> {localPost.likes || 0}
                        </button>
                        <button
                            onClick={() => setIsCommentModalOpen(true)}
                            className="action-button"
                        >
                            <FaComment /> {comments.length}
                        </button>
                    </div>
                </div>
                <div className="comments-scroll-container">
                    <h3>Comments</h3>
                    {renderComments()}
                </div>
            </div>
            <NewCommentModal
                isOpen={isCommentModalOpen}
                onClose={() => {
                    setIsCommentModalOpen(false);
                    setSelectedParentId(null);
                }}
                onCommentCreated={handleCommentCreated}
                postId={localPost.id}
                parentId={selectedParentId}
            />
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
};


export default PostDetail;
