// src/pages/Login.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Settings } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarLogin = async (e) => {
    e.preventDefault(); // Evita recargar la página
    setError('');
    setCargando(true);

    try {
      // Realiza la solicitud al backend para autenticar al usuario
      const respuesta = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), 
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        // Muestra el error exacto que devuelva el backend
        throw new Error(data.message || data.error || 'Credenciales incorrectas');
      }

      // Si todo sale bien, guardamos el token
      localStorage.setItem('token', data.token);
      
      // SOLUCIÓN: Forzamos la redirección nativa para asegurar que la app 
      // se monte de nuevo y lea el token correctamente sin rebotar al usuario.
      window.location.href = '/salas';

    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-emerald-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold tracking-wide">Diagramador de Clases UML</h1>
        <div className="flex gap-4">
          <HelpCircle className="w-6 h-6 cursor-pointer hover:text-emerald-200 transition-colors" />
          <Settings className="w-6 h-6 cursor-pointer hover:text-emerald-200 transition-colors" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-gray-100">
          
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 tracking-wide">ACCESO</h2>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded text-sm shadow-sm">
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={manejarLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={cargando}
              className={`w-full text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-colors text-sm ${cargando ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Aún no tienes una cuenta?{' '}
              <Link to="/registro" className="text-blue-600 hover:text-blue-800 font-semibold">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}