# Diagramador de Clases UML Colaborativo y Generador de Backend en Spring Boot

Una aplicación web interactiva que permite a equipos de desarrollo diseñar diagramas de clases UML de forma colaborativa y en tiempo real. Incluye generación automática de código para proyectos Spring Boot y un asistente de Inteligencia Artificial.

## Características Principales

* Colaboración en Tiempo Real: Varios usuarios pueden editar el mismo diagrama simultáneamente gracias a WebSockets.
* Autenticación Segura: Sistema de registro e inicio de sesión protegido con encriptación bcrypt y JSON Web Tokens (JWT).
* Gestión de Salas: Crea salas de trabajo privadas o únete a las de tus compañeros mediante códigos de invitación de 6 caracteres.
* Autoguardado Silencioso: Los diagramas se guardan automáticamente en la base de datos con cada cambio realizado en el lienzo.
* Generación de Código (Spring Boot): Exporta el diagrama completo directamente a un proyecto Java Spring Boot empaquetado en un archivo `.zip` con sus Entidades, DTOs, Repositorios, Servicios y Controladores listos para usar.
* Asistente de Inteligencia Artificial: Genera clases y relaciones automáticamente mediante prompts de texto o dictado por voz.

## Tecnologías Utilizadas

**Frontend:**
*   React (con Vite)
*   React Flow (Lienzo interactivo de nodos y aristas)
*   Tailwind CSS (Estilos y diseño UI)
*   Lucide React (Iconografía)
*   Socket.io-client (Conexión en tiempo real)

**Backend:**
*   Node.js con Express
*   Socket.io (Servidor de WebSockets)
*   PostgreSQL (Base de datos relacional)
*   Bcrypt & JsonWebToken (Seguridad y autenticación)
*   EJS & Archiver (Motor de plantillas para Java y compresión de archivos ZIP)

---

## Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

### 1. Requisitos Previos
*   [Node.js](https://nodejs.org/) (v16 o superior)
*   [PostgreSQL](https://www.postgresql.org/) (v13 o superior)

### 2. Configuración de la Base de Datos
Crea una base de datos en PostgreSQL y ejecuta el siguiente esquema básico para crear las tablas necesarias:

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    descripcion TEXT,
    invitacion VARCHAR(50) UNIQUE,
    diagrama JSONB DEFAULT '{}',
    ownerid INTEGER REFERENCES usuarios(id)
);

CREATE TABLE user_room (
    user_id INTEGER REFERENCES usuarios(id),
    room_id INTEGER REFERENCES rooms(id),
    PRIMARY KEY (user_id, room_id)
);