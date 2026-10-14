const bcrypt = require("bcrypt");

const db = require("./database");

// =====================================
// DATOS DEL USUARIO
// =====================================

const nombre = "Usuario Inventario";
const correo = "usuario@inventario.local";
const password = "Usuario1234";

// =====================================
// COMPROBAR SI YA EXISTE
// =====================================

const usuarioExistente = db
    .prepare(`
        SELECT id
        FROM usuarios
        WHERE correo = ?
    `)
    .get(correo);

if (usuarioExistente) {
    console.log("El usuario ya existe.");
    process.exit(0);
}

// =====================================
// ENCRIPTAR CONTRASEÑA
// =====================================

const passwordHash = bcrypt.hashSync(
    password,
    12
);

// =====================================
// CREAR USUARIO
// =====================================

const resultado = db
    .prepare(`
        INSERT INTO usuarios (
            nombre,
            correo,
            password,
            rol,
            estado
        )
        VALUES (?, ?, ?, ?, ?)
    `)
    .run(
        nombre,
        correo,
        passwordHash,
        "USUARIO",
        "ACTIVO"
    );

// =====================================
// MOSTRAR RESULTADO
// =====================================

console.log("=================================");
console.log("USUARIO CREADO");
console.log("=================================");
console.log(`ID:       ${resultado.lastInsertRowid}`);
console.log(`Nombre:   ${nombre}`);
console.log(`Correo:   ${correo}`);
console.log(`Password: ${password}`);
console.log("Rol:      USUARIO");
console.log("Estado:   ACTIVO");
console.log("=================================");