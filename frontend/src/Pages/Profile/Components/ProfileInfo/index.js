// ProfileInfo.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../Configs/supabaseClient";
import "./index.css";

const ProfileInfo = ({ onEditClick }) => {
    const [profile, setProfile] = useState(null);
    const [followersCount, setFollowersCount] = useState(0);
    const navigate = useNavigate(); // Hook para navegación

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Consulta para obtener los datos del perfil
                const { data: profileData, error: profileError } = await supabase
                    .from('perfil_jugadores')
                    .select(`
                        id,
                        avatar_url,
                        edad,
                        altura,
                        peso,
                        usuarios (
                            id,
                            nombre,
                            apellido,
                            rol
                        ),
                        naciones (
                            nombre
                        ),
                        provincias (
                            nombre
                        )
                    `)
                    .eq('usuario_id', 11)
                    .single();
                
                if (profileError) {
                    throw profileError;
                }
                
                setProfile(profileData);

                // Consulta para contar seguidores
                const { count: followersCount, error: followersError } = await supabase
                    .from('seguidores')
                    .select('*', { count: 'exact' })
                    .eq('usuarioid', 11);
                
                if (followersError) {
                    throw followersError;
                }

                setFollowersCount(followersCount);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchProfile();
    }, []);

    if (!profile) {
        return <div>Loading...</div>;
    }

    return (
        <div className="profile-info">
            <img src={profile.avatar_url} alt="Player Profile" className="profile-pic" />
            <div className="profile-details">
                <h1 className="profile-name">{profile.usuarios.nombre} {profile.usuarios.apellido}</h1>
                <p className="profile-role">{profile.usuarios.rol}</p>
                <p className="profile-location">{profile.provincias.nombre}, {profile.naciones.nombre}</p>
                <p className="profile-followers"><span>{followersCount} followers</span></p>
            </div>
            <button 
                className="edit-button"
                onClick={() => onEditClick()} // Llama a la función proporcionada como prop
            >
                Editar
            </button>
        </div>
    );
}

export default ProfileInfo;
