// =========================================================
// INVENTARIO APP
// APPIN.JS - BACKEND + JWT + CATEGORÍAS
// =========================================================


// =========================================================
// CONFIGURACIÓN
// =========================================================

const API_URL = "http://192.168.1.9:3000/api";


let productos = [];

let categorias = [];

let productoDetalleActual = null;

let toastTimeout = null;


// =========================================================
// ADMINISTRACIÓN DE USUARIOS
// =========================================================

let usuariosAdmin = [];

let permisosAdmin = [];

let usuarioPermisosActual = null;
// =========================================================
// INICIO
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacion
);


async function iniciarAplicacion() {

    console.log("InventarioApp iniciada.");

    configurarEventos();

    comprobarSesion();

}


// =========================================================
// SESIÓN
// =========================================================

function obtenerToken() {

    return sessionStorage.getItem("token");

}


function guardarSesion(
    correo,
    rol,
    token
) {

    sessionStorage.setItem(
        "usuarioAutenticado",
        "true"
    );

    sessionStorage.setItem(
        "usuarioEmail",
        correo
    );

    sessionStorage.setItem(
        "rolUsuario",
        rol
    );

    sessionStorage.setItem(
        "token",
        token
    );

}


function cerrarSesion() {

    sessionStorage.removeItem(
        "usuarioAutenticado"
    );

    sessionStorage.removeItem(
        "usuarioEmail"
    );

    sessionStorage.removeItem(
        "rolUsuario"
    );

    sessionStorage.removeItem(
        "token"
    );

    productos = [];

    categorias = [];

    mostrarLogin();

}


// =========================================================
// COMPROBAR SESIÓN
// =========================================================

function comprobarSesion() {

    const token =
        sessionStorage.getItem(
            "token"
        );


    const autenticado =
        sessionStorage.getItem(
            "usuarioAutenticado"
        );


    if (
        autenticado === "true" &&
        token
    ) {

        mostrarAplicacion();

    } else {

        mostrarLogin();

    }

}


// =========================================================
// LOGIN
// =========================================================

async function manejarLogin(event) {

    event.preventDefault();


    const inputEmail =
        document.getElementById(
            "input-email"
        );


    const inputPassword =
        document.getElementById(
            "input-password"
        );


    const mensaje =
        document.getElementById(
            "login-error"
        );


    if (
        !inputEmail ||
        !inputPassword
    ) {

        console.error(
            "No se encontraron los campos del login."
        );

        return;

    }


    const correo =
        inputEmail.value.trim();


    const password =
        inputPassword.value;


    if (mensaje) {

        mensaje.textContent = "";

    }


    if (
        !correo ||
        !password
    ) {

        if (mensaje) {

            mensaje.textContent =
                "Completa todos los campos.";

        }

        return;

    }


    try {

        console.log(
            "Intentando iniciar sesión..."
        );


        const respuesta =
            await fetch(
                `${API_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        correo: correo,
                        password: password
                    })
                }
            );


        const datos =
            await respuesta.json();


        console.log(
            "Respuesta del servidor:",
            datos
        );


        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            if (mensaje) {

                mensaje.textContent =
                    datos.mensaje ||
                    "Correo o contraseña incorrectos.";

            }

            return;

        }


        if (!datos.token) {

            if (mensaje) {

                mensaje.textContent =
                    "El servidor no devolvió un token.";

            }

            console.error(
                "Respuesta sin token:",
                datos
            );

            return;

        }


        guardarSesion(
            correo,
            datos.usuario?.rol || "ADMIN",
            datos.token
        );


        inputPassword.value = "";


        await mostrarAplicacion();


        mostrarToast(
            "Inicio de sesión correcto"
        );


    } catch (error) {

        console.error(
            "Error de conexión:",
            error
        );


        if (mensaje) {

            mensaje.textContent =
                "No se pudo conectar con el servidor.";

        }

    }

}


// =========================================================
// MOSTRAR LOGIN
// =========================================================

function mostrarLogin() {

    const pantallaLogin =
        document.getElementById(
            "pantalla-login"
        );


    const pantallaApp =
        document.getElementById(
            "pantalla-app"
        );


    if (pantallaLogin) {

        pantallaLogin.classList.remove(
            "oculto"
        );

    }


    if (pantallaApp) {

        pantallaApp.classList.add(
            "oculto"
        );

    }

}


// =========================================================
// MOSTRAR APLICACIÓN
// =========================================================

// =========================================================
// MOSTRAR APLICACIÓN
// =========================================================

async function mostrarAplicacion() {

    const pantallaLogin =
        document.getElementById(
            "pantalla-login"
        );


    const pantallaApp =
        document.getElementById(
            "pantalla-app"
        );


    if (pantallaLogin) {

        pantallaLogin.classList.add(
            "oculto"
        );

    }


    if (pantallaApp) {

        pantallaApp.classList.remove(
            "oculto"
        );

    }


    actualizarEmailConfiguracion();


    await cargarCategoriasDesdeServidor();

    await cargarProductosDesdeServidor();


    actualizarDashboard();

    renderizarInventario();

    renderizarCategorias();

}

// =========================================================
// API - CARGAR USUARIOS ADMINISTRACIÓN
// =========================================================

async function cargarUsuariosAdmin() {

    const token = obtenerToken();

    if (!token) {

        mostrarLogin();

        return;

    }


    try {

        const respuesta = await fetch(
            `${API_URL}/admin/usuarios`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const datos = await respuesta.json();


        if (respuesta.status === 401) {

            cerrarSesion();

            return;

        }


        if (respuesta.status === 403) {

            mostrarToast(
                "No tienes permisos para administrar usuarios."
            );

            return;

        }


        if (!respuesta.ok || !datos.ok) {

            mostrarToast(
                datos.mensaje ||
                "No se pudieron cargar los usuarios."
            );

            return;

        }


        usuariosAdmin =
            Array.isArray(datos.usuarios)
                ? datos.usuarios
                : [];


        renderizarUsuariosAdmin();


    } catch (error) {

        console.error(
            "Error cargando usuarios:",
            error
        );


        mostrarToast(
            "No se pudieron cargar los usuarios."
        );

    }

}

// =========================================================
// RENDERIZAR USUARIOS ADMINISTRACIÓN
// =========================================================

function renderizarUsuariosAdmin() {

    const contenedor =
        document.getElementById(
            "lista-usuarios"
        );


    if (!contenedor) {

        console.error(
            "No se encontró #lista-usuarios."
        );

        return;

    }


    if (!Array.isArray(usuariosAdmin) ||
        usuariosAdmin.length === 0) {

        contenedor.innerHTML = `
            <div class="empty-state">
                <p>No hay usuarios registrados.</p>
            </div>
        `;

        return;

    }


    contenedor.innerHTML =
        usuariosAdmin.map(usuario => {

            const estado =
                usuario.estado || "ACTIVO";

            const rol =
                usuario.rol || "USUARIO";


            return `
                <div class="user-card">

                    <div class="user-card-info">

                        <h3>
                            ${usuario.nombre || "Sin nombre"}
                        </h3>

                        <p>
                            ${usuario.correo || ""}
                        </p>

                        <div class="user-card-meta">

                            <span class="role-badge">
                                ${rol}
                            </span>

                            <span class="user-status">
                                ${estado}
                            </span>

                        </div>

                    </div>


                    <div class="user-card-actions">

                        <button
                            type="button"
                            class="secondary-button"
                            onclick="abrirModalUsuario(${usuario.id})"
                        >
                            Editar
                        </button>


                        <button
                            type="button"
                            class="primary-button"
                            onclick="abrirModalPermisos(${usuario.id})"
                        >
                            Permisos
                        </button>

                    </div>

                </div>
            `;

        }).join("");

}


// =========================================================
// API - CARGAR CATEGORÍAS
// =========================================================

async function cargarCategoriasDesdeServidor() {

    const token =
        obtenerToken();


    if (!token) {

        mostrarLogin();

        return;

    }


    try {

        const respuesta =
            await fetch(
                `${API_URL}/categorias`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const datos =
            await respuesta.json();


       if (respuesta.status === 401) {
    cerrarSesion();
    return;
}

if (respuesta.status === 403) {
    mostrarToast(
        datos.mensaje ||
        "No tienes permisos para consultar categorías."
    );

    categorias = [];
    renderizarCategorias();

    return;
}


        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            console.error(
                datos.mensaje ||
                "No se pudieron cargar las categorías."
            );

            return;

        }


        categorias =
            Array.isArray(
                datos.categorias
            )
                ? datos.categorias
                : [];


        console.log(
            "Categorías cargadas:",
            categorias
        );


        renderizarCategorias();

        llenarCategoriasSelect();


    } catch (error) {

        console.error(
            "Error cargando categorías:",
            error
        );

    }

}


// =========================================================
// EVENTOS
// =========================================================

function configurarEventos() {

    // -------------------------------------------------
    // LOGIN
    // -------------------------------------------------

    const formularioLogin =
        document.getElementById(
            "form-login"
        );


    if (formularioLogin) {

        formularioLogin.addEventListener(
            "submit",
            manejarLogin
        );

    }


    // -------------------------------------------------
    // NAVEGACIÓN
    // -------------------------------------------------

    document
        .querySelectorAll(
            "[data-seccion]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    function () {

                        mostrarSeccion(
                            this.dataset.seccion
                        );

                    }
                );

            }
        );


    // -------------------------------------------------
    // CERRAR SESIÓN
    // -------------------------------------------------

    const btnCerrarPC =
        document.getElementById(
            "btn-cerrar-sesion-pc"
        );


    if (btnCerrarPC) {

        btnCerrarPC.addEventListener(
            "click",
            cerrarSesion
        );

    }


    const btnCerrarConfig =
        document.getElementById(
            "btn-cerrar-sesion-config"
        );


    if (btnCerrarConfig) {

        btnCerrarConfig.addEventListener(
            "click",
            cerrarSesion
        );

    }


    // -------------------------------------------------
    // AGREGAR PRODUCTO
    // -------------------------------------------------

    const btnAgregar =
        document.getElementById(
            "btn-agregar-producto"
        );


    if (btnAgregar) {

        btnAgregar.addEventListener(
            "click",
            abrirModalProducto
        );

    }


    const btnDashboardAgregar =
        document.getElementById(
            "btn-dashboard-agregar"
        );


    if (btnDashboardAgregar) {

        btnDashboardAgregar.addEventListener(
            "click",
            abrirModalProducto
        );

    }


    // -------------------------------------------------
    // MODAL PRODUCTO
    // -------------------------------------------------

    const cerrarProducto =
        document.getElementById(
            "cerrar-modal-producto"
        );


    if (cerrarProducto) {

        cerrarProducto.addEventListener(
            "click",
            cerrarModalProducto
        );

    }


    const cancelarProducto =
        document.getElementById(
            "cancelar-producto"
        );


    if (cancelarProducto) {

        cancelarProducto.addEventListener(
            "click",
            cerrarModalProducto
        );

    }


    const formularioProducto =
        document.getElementById(
            "form-producto"
        );


    if (formularioProducto) {

        formularioProducto.addEventListener(
            "submit",
            guardarProducto
        );

    }


    // -------------------------------------------------
    // BUSCADOR
    // -------------------------------------------------

    const buscador =
        document.getElementById(
            "buscar-producto"
        );


    if (buscador) {

        buscador.addEventListener(
            "input",
            renderizarInventario
        );

    }


    const filtroEstado =
        document.getElementById(
            "filtro-estado"
        );


    if (filtroEstado) {

        filtroEstado.addEventListener(
            "change",
            renderizarInventario
        );

    }


    // -------------------------------------------------
    // CATEGORÍAS
    // -------------------------------------------------

    const btnNuevaCategoria =
        document.getElementById(
            "btn-nueva-categoria"
        );


    if (btnNuevaCategoria) {

        btnNuevaCategoria.addEventListener(
            "click",
            abrirModalCategoria
        );

    }


    const cerrarCategoria =
        document.getElementById(
            "cerrar-modal-categoria"
        );


    if (cerrarCategoria) {

        cerrarCategoria.addEventListener(
            "click",
            cerrarModalCategoria
        );

    }


    const cancelarCategoria =
        document.getElementById(
            "cancelar-categoria"
        );


    if (cancelarCategoria) {

        cancelarCategoria.addEventListener(
            "click",
            cerrarModalCategoria
        );

    }


    const formularioCategoria =
        document.getElementById(
            "form-categoria"
        );


    if (formularioCategoria) {

        formularioCategoria.addEventListener(
            "submit",
            crearCategoria
        );

    }

    // -------------------------------------------------
    // ADMINISTRACIÓN DE USUARIOS
    // -------------------------------------------------

    const btnNuevoUsuario =
    document.getElementById(
        "btn-nuevo-usuario"
    );


if (btnNuevoUsuario) {

    btnNuevoUsuario.addEventListener(
        "click",
        function () {

            abrirModalUsuario();

        }
    );

}

    const cerrarUsuario =
        document.getElementById(
            "cerrar-modal-usuario"
        );


    if (cerrarUsuario) {

        cerrarUsuario.addEventListener(
            "click",
            cerrarModalUsuario
        );

    }


    const cancelarUsuario =
        document.getElementById(
            "cancelar-usuario"
        );


    if (cancelarUsuario) {

        cancelarUsuario.addEventListener(
            "click",
            cerrarModalUsuario
        );

    }


    const formularioUsuario =
        document.getElementById(
            "form-usuario"
        );


    if (formularioUsuario) {

        formularioUsuario.addEventListener(
            "submit",
            guardarUsuarioAdmin
        );

    }


    // -------------------------------------------------
    // ADMINISTRACIÓN DE PERMISOS
    // -------------------------------------------------

    const cerrarPermisos =
        document.getElementById(
            "cerrar-modal-permisos"
        );


    if (cerrarPermisos) {

        cerrarPermisos.addEventListener(
            "click",
            cerrarModalPermisos
        );

    }


    const cancelarPermisos =
        document.getElementById(
            "cancelar-permisos"
        );


    if (cancelarPermisos) {

        cancelarPermisos.addEventListener(
            "click",
            cerrarModalPermisos
        );

    }


    const guardarPermisos =
        document.getElementById(
            "guardar-permisos"
        );


    if (guardarPermisos) {

        guardarPermisos.addEventListener(
            "click",
            guardarPermisosAdmin
        );

    }



    // -------------------------------------------------
    // DETALLE
    // -------------------------------------------------

    const cerrarDetalle =
        document.getElementById(
            "cerrar-modal-detalle"
        );


    if (cerrarDetalle) {

        cerrarDetalle.addEventListener(
            "click",
            cerrarModalDetalle
        );

    }


    const cerrarDetalleBoton =
        document.getElementById(
            "cerrar-detalle"
        );


    if (cerrarDetalleBoton) {

        cerrarDetalleBoton.addEventListener(
            "click",
            cerrarModalDetalle
        );

    }


    const editarDetalle =
        document.getElementById(
            "editar-desde-detalle"
        );


    if (editarDetalle) {

        editarDetalle.addEventListener(
            "click",
            editarDesdeDetalle
        );

    }


    // -------------------------------------------------
    // RECUPERAR CONTRASEÑA
    // -------------------------------------------------

    const recuperar =
        document.getElementById(
            "link-recuperar"
        );


    if (recuperar) {

        recuperar.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                alert(
                    "La recuperación de contraseña estará disponible próximamente."
                );

            }
        );

    }

    // -------------------------------------------------
// AGREGAR PRODUCTO AGRUPABLE
// -------------------------------------------------

const btnAgregarAgrupable = document.getElementById(
    "btn-agregar-agrupable"
);

if (btnAgregarAgrupable) {
    btnAgregarAgrupable.addEventListener(
        "click",
        abrirModalNuevoAgrupable
    );
}

}


// =========================================================
// NAVEGACIÓN
// =========================================================

function mostrarSeccion(nombre) {

    document
        .querySelectorAll(
            ".seccion"
        )
        .forEach(
            seccion => {

                seccion.classList.remove(
                    "activa"
                );

            }
        );


    const seccion =
        document.getElementById(
            `seccion-${nombre}`
        );


    if (seccion) {

        seccion.classList.add(
            "activa"
        );

    }


    document
        .querySelectorAll(
            ".menu-item"
        )
        .forEach(
            boton => {

                boton.classList.toggle(
                    "activo",
                    boton.dataset.seccion === nombre
                );

            }
        );


    document
        .querySelectorAll(
            ".bottom-nav-item"
        )
        .forEach(
            boton => {

                boton.classList.toggle(
                    "activo",
                    boton.dataset.seccion === nombre
                );

            }
        );


    if (nombre === "inicio") {

        actualizarDashboard();

    }


    if (nombre === "inventario") {

        renderizarInventario();

    }


        if (nombre === "categorias") {

        renderizarCategorias();

    }


    if (nombre === "usuarios") {

    cargarUsuariosAdmin();

}

if (nombre === "agrupables") {
    cargarAgrupablesDesdeServidor();
}


if (nombre === "historial") {

    cargarHistorialDesdeServidor();

}

}


// =========================================================
// MODAL - USUARIO
// =========================================================

function abrirModalUsuario(id = null) {

    const modal =
        document.getElementById(
            "modal-usuario"
        );

    const titulo =
        document.getElementById(
            "modal-usuario-titulo"
        );

    const campoId =
        document.getElementById(
            "usuario-id"
        );

    const campoNombre =
        document.getElementById(
            "usuario-nombre"
        );

    const campoCorreo =
        document.getElementById(
            "usuario-correo"
        );

    const campoPassword =
        document.getElementById(
            "usuario-password"
        );

    const campoRol =
        document.getElementById(
            "usuario-rol"
        );


    if (!modal) {

        console.error(
            "No se encontró el modal de usuario."
        );

        return;

    }


    // ---------------------------------------------
    // NUEVO USUARIO
    // ---------------------------------------------

    if (!id) {

        if (titulo) {

            titulo.textContent =
                "Nuevo usuario";

        }


        if (campoId) {

            campoId.value = "";

        }


        if (campoNombre) {

            campoNombre.value = "";

        }


        if (campoCorreo) {

            campoCorreo.value = "";

        }


        if (campoPassword) {

            campoPassword.value = "";

            campoPassword.required = true;

        }


        if (campoRol) {

            campoRol.value = "USUARIO";

        }

    }


    // ---------------------------------------------
    // EDITAR USUARIO
    // ---------------------------------------------

    else {

        const usuario =
            usuariosAdmin.find(
                item => item.id === id
            );


        if (!usuario) {

            mostrarToast(
                "No se encontró el usuario."
            );

            return;

        }


        if (titulo) {

            titulo.textContent =
                "Editar usuario";

        }


        if (campoId) {

            campoId.value =
                usuario.id;

        }


        if (campoNombre) {

            campoNombre.value =
                usuario.nombre || "";

        }


        if (campoCorreo) {

            campoCorreo.value =
                usuario.correo || "";

        }


        if (campoPassword) {

            campoPassword.value = "";

            campoPassword.required = false;

        }


        if (campoRol) {

            campoRol.value =
                usuario.rol || "USUARIO";

        }

    }


    modal.classList.remove(
        "oculto"
    );

}

function cerrarModalUsuario() {

    const modal =
        document.getElementById(
            "modal-usuario"
        );


    if (modal) {

        modal.classList.add(
            "oculto"
        );

    }

}

// =========================================================
// GUARDAR USUARIO - ADMINISTRACIÓN
// =========================================================

async function guardarUsuarioAdmin(event) {

    event.preventDefault();


    const token = obtenerToken();

    if (!token) {

        mostrarLogin();

        return;

    }


    const campoId =
        document.getElementById(
            "usuario-id"
        );

    const campoNombre =
        document.getElementById(
            "usuario-nombre"
        );

    const campoCorreo =
        document.getElementById(
            "usuario-correo"
        );

    const campoPassword =
        document.getElementById(
            "usuario-password"
        );

    const campoRol =
        document.getElementById(
            "usuario-rol"
        );


    const id =
        campoId
            ? campoId.value.trim()
            : "";

    const nombre =
        campoNombre
            ? campoNombre.value.trim()
            : "";

    const correo =
        campoCorreo
            ? campoCorreo.value.trim()
            : "";

    const password =
        campoPassword
            ? campoPassword.value
            : "";

    const rol =
        campoRol
            ? campoRol.value
            : "USUARIO";


    if (!nombre || !correo || !rol) {

        mostrarToast(
            "Completa los campos obligatorios."
        );

        return;

    }


    // ---------------------------------------------
    // PREPARAR DATOS
    // ---------------------------------------------

    const datosUsuario = {

        nombre: nombre,

        correo: correo,

        rol: rol

    };


    // La contraseña solamente se envía:
    // - al crear un usuario
    // - si se escribió una nueva contraseña
    if (password) {

        datosUsuario.password =
            password;

    }


    try {

        let respuesta;


        // -----------------------------------------
        // CREAR
        // -----------------------------------------

        if (!id) {

            if (!password) {

                mostrarToast(
                    "La contraseña es obligatoria."
                );

                return;

            }


            respuesta =
                await fetch(
                    `${API_URL}/admin/usuarios`,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify(
                                datosUsuario
                            )

                    }
                );

        }


        // -----------------------------------------
        // EDITAR
        // -----------------------------------------

        else {

            respuesta =
                await fetch(
                    `${API_URL}/admin/usuarios/${id}`,
                    {
                        method: "PUT",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify(
                                datosUsuario
                            )

                    }
                );

        }


        const datos =
            await respuesta.json();


        // -----------------------------------------
        // SESIÓN EXPIRADA
        // -----------------------------------------

        if (respuesta.status === 401) {

            cerrarSesion();

            return;

        }


        // -----------------------------------------
        // SIN PERMISOS
        // -----------------------------------------

        if (respuesta.status === 403) {

            mostrarToast(
                "No tienes permisos para realizar esta acción."
            );

            return;

        }


        // -----------------------------------------
        // ERROR
        // -----------------------------------------

        if (!respuesta.ok || !datos.ok) {

            mostrarToast(
                datos.mensaje ||
                "No se pudo guardar el usuario."
            );

            return;

        }


        // -----------------------------------------
        // ÉXITO
        // -----------------------------------------

        cerrarModalUsuario();


        await cargarUsuariosAdmin();


        mostrarToast(
            id
                ? "Usuario actualizado correctamente."
                : "Usuario creado correctamente."
        );

    } catch (error) {

        console.error(
            "Error guardando usuario:",
            error
        );


        mostrarToast(
            "No se pudo conectar con el servidor."
        );

    }

}

// =========================================================
// MODAL - PERMISOS
// =========================================================

async function abrirModalPermisos(id) {

    const modal =
        document.getElementById(
            "modal-permisos"
        );


    const lista =
        document.getElementById(
            "lista-permisos"
        );


    const nombreUsuario =
        document.getElementById(
            "permisos-usuario-nombre"
        );


    const usuario =
        usuariosAdmin.find(
            item => item.id === id
        );


    if (!usuario) {

        mostrarToast(
            "No se encontró el usuario."
        );

        return;

    }


    const token =
        obtenerToken();


    if (!token) {

        mostrarLogin();

        return;

    }


    usuarioPermisosActual = id;


    if (nombreUsuario) {

        nombreUsuario.textContent =
            `${usuario.nombre} — ${usuario.correo}`;

    }


    if (lista) {

        lista.innerHTML = `
            <p>
                Cargando permisos...
            </p>
        `;

    }


    if (modal) {

        modal.classList.remove(
            "oculto"
        );

    }


    try {

        // -----------------------------------------
        // CARGAR CATÁLOGO DE PERMISOS
        // -----------------------------------------

        if (
            !Array.isArray(permisosAdmin) ||
            permisosAdmin.length === 0
        ) {

            const respuestaPermisos =
                await fetch(
                    `${API_URL}/admin/permisos`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            const datosPermisos =
                await respuestaPermisos.json();


            if (
                respuestaPermisos.status === 401
            ) {

                cerrarSesion();

                return;

            }


            if (
                respuestaPermisos.status === 403
            ) {

                cerrarModalPermisos();

                mostrarToast(
                    "No tienes permisos para administrar usuarios."
                );

                return;

            }


            if (
                !respuestaPermisos.ok ||
                !datosPermisos.ok
            ) {

                cerrarModalPermisos();

                mostrarToast(
                    datosPermisos.mensaje ||
                    "No se pudieron cargar los permisos."
                );

                return;

            }


            permisosAdmin =
                Array.isArray(
                    datosPermisos.permisos
                )
                    ? datosPermisos.permisos
                    : [];

        }


        // -----------------------------------------
        // CARGAR PERMISOS DEL USUARIO
        // -----------------------------------------

        const respuestaUsuario =
            await fetch(
                `${API_URL}/admin/usuarios/${id}/permisos`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const datosUsuario =
            await respuestaUsuario.json();


        if (
            respuestaUsuario.status === 401
        ) {

            cerrarSesion();

            return;

        }


        if (
            respuestaUsuario.status === 403
        ) {

            cerrarModalPermisos();

            mostrarToast(
                "No tienes permisos para administrar usuarios."
            );

            return;

        }


        if (
            !respuestaUsuario.ok ||
            !datosUsuario.ok
        ) {

            cerrarModalPermisos();

            mostrarToast(
                datosUsuario.mensaje ||
                "No se pudieron cargar los permisos del usuario."
            );

            return;

        }


        const permisosUsuario =
            Array.isArray(
                datosUsuario.permisos
            )
                ? datosUsuario.permisos
                : [];


        renderizarPermisosAdmin(
            usuario,
            permisosUsuario
        );


    } catch (error) {

        console.error(
            "Error cargando permisos:",
            error
        );


        cerrarModalPermisos();


        mostrarToast(
            "No se pudieron cargar los permisos."
        );

    }

}

// =========================================================
// RENDERIZAR PERMISOS
// =========================================================

function renderizarPermisosAdmin(
    usuario,
    permisosUsuario
) {

    const lista =
        document.getElementById(
            "lista-permisos"
        );


    if (!lista) {

        return;

    }


    if (
        !Array.isArray(permisosAdmin) ||
        permisosAdmin.length === 0
    ) {

        lista.innerHTML = `
            <p>
                No hay permisos disponibles.
            </p>
        `;

        return;

    }


    const idsUsuario =
        permisosUsuario.map(
            permiso =>
                Number(
                    permiso.id
                )
        );


    const esAdmin =
        usuario.rol === "ADMIN";


    lista.innerHTML =
        permisosAdmin.map(
            permiso => {

                const id =
                    Number(
                        permiso.id
                    );


                const marcado =
                    esAdmin ||
                    idsUsuario.includes(id);


                return `
                    <label class="permission-item">

                        <input
                            type="checkbox"
                            value="${id}"
                            ${marcado ? "checked" : ""}
                            ${esAdmin ? "disabled" : ""}
                        >

                        <span>

                            <strong>
                                ${permiso.nombre}
                            </strong>

                            ${
                                permiso.descripcion
                                    ? `
                                        <small>
                                            ${permiso.descripcion}
                                        </small>
                                      `
                                    : ""
                            }

                        </span>

                    </label>
                `;

            }
        ).join("");


    if (esAdmin) {

        lista.insertAdjacentHTML(
            "afterbegin",
            `
                <div class="permissions-admin-info">
                    Los administradores tienen
                    todos los permisos automáticamente.
                </div>
            `
        );

    }

}

// =========================================================
// CERRAR MODAL - PERMISOS
// =========================================================

function cerrarModalPermisos() {

    const modal =
        document.getElementById(
            "modal-permisos"
        );


    if (modal) {

        modal.classList.add(
            "oculto"
        );

    }


    usuarioPermisosActual = null;

}
// =========================================================
// GUARDAR PERMISOS - ADMINISTRACIÓN
// =========================================================

async function guardarPermisosAdmin() {

    const token = obtenerToken();


    if (!token) {

        mostrarLogin();

        return;

    }


    if (!usuarioPermisosActual) {

        mostrarToast(
            "No se ha seleccionado ningún usuario."
        );

        return;

    }


    const usuario =
        usuariosAdmin.find(
            item =>
                item.id === usuarioPermisosActual
        );


    if (!usuario) {

        mostrarToast(
            "No se encontró el usuario."
        );

        return;

    }


    // Los administradores tienen todos
    // los permisos automáticamente.
    if (usuario.rol === "ADMIN") {

        mostrarToast(
            "Los administradores tienen todos los permisos automáticamente."
        );

        return;

    }


    const lista =
        document.getElementById(
            "lista-permisos"
        );


    if (!lista) {

        return;

    }


    const checkboxes =
        lista.querySelectorAll(
            'input[type="checkbox"]'
        );


    const permisosSeleccionados =
        Array.from(
            checkboxes
        )
        .filter(
            checkbox =>
                checkbox.checked
        )
        .map(
            checkbox =>
                Number(
                    checkbox.value
                )
        );


    try {

        const respuesta =
            await fetch(
                `${API_URL}/admin/usuarios/${usuarioPermisosActual}/permisos`,
                {
                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        permisos:
                            permisosSeleccionados

                    })

                }
            );


        const datos =
            await respuesta.json();


        // -----------------------------------------
        // SESIÓN EXPIRADA
        // -----------------------------------------

        if (respuesta.status === 401) {

            cerrarSesion();

            return;

        }


        // -----------------------------------------
        // SIN PERMISOS
        // -----------------------------------------

        if (respuesta.status === 403) {

            mostrarToast(
                "No tienes permisos para modificar permisos."
            );

            return;

        }


        // -----------------------------------------
        // ERROR
        // -----------------------------------------

        if (!respuesta.ok || !datos.ok) {

            mostrarToast(
                datos.mensaje ||
                "No se pudieron guardar los permisos."
            );

            return;

        }


        // -----------------------------------------
        // ÉXITO
        // -----------------------------------------

        cerrarModalPermisos();


        mostrarToast(
            "Permisos actualizados correctamente."
        );


    } catch (error) {

        console.error(
            "Error guardando permisos:",
            error
        );


        mostrarToast(
            "No se pudieron guardar los permisos."
        );

    }

}

// =========================================================
// API - CARGAR CATEGORÍAS
// =========================================================

async function cargarCategoriasDesdeServidor() {

    const token =
        obtenerToken();


    if (!token) {

        console.error(
            "No existe token para cargar categorías."
        );

        return;

    }


    try {

        const respuesta =
            await fetch(
                `${API_URL}/categorias`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const datos =
            await respuesta.json();


       if (respuesta.status === 401) {

    console.warn(
        "La sesión no es válida o ha expirado."
    );

    cerrarSesion();

    return;

}


if (respuesta.status === 403) {

    console.warn(
        "El usuario no tiene permiso para consultar categorías."
    );

    categorias = [];

    renderizarCategorias();

    return;

}


        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            console.error(
                datos.mensaje ||
                "No se pudieron cargar las categorías."
            );

            return;

        }


        categorias =
            Array.isArray(
                datos.categorias
            )
                ? datos.categorias
                : [];


        console.log(
            "Categorías cargadas:",
            categorias
        );


        renderizarCategorias();


    } catch (error) {

        console.error(
            "Error cargando categorías:",
            error
        );

    }

}

// =====================================
// CARGAR PRODUCTOS AGRUPABLES
// =====================================

async function cargarAgrupablesDesdeServidor() {

    const token = obtenerToken();

    if (!token) {

        cerrarSesion();

        return;
    }

    const contenedor =
        document.getElementById("lista-agrupables");

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = `
        <div class="agrupable-vacio">
            Cargando productos agrupables...
        </div>
    `;

    try {

        const respuesta = await fetch(
            `${API_URL}/agrupables`,
            {
                method: "GET",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        if (respuesta.status === 401) {

            cerrarSesion();

            return;
        }

        if (respuesta.status === 403) {

            mostrarToast(
                "No tienes permisos para acceder a esta sección."
            );

            contenedor.innerHTML = `
                <div class="agrupable-vacio">
                    No tienes acceso a los productos agrupables.
                </div>
            `;

            return;
        }

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje ||
                "No se pudieron cargar los productos agrupables."
            );

        }

        renderizarAgrupables(
            datos.agrupables || []
        );

    } catch (error) {

        console.error(
            "Error cargando productos agrupables:",
            error
        );

        contenedor.innerHTML = `
            <div class="agrupable-vacio">
                No se pudieron cargar los productos agrupables.
            </div>
        `;

    }
}

// =====================================
// MOSTRAR PRODUCTOS AGRUPABLES
// =====================================

function renderizarAgrupables(agrupables) {

window.productosAgrupablesActuales =
    agrupables;

    const contenedor =
        document.getElementById("lista-agrupables");

    if (!contenedor) {
        return;
    }

    if (!agrupables.length) {

        contenedor.innerHTML = `
            <div class="agrupable-vacio">
                No hay productos agrupables registrados.
            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        agrupables.map(agrupable => {

            return `
                <article
                    class="agrupable-card"
                    data-agrupable-id="${agrupable.id}"
                >

                    <div
                        class="agrupable-card-header"
                    >

                        <div>

                            <h3
                                class="agrupable-nombre"
                            >
                                ${escaparHTML(
                                    agrupable.nombre
                                )}
                            </h3>

                            <p
                                class="agrupable-descripcion"
                            >
                                ${escaparHTML(
                                    agrupable.descripcion ||
                                    "Sin descripción"
                                )}
                            </p>

                        </div>

                    </div>

                    <div
                        class="agrupable-cantidad"
                    >

                        <span
                            class="agrupable-cantidad-label"
                        >
                            Disponible
                        </span>

                        <span
                            class="agrupable-cantidad-valor"
                        >
                            ${agrupable.cantidad}
                        </span>

                        <span
                            class="agrupable-cantidad-unidad"
                        >
                            ${escaparHTML(
                                agrupable.unidad
                            )}
                        </span>

                    </div>

                    <div
                        class="agrupable-controles"
                    >

                        <button
                            type="button"
                            class="agrupable-btn-cantidad"
                            data-accion-cantidad="restar"
                            data-id="${agrupable.id}"
                        >
                            −
                        </button>

                        <div
                            class="agrupable-cantidad-control"
                        >
                            ${agrupable.cantidad}
                        </div>

                        <button
                            type="button"
                            class="agrupable-btn-cantidad"
                            data-accion-cantidad="sumar"
                            data-id="${agrupable.id}"
                        >
                            +
                        </button>

                    </div>

                    <div
                        class="agrupable-acciones"
                    >

                        <button
                            type="button"
                            class="btn-secondary"
                            data-accion-agrupable="editar"
                            data-id="${agrupable.id}"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            class="btn-secondary"
                            data-accion-agrupable="eliminar"
                            data-id="${agrupable.id}"
                        >
                            Eliminar
                        </button>

                    </div>

                </article>
            `;

        }).join("");

    configurarEventosAgrupables();
}

// =====================================
// ABRIR EDICIÓN DE AGRUPABLE
// =====================================

function abrirEditarAgrupable(id) {

    const agrupables =
        window.productosAgrupablesActuales || [];

    const agrupable =
        agrupables.find(
            producto => producto.id === id
        );

    if (!agrupable) {

        mostrarToast(
            "No se encontró el producto agrupable."
        );

        return;
    }


    // Eliminar modal anterior si existe

    const modalAnterior =
        document.getElementById(
            "modal-editar-agrupable"
        );

    if (modalAnterior) {
        modalAnterior.remove();
    }


    // Crear opciones de categorías

    const opcionesCategorias =
        typeof categorias !== "undefined"
            ? categorias
                .map(categoria => {

                    const seleccionada =
                        Number(categoria.id) ===
                        Number(agrupable.categoria_id)
                            ? "selected"
                            : "";

                    return `
                        <option
                            value="${categoria.id}"
                            ${seleccionada}
                        >
                            ${escaparHTML(
                                categoria.nombre
                            )}
                        </option>
                    `;

                })
                .join("")
            : "";


    // Crear modal

    const modal =
        document.createElement("div");

    modal.id =
        "modal-editar-agrupable";

    modal.className =
        "modal-agrupable";


    modal.innerHTML = `

        <div class="modal-agrupable-contenido">

            <div class="modal-agrupable-header">

                <div>

                    <p class="section-small">
                        PRODUCTO AGRUPABLE
                    </p>

                    <h2>
                        Editar producto
                    </h2>

                </div>

                <button
                    type="button"
                    class="modal-agrupable-cerrar"
                    id="cerrar-modal-agrupable"
                >
                    ×
                </button>

            </div>


            <div class="modal-agrupable-form">

                <div class="form-group">

                    <label for="editar-agrupable-nombre">
                        Nombre
                    </label>

                    <input
                        type="text"
                        id="editar-agrupable-nombre"
                        value="${escaparHTML(
                            agrupable.nombre
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label for="editar-agrupable-descripcion">
                        Descripción
                    </label>

                    <input
                        type="text"
                        id="editar-agrupable-descripcion"
                        value="${escaparHTML(
                            agrupable.descripcion || ""
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label for="editar-agrupable-categoria">
                        Categoría
                    </label>

                    <select
                        id="editar-agrupable-categoria"
                    >

                        <option value="">
                            Sin categoría
                        </option>

                        ${opcionesCategorias}

                    </select>

                </div>


                <div class="form-group">

                    <label for="editar-agrupable-unidad">
                        Unidad
                    </label>

                    <input
                        type="text"
                        id="editar-agrupable-unidad"
                        value="${escaparHTML(
                            agrupable.unidad
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label for="editar-agrupable-cantidad">
                        Cantidad
                    </label>

                    <input
                        type="number"
                        id="editar-agrupable-cantidad"
                        min="0"
                        step="1"
                        value="${agrupable.cantidad}"
                    >

                </div>

            </div>


            <div class="modal-agrupable-acciones">

                <button
                    type="button"
                    class="btn-secondary"
                    id="cancelar-modal-agrupable"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    class="btn-primary"
                    id="guardar-modal-agrupable"
                >
                    Guardar cambios
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    // =================================
    // CERRAR
    // =================================

    document
        .getElementById(
            "cerrar-modal-agrupable"
        )
        .addEventListener(
            "click",
            () => modal.remove()
        );


    document
        .getElementById(
            "cancelar-modal-agrupable"
        )
        .addEventListener(
            "click",
            () => modal.remove()
        );


    // =================================
    // GUARDAR
    // =================================

    document
        .getElementById(
            "guardar-modal-agrupable"
        )
        .addEventListener(
            "click",
            () => guardarEdicionAgrupable(id)
        );

}

// =====================================
// GUARDAR EDICIÓN DE AGRUPABLE
// =====================================

async function guardarEdicionAgrupable(id) {

    const token = obtenerToken();

    if (!token) {

        cerrarSesion();

        return;
    }


    const nombre =
        document
            .getElementById(
                "editar-agrupable-nombre"
            )
            .value
            .trim();


    const descripcion =
        document
            .getElementById(
                "editar-agrupable-descripcion"
            )
            .value
            .trim();


    const categoria_id =
        document
            .getElementById(
                "editar-agrupable-categoria"
            )
            .value;


    const unidad =
        document
            .getElementById(
                "editar-agrupable-unidad"
            )
            .value
            .trim();


    const cantidad =
        Number(
            document
                .getElementById(
                    "editar-agrupable-cantidad"
                )
                .value
        );


    if (!nombre) {

        mostrarToast(
            "El nombre es obligatorio."
        );

        return;
    }


    if (
        !Number.isInteger(cantidad) ||
        cantidad < 0
    ) {

        mostrarToast(
            "La cantidad debe ser un número entero igual o mayor que 0."
        );

        return;
    }


    try {

        const respuesta =
            await fetch(
                `${API_URL}/agrupables/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        nombre:
                            nombre,

                        descripcion:
                            descripcion,

                        categoria_id:
                            categoria_id
                                ? Number(categoria_id)
                                : null,

                        unidad:
                            unidad || "UNIDAD",

                        cantidad:
                            cantidad
                    })
                }
            );


        if (respuesta.status === 401) {

            cerrarSesion();

            return;
        }


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            mostrarToast(
                datos.mensaje ||
                "No se pudo actualizar el producto."
            );

            return;
        }


        const modal =
            document.getElementById(
                "modal-editar-agrupable"
            );

        if (modal) {
            modal.remove();
        }


        mostrarToast(
            "Producto actualizado correctamente."
        );


        await cargarAgrupablesDesdeServidor();


    } catch (error) {

        console.error(
            "Error actualizando producto agrupable:",
            error
        );

        mostrarToast(
            "No se pudo actualizar el producto."
        );

    }

}


// =====================================
// CAMBIAR CANTIDAD DE AGRUPABLE
// =====================================

async function cambiarCantidadAgrupable(
    id,
    cambio
) {

    const token = obtenerToken();

    if (!token) {

        cerrarSesion();

        return;
    }

    try {

        const respuesta = await fetch(
            `${API_URL}/agrupables/${id}/cantidad`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },

                body: JSON.stringify({
                    cambio: cambio
                })
            }
        );

        if (respuesta.status === 401) {

            cerrarSesion();

            return;
        }

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {

            mostrarToast(
                datos.mensaje ||
                "No se pudo cambiar la cantidad."
            );

            return;
        }

        // Volvemos a cargar la lista
        // para mostrar la cantidad actualizada.

        await cargarAgrupablesDesdeServidor();

    } catch (error) {

        console.error(
            "Error cambiando cantidad:",
            error
        );

        mostrarToast(
            "No se pudo cambiar la cantidad."
        );

    }
}


 // =====================================
 // EVENTOS DE PRODUCTOS AGRUPABLES
 // =====================================

function configurarEventosAgrupables() {
    // Botones para sumar y restar cantidades
    document.querySelectorAll("[data-accion-cantidad]").forEach(boton => {
        boton.onclick = async () => {
            const id = Number(boton.dataset.id);
            const cambio = boton.dataset.accionCantidad === "sumar" ? 1 : -1;

            await cambiarCantidadAgrupable(id, cambio);
        };
    });

    // Botones para editar
    document.querySelectorAll('[data-accion-agrupable="editar"]').forEach(boton => {
        boton.onclick = () => {
            abrirEditarAgrupable(Number(boton.dataset.id));
        };
    });

    // Botones para dar de baja
    document.querySelectorAll('[data-accion-agrupable="eliminar"]').forEach(boton => {
        boton.onclick = async () => {
            const id = Number(boton.dataset.id);

            const agrupable = (window.productosAgrupablesActuales || [])
                .find(item => Number(item.id) === id);

            if (!agrupable) {
                mostrarToast("No se encontró el producto agrupable.");
                return;
            }

            const confirmar = confirm(
                `¿Deseas dar de baja "${agrupable.nombre}"? El registro se conservará en el historial.`
            );

            if (!confirmar) return;

            const token = obtenerToken();

            if (!token) {
                cerrarSesion();
                return;
            }

            try {
                const respuesta = await fetch(`${API_URL}/agrupables/${id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const datos = await respuesta.json();

                if (respuesta.status === 401) {
                    cerrarSesion();
                    return;
                }

                if (respuesta.status === 403) {
                    mostrarToast(datos.mensaje || "No tienes permisos para dar de baja este producto.");
                    return;
                }

                if (!respuesta.ok || !datos.ok) {
                    mostrarToast(datos.mensaje || "No se pudo dar de baja el producto.");
                    return;
                }

                mostrarToast(datos.mensaje || "Producto dado de baja correctamente.");
                await cargarAgrupablesDesdeServidor();

            } catch (error) {
                console.error("Error dando de baja el producto:", error);
                mostrarToast("No se pudo conectar con el servidor.");
            }
        };
    });
}


 // =====================================
 // AGREGAR PRODUCTO AGRUPABLE
 // =====================================

function abrirModalNuevoAgrupable() {
    const modalAnterior = document.getElementById(
        "modal-nuevo-agrupable"
    );

    if (modalAnterior) modalAnterior.remove();

    const opcionesCategorias = categorias.map(categoria => `
        <option value="${categoria.id}">
            ${escaparHTML(categoria.nombre)}
        </option>
    `).join("");

    const modal = document.createElement("div");
    modal.id = "modal-nuevo-agrupable";
    modal.className = "modal-agrupable";

    modal.innerHTML = `
        <div class="modal-agrupable-contenido">
            <div class="modal-agrupable-header">
                <div>
                    <p class="section-small">PRODUCTO AGRUPABLE</p>
                    <h2>Agregar producto</h2>
                </div>

                <button
                    type="button"
                    class="modal-agrupable-cerrar"
                    id="cerrar-nuevo-agrupable"
                >×</button>
            </div>

            <form id="form-nuevo-agrupable">
                <div class="modal-agrupable-form">
                    <div class="form-group">
                        <label for="nuevo-agrupable-nombre">Nombre *</label>
                        <input
                            id="nuevo-agrupable-nombre"
                            type="text"
                            required
                            maxlength="150"
                        >
                    </div>

                    <div class="form-group">
                        <label for="nuevo-agrupable-descripcion">
                            Descripción
                        </label>
                        <input
                            id="nuevo-agrupable-descripcion"
                            type="text"
                            maxlength="500"
                        >
                    </div>

                    <div class="form-group">
                        <label for="nuevo-agrupable-categoria">
                            Categoría
                        </label>
                        <select id="nuevo-agrupable-categoria">
                            <option value="">Sin categoría</option>
                            ${opcionesCategorias}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="nuevo-agrupable-unidad">Unidad *</label>
                        <input
                            id="nuevo-agrupable-unidad"
                            type="text"
                            value="UNIDAD"
                            required
                            maxlength="50"
                        >
                    </div>

                    <div class="form-group">
                        <label for="nuevo-agrupable-cantidad">
                            Cantidad inicial *
                        </label>
                        <input
                            id="nuevo-agrupable-cantidad"
                            type="number"
                            min="0"
                            step="1"
                            value="0"
                            required
                        >
                    </div>
                </div>

                <div class="modal-agrupable-acciones">
                    <button
                        type="button"
                        class="btn-secondary"
                        id="cancelar-nuevo-agrupable"
                    >
                        Cancelar
                    </button>

                    <button type="submit" class="btn-primary">
                        Guardar producto
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("cerrar-nuevo-agrupable").onclick =
        () => modal.remove();

    document.getElementById("cancelar-nuevo-agrupable").onclick =
        () => modal.remove();

    document.getElementById("form-nuevo-agrupable").addEventListener(
        "submit",
        guardarNuevoAgrupable
    );
}


// =====================================
// GUARDAR PRODUCTO AGRUPABLE
// =====================================

async function guardarNuevoAgrupable(event) {
    event.preventDefault();

    const token = obtenerToken();

    if (!token) {
        cerrarSesion();
        return;
    }

    const nombre = document.getElementById(
        "nuevo-agrupable-nombre"
    ).value.trim();

    const descripcion = document.getElementById(
        "nuevo-agrupable-descripcion"
    ).value.trim();

    const categoria = document.getElementById(
        "nuevo-agrupable-categoria"
    ).value;

    const unidad = document.getElementById(
        "nuevo-agrupable-unidad"
    ).value.trim();

    const cantidad = Number(document.getElementById(
        "nuevo-agrupable-cantidad"
    ).value);

    if (!nombre || !unidad) {
        mostrarToast("Completa el nombre y la unidad.");
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad < 0) {
        mostrarToast("La cantidad debe ser un entero igual o mayor que cero.");
        return;
    }

    const formulario = document.getElementById(
        "form-nuevo-agrupable"
    );

    const botonGuardar = formulario.querySelector(
        'button[type="submit"]'
    );

    botonGuardar.disabled = true;

    try {
        const respuesta = await fetch(
            `${API_URL}/agrupables`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    nombre,
                    descripcion,
                    categoria_id: categoria ? Number(categoria) : null,
                    unidad,
                    cantidad
                })
            }
        );

        const datos = await respuesta.json();

        if (respuesta.status === 401) {
            cerrarSesion();
            return;
        }

        if (respuesta.status === 403) {
            mostrarToast(
                datos.mensaje ||
                "No tienes permisos para crear productos agrupables."
            );
            return;
        }

        if (!respuesta.ok || !datos.ok) {
            mostrarToast(
                datos.mensaje ||
                "No se pudo crear el producto agrupable."
            );
            return;
        }

        const modal = document.getElementById(
            "modal-nuevo-agrupable"
        );

        if (modal) modal.remove();

        mostrarToast("Producto agrupable creado correctamente.");

        await cargarAgrupablesDesdeServidor();
    } catch (error) {
        console.error("Error creando producto agrupable:", error);
        mostrarToast("No se pudo conectar con el servidor.");
    } finally {
        if (botonGuardar.isConnected) {
            botonGuardar.disabled = false;
        }
    }
}

// =========================================================
// API - CARGAR HISTORIAL
// =========================================================

async function cargarHistorialDesdeServidor() {

    const token =
        obtenerToken();


    if (!token) {

        mostrarLogin();

        return;

    }


    const contenedor =
        document.getElementById(
            "lista-historial"
        );


    if (contenedor) {

        contenedor.innerHTML = `
            <div class="historial-vacio">
                Cargando historial...
            </div>
        `;

    }


    try {

        const respuesta =
            await fetch(
                `${API_URL}/historial`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const datos =
            await respuesta.json();


        // -----------------------------------------
        // SESIÓN EXPIRADA
        // -----------------------------------------

        if (respuesta.status === 401) {

            cerrarSesion();

            return;

        }


        // -----------------------------------------
        // SIN PERMISOS
        // -----------------------------------------

        if (respuesta.status === 403) {

            mostrarToast(
                datos.mensaje ||
                "No tienes permisos para consultar el historial."
            );


            if (contenedor) {

                contenedor.innerHTML = `
                    <div class="historial-vacio">
                        No tienes permisos para consultar el historial.
                    </div>
                `;

            }

            return;

        }


        // -----------------------------------------
        // ERROR
        // -----------------------------------------

        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            mostrarToast(
                datos.mensaje ||
                "No se pudo cargar el historial."
            );


            if (contenedor) {

                contenedor.innerHTML = `
                    <div class="historial-vacio">
                        No se pudo cargar el historial.
                    </div>
                `;

            }

            return;

        }


        // -----------------------------------------
        // ÉXITO
        // -----------------------------------------

        renderizarHistorial(
            Array.isArray(datos.historial)
                ? datos.historial
                : []
        );


    } catch (error) {

        console.error(
            "Error cargando historial:",
            error
        );


        if (contenedor) {

            contenedor.innerHTML = `
                <div class="historial-vacio">
                    No se pudo conectar con el servidor.
                </div>
            `;

        }


        mostrarToast(
            "No se pudo conectar con el servidor."
        );

    }

}

// =========================================================
// RENDERIZAR HISTORIAL
// =========================================================


function renderizarHistorial(historial) {
    const registros = Array.isArray(historial) ? historial : [];

    const contenedor = document.getElementById("lista-historial");
    const resumen = document.getElementById("historial-resumen");

    const inputBuscar = document.getElementById("historial-buscar");
    const fechaDesde = document.getElementById("historial-desde");
    const fechaHasta = document.getElementById("historial-hasta");
    const selectorTipo = document.getElementById("historial-tipo");
    const botonLimpiar = document.getElementById("historial-limpiar-filtros");

    function aplicarFiltros() {
        const busqueda = (inputBuscar?.value || "")
            .trim()
            .toLowerCase();

        const desde = fechaDesde?.value || "";
        const hasta = fechaHasta?.value || "";
        const tipoSeleccionado = selectorTipo?.value || "TODOS";

        const filtrados = registros.filter(movimiento => {
            // Buscar por producto, usuario, acción o descripción.
            const textoBusqueda = [
                movimiento.producto,
                movimiento.usuario,
                movimiento.accion,
                movimiento.descripcion
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            if (busqueda && !textoBusqueda.includes(busqueda)) {
                return false;
            }

            // Comparar las fechas en formato YYYY-MM-DD.
            const fechaMovimiento = String(movimiento.fecha || "").slice(0, 10);

            if (desde && (!fechaMovimiento || fechaMovimiento < desde)) {
                return false;
            }

            if (hasta && (!fechaMovimiento || fechaMovimiento > hasta)) {
                return false;
            }

            // Filtrar por tipo de inventario.
            if (
                tipoSeleccionado !== "TODOS" &&
                movimiento.tipo !== tipoSeleccionado
            ) {
                return false;
            }

            return true;
        });

        if (resumen) {
            resumen.textContent =
                `${filtrados.length} movimiento${filtrados.length === 1 ? "" : "s"} encontrado${filtrados.length === 1 ? "" : "s"}`;
        }

        if (!contenedor) return;

        if (filtrados.length === 0) {
            contenedor.innerHTML = `
                <div class="historial-vacio">
                    No se encontraron movimientos con los filtros seleccionados.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = filtrados.map(movimiento => {
            const producto = escaparHTML(movimiento.producto || "Producto no disponible");
            const usuario = escaparHTML(movimiento.usuario || "Usuario no disponible");
            const accion = escaparHTML(movimiento.accion || "MOVIMIENTO");
            const descripcion = escaparHTML(movimiento.descripcion || "");
            const fecha = escaparHTML(movimiento.fecha || "");
            const tipo = movimiento.tipo === "AGRUPABLE"
                ? "Producto agrupable"
                : "Producto normal";

            let detalleCantidad = "";

            if (movimiento.tipo === "AGRUPABLE") {
                const unidad = escaparHTML(movimiento.unidad || "UNIDAD");
                const anterior = Number(movimiento.cantidad_anterior ?? 0);
                const cambio = Number(movimiento.cantidad_movimiento ?? 0);
                const nueva = Number(movimiento.cantidad_nueva ?? 0);

                const movimientoTexto = cambio > 0
                    ? `+${cambio}`
                    : String(cambio);

                detalleCantidad = `
                    <div class="historial-cantidades">
                        <span>Anterior: ${anterior} ${unidad}</span>
                        <span>Movimiento: ${movimientoTexto} ${unidad}</span>
                        <span>Final: ${nueva} ${unidad}</span>
                    </div>
                `;
            }

            return `
                <article class="historial-item">
                    <div class="historial-item-header">
                        <div>
                            <h3>${producto}</h3>
                            <span class="historial-tipo">${tipo}</span>
                        </div>
                        <span class="historial-accion">${accion}</span>
                    </div>

                    <div class="historial-item-info">
                        <span><strong>Usuario:</strong> ${usuario}</span>
                        <span><strong>Fecha:</strong> ${fecha}</span>
                    </div>

                    ${descripcion ? `
                        <p class="historial-descripcion">${descripcion}</p>
                    ` : ""}

                    ${detalleCantidad}
                </article>
            `;
        }).join("");
    }

    // Conectar los controles del HTML sin acumular eventos duplicados.
    if (inputBuscar) {
        inputBuscar.oninput = aplicarFiltros;
    }

    if (fechaDesde) {
        fechaDesde.onchange = aplicarFiltros;
    }

    if (fechaHasta) {
        fechaHasta.onchange = aplicarFiltros;
    }

    if (selectorTipo) {
        selectorTipo.onchange = aplicarFiltros;
    }

    if (botonLimpiar) {
        botonLimpiar.onclick = () => {
            if (inputBuscar) inputBuscar.value = "";
            if (fechaDesde) fechaDesde.value = "";
            if (fechaHasta) fechaHasta.value = "";
            if (selectorTipo) selectorTipo.value = "TODOS";

            aplicarFiltros();
        };
    }

    // Mostrar el historial completo inicialmente.
    aplicarFiltros();
}



// =========================================================
// API - CARGAR PRODUCTOS
// =========================================================

async function cargarProductosDesdeServidor() {

    const token =
        obtenerToken();


    if (!token) {

        console.error(
            "No existe token."
        );

        mostrarLogin();

        return;

    }


    try {

        const respuesta =
            await fetch(
                `${API_URL}/productos`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const datos =
            await respuesta.json();


        if (respuesta.status === 401) {

    console.warn(
        "La sesión no es válida o ha expirado."
    );

    cerrarSesion();

    return;

}


if (respuesta.status === 401) {

    console.warn(
        "La sesión no es válida o ha expirado."
    );

    cerrarSesion();

    return;

}


if (respuesta.status === 403) {

    console.warn(
        "El usuario no tiene permiso para consultar productos."
    );

    productos = [];

    actualizarDashboard();

    renderizarInventario();

    return;

}

        productos =
            Array.isArray(
                datos.productos
            )
                ? datos.productos
                : [];


        console.log(
            "Productos cargados:",
            productos
        );


        actualizarDashboard();

        renderizarInventario();


    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

    }

}


// =========================================================
// DASHBOARD
// =========================================================

function actualizarDashboard() {

    const total =
        productos.length;


    const disponibles =
        productos.filter(
            producto =>
                normalizarEstado(
                    producto.estado
                ) === "DISPONIBLE"
        ).length;


    const mantenimiento =
        productos.filter(
            producto =>
                normalizarEstado(
                    producto.estado
                ) === "MANTENIMIENTO"
        ).length;


    const enUso =
        productos.filter(
            producto =>
                normalizarEstado(
                    producto.estado
                ) === "EN USO"
        ).length;


    actualizarElemento(
        "dashboard-total",
        total
    );


    actualizarElemento(
        "dashboard-disponibles",
        disponibles
    );


    actualizarElemento(
        "dashboard-mantenimiento",
        mantenimiento
    );


    actualizarElemento(
        "dashboard-en-uso",
        enUso
    );


    renderizarUltimosProductos();

}


// =========================================================
// ÚLTIMOS PRODUCTOS
// =========================================================

function renderizarUltimosProductos() {

    const contenedor =
        document.getElementById(
            "ultimos-productos"
        );


    if (!contenedor) {

        return;

    }


    const ultimos =
        [...productos]
            .slice(0, 4);


    if (ultimos.length === 0) {

        contenedor.innerHTML = `
            <div class="inventory-card">
                <p>
                    Todavía no hay productos registrados.
                </p>
            </div>
        `;

        return;

    }


    contenedor.innerHTML =
        ultimos
            .map(
                producto =>
                    crearTarjetaProducto(
                        producto,
                        true
                    )
            )
            .join("");

}


// =========================================================
// INVENTARIO
// =========================================================

function renderizarInventario() {

    const contenedor =
        document.getElementById(
            "lista-inventario"
        );


    if (!contenedor) {

        return;

    }


    const buscador =
        document.getElementById(
            "buscar-producto"
        );


    const filtro =
        document.getElementById(
            "filtro-estado"
        );


    const busqueda =
        buscador
            ? buscador.value
                .toLowerCase()
                .trim()
            : "";


    const estado =
        filtro
            ? filtro.value
            : "";


    const filtrados =
        productos.filter(
            producto => {

                const texto = `
                    ${producto.nombre || ""}
                    ${producto.marca || ""}
                    ${producto.modelo || ""}
                    ${producto.serial || ""}
                    ${producto.codigo_interno || producto.codigo || ""}
                    ${obtenerNombreCategoriaProducto(producto)}
                    ${producto.ubicacion || ""}
                `.toLowerCase();


                const coincideBusqueda =
                    texto.includes(
                        busqueda
                    );


                const estadoProducto =
                    producto.estado || "";


                const coincideEstado =
                    !estado ||
                    estadoProducto === estado;


                return (
                    coincideBusqueda &&
                    coincideEstado
                );

            }
        );


    if (filtrados.length === 0) {

        contenedor.innerHTML = `
            <div class="inventory-card">

                <h3>
                    No hay productos
                </h3>

                <p>
                    No encontramos productos
                    con los filtros seleccionados.
                </p>

            </div>
        `;

        return;

    }


    contenedor.innerHTML =
        filtrados
            .map(
                producto =>
                    crearTarjetaProducto(
                        producto,
                        false
                    )
            )
            .join("");

}


// =========================================================
// OBTENER NOMBRE DE CATEGORÍA DEL PRODUCTO
// =========================================================

function obtenerNombreCategoriaProducto(producto) {

    if (producto.categoria) {

        if (
            typeof producto.categoria ===
            "string"
        ) {

            return producto.categoria;

        }


        if (
            typeof producto.categoria ===
            "object"
        ) {

            return (
                producto.categoria.nombre ||
                ""
            );

        }

    }


    if (producto.categoria_nombre) {

        return producto.categoria_nombre;

    }


    if (producto.categoria_id) {

        const categoria =
            categorias.find(
                item =>
                    String(item.id) ===
                    String(producto.categoria_id)
            );


        if (categoria) {

            return categoria.nombre;

        }

    }


    return "";

}


// =========================================================
// OBTENER ID DE CATEGORÍA DEL PRODUCTO
// =========================================================

function obtenerCategoriaIdProducto(producto) {

    if (
        producto.categoria_id !==
        undefined &&
        producto.categoria_id !==
        null
    ) {

        return producto.categoria_id;

    }


    if (
        producto.categoria &&
        typeof producto.categoria ===
        "object"
    ) {

        if (
            producto.categoria.id !==
            undefined
        ) {

            return producto.categoria.id;

        }

    }


    const nombre =
        obtenerNombreCategoriaProducto(
            producto
        );


    if (!nombre) {

        return "";

    }


    const categoria =
        categorias.find(
            item =>
                String(item.nombre)
                    .toLowerCase() ===
                String(nombre)
                    .toLowerCase()
        );


    return categoria
        ? categoria.id
        : "";

}


// =========================================================
// TARJETA PRODUCTO
// =========================================================

function crearTarjetaProducto(
    producto,
    compacta
) {

    const codigo =
        producto.codigo_interno ||
        producto.codigo ||
        "-";


    return `

        <article class="inventory-card">

            <div class="inventory-card-header">

                <div>

                    <h3>
                        ${escaparHTML(
                            producto.nombre
                        )}
                    </h3>

                    <p class="inventory-code">
                        ${escaparHTML(
                            codigo
                        )}
                    </p>

                </div>


                <span class="status-badge">
                    ${escaparHTML(
                        producto.estado || "-"
                    )}
                </span>

            </div>


            <div class="inventory-details">

                <div class="inventory-detail">

                    <span>
                        Marca
                    </span>

                    <strong>
                        ${escaparHTML(
                            producto.marca || "-"
                        )}
                    </strong>

                </div>


                <div class="inventory-detail">

                    <span>
                        Modelo
                    </span>

                    <strong>
                        ${escaparHTML(
                            producto.modelo || "-"
                        )}
                    </strong>

                </div>


                <div class="inventory-detail">

                    <span>
                        Serial
                    </span>

                    <strong>
                        ${escaparHTML(
                            producto.serial || "-"
                        )}
                    </strong>

                </div>


                <div class="inventory-detail">

                    <span>
                        Ubicación
                    </span>

                    <strong>
                        ${escaparHTML(
                            producto.ubicacion || "-"
                        )}
                    </strong>

                </div>

            </div>


            <div class="card-actions">

                <button
                    class="card-action"
                    onclick="verProducto('${producto.id}')"
                >
                    Ver
                </button>


                ${
                    compacta
                    ? ""
                    :
                    `
                    <button
                        class="card-action"
                        onclick="editarProducto('${producto.id}')"
                    >
                        Editar
                    </button>

                    <button
                        class="card-action danger"
                        onclick="darDeBaja('${producto.id}')"
                    >
                        Baja
                    </button>
                    `
                }

            </div>

        </article>

    `;

}


// =========================================================
// MODAL PRODUCTO
// =========================================================

function abrirModalProducto() {

    limpiarFormularioProducto();

    llenarCategoriasSelect();


    const titulo =
        document.getElementById(
            "modal-producto-titulo"
        );


    if (titulo) {

        titulo.textContent =
            "Agregar producto";

    }


    const modal =
        document.getElementById(
            "modal-producto"
        );


    if (modal) {

        modal.classList.remove(
            "oculto"
        );

    }

}


function cerrarModalProducto() {

    const modal =
        document.getElementById(
            "modal-producto"
        );


    if (modal) {

        modal.classList.add(
            "oculto"
        );

    }

}


function limpiarFormularioProducto() {

    const formulario =
        document.getElementById(
            "form-producto"
        );


    if (formulario) {

        formulario.reset();

    }


    const id =
        document.getElementById(
            "producto-id"
        );


    if (id) {

        id.value = "";

    }

}


// =========================================================
// CATEGORÍAS SELECT
// =========================================================

function llenarCategoriasSelect() {

    const select =
        document.getElementById(
            "producto-categoria"
        );


    if (!select) {

        console.warn(
            "No existe #producto-categoria en el HTML."
        );

        return;

    }


    select.innerHTML = `
        <option value="">
            Selecciona una categoría
        </option>
    `;


    categorias.forEach(
        categoria => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                categoria.id;


            option.textContent =
                categoria.nombre;


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// CREAR / EDITAR PRODUCTO
// =========================================================

async function guardarProducto(event) {

    event.preventDefault();


    const token =
        obtenerToken();


    if (!token) {

        mostrarLogin();

        return;

    }


    const id =
        obtenerValor(
            "producto-id"
        );


    const categoriaId =
        obtenerValor(
            "producto-categoria"
        );


    const producto = {

        nombre:
            obtenerValor(
                "producto-nombre"
            ),

        marca:
            obtenerValor(
                "producto-marca"
            ),

        modelo:
            obtenerValor(
                "producto-modelo"
            ),

        serial:
            obtenerValor(
                "producto-serial"
            ),

        descripcion:
            obtenerValor(
                "producto-descripcion"
            ),

        categoria_id:
            categoriaId
                ? Number(categoriaId)
                : null,

        ubicacion_id:
            null,

        estado:
            obtenerValor(
                "producto-estado"
            ),

        codigo_interno:
            obtenerValor(
                "producto-codigo"
            )

    };


    if (
        !producto.nombre ||
        !producto.estado ||
        !producto.codigo_interno
    ) {

        mostrarToast(
            "Completa los campos obligatorios."
        );

        return;

    }


    try {

        let respuesta;


        // ------------------------------------------------
        // CREAR
        // ------------------------------------------------

        if (!id) {

            respuesta =
                await fetch(
                    `${API_URL}/productos`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify(
                                producto
                            )
                    }
                );

        }


        // ------------------------------------------------
        // EDITAR
        // ------------------------------------------------

        else {

            respuesta =
                await fetch(
                    `${API_URL}/productos/${id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify(
                                producto
                            )
                    }
                );

        }


        const datos =
            await respuesta.json();


       if (respuesta.status === 401) {
    cerrarSesion();
    return;
}

if (respuesta.status === 403) {
    mostrarToast(
        datos.mensaje ||
        "No tienes permisos para consultar categorías."
    );

    categorias = [];
    renderizarCategorias();

    return;
}

        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            mostrarToast(
                datos.mensaje ||
                "No se pudo guardar el producto."
            );

            console.error(
                datos
            );

            return;

        }


        cerrarModalProducto();


        mostrarToast(
            id
                ? "Producto actualizado"
                : "Producto agregado"
        );


        await cargarProductosDesdeServidor();


        actualizarDashboard();

        renderizarInventario();


    } catch (error) {

        console.error(
            "Error guardando producto:",
            error
        );


        mostrarToast(
            "No se pudo conectar con el servidor."
        );

    }

}


// =========================================================
// EDITAR PRODUCTO
// =========================================================

function editarProducto(id) {

    const producto =
        productos.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!producto) {

        mostrarToast(
            "Producto no encontrado."
        );

        return;

    }


    llenarCategoriasSelect();


    establecerValor(
        "producto-id",
        producto.id
    );


    establecerValor(
        "producto-nombre",
        producto.nombre
    );


    establecerValor(
        "producto-marca",
        producto.marca
    );


    establecerValor(
        "producto-modelo",
        producto.modelo
    );


    establecerValor(
        "producto-serial",
        producto.serial
    );


    establecerValor(
        "producto-codigo",
        producto.codigo_interno ||
        producto.codigo
    );


    establecerValor(
        "producto-categoria",
        obtenerCategoriaIdProducto(
            producto
        )
    );


    establecerValor(
        "producto-ubicacion",
        producto.ubicacion_id ||
        ""
    );


    establecerValor(
        "producto-estado",
        producto.estado
    );


    establecerValor(
        "producto-descripcion",
        producto.descripcion
    );


    const titulo =
        document.getElementById(
            "modal-producto-titulo"
        );


    if (titulo) {

        titulo.textContent =
            "Editar producto";

    }


    const modal =
        document.getElementById(
            "modal-producto"
        );


    if (modal) {

        modal.classList.remove(
            "oculto"
        );

    }

}


// =========================================================
// VER PRODUCTO
// =========================================================

function verProducto(id) {

    const producto =
        productos.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!producto) {

        return;

    }


    productoDetalleActual =
        producto;


    const contenedor =
        document.getElementById(
            "detalle-producto"
        );


    if (!contenedor) {

        return;

    }


    contenedor.innerHTML = `

        ${crearDetalle(
            "ID",
            producto.id
        )}

        ${crearDetalle(
            "Nombre",
            producto.nombre
        )}

        ${crearDetalle(
            "Código interno",
            producto.codigo_interno ||
            producto.codigo
        )}

        ${crearDetalle(
            "Marca",
            producto.marca
        )}

        ${crearDetalle(
            "Modelo",
            producto.modelo
        )}

        ${crearDetalle(
            "Serial",
            producto.serial
        )}

        ${crearDetalle(
            "Categoría",
            obtenerNombreCategoriaProducto(
                producto
            )
        )}

        ${crearDetalle(
            "Ubicación",
            producto.ubicacion
        )}

        ${crearDetalle(
            "Estado",
            producto.estado
        )}

        ${crearDetalle(
            "Descripción",
            producto.descripcion
        )}

    `;


    const modal =
        document.getElementById(
            "modal-detalle"
        );


    if (modal) {

        modal.classList.remove(
            "oculto"
        );

    }

}


function crearDetalle(
    nombre,
    valor
) {

    return `

        <div class="detail-row">

            <span>
                ${escaparHTML(
                    nombre
                )}
            </span>

            <strong>
                ${escaparHTML(
                    valor ?? "-"
                )}
            </strong>

        </div>

    `;

}


// =========================================================
// EDITAR DESDE DETALLE
// =========================================================

function editarDesdeDetalle() {

    if (!productoDetalleActual) {

        return;

    }


    const id =
        productoDetalleActual.id;


    cerrarModalDetalle();

    editarProducto(id);

}


// =========================================================
// CERRAR DETALLE
// =========================================================

function cerrarModalDetalle() {

    const modal =
        document.getElementById(
            "modal-detalle"
        );


    if (modal) {

        modal.classList.add(
            "oculto"
        );

    }

}


// =========================================================
// DAR DE BAJA
// =========================================================

async function darDeBaja(id) {

    const producto =
        productos.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!producto) {

        return;

    }


    const confirmar =
        confirm(
            `¿Dar de baja el producto "${producto.nombre}"?`
        );


    if (!confirmar) {

        return;

    }


    const token =
        obtenerToken();


    try {

        const respuesta =
    await fetch(
        `${API_URL}/productos/${id}`,
        {
            method: "DELETE",

            headers: {
                "Authorization":
                    `Bearer ${token}`
            }
        }
    );

        const datos =
            await respuesta.json();


        if (respuesta.status === 401) {

    cerrarSesion();

    return;
}

if (respuesta.status === 403) {

    mostrarToast(
        datos.mensaje ||
        "No tienes permisos para dar de baja productos."
    );

    return;
}

        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            mostrarToast(
                datos.mensaje ||
                "No se pudo dar de baja."
            );

            return;

        }


        mostrarToast(
            "Producto dado de baja"
        );


        await cargarProductosDesdeServidor();


        actualizarDashboard();

        renderizarInventario();


    } catch (error) {

        console.error(
            error
        );


        mostrarToast(
            "Error conectando con el servidor."
        );

    }

}


// =========================================================
// CATEGORÍAS - MOSTRAR
// =========================================================

function renderizarCategorias() {

    const contenedor =
        document.getElementById(
            "lista-categorias"
        );


    if (!contenedor) {

        return;

    }


    if (
        categorias.length === 0
    ) {

        contenedor.innerHTML = `
            <div class="category-card">
                No hay categorías.
            </div>
        `;

        return;

    }


    contenedor.innerHTML =
        categorias
            .map(
                categoria => {

                    const cantidad =
                        productos.filter(
                            producto => {

                                const categoriaProducto =
                                    obtenerCategoriaIdProducto(
                                        producto
                                    );

                                return (
                                    String(
                                        categoriaProducto
                                    ) ===
                                    String(
                                        categoria.id
                                    )
                                );

                            }
                        ).length;


                    return `

                        <div class="category-card">

                            <div>

                                <strong>
                                    ${escaparHTML(
                                        categoria.nombre
                                    )}
                                </strong>

                                <span>
                                    ${cantidad}
                                    producto(s)
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


// =========================================================
// MODAL CATEGORÍA
// =========================================================

function abrirModalCategoria() {

    const formulario =
        document.getElementById(
            "form-categoria"
        );


    if (formulario) {

        formulario.reset();

    }


    const modal =
        document.getElementById(
            "modal-categoria"
        );


    if (modal) {

        modal.classList.remove(
            "oculto"
        );

    }

}


function cerrarModalCategoria() {

    const modal =
        document.getElementById(
            "modal-categoria"
        );


    if (modal) {

        modal.classList.add(
            "oculto"
        );

    }

}


// =========================================================
// CREAR CATEGORÍA - API
// =========================================================

async function crearCategoria(event) {

    event.preventDefault();


    const token =
        obtenerToken();


    if (!token) {

        mostrarLogin();

        return;

    }


    const input =
        document.getElementById(
            "nombre-categoria"
        );


    if (!input) {

        console.error(
            "No se encontró #nombre-categoria."
        );

        return;

    }


    const nombre =
        input.value.trim();


    if (!nombre) {

        mostrarToast(
            "Escribe un nombre para la categoría."
        );

        return;

    }


    try {

        const respuesta =
            await fetch(
                `${API_URL}/categorias`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        nombre: nombre
                    })
                }
            );


        const datos =
            await respuesta.json();


        console.log(
            "Respuesta crear categoría:",
            datos
        );


      if (respuesta.status === 401) {

    cerrarSesion();

    return;

}


if (respuesta.status === 403) {

    mostrarToast(
        datos.mensaje ||
        "No tienes permisos para crear categorías."
    );

    return;

}


        if (
            !respuesta.ok ||
            !datos.ok
        ) {

            mostrarToast(
                datos.mensaje ||
                "No se pudo crear la categoría."
            );

            return;

        }


        cerrarModalCategoria();


        mostrarToast(
            "Categoría creada correctamente."
        );


        await cargarCategoriasDesdeServidor();


        llenarCategoriasSelect();


        renderizarCategorias();


    } catch (error) {

        console.error(
            "Error creando categoría:",
            error
        );


        mostrarToast(
            "No se pudo conectar con el servidor."
        );

    }

}


// =========================================================
// CONFIGURACIÓN
// =========================================================

function actualizarEmailConfiguracion() {

    const email =
        sessionStorage.getItem(
            "usuarioEmail"
        );


    const elemento =
        document.getElementById(
            "config-email"
        );


    if (
        email &&
        elemento
    ) {

        elemento.textContent =
            email;

    }

}


// =========================================================
// TOAST
// =========================================================

function mostrarToast(
    mensaje
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        console.log(
            mensaje
        );

        return;

    }


    toast.textContent =
        mensaje;


    toast.classList.add(
        "visible"
    );


    clearTimeout(
        toastTimeout
    );


    toastTimeout =
        setTimeout(
            function () {

                toast.classList.remove(
                    "visible"
                );

            },
            2500
        );

}


// =========================================================
// UTILIDADES
// =========================================================

function obtenerValor(id) {

    const elemento =
        document.getElementById(
            id
        );


    if (!elemento) {

        return "";

    }


    return elemento.value
        .trim();

}


function establecerValor(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.value =
            valor ?? "";

    }

}


function actualizarElemento(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            valor;

    }

}


function normalizarEstado(
    estado
) {

    return String(
        estado || ""
    )
        .trim()
        .toUpperCase();

}


// =========================================================
// SEGURIDAD HTML
// =========================================================

function escaparHTML(
    valor
) {

    return String(
        valor ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}
