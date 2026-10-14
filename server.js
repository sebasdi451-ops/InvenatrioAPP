require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const db = require("./database");

const app = express();


// =========================================================
// SERVIR FRONTEND
// =========================================================

const frontendPath =
    path.join(__dirname, "../frontend");

app.use(
    express.static(frontendPath)
);

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            frontendPath,
            "indexte.html"
        )
    );

});


// =========================================================
// CONFIGURACIÓN
// =========================================================

const PORT =
    process.env.PORT || 3000;


// =========================================================
// RUTAS
// =========================================================

const authRoutes =
    require("./routes/auth");

const productosRoutes =
    require("./routes/productos");

const categoriasRoutes =
    require("./routes/categorias");

const ubicacionesRoutes =
    require("./routes/ubicaciones");

const adminRoutes =
    require("./routes/admin");

const historialRoutes =
    require("./routes/Historial");
const agrupablesRoutes = 
    require("./routes/agrupables");


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());

app.use(
    express.json()
);


// =========================================================
// API AUTH
// =========================================================

app.use(
    "/api/auth",
    authRoutes
);


// =========================================================
// API PRODUCTOS
// =========================================================

app.use(
    "/api/productos",
    productosRoutes
);


// =========================================================
// API CATEGORÍAS
// =========================================================

app.use(
    "/api/categorias",
    categoriasRoutes
);


// =========================================================
// API UBICACIONES
// =========================================================

app.use(
    "/api/ubicaciones",
    ubicacionesRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/historial",
    historialRoutes
);

app.use(
    "/api/agrupables",
    agrupablesRoutes
);

// =========================================================
// RUTA DE PRUEBA
// =========================================================

app.get(
    "/api",
    (req, res) => {

        res.json({

            ok: true,

            mensaje:
                "API de Inventario funcionando",

            version:
                "1.0.0"

        });

    }
);


// =========================================================
// INICIAR SERVIDOR
// =========================================================

app.listen(
    PORT,
    () => {

        console.log(
            "================================="
        );

        console.log(
            "     SERVIDOR DE INVENTARIO"
        );

        console.log(
            "================================="
        );

        console.log(
            `Servidor: http://localhost:${PORT}`
        );

        console.log(
            `API:      http://localhost:${PORT}/api`
        );

        console.log(
            "================================="
        );

    }
);