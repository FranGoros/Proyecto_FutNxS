import sqlite3


def conectar():
    conexion = sqlite3.connect("futbol5.db")
    conexion.row_factory = sqlite3.Row
    return conexion


def crear_tablas():
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jugadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS partidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            goles_a INTEGER NOT NULL,
            goles_b INTEGER NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS partido_jugadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            partido_id INTEGER NOT NULL,
            jugador_id INTEGER NOT NULL,
            lado TEXT NOT NULL,
            FOREIGN KEY (partido_id) REFERENCES partidos(id),
            FOREIGN KEY (jugador_id) REFERENCES jugadores(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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