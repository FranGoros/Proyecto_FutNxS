from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import crear_tablas, conectar
from pydantic import BaseModel


app = FastAPI(title="Fútbol 5 Stats")


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "https://futnxs-app.onrender.com"
    ],
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


class JugadorPartidoModificar(BaseModel):
    jugador_id: int
    lado: str


class GolModificar(BaseModel):
    jugador_id: int
    minuto: int
    lado: str


class PartidoModificar(BaseModel):
    fecha: str
    goles_a: int
    goles_b: int
    jugadores: list[JugadorPartidoModificar]
    goles: list[GolModificar]


# =========================
# INICIO
# =========================

@app.get("/")
def inicio():
    return {
        "mensaje": "FutNxS funcionando"
    }


# =========================
# JUGADORES
# =========================

@app.post("/jugadores")
def crear_jugador(jugador: Jugador):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        INSERT INTO jugadores (nombre)
        VALUES (%s)
        """,
        (jugador.nombre,)
    )

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Jugador creado",
        "nombre": jugador.nombre
    }


@app.delete("/jugadores/{jugador_id}")
def eliminar_jugador(jugador_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT *
        FROM jugadores
        WHERE id = %s
        """,
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
        """
        DELETE FROM jugadores
        WHERE id = %s
        """,
        (jugador_id,)
    )

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Jugador eliminado"
    }


@app.get("/jugadores")
def listar_jugadores():
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT *
        FROM jugadores
        ORDER BY id
        """
    )

    jugadores = cursor.fetchall()

    conexion.close()

    return jugadores


# =========================
# PARTIDOS
# =========================

@app.post("/partidos")
def crear_partido(partido: Partido):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        INSERT INTO partidos
        (fecha, goles_a, goles_b)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (
            partido.fecha,
            partido.goles_a,
            partido.goles_b
        )
    )

    partido_id = cursor.fetchone()["id"]

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Partido creado",
        "id": partido_id,
        "fecha": partido.fecha,
        "resultado": f"{partido.goles_a} - {partido.goles_b}"
    }


# =========================
# JUGADORES DEL PARTIDO
# =========================

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

    cursor.execute(
        """
        SELECT id
        FROM partidos
        WHERE id = %s
        """,
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
        SELECT id
        FROM jugadores
        WHERE id = %s
        """,
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
        VALUES (%s, %s, %s)
        """,
        (
            partido_id,
            jugador_id,
            lado
        )
    )

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Jugador agregado al partido",
        "partido_id": partido_id,
        "jugador_id": jugador_id,
        "lado": lado
    }


@app.get("/partidos/{partido_id}/jugadores")
def listar_jugadores_del_partido(partido_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT id
        FROM partidos
        WHERE id = %s
        """,
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
        WHERE partido_jugadores.partido_id = %s
        """,
        (partido_id,)
    )

    jugadores = cursor.fetchall()

    conexion.close()

    return jugadores


@app.delete("/partidos/{partido_id}/jugadores/{jugador_id}")
def eliminar_jugador_del_partido(
    partido_id: int,
    jugador_id: int
):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT id
        FROM partidos
        WHERE id = %s
        """,
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
        WHERE partido_id = %s
        AND jugador_id = %s
        """,
        (
            partido_id,
            jugador_id
        )
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


# =========================
# GOLES
# =========================

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

    cursor.execute(
        """
        SELECT id
        FROM partidos
        WHERE id = %s
        """,
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
        SELECT id
        FROM jugadores
        WHERE id = %s
        """,
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
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """,
        (
            partido_id,
            jugador_id,
            minuto,
            lado
        )
    )

    gol_id = cursor.fetchone()["id"]

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Gol registrado",
        "id": gol_id,
        "partido_id": partido_id,
        "jugador_id": jugador_id,
        "minuto": minuto,
        "lado": lado
    }


@app.get("/partidos/{partido_id}/goles")
def listar_goles(partido_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT id
        FROM partidos
        WHERE id = %s
        """,
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
               goles.jugador_id,
               jugadores.nombre,
               goles.minuto,
               goles.lado
        FROM goles
        JOIN jugadores
        ON goles.jugador_id = jugadores.id
        WHERE goles.partido_id = %s
        ORDER BY goles.minuto
        """,
        (partido_id,)
    )

    goles = cursor.fetchall()

    conexion.close()

    return goles


@app.delete("/partidos/{partido_id}/goles/{gol_id}")
def eliminar_gol(
    partido_id: int,
    gol_id: int
):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT id
        FROM partidos
        WHERE id = %s
        """,
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
        WHERE id = %s
        AND partido_id = %s
        """,
        (
            gol_id,
            partido_id
        )
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


# =========================
# ESTADISTICAS
# =========================

@app.get("/jugadores/{jugador_id}/estadisticas")
def estadisticas_jugador(jugador_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT nombre
        FROM jugadores
        WHERE id = %s
        """,
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
        """
        SELECT COUNT(*) AS cantidad
        FROM partido_jugadores
        WHERE jugador_id = %s
        """,
        (jugador_id,)
    )

    partidos_jugados = cursor.fetchone()["cantidad"]

    cursor.execute(
        """
        SELECT COUNT(*) AS cantidad
        FROM goles
        WHERE jugador_id = %s
        """,
        (jugador_id,)
    )

    goles = cursor.fetchone()["cantidad"]

    conexion.close()

    if partidos_jugados > 0:
        goles_por_partido = round(
            goles / partidos_jugados,
            2
        )
    else:
        goles_por_partido = 0

    return {
        "jugador": jugador["nombre"],
        "partidos_jugados": partidos_jugados,
        "goles": goles,
        "goles_por_partido": goles_por_partido
    }


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

    return goleadores


# =========================
# HISTORIAL
# =========================

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

    return partidos


@app.get("/partidos/{partido_id}")
def detalle_partido(partido_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT *
        FROM partidos
        WHERE id = %s
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

    cursor.execute(
        """
        SELECT jugadores.id,
               jugadores.nombre,
               partido_jugadores.lado
        FROM partido_jugadores
        JOIN jugadores
        ON partido_jugadores.jugador_id = jugadores.id
        WHERE partido_jugadores.partido_id = %s
        """,
        (partido_id,)
    )

    jugadores = cursor.fetchall()

    cursor.execute(
        """
        SELECT goles.id,
               jugadores.nombre,
               goles.minuto,
               goles.lado
        FROM goles
        JOIN jugadores
        ON goles.jugador_id = jugadores.id
        WHERE goles.partido_id = %s
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
        "goles": goles
    }


# =========================
# ELIMINAR PARTIDO
# =========================

@app.delete("/partidos/{partido_id}")
def eliminar_partido(partido_id: int):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT id
        FROM partidos
        WHERE id = %s
        """,
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
        WHERE partido_id = %s
        """,
        (partido_id,)
    )

    cursor.execute(
        """
        DELETE FROM partido_jugadores
        WHERE partido_id = %s
        """,
        (partido_id,)
    )

    cursor.execute(
        """
        DELETE FROM partidos
        WHERE id = %s
        """,
        (partido_id,)
    )

    conexion.commit()
    conexion.close()

    return {
        "mensaje": "Partido eliminado correctamente"
    }

# =========================
# MODIFICAR PARTIDO
# =========================

@app.put("/partidos/{partido_id}")
def modificar_partido(
    partido_id: int,
    partido: PartidoModificar
):
    conexion = conectar()
    cursor = conexion.cursor()

    try:

        # Verificar que exista el partido
        cursor.execute(
            """
            SELECT id
            FROM partidos
            WHERE id = %s
            """,
            (partido_id,)
        )

        if cursor.fetchone() is None:
            raise HTTPException(
                status_code=404,
                detail="Partido no encontrado"
            )

        # Validar resultado
        if partido.goles_a < 0 or partido.goles_b < 0:
            raise HTTPException(
                status_code=400,
                detail="Los goles no pueden ser negativos"
            )

        # Actualizar fecha y resultado
        cursor.execute(
            """
            UPDATE partidos
            SET fecha = %s,
                goles_a = %s,
                goles_b = %s
            WHERE id = %s
            """,
            (
                partido.fecha,
                partido.goles_a,
                partido.goles_b,
                partido_id
            )
        )

        # Borrar jugadores anteriores
        cursor.execute(
            """
            DELETE FROM partido_jugadores
            WHERE partido_id = %s
            """,
            (partido_id,)
        )

        # Volver a cargar jugadores
        for jugador in partido.jugadores:

            lado = jugador.lado.upper()

            if lado not in ["A", "B"]:
                raise HTTPException(
                    status_code=400,
                    detail="El lado debe ser A o B"
                )

            cursor.execute(
                """
                SELECT id
                FROM jugadores
                WHERE id = %s
                """,
                (jugador.jugador_id,)
            )

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Jugador no encontrado"
                )

            cursor.execute(
                """
                INSERT INTO partido_jugadores
                (partido_id, jugador_id, lado)
                VALUES (%s, %s, %s)
                """,
                (
                    partido_id,
                    jugador.jugador_id,
                    lado
                )
            )

        # Borrar goles anteriores
        cursor.execute(
            """
            DELETE FROM goles
            WHERE partido_id = %s
            """,
            (partido_id,)
        )

        # Volver a cargar goles
        for gol in partido.goles:

            lado = gol.lado.upper()

            if lado not in ["A", "B"]:
                raise HTTPException(
                    status_code=400,
                    detail="El lado debe ser A o B"
                )

            if gol.minuto < 0:
                raise HTTPException(
                    status_code=400,
                    detail="El minuto no puede ser negativo"
                )

            cursor.execute(
                """
                SELECT id
                FROM jugadores
                WHERE id = %s
                """,
                (gol.jugador_id,)
            )

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Jugador del gol no encontrado"
                )

            cursor.execute(
                """
                INSERT INTO goles
                (partido_id, jugador_id, minuto, lado)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    partido_id,
                    gol.jugador_id,
                    gol.minuto,
                    lado
                )
            )

        conexion.commit()

        return {
            "mensaje": "Partido modificado correctamente",
            "id": partido_id
        }

    except HTTPException:
        conexion.rollback()
        raise

    except Exception as error:
        conexion.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        conexion.close()