const Database = require("better-sqlite3");
const path = require("path");

// =====================================
// RUTA DE LA BASE DE DATOS
// =====================================

const dbPath = path.join(
    __dirname,
    "database",
    "inventario.db"
);
// =====================================
// CONEXIÓN
// =====================================

const db = new Database(dbPath);

// Activar claves foráneas
db.pragma("foreign_keys = ON");

console.log("Base de datos conectada correctamente.");

// =====================================
// CREAR TABLA: USUARIOS
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'USUARIO',
        estado TEXT NOT NULL DEFAULT 'ACTIVO',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// =====================================
// CREAR TABLA: PERMISOS
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS permisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        estado TEXT NOT NULL DEFAULT 'ACTIVO',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// =====================================
// CREAR TABLA: USUARIO_PERMISOS
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS usuario_permisos (
        usuario_id INTEGER NOT NULL,
        permiso_id INTEGER NOT NULL,
        fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (
            usuario_id,
            permiso_id
        ),

        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE,

        FOREIGN KEY (permiso_id)
            REFERENCES permisos(id)
            ON DELETE CASCADE
    );
`);

// =====================================
// CREAR / VERIFICAR PERMISOS
// =====================================

const permisosIniciales = [
    [
        "PRODUCTOS_VER",
        "Ver productos",
        "Permite consultar y visualizar productos."
    ],
    [
        "PRODUCTOS_CREAR",
        "Crear productos",
        "Permite registrar nuevos productos."
    ],
    [
        "PRODUCTOS_EDITAR",
        "Editar productos",
        "Permite modificar productos existentes."
    ],
    [
        "PRODUCTOS_BAJA",
        "Dar de baja productos",
        "Permite cambiar el estado de los productos."
    ],
    [
        "CATEGORIAS_VER",
        "Ver categorías",
        "Permite consultar y visualizar categorías."
    ],
    [
        "CATEGORIAS_CREAR",
        "Crear categorías",
        "Permite registrar nuevas categorías."
    ],
    [
        "CATEGORIAS_EDITAR",
        "Editar categorías",
        "Permite modificar categorías existentes."
    ],
    [
        "CATEGORIAS_ESTADO",
        "Cambiar estado de categorías",
        "Permite activar o desactivar categorías."
    ],
    [
        "UBICACIONES_VER",
        "Ver ubicaciones",
        "Permite consultar y visualizar ubicaciones."
    ],
    [
        "UBICACIONES_CREAR",
        "Crear ubicaciones",
        "Permite registrar nuevas ubicaciones."
    ],
    [
        "USUARIOS_VER",
        "Ver usuarios",
        "Permite consultar usuarios."
    ],
    [
        "USUARIOS_CREAR",
        "Crear usuarios",
        "Permite crear nuevos usuarios."
    ],
    [
        "USUARIOS_EDITAR",
        "Editar usuarios",
        "Permite modificar usuarios."
    ],
    [
        "USUARIOS_PERMISOS",
        "Gestionar permisos",
        "Permite asignar y modificar permisos de usuarios."
    ],
        [
        "USUARIOS_ESTADO",
        "Cambiar estado de usuarios",
        "Permite activar o desactivar usuarios."
    ],
    [
        "HISTORIAL_VER",
        "Ver historial",
        "Permite consultar el historial de movimientos."
    ]
];

const insertarPermiso = db.prepare(`
    INSERT OR IGNORE INTO permisos (
        codigo,
        nombre,
        descripcion
    )
    VALUES (?, ?, ?)
`);

const insertarPermisos = db.transaction(() => {

    for (const permiso of permisosIniciales) {

        insertarPermiso.run(
            permiso[0],
            permiso[1],
            permiso[2]
        );

    }

});

insertarPermisos();

console.log(
    "Permisos iniciales verificados correctamente."
);



// =====================================
// CREAR TABLA: CATEGORIAS
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        estado TEXT NOT NULL DEFAULT 'ACTIVO',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// =====================================
// CATEGORIAS INICIALES
// =====================================

const cantidadCategorias = db
    .prepare(`
        SELECT COUNT(*) AS total
        FROM categorias
    `)
    .get();

if (cantidadCategorias.total === 0) {

    const insertarCategoria = db.prepare(`
        INSERT INTO categorias (
            nombre,
            descripcion
        )
        VALUES (?, ?)
    `);

    const categoriasIniciales = [
        [
            "Computadores",
            "Equipos de cómputo"
        ],
        [
            "Monitores",
            "Monitores y pantallas"
        ],
        [
            "Periféricos",
            "Teclados, mouse y otros periféricos"
        ],
        [
            "Impresoras",
            "Impresoras y equipos de impresión"
        ],
        [
            "Telefonía",
            "Teléfonos y dispositivos móviles"
        ],
        [
            "Redes",
            "Equipos de red"
        ],
        [
            "Otros",
            "Otros equipos"
        ]
    ];

    const insertarCategorias = db.transaction(() => {

        for (const categoria of categoriasIniciales) {

            insertarCategoria.run(
                categoria[0],
                categoria[1]
            );

        }

    });

    insertarCategorias();

    console.log(
        "Categorías iniciales creadas correctamente."
    );
}

// =====================================
// CREAR TABLA: UBICACIONES
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS ubicaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        estado TEXT NOT NULL DEFAULT 'ACTIVO',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// =====================================
// CREAR TABLA: PRODUCTOS
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        marca TEXT,
        modelo TEXT,
        serial TEXT UNIQUE,
        descripcion TEXT,
        categoria_id INTEGER,
        ubicacion_id INTEGER,
        estado TEXT NOT NULL DEFAULT 'DISPONIBLE',
        codigo_interno TEXT NOT NULL UNIQUE,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (categoria_id)
            REFERENCES categorias(id),

        FOREIGN KEY (ubicacion_id)
            REFERENCES ubicaciones(id)
    );
`);

// =====================================
// CREAR TABLA: HISTORIAL
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS historial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        accion TEXT NOT NULL,
        descripcion TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (producto_id)
            REFERENCES productos(id),

        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
    );
`);

// =====================================
// CREAR TABLA: PRODUCTOS AGRUPABLES
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS productos_agrupables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        categoria_id INTEGER,
        unidad TEXT NOT NULL DEFAULT 'UNIDAD',
        cantidad INTEGER NOT NULL DEFAULT 0,
        estado TEXT NOT NULL DEFAULT 'ACTIVO',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (categoria_id)
            REFERENCES categorias(id)
    );
`);

// =====================================
// CREAR TABLA: HISTORIAL AGRUPABLES
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS historial_agrupables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        agrupable_id INTEGER NOT NULL,

        usuario_id INTEGER NOT NULL,

        accion TEXT NOT NULL,

        cantidad_anterior INTEGER NOT NULL,

        cantidad_movimiento INTEGER NOT NULL,

        cantidad_nueva INTEGER NOT NULL,

        descripcion TEXT,

        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
    );
`);


// =====================================
// VERIFICAR COLUMNAS DE PRODUCTOS AGRUPABLES
// =====================================

const columnasAgrupables = db.prepare(`
    PRAGMA table_info(productos_agrupables)
`).all();

const tieneEstadoAgrupables =
    columnasAgrupables.some(
        columna => columna.name === "estado"
    );

if (!tieneEstadoAgrupables) {

    db.exec(`
        ALTER TABLE productos_agrupables
        ADD COLUMN estado TEXT NOT NULL DEFAULT 'ACTIVO'
    `);

    console.log(
        "Columna estado agregada a productos_agrupables."
    );
}



console.log(
    "Tablas de la base de datos verificadas correctamente."
);

// =====================================
// EXPORTAR BASE DE DATOS
// =====================================

module.exports = db;