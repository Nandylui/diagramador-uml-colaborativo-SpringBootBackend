//src/pages/Salas.jsx
// Página de Salas Colaborativas
import { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Settings, Users, Plus, Download, Trash2, PenTool, X, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Salas() {
  const navigate = useNavigate();
  
  const [salas, setSalas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState(''); // Estado para el nombre del usuario

  const [modalNuevaSala, setModalNuevaSala] = useState(false);
  const [modalUnirse, setModalUnirse] = useState(false);

  const [nombreSala, setNombreSala] = useState('');
  const [descSala, setDescSala] = useState('');
  const [codigoSala, setCodigoSala] = useState('');

  const cargarSalas = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Decodificamos de forma segura el nombre del usuario desde el Token JWT
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        setNombreUsuario(payload.username || payload.email || 'Usuario');
      } catch (e) {
        setNombreUsuario('Usuario');
      }

      const respuesta = await fetch('http://localhost:3000/api/salas/mis-salas', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        }
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudieron cargar las salas.');
      }

      const data = await respuesta.json();
      setSalas(data); 
      
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [navigate]);

  useEffect(() => {
    cargarSalas();
  }, [cargarSalas]);

  const irAPizarra = (idSala) => {
    navigate(`/sala/${idSala}`);
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCrearSala = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:3000/api/salas/crear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombreSala, descripcion: descSala })
      });

      if (!respuesta.ok) throw new Error('Error al crear la sala');

      setNombreSala('');
      setDescSala('');
      setModalNuevaSala(false);
      cargarSalas();
    } catch (err) { alert(err.message); }
  };

  const handleUnirseSala = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:3000/api/salas/unirse', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitacion: codigoSala })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.message || 'Código inválido o error al unirse');
      }

      setCodigoSala('');
      setModalUnirse(false);
      cargarSalas();
    } catch (err) { alert(err.message); }
  };

  // ==========================================
  // EXPORTAR A SPRING BOOT DESDE EL BOTÓN
  // ==========================================
  const handleExportarSpring = async (idSala) => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`http://localhost:3000/api/salas/${idSala}/exportar/spring`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!respuesta.ok) throw new Error('Error al generar el proyecto Spring Boot');

      // Descargamos el archivo ZIP que devuelve el backend
      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proyecto-springboot-sala-${idSala}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // ELIMINAR SALA POR COMPLETO
  // ==========================================
  const handleEliminarSala = async (idSala) => {
    if (!window.confirm('¿Estás seguro de eliminar esta sala? Se borrará para todos los participantes.')) return;
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`http://localhost:3000/api/salas/eliminar/${idSala}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!respuesta.ok) throw new Error('Error al eliminar la sala');
      cargarSalas();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <header className="bg-emerald-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold tracking-wide">Diagramador de Clases UML</h1>
        
        {/* MOSTRAR NOMBRE DE USUARIO Y CONTROLES */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 bg-emerald-800/60 px-3 py-1 rounded-full text-sm font-medium border border-emerald-600/50">
            <User className="w-4 h-4 text-emerald-300" />
            <span>{nombreUsuario}</span>
          </div>
          <HelpCircle className="w-6 h-6 cursor-pointer hover:text-emerald-200 transition-colors" />
          <Settings className="w-6 h-6 cursor-pointer hover:text-emerald-200 transition-colors" />
          <button onClick={handleCerrarSesion} title="Cerrar Sesión" className="hover:text-red-300 transition-colors ml-2">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-8">
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pizarra Individual</h2>
            <p className="text-gray-600">Comienza a diagramar rápidamente sin crear un grupo o sala.</p>
          </div>
          <button onClick={() => irAPizarra('individual')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all">
            <PenTool className="w-5 h-5" /> Dibujar Ahora
          </button>
        </section>

        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Mis Salas Colaborativas</h2>
              <p className="text-gray-600">Crea o únete a un grupo para trabajar en tiempo real.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalNuevaSala(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-colors">
                <Users className="w-5 h-5" /> Nueva Sala
              </button>
              <button onClick={() => setModalUnirse(true)} className="flex items-center gap-2 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow-sm transition-all">
                <Plus className="w-5 h-5" /> Unirse a una Sala
              </button>
            </div>
          </div>

          {error && <div className="text-red-500 mb-4 p-4 bg-red-50 rounded border border-red-200 font-medium flex justify-between items-center">
            {error} <button onClick={cargarSalas} className="underline text-sm hover:text-red-700">Reintentar</button>
          </div>}
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[200px]">
            {cargando ? (
              <div className="flex items-center justify-center h-48 text-gray-500 font-medium">Cargando tus salas...</div>
            ) : salas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <p className="mb-2">Aún no tienes salas colaborativas.</p>
                <p className="text-sm">Haz clic en "Nueva Sala" para empezar.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cyan-100 text-gray-700 border-b-2 border-cyan-200">
                    <th className="p-4 font-bold">Nombre</th>
                    <th className="p-4 font-bold">Descripción</th>
                    <th className="p-4 font-bold">Código</th>
                    <th className="p-4 font-bold text-center">Opciones</th>
                  </tr>
                </thead>
                <tbody>
                  {salas.map((sala) => (
                    <tr key={sala.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-semibold text-gray-800">{sala.name}</td>
                      <td className="p-4 text-gray-600">{sala.descripcion}</td>
                      <td className="p-4 text-gray-600 font-mono font-bold tracking-wider">{sala.invitacion}</td>
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => irAPizarra(sala.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium text-sm transition-colors">
                          Diagrama
                        </button>
                        {/* BOTÓN EXPORTAR SPRING BOOT */}
                        <button onClick={() => handleExportarSpring(sala.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-medium text-sm transition-colors flex items-center gap-1">
                          <Download className="w-4 h-4" /> Exportar
                        </button>
                        {/* BOTÓN ELIMINAR SALA */}
                        <button onClick={() => handleEliminarSala(sala.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded font-medium text-sm transition-colors flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* MODAL NUEVA SALA */}
      {modalNuevaSala && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
            <div className="bg-emerald-700 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Crear Nueva Sala</h3>
              <button onClick={() => setModalNuevaSala(false)} className="hover:text-emerald-200"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCrearSala} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Sala</label>
                <input required type="text" value={nombreSala} onChange={(e) => setNombreSala(e.target.value)} className="w-full border border-gray-300 rounded p-2 focus:border-emerald-500 focus:outline-none" placeholder="Ej. Proyecto Final" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                <textarea value={descSala} onChange={(e) => setDescSala(e.target.value)} className="w-full border border-gray-300 rounded p-2 focus:border-emerald-500 focus:outline-none resize-none h-24" placeholder="Ej. Diagramas para el sistema de ventas..."></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModalNuevaSala(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors shadow">Crear Sala</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UNIRSE */}
      {modalUnirse && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
            <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Unirse a una Sala</h3>
              <button onClick={() => setModalUnirse(false)} className="hover:text-gray-300"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleUnirseSala} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código de Invitación</label>
                <input required type="text" value={codigoSala} onChange={(e) => setCodigoSala(e.target.value.toUpperCase())} className="w-full border-2 border-gray-300 rounded p-3 text-center text-xl font-mono tracking-widest uppercase focus:border-blue-500 focus:outline-none" placeholder="EJ: 5ZJACL" />
                <p className="text-xs text-gray-500 mt-2 text-center">Pídele a tu compañero el código de 6 caracteres de su sala.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModalUnirse(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow">Unirme Ahora</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}