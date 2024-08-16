import React, { useEffect, useState } from "react";
import supabase from "../../../../Configs/supabaseClient";
import { FaPencilAlt } from "react-icons/fa";
import "./index.css";


const MisDatos = () => {
    const [userData, setUserData] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({
        edad: '',
        altura: '',
        nacion_id: '',
        provincia_id: '',
        email: ''
    });
    const [naciones, setNaciones] = useState([]);
    const [provincias, setProvincias] = useState([]);


    useEffect(() => {
        fetchUserData();
        fetchNaciones();
    }, []);


    useEffect(() => {
        if (editData.nacion_id) {
            fetchProvincias(editData.nacion_id);
        }
    }, [editData.nacion_id]);


    const fetchUserData = async () => {
        try {
            const { data, error } = await supabase
                .from('perfil_jugadores')
                .select(`
                    id,
                    edad,
                    altura,
                    nacion_id,
                    provincia_id,
                    usuarios (
                        id,
                        email
                    )
                `)
                .eq('usuario_id', 11)
                .single();


            if (error) throw error;
            setUserData(data);
            setEditData({
                edad: data.edad,
                altura: data.altura,
                nacion_id: data.nacion_id,
                provincia_id: data.provincia_id,
                email: data.usuarios.email
            });
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };


    const fetchNaciones = async () => {
        try {
            const { data, error } = await supabase
                .from('naciones')
                .select('*')
                .order('nombre');


            if (error) throw error;
            setNaciones(data);
        } catch (error) {
            console.error("Error fetching naciones:", error);
        }
    };


    const fetchProvincias = async (nacionId) => {
        try {
            const { data, error } = await supabase
                .from('provincias')
                .select('*')
                .eq('nacion_id', nacionId)
                .order('nombre');


            if (error) throw error;
            setProvincias(data);
        } catch (error) {
            console.error("Error fetching provincias:", error);
        }
    };


    const handleEdit = () => {
        setEditing(!editing);
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();


        // Verificación de datos antes de enviar la actualización
        if (!userData.id) {
            console.error("User ID is not available.");
            return;
        }


        try {
            const { error } = await supabase
                .from('perfil_jugadores')
                .update({
                    edad: editData.edad,
                    altura: editData.altura,
                    nacion_id: editData.nacion_id,
                    provincia_id: editData.provincia_id
                })
                .eq('id', userData.id);


            if (error) throw error;


            const { error: userError } = await supabase
                .from('usuarios')
                .update({ email: editData.email })
                .eq('id', userData.usuarios.id);


            if (userError) throw userError;


            setEditing(false);
            fetchUserData();
        } catch (error) {
            console.error("Error updating data:", error);
            alert("Hubo un problema al actualizar los datos. Intenta nuevamente.");
        }
    };


    if (!userData) {
        return <div>Loading...</div>;
    }


    return (
        <div className={`mis-datos-container ${editing ? 'editing' : ''}`}>
            <h2>Mis Datos <FaPencilAlt onClick={handleEdit} className="edit-icon" /></h2>
            {!editing ? (
                <div className="datos-list">
                    <p><strong>Nacionalidad:</strong> <span>{naciones.find(n => n.id === userData.nacion_id)?.nombre}</span></p>
                    <p><strong>Correo electrónico:</strong> <span>{userData.usuarios.email}</span></p>
                    <p><strong>Residencia:</strong> <span>{provincias.find(p => p.id === userData.provincia_id)?.nombre}</span></p>
                    <p><strong>Edad:</strong> <span>{userData.edad}</span></p>
                    <p><strong>Altura:</strong> <span>{userData.altura} cm</span></p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="edit-form">
                    <div>
                        <label>Nacionalidad:</label>
                        <select
                            name="nacion_id"
                            value={editData.nacion_id}
                            onChange={handleChange}
                        >
                            {naciones.map(nacion => (
                                <option key={nacion.id} value={nacion.id}>{nacion.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Correo electrónico:</label>
                        <input
                            type="email"
                            name="email"
                            value={editData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Residencia:</label>
                        <select
                            name="provincia_id"
                            value={editData.provincia_id}
                            onChange={handleChange}
                        >
                            {provincias.map(provincia => (
                                <option key={provincia.id} value={provincia.id}>{provincia.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Edad:</label>
                        <input
                            type="number"
                            name="edad"
                            value={editData.edad}
                            onChange={handleChange}
                            min="0"
                            max="100"
                        />
                    </div>
                    <div>
                        <label>Altura:</label>
                        <input
                            type="number"
                            name="altura"
                            value={editData.altura}
                            onChange={handleChange}
                            min="120"
                            max="220"
                        />
                    </div>
                    <button type="submit">Guardar</button>
                </form>
            )}
        </div>
    );
};


export default MisDatos;
