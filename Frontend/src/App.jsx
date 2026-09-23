// src/App.jsx
// Este archivo es el punto de entrada principal de nuestra aplicación React.
// Aquí configuramos las rutas y la navegación entre las diferentes páginas.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro'; // <-- ¡IMPORTANTE! Importamos la nueva página
import Salas from './pages/Salas';
import Pizarra from './pages/Pizarra';

function App() {
  // Verificamos de verdad si el usuario tiene un Token de sesión activo
  const token = localStorage.getItem('token');
  const estaAutenticado = !!token; 

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} /> {/* <-- RUTA DE REGISTRO AGREGADA */}

          {/* Rutas Protegidas */}
          <Route 
            path="/salas" 
            element={estaAutenticado ? <Salas /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/sala/:id" 
            element={estaAutenticado ? <Pizarra /> : <Navigate to="/login" />} 
          />

          {/* Redirecciones por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/salas" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;