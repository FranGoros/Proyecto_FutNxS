from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import crear_tablas, conectar
from pydantic import BaseModel

app = FastAPI(title="Fútbol 5 Stats")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

crear_tablas()

class Jugador(BaseModel):
    nombre: str
    
class Partido(BaseModel):
    fecha: str
    goles_a: int
    goles_b: int

# ENDPOINTS

# Inicio
@app.get("/")
def inicio():
    return {
        "mensaje": "FutNxS funcionando"
    }


# Crea un jugador y lo agrega a la tabla jugadores
@app.post("/jugadores")
def crear_jugador(jugador: Jugador):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        "INSERT INTO jugadores (nombre) VALUES (?)",
        (jugador.nombre,)
    )

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Jugador creado",
        "nombre": jugador.nombre
    }

# Elimina un jugador de la tabla jugadores
@app.delete("/jugadores/{jugador_id}")
def eliminar_jugador(jugador_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        "SELECT * FROM jugadores WHERE id = ?",
        (jugador_id,)
    )

    jugador = cursor.fetchone()

    if jugador is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Jugador no encontrado"
        )

    cursor.execute(
        "DELETE FROM jugadores WHERE id = ?",
        (jugador_id,)
    )

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Jugador eliminado"
    }

# Muestra los jugadores de la tabla jugadores
@app.get("/jugadores")
def listar_jugadores():
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute("SELECT * FROM jugadores")
    jugadores = cursor.fetchall()

    conexion.close()

    return [dict(jugador) for jugador in jugadores]


# Crea un partido y lo agrega a la tabla partidos
@app.post("/partidos")
def crear_partido(partido: Partido):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        INSERT INTO partidos (fecha, goles_a, goles_b)
        VALUES (?, ?, ?)
        """,
        (
            partido.fecha,
            partido.goles_a,
            partido.goles_b
        )
    )

    conexion.commit()

    partido_id = cursor.lastrowid

    conexion.close()

    return {
        "mensaje": "Partido creado",
        "id": partido_id,
        "fecha": partido.fecha,
        "resultado": f"{partido.goles_a} - {partido.goles_b}"
    }
    

# Agrega una fila a la tabla partido_jugadores con un jugador de la tabla jugadores, un partido de la tabla partidos y se le asigna un lado A o B
@app.post("/partidos/{partido_id}/jugadores")
def agregar_jugador_al_partido(
    partido_id: int,
    jugador_id: int,
    lado: str
):
    
    lado = lado.upper()
    
    if lado not in ["A", "B"]:
        raise HTTPException(
            status_code=400,
            detail="El lado debe ser A o B"
        )

    conexion = conectar()
    cursor = conexion.cursor()

    # Verificar que el partido existe
    cursor.execute(
        "SELECT id FROM partidos WHERE id = ?",
        (partido_id,)
    )

    if cursor.fetchone() is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Partido no encontrado"
        )

    # Verificar que el jugador existe
    cursor.execute(
        "SELECT id FROM jugadores WHERE id = ?",
        (jugador_id,)
    )

    if cursor.fetchone() is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Jugador no encontrado"
        )

    cursor.execute(
        """
        INSERT INTO partido_jugadores
        (partido_id, jugador_id, lado)
        VALUES (?, ?, ?)
        """,
        (partido_id, jugador_id, lado)
    )

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Jugador agregado al partido",
        "partido_id": partido_id,
        "jugador_id": jugador_id,
        "lado": lado
    }


# Muestra los jugadores que jugaron un partido y su lado
@app.get("/partidos/{partido_id}/jugadores")
def listar_jugadores_del_partido(partido_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    # Verificar que el partido existe
    cursor.execute(
        "SELECT id FROM partidos WHERE id = ?",
        (partido_id,)
    )

    if cursor.fetchone() is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Partido no encontrado"
        )

    cursor.execute(
        """
        SELECT partido_jugadores.id,
               partido_jugadores.jugador_id,
               jugadores.nombre,
               partido_jugadores.lado
        FROM partido_jugadores
        JOIN jugadores
        ON partido_jugadores.jugador_id = jugadores.id
        WHERE partido_jugadores.partido_id = ?
        """,
        (partido_id,)
    )

    jugadores = cursor.fetchall()

    conexion.close()

    return [dict(jugador) for jugador in jugadores]


# Elimina una fila de la tabla partidos_jugados
@app.delete("/partidos/{partido_id}/jugadores/{jugador_id}")
def eliminar_jugador_del_partido(partido_id: int, jugador_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    # Verificar que el partido existe
    cursor.execute(
        "SELECT id FROM partidos WHERE id = ?",
        (partido_id,)
    )

    if cursor.fetchone() is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Partido no encontrado"
        )

    cursor.execute(
        """
        DELETE FROM partido_jugadores
        WHERE partido_id = ? AND jugador_id = ?
        """,
        (partido_id, jugador_id)
    )

    filas_borradas = cursor.rowcount

    conexion.commit()
    conexion.close()

    if filas_borradas == 0:
        raise HTTPException(
            status_code=404,
            detail="No se encontró ese jugador en ese partido"
        )

    return {
        "mensaje": "Jugador eliminado del partido"
    }


# Agrega un gol a la tabla goles(id, partido, jugador, minuto, lado)
@app.post("/partidos/{partido_id}/goles")
def agregar_gol(
    partido_id: int,
    jugador_id: int,
    minuto: int,
    lado: str
):
    lado = lado.upper()

    if lado not in ["A", "B"]:
        raise HTTPException(
            status_code=400,
            detail="El lado debe ser A o B"
        )

    conexion = conectar()
    cursor = conexion.cursor()

    # Verificar que el partido existe
    cursor.execute(
        "SELECT id FROM partidos WHERE id = ?",
        (partido_id,)
    )

    if cursor.fetchone() is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Partido no encontrado"
        )

    # Verificar que el jugador existe
    cursor.execute(
        "SELECT id FROM jugadores WHERE id = ?",
        (jugador_id,)
    )

    if cursor.fetchone() is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Jugador no encontrado"
        )

    cursor.execute(
        """
        INSERT INTO goles
        (partido_id, jugador_id, minuto, lado)
        VALUES (?, ?, ?, ?)
        """,
        (partido_id, jugador_id, minuto, lado)
    )

    conexion.commit()

    gol_id = cursor.lastrowid

    conexion.close()

    return {
        "mensaje": "Gol registrado",
        "id": gol_id,
        "partido_id": partido_id,
        "jugador_id": jugador_id,
        "minuto": minuto,
        "lado": lado
    }


# Devuelve etsadisticas de un partido 
@app.get("/partidos/{partido_id}/goles")
def listar_goles(partido_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    # Verificar que el partido existe
    cursor.execute(
        "SELECT id FROM partidos WHERE id = ?",
        (partido_id,)
    )

    if cursor.fetchone() is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Partido no encontrado"
        )

    cursor.execute(
        """
        SELECT goles.id,
               jugadores.nombre,
               goles.minuto,
               goles.lado
        FROM goles
        JOIN jugadores
        ON goles.jugador_id = jugadores.id
        WHERE goles.partido_id = ?
        ORDER BY goles.minuto
        """,
        (partido_id,)
    )

    goles = cursor.fetchall()

    conexion.close()

    return [dict(gol) for gol in goles]


# Elimina un gol de la tabla goles
@app.delete("/partidos/{partido_id}/goles/{gol_id}")
def eliminar_gol(partido_id: int, gol_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    # Verificar que el partido existe
    cursor.execute(
        "SELECT id FROM partidos WHERE id = ?",
        (partido_id,)
    )

    if cursor.fetchone() is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Partido no encontrado"
        )

    cursor.execute(
        """
        DELETE FROM goles
        WHERE id = ? AND partido_id = ?
        """,
        (gol_id, partido_id)
    )

    filas_borradas = cursor.rowcount

    conexion.commit()
    conexion.close()

    if filas_borradas == 0:
        raise HTTPException(
            status_code=404,
            detail="No se encontró ese gol en ese partido"
        )

    return {
        "mensaje": "Gol eliminado"
    }
    

# Devuelve los partidos jugados, goles y goles por partido de un jugador
@app.get("/jugadores/{jugador_id}/estadisticas")
def estadisticas_jugador(jugador_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    # Buscar jugador
    cursor.execute(
        "SELECT nombre FROM jugadores WHERE id = ?",
        (jugador_id,)
    )

    jugador = cursor.fetchone()

    if jugador is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Jugador no encontrado"
        )

    # Cantidad de partidos
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM partido_jugadores
        WHERE jugador_id = ?
        """,
        (jugador_id,)
    )

    partidos_jugados = cursor.fetchone()[0]

    # Cantidad de goles
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM goles
        WHERE jugador_id = ?
        """,
        (jugador_id,)
    )

    goles = cursor.fetchone()[0]

    conexion.close()

    if partidos_jugados > 0:
        goles_por_partido = round(goles / partidos_jugados, 2)
    else:
        goles_por_partido = 0

    return {
        "jugador": jugador["nombre"],
        "partidos_jugados": partidos_jugados,
        "goles": goles,
        "goles_por_partido": goles_por_partido
    }
    
# Devuelve un ranking de goleadores
@app.get("/estadisticas/goleadores")
def ranking_goleadores():
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT jugadores.id,
               jugadores.nombre,
               COUNT(goles.id) AS goles
        FROM jugadores
        LEFT JOIN goles
        ON jugadores.id = goles.jugador_id
        GROUP BY jugadores.id, jugadores.nombre
        ORDER BY goles DESC, jugadores.nombre ASC
        """
    )

    goleadores = cursor.fetchall()

    conexion.close()

    return [dict(jugador) for jugador in goleadores]


# Devuelve historial BASICO de partidos
@app.get("/partidos")
def listar_partidos():
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT *
        FROM partidos
        ORDER BY fecha DESC
        """
    )

    partidos = cursor.fetchall()

    conexion.close()

    return [dict(partido) for partido in partidos]



# Devuelve historial COMPLETO de partidos
@app.get("/partidos/{partido_id}")
def detalle_partido(partido_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    # Buscar el partido
    cursor.execute(
        """
        SELECT *
        FROM partidos
        WHERE id = ?
        """,
        (partido_id,)
    )

    partido = cursor.fetchone()

    if partido is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Partido no encontrado"
        )

    # Buscar jugadores del partido
    cursor.execute(
        """
        SELECT jugadores.id,
               jugadores.nombre,
               partido_jugadores.lado
        FROM partido_jugadores
        JOIN jugadores
        ON partido_jugadores.jugador_id = jugadores.id
        WHERE partido_jugadores.partido_id = ?
        """,
        (partido_id,)
    )

    jugadores = cursor.fetchall()

    # Buscar goles
    cursor.execute(
        """
        SELECT goles.id,
               jugadores.nombre,
               goles.minuto,
               goles.lado
        FROM goles
        JOIN jugadores
        ON goles.jugador_id = jugadores.id
        WHERE goles.partido_id = ?
        ORDER BY goles.minuto
        """,
        (partido_id,)
    )

    goles = cursor.fetchall()

    conexion.close()

    equipo_a = []
    equipo_b = []

    for jugador in jugadores:
        datos = {
            "id": jugador["id"],
            "nombre": jugador["nombre"]
        }

        if jugador["lado"] == "A":
            equipo_a.append(datos)
        else:
            equipo_b.append(datos)

    return {
        "id": partido["id"],
        "fecha": partido["fecha"],
        "resultado": {
            "equipo_a": partido["goles_a"],
            "equipo_b": partido["goles_b"]
        },
        "jugadores": {
            "A": equipo_a,
            "B": equipo_b
        },
        "goles": [dict(gol) for gol in goles]
    }
    
# Elimina un partido, sus goles y jugadores asociados
@app.delete("/partidos/{partido_id}")
def eliminar_partido(partido_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    # Verificar que el partido existe
    cursor.execute(
        "SELECT id FROM partidos WHERE id = ?",
        (partido_id,)
    )

    if cursor.fetchone() is None:
        conexion.close()
        raise HTTPException(
            status_code=404,
            detail="Partido no encontrado"
        )

    # Borrar goles del partido
    cursor.execute(
        """
        DELETE FROM goles
        WHERE partido_id = ?
        """,
        (partido_id,)
    )

    # Borrar jugadores asociados al partido
    cursor.execute(
        """
        DELETE FROM partido_jugadores
        WHERE partido_id = ?
        """,
        (partido_id,)
    )

    # Borrar el partido
    cursor.execute(
        """
        DELETE FROM partidos
        WHERE id = ?
        """,
        (partido_id,)
    )

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Partido eliminado correctamente"
    }