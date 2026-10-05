import os
import psycopg
from psycopg.rows import dict_row


def conectar():
    conexion = psycopg.connect(
        os.environ["DATABASE_URL"],
        row_factory=dict_row
    )
    return conexion


def crear_tablas():
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jugadores (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            nombre TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS partidos (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            fecha TEXT NOT NULL,
            goles_a INTEGER NOT NULL,
            goles_b INTEGER NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS partido_jugadores (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            partido_id INTEGER NOT NULL,
            jugador_id INTEGER NOT NULL,
            lado TEXT NOT NULL,
            FOREIGN KEY (partido_id) REFERENCES partidos(id),
            FOREIGN KEY (jugador_id) REFERENCES jugadores(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goles (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            partido_id INTEGER NOT NULL,
            jugador_id INTEGER NOT NULL,
            minuto INTEGER NOT NULL,
            lado TEXT NOT NULL,
            FOREIGN KEY (partido_id) REFERENCES partidos(id),
            FOREIGN KEY (jugador_id) REFERENCES jugadores(id)
        )
    """)

    conexion.commit()
    conexion.close()