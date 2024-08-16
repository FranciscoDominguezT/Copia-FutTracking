import React, { useState, useRef, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaHeart,
  FaComment,
  FaEye,
  FaShareAlt,
  FaDownload,
  FaLink,
  FaChevronDown,
} from "react-icons/fa";
import { FaRegEnvelope } from "react-icons/fa6";
import supabase, {
  getVideoData,
  getVideoLikes,
  getVideoComments,
  getComentarioLikes,
} from "../../../../Configs/supabaseClient";
import "./index.css";


const Main = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCommentMenu, setShowCommentMenu] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [lastClickTime, setLastClickTime] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liked3, setLiked3] = useState(false);
  const [liked2, setLiked2] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const videoRef = useRef();
  const shareMenuRef = useRef();
  const commentMenuRef = useRef();
  const [likedComments, setLikedComments] = useState({});
  const progressBarRef = useRef();
  const [visibleReplies, setVisibleReplies] = useState({});
  const [commentsCount, setCommentsCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(11);
  const [userData, setUserData] = useState(null);
  const [userLocation, setUserLocation] = useState("");


  useEffect(() => {
    const getRandomVideoId = () => {
      return Math.floor(Math.random() * 5) + 1;
    };
    const fetchVideoData = async () => {
      const videoId = getRandomVideoId();
      console.log("Generated videoId:", videoId);
      try {
        const video = await getVideoData(videoId);
        if (!video) {
          console.error(
            "No se pudo obtener los datos del video para videoId:",
            videoId
          );
          return;
        }


        console.log("Video data:", video);
        setVideoData(video);


        const videoLikes = await getVideoLikes(videoId);
        console.log("videoLikes:", videoLikes);


        if (typeof videoLikes === "number") {
          setLikes(videoLikes);
        } else if (videoLikes && typeof videoLikes.likes === "number") {
          setLikes(videoLikes.likes);
        } else {
          setLikes(0); // Valor por defecto si no es un número
        }
        const ComentarioLikes = await getComentarioLikes(videoId);
        console.log("ComentarioLikes:", ComentarioLikes);


        if (typeof ComentarioLikes === "number") {
          setLikes(ComentarioLikes);
        } else if (
          ComentarioLikes &&
          typeof ComentarioLikes.likes === "number"
        ) {
          setLikes(ComentarioLikes.likes);
        } else {
          setLikes(0); // Valor por defecto si no es un número
        }


        const comentarios = await getVideoComments(videoId);
        console.log("videoComments:", comentarios);


        if (Array.isArray(comentarios)) {
          setComments(comentarios);
        } else {
          setComments([]); // Valor por defecto si no es un array
        }


        setSelectedVideo(video);
        console.log("Selected video:", video);
        setLikes(typeof video.likes === "number" ? video.likes : 0);
      } catch (error) {
        console.error("Error al obtener datos del video:", error);
      }
    };


    fetchVideoData();
  }, []);


  useEffect(() => {
    if (videoData && videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error("Error al reproducir:", e);
          setIsPlaying(false);
        }
      };
      playVideo();
    }
    fetchComments();
    checkFollowStatus();
  }, [videoData]);

  const checkFollowStatus = async () => {
    if (!videoData || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('seguidores')
        .select('*')
        .eq('id_seguidor', currentUserId)
        .eq('usuarioid', videoData.usuarioid)
        .single();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollowToggle = async () => {
    if (!videoData || !currentUserId) return;

    try {
      if (isFollowing) {
        // Dejar de seguir
        const { error } = await supabase
          .from('seguidores')
          .delete()
          .eq('id_seguidor', currentUserId)
          .eq('usuarioid', videoData.usuarioid);

        if (error) throw error;
      } else {
        // Comenzar a seguir
        const { error } = await supabase
          .from('seguidores')
          .insert({
            id_seguidor: currentUserId,
            usuarioid: videoData.usuarioid,
            fechaseguido: new Date().toISOString()
          });

        if (error) throw error;
      }

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow status:", error);
    }
  };

  const fetchComments = async () => {
    if (!videoData) return;
    try {
      const { data, error } = await supabase
        .from('comentarios')
        .select(`
          *,
          usuarios (
            id,
            nombre,
            apellido,
            perfil_jugadores (
              avatar_url
            )
          )
        `)
        .eq('videoid', videoData.id)
        .order('fechacomentario', { ascending: false });
 
      if (error) throw error;
      const comentariosPrincipales = data.filter(comment => comment.parent_id === null);
      setComments(data);

      setCommentsCount(comentariosPrincipales.length);

    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (videoData && videoData.usuarioid) {
        try {
          const { data, error } = await supabase
            .from('usuarios')
            .select(`
              *,
              perfil_jugadores (
                *,
                naciones (nombre),
                provincias (nombre),
                localidades (nombre)
              )
            `)
            .eq('id', videoData.usuarioid)
            .single();

          if (error) throw error;

          setUserData(data);

          const location = [
            data.perfil_jugadores[0]?.localidades?.nombre,
            data.perfil_jugadores[0]?.provincias?.nombre,
            data.perfil_jugadores[0]?.naciones?.nombre
          ].filter(Boolean).join(", ");

          setUserLocation(location);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [videoData]);


  const handleCommentClick = () => {
    setShowCommentMenu(true);
    fetchComments(); // Carga los comentarios cuando se abre el menú
  };


  const handleCommentLike = async (commentId) => {
    try {
      const commentToUpdate = comments.find(c => c.id === commentId);
      const newLikes = likedComments[commentId] ? commentToUpdate.likes - 1 : commentToUpdate.likes + 1;


      const { data, error } = await supabase
        .from('comentarios')
        .update({ likes: newLikes })
        .eq('id', commentId)
        .select();


      if (error) throw error;


      setComments(comments.map(c => c.id === commentId ? { ...c, likes: data[0].likes } : c));
      setLikedComments({ ...likedComments, [commentId]: !likedComments[commentId] });
    } catch (error) {
      console.error("Error updating comment likes:", error);
    }
  };


  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
  
    try {
      const userId = 11; // Asume que tienes acceso al ID del usuario actual
      const { data: userData } = await supabase
        .from('usuarios')
        .select(`
          id,
          nombre,
          apellido,
          perfil_jugadores (
            avatar_url
          )
        `)
        .eq('id', userId)
        .single();
  
      const { data, error } = await supabase
        .from('comentarios')
        .insert({
          videoid: videoData.id,
          contenido: newComment,
          usuarioid: userId,
          parent_id: replyTo,
          fechacomentario: new Date().toISOString() // Agrega la fecha actual aquí
        })
        .select()
        .single();
  
      if (error) throw error;
  
      const newCommentWithUserData = {
        ...data,
        usuarios: userData
      };
  
      setComments([newCommentWithUserData, ...comments]);
      setNewComment("");
      setReplyTo(null);
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };
  


  const renderComments = (parentId = null) => {
    // Ordenar comentarios por fecha de comentario
    const sortedComments = [...comments].sort((a, b) => new Date(a.fechacomentario) - new Date(b.fechacomentario));
  
    return sortedComments
      .filter(comment => comment.parent_id === parentId)
      .map(comment => {
        const hasReplies = sortedComments.some(reply => reply.parent_id === comment.id);
        const replies = sortedComments.filter(reply => reply.parent_id === comment.id);
        const areRepliesVisible = visibleReplies[comment.id];
  
        return (
          <div key={comment.id} className="comment">
            <div className="comment-user-info">
              <img
                src={comment.usuarios?.perfil_jugadores?.[0]?.avatar_url || "default-avatar.png"}
                alt="User Profile"
                className="comment-user-profile-img"
              />
              <div className="comment-user-details">
                <p className="comment-user-name">
                  {comment.usuarios?.nombre || 'Unknown'} {comment.usuarios?.apellido || 'User'}
                </p>
                <p className="comment-timestamp">{new Date(comment.fechacomentario).toLocaleString()}</p>
              </div>
            </div>
            <p className="comment-text">{comment.contenido}</p>
            <div className="comment-stats">
              <button className="reply-button" onClick={() => setReplyTo(comment.id)}>
                Responder
              </button>
              <div className="comment-like-icon" onClick={() => handleCommentLike(comment.id)}>
                <FaHeart className={likedComments[comment.id] ? "liked" : ""} />
                <span>{comment.likes}</span>
              </div>
            </div>
            {hasReplies && (
              <div>
                {!areRepliesVisible && (
                  <button className="view-replies-button" onClick={() => setVisibleReplies({ ...visibleReplies, [comment.id]: true })}>
                    Ver Respuesta/s
                  </button>
                )}
                {areRepliesVisible && (
                  <div>
                    {replies.map(reply => (
                      <div key={reply.id} className="comment-reply">
                        <img
                          src={reply.usuarios?.perfil_jugadores?.[0]?.avatar_url || "default-avatar.png"}
                          alt="User Profile"
                          className="comment-user-profile-img"
                        />
                        <p className="reply-user-name">
                          <span>{reply.usuarios?.nombre || 'Unknown'} {reply.usuarios?.apellido || 'User'}</span>
                          <FaPlay className="reply-icon" />
                          <span>{comment.usuarios?.nombre || 'Unknown'} {comment.usuarios?.apellido || 'User'}</span>
                        </p>
                        <p className="comment-timestamp">{new Date(reply.fechacomentario).toLocaleString()}</p>
                        <p className="comment-text">{reply.contenido}</p>
                        <div className="comment-stats">
                          <button className="reply-button" onClick={() => setReplyTo(comment.id)}>
                            Responder
                          </button>
                          <div className="comment-like-icon" onClick={() => handleCommentLike(reply.id)}>
                            <FaHeart className={likedComments[reply.id] ? "liked" : ""} />
                            <span>{reply.likes}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="hide-replies-button" onClick={() => setVisibleReplies({ ...visibleReplies, [comment.id]: false })}>
                      Ocultar Respuestas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      });
  };
  



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target)
      ) {
        setShowShareMenu(false);
      }
      if (
        commentMenuRef.current &&
        !commentMenuRef.current.contains(event.target)
      ) {
        setShowCommentMenu(false);
      }
    };


    if (showShareMenu || showCommentMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }


    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareMenu, showCommentMenu]);


  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current
          .play()
          .catch((e) => console.error("Error al reproducir:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };


  const handleScreenClick = (e) => {
    const currentTime = new Date().getTime();
    if (currentTime - lastClickTime < 300) {
      handleDoubleClick(e);
    } else {
      handlePlayPause();
    }
    setLastClickTime(currentTime);
  };


  const handleDoubleClick = (e) => {
    const newTime = videoRef.current.currentTime + 10;
    videoRef.current.currentTime =
      newTime < videoRef.current.duration ? newTime : videoRef.current.duration;
  };


  const handleShareClick = (e) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };


  const handleLikeClick = async () => {
    const updatedLikes = liked3 ? likes - 1 : likes + 1;


    const { data, error } = await supabase
      .from("videos")
      .update({ likes: updatedLikes })
      .eq("id", selectedVideo.id);


    setLikes(updatedLikes);
    setLiked3(!liked3);
  };


  const handleCloseShareMenu = () => {
    setShowShareMenu(false);
  };


  const handleCloseCommentMenu = () => {
    setShowCommentMenu(false);
  };


  const handleDownload = () => {
    if (videoData && videoData.url) {
      const link = document.createElement("a");
      link.href = videoData.url;
      link.setAttribute("download", "video.mp4");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
    setDuration(videoRef.current.duration);
  };


  const handleProgressClick = (e) => {
    const newTime =
      (e.nativeEvent.offsetX / progressBarRef.current.offsetWidth) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };


  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleProgressClick(e);
  };


  const handleMouseMove = (e) => {
    if (isDragging) {
      handleProgressClick(e);
    }
  };


  const handleMouseUp = () => {
    setIsDragging(false);
  };


  const handleReplyClick = (commentId) => {
    setReplyTo(commentId);
    console.log("replyTo:", replyTo);
  };




  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };






  return (
    <div className="image-container">
      <video
        ref={videoRef}
        src={videoData ? videoData.url : ""}
        className="player-img"
        playsInline
        loop
        onClick={handleScreenClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() =>
          videoRef.current
            .play()
            .catch((e) => console.error("Error al cargar metadata:", e))
        }
      />
      <div className="player-info">
        <div className="controls-wrapper">
          <button className="pause-button" onClick={handlePlayPause}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <div
            className="time-bar"
            ref={progressBarRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <span className="time">{formatTime(currentTime)}</span>
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            <span className="time">{formatTime(duration - currentTime)}</span>
          </div>
        </div>
        <div className="user-info">
        <img
          src={userData?.perfil_jugadores[0]?.avatar_url || "default-avatar.png"}
          alt="Player Profile"
          className="user-profile-img"
        />
          <div className="user-details">
          <p className="user-name">{userData ? `${userData.nombre} ${userData.apellido}` : "Cargando..."}</p>
          <p className="user-location">{userLocation || "Cargando ubicación..."}</p>
          </div>
          <button className="follow-button" onClick={handleFollowToggle}>
          {isFollowing ? "Siguiendo" : "Seguir"}
          </button>
        </div>
        <div className="stats">
          <div
            className="stat"
            onClick={handleLikeClick}
            style={{ cursor: "pointer" }}
          >
            <FaHeart className={`stat-icon ${liked3 ? "liked" : ""}`} />
            <span>{liked3 ? likes : likes}</span>
          </div>
          <div
            className="stat"
            onClick={handleCommentClick}
            style={{ cursor: "pointer" }}
          >
            <FaComment className="stat-icon" />
            <span>{commentsCount}</span>
          </div>
          <div className="stat">
            <FaEye className="stat-icon" />
            <span>61.3K</span>
          </div>
          <div
            className="stat"
            onClick={handleShareClick}
            style={{ cursor: "pointer" }}
          >
            <FaShareAlt className="stat-icon" />
            <span>Compartir</span>
          </div>
        </div>
      </div>
      {showShareMenu && (
        <div
          className="share-menu"
          ref={shareMenuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="share-title">Compartir video</p>
          <div className="share-subtitle-container">
            <FaRegEnvelope className="envelope" />
            <p className="share-subtitle">Enviar vía Mensaje Directo</p>
          </div>
          <div className="share-icons">
            <div className="share-icon-container">
              <img
                src="https://cdn-icons-png.freepik.com/256/3983/3983877.png?semt=ais_hybrid"
                alt="WhatsApp"
                className="share-img"
              />
              <span>WhatsApp</span>
            </div>
            <div className="share-icon-container">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/2048px-Telegram_logo.svg.png"
                alt="Telegram"
                className="share-img"
              />
              <span>Telegram</span>
            </div>
            <div className="share-icon-container">
              <img
                src="https://cdn1.iconfinder.com/data/icons/logotypes/32/circle-linkedin-512.png"
                alt="LinkedIn"
                className="share-img"
              />
              <span>LinkedIn</span>
            </div>
            <div className="share-icon-container">
              <img
                src="https://static-00.iconduck.com/assets.00/gmail-icon-1024x1024-09wrt8am.png"
                alt="Gmail"
                className="share-img"
              />
              <span>Gmail</span>
            </div>
          </div>
          <div className="share-icons">
            <div className="share-icon-container">
              <div className="share-icon">
                <FaLink />
              </div>
              <span>Copiar enlace</span>
            </div>
            <div className="share-icon-container" onClick={handleDownload}>
              <div className="share-icon">
                <FaDownload />
              </div>
              <span>Guardar</span>
            </div>
          </div>
          <button className="cancel-button" onClick={handleCloseShareMenu}>
            Cancelar
          </button>
        </div>
      )}
      {showCommentMenu && (
        <div className="comment-menu" ref={commentMenuRef} onClick={(e) => e.stopPropagation()}>
          <p className="comment-title">Comentarios</p>
          <div className="comment-section">
            {renderComments()}
          </div>
          <div className="comment-input-wrapper">
            <input
              type="text"
              className="comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo !== null ? "Responde al comentario..." : "Escribí tu respuesta"}
            />
            <button className="comment-send-button" onClick={handleSubmitComment}>
              Enviar
            </button>
          </div>
          <button className="cancel-button" onClick={handleCloseCommentMenu}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};


export default Main;