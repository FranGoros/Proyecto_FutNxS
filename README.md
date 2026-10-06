# FutNxS

FutNxS es una aplicación web para llevar el registro de partidos de fútbol 5 entre amigos.

Permite guardar jugadores, partidos, resultados, equipos y goles individuales. También cuenta con un historial de partidos y estadísticas de los jugadores.

# Funcionalidades

- Crear y eliminar jugadores.
- Registrar partidos.
- Asignar jugadores al equipo A o B.
- Registrar goles individuales.
- Ver el historial de partidos.
- Modificar partidos.
- Eliminar partidos.
- Consultar estadísticas de jugadores.
- Ver el ranking de goleadores.

# Tecnologías

**Backend**
- Python
- FastAPI
- PostgreSQL
- Psycopg
- Uvicorn

**Frontend**
- HTML
- CSS
- JavaScript

**Otros**
- Git
- GitHub
- Render

# Estructura

```text
Proyecto_FutNxS/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── img/
│
└── README.md
```

# Aplicación

Frontend:

https://futnxs-app.onrender.com

API:

https://futnxs.onrender.com

Documentación de la API:

https://futnxs.onrender.com/docs

# Ejecutar el proyecto

# Backend

Entrar a la carpeta `backend`:

```bash
cd backend
```

Crear el entorno virtual:

```bash
python -m venv env
```

Activarlo en Windows:

```powershell
.\env\Scripts\Activate.ps1
```

Instalar las dependencias:

```bash
python -m pip install -r requirements.txt
```

Configurar la variable de entorno `DATABASE_URL` con la URL de conexión a PostgreSQL.

Ejecutar el servidor:

```bash
python -m uvicorn main:app --reload
```

La API estará disponible en:

```text
http://127.0.0.1:8000
```

La documentación de FastAPI:

```text
http://127.0.0.1:8000/docs
```

# Frontend

Entrar a la carpeta `frontend`:

```bash
cd frontend
```

Ejecutar un servidor local:

```bash
python -m http.server 5500
```

Abrir en el navegador:

```text
http://127.0.0.1:5500
```

# Principales endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/jugadores` | Obtener jugadores |
| POST | `/jugadores` | Crear jugador |
| DELETE | `/jugadores/{id}` | Eliminar jugador |
| GET | `/partidos` | Obtener partidos |
| POST | `/partidos` | Crear partido |
| GET | `/partidos/{id}` | Obtener un partido |
| PUT | `/partidos/{id}` | Modificar un partido |
| DELETE | `/partidos/{id}` | Eliminar un partido |
| GET | `/estadisticas/goleadores` | Obtener goleadores |

También existen endpoints para gestionar los jugadores y goles de cada partido.

# Objetivo

El objetivo de FutNxS es facilitar el registro de los partidos de fútbol 5 entre amigos y mantener un historial con las estadísticas de cada jugador.

El proyecto fue desarrollado como práctica de desarrollo web, utilizando una API REST con FastAPI, un frontend en HTML, CSS y JavaScript, y PostgreSQL como base de datos.

# Autor

//Francisco Gorostegui//

GitHub: https://github.com/FranGoros