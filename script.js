const API = "https://ghibliapi.vercel.app";

const contenedor = document.getElementById("peliculas");
const busqueda = document.getElementById("busqueda");
const filtroDirector = document.getElementById("filtroDirector");
const ordenar = document.getElementById("ordenar");
const contador = document.getElementById("contador");
const estado = document.getElementById("estado");
const modal = document.getElementById("modal");
const detalle = document.getElementById("detalle");
const cerrarModal = document.getElementById("cerrarModal");

let peliculas = [];

async function cargarPeliculas() {
    estado.textContent = "Cargando películas de Studio Ghibli...";

    try {
        const respuesta = await fetch(`${API}/films`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener las películas.");
        }

        peliculas = await respuesta.json();

        if (!Array.isArray(peliculas)) {
            throw new Error("La respuesta de la API no es válida.");
        }

        cargarDirectores();
        mostrarPeliculas();

    } catch (error) {
        console.error(error);

        estado.textContent =
            "No se pudieron cargar las películas. Comprueba tu conexión e inténtalo de nuevo.";

        contador.textContent = "Error de conexión";
    }
}

function cargarDirectores() {
    const directores = [...new Set(
        peliculas
            .map(pelicula => pelicula.director)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es"));

    filtroDirector.innerHTML =
        '<option value="">Todos los directores</option>';

    directores.forEach(director => {
        const opcion = document.createElement("option");

        opcion.value = director;
        opcion.textContent = director;

        filtroDirector.appendChild(opcion);
    });
}

function obtenerPeliculasFiltradas() {
    const texto = busqueda.value.trim().toLocaleLowerCase("es");
    const directorSeleccionado = filtroDirector.value;

    const resultado = peliculas.filter(pelicula => {
        const titulo = (pelicula.title || "").toLocaleLowerCase("es");

        const coincideTitulo = titulo.includes(texto);

        const coincideDirector =
            !directorSeleccionado ||
            pelicula.director === directorSeleccionado;

        return coincideTitulo && coincideDirector;
    });

    if (ordenar.value === "antiguas") {
        resultado.sort(
            (a, b) => Number(a.release_date) - Number(b.release_date)
        );
    } else if (ordenar.value === "recientes") {
        resultado.sort(
            (a, b) => Number(b.release_date) - Number(a.release_date)
        );
    } else {
        resultado.sort((a, b) =>
            (a.title || "").localeCompare(b.title || "", "es")
        );
    }

    return resultado;
}

function crearPortada(pelicula) {
    const portada = document.createElement("div");
    portada.className = "portada";

    const imagenURL = pelicula.image || pelicula.movie_banner;

    if (imagenURL) {
        const imagen = document.createElement("img");

        imagen.src = imagenURL;
        imagen.alt = `Portada de ${pelicula.title}`;
        imagen.loading = "lazy";
        imagen.referrerPolicy = "no-referrer";

        imagen.addEventListener("error", () => {
            const alternativa = document.createElement("div");

            alternativa.className = "portada-fallback";
            alternativa.textContent = pelicula.title;

            imagen.replaceWith(alternativa);
        }, { once: true });

        portada.appendChild(imagen);
    } else {
        const alternativa = document.createElement("div");

        alternativa.className = "portada-fallback";
        alternativa.textContent = pelicula.title;

        portada.appendChild(alternativa);
    }

    const anio = document.createElement("span");

    anio.className = "anio";
    anio.textContent = pelicula.release_date || "Año desconocido";

    portada.appendChild(anio);

    return portada;
}

function mostrarPeliculas() {
    const resultado = obtenerPeliculasFiltradas();

    contenedor.innerHTML = "";
    estado.textContent = "";

    contador.textContent =
        `${resultado.length} ${resultado.length === 1 ? "película" : "películas"}`;

    if (resultado.length === 0) {
        estado.textContent =
            "No encontramos películas con esos criterios. Prueba otra búsqueda.";

        return;
    }

    resultado.forEach(pelicula => {
        const tarjeta = document.createElement("article");

        tarjeta.className = "tarjeta";
        tarjeta.tabIndex = 0;
        tarjeta.setAttribute("role", "button");
        tarjeta.setAttribute(
            "aria-label",
            `Abrir ficha de ${pelicula.title}`
        );

        const informacion = document.createElement("div");
        informacion.className = "info";

        const titulo = document.createElement("h3");
        titulo.textContent = pelicula.title || "Título desconocido";

        const director = document.createElement("p");
        director.className = "director";

        const etiquetaDirector = document.createElement("strong");
        etiquetaDirector.textContent = "Director: ";

        director.append(
            etiquetaDirector,
            document.createTextNode(pelicula.director || "No disponible")
        );

        const boton = document.createElement("button");

        boton.className = "ver-detalle";
        boton.type = "button";

        const textoBoton = document.createElement("span");
        textoBoton.textContent = "Ver ficha completa";

        const flecha = document.createElement("span");
        flecha.textContent = "→";
        flecha.setAttribute("aria-hidden", "true");

        boton.append(textoBoton, flecha);

        informacion.append(titulo, director, boton);

        tarjeta.append(crearPortada(pelicula), informacion);

        tarjeta.addEventListener("click", () => {
            abrirFicha(pelicula.id);
        });

        tarjeta.addEventListener("keydown", evento => {
            if (
                (evento.key === "Enter" || evento.key === " ") &&
                evento.target === tarjeta
            ) {
                evento.preventDefault();
                abrirFicha(pelicula.id);
            }
        });

        contenedor.appendChild(tarjeta);
    });
}

async function abrirFicha(id) {
    const pelicula = peliculas.find(item => item.id === id);

    if (!pelicula) return;

    modal.showModal();

    detalle.innerHTML = "";

    const cargando = document.createElement("div");
    cargando.className = "detalle-portada";
    cargando.textContent = "Cargando ficha...";

    detalle.appendChild(cargando);

    try {
        const respuesta = await fetch(
            `${API}/films/${encodeURIComponent(id)}`
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar la ficha.");
        }

        const datos = await respuesta.json();

        const contenido = document.createElement("div");
        contenido.className = "detalle-contenido";

        const titulo = document.createElement("h2");
        titulo.textContent = datos.title || "Título desconocido";

        const sinopsis = document.createElement("p");
        sinopsis.textContent =
            datos.description || "No hay sinopsis disponible.";

        contenido.append(titulo, sinopsis);

        const datosExtra = document.createElement("div");
        datosExtra.className = "datos-detalle";

        const campos = [
            ["Título original", datos.original_title],
            ["Título romanizado", datos.original_title_romanised],
            ["Director", datos.director],
            ["Productor", datos.producer],
            ["Año de estreno", datos.release_date],
            [
                "Duración",
                datos.running_time ? `${datos.running_time} minutos` : ""
            ],
            [
                "Puntuación",
                datos.rt_score ? `${datos.rt_score}/100` : ""
            ]
        ];

        campos.forEach(([nombre, valor]) => {
            if (!valor) return;

            const parrafo = document.createElement("p");
            const etiqueta = document.createElement("strong");

            etiqueta.textContent = `${nombre}: `;

            parrafo.append(
                etiqueta,
                document.createTextNode(valor)
            );

            datosExtra.appendChild(parrafo);
        });

        const enlace = document.createElement("a");

        enlace.className = "detalle-api";
        enlace.href = `${API}/films/${encodeURIComponent(id)}`;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
        enlace.textContent = "Consultar ficha original de la API";

        contenido.append(datosExtra, enlace);

        detalle.innerHTML = "";
        detalle.appendChild(contenido);

    } catch (error) {
        console.error(error);

        detalle.innerHTML = "";

        const contenido = document.createElement("div");
        contenido.className = "detalle-contenido";

        const titulo = document.createElement("h2");
        titulo.textContent = pelicula.title;

        const mensaje = document.createElement("p");
        mensaje.textContent =
            "No se pudo cargar la sinopsis. Comprueba tu conexión e inténtalo de nuevo.";

        contenido.append(titulo, mensaje);
        detalle.appendChild(contenido);
    }
}

busqueda.addEventListener("input", mostrarPeliculas);

filtroDirector.addEventListener("change", mostrarPeliculas);

ordenar.addEventListener("change", mostrarPeliculas);

cerrarModal.addEventListener("click", () => {
    modal.close();
});

modal.addEventListener("click", evento => {
    if (evento.target === modal) {
        modal.close();
    }
});

cargarPeliculas();s