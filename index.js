window.onload = function () {
    var buscador = document.getElementById("buscador");
    var opcion = document.getElementById("tipo");
    var informe = document.getElementById("informe");

    tipo = opcion.value;

    buscador.addEventListener("input", () => {
            let caracteres = buscador.value.trim();
            if (caracteres.length >= 0) {
                inicio();
            } 
    });

    opcion.addEventListener("change", () => {
        tipo = opcion.value;
        inicio();
    });

    informe.addEventListener("click", mostrarInforme);

    window.addEventListener("scroll", scrollInfinito);
};

var contadorPagina = 1;
var peticion = false;
var eliminarP = true;
var detalleActivado = false;
var tipo = "";
var peliculasDetalles = [];

function inicio() {
    contadorPagina = 1;
    eliminarP = true;
    mostrarPelicula();
    filtro(tipo);
}

function mostrarPelicula() {
    const lista = document.getElementById("lista");
    const spinner = document.getElementById("spinner");

    spinner.style.display = "block"; 

    if (eliminarP && contadorPagina === 1) {
        peliculasDetalles = [];
    }

    peticion = true;
    let peliBuscada = document.getElementById("buscador").value;
    fetch("https://www.omdbapi.com/?apikey=308558b&s=" + peliBuscada + "&page=" + contadorPagina + "&type=" + tipo, { method: "GET" })
        .then((res) => res.json())
        .then((datosRecibidos) => {
            if (datosRecibidos.totalResults == undefined) {
                document.getElementById("numeroResultados").innerHTML = "No Results Found";
                document.getElementById("informe").innerHTML = "";
                document.getElementById("informe").style.display = "none";
            } else {
                document.getElementById("numeroResultados").innerHTML = "Results Found: " + datosRecibidos.totalResults;
                document.getElementById("informe").innerHTML = "View Stats";
                document.getElementById("informe").style.display = "block";
            }
            
            if (eliminarP) {
                lista.innerHTML = ""; 
            }

            const promesas = datosRecibidos.Search.map((pelicula) =>
                fetch(`https://www.omdbapi.com/?apikey=308558b&i=${pelicula.imdbID}`, { method: "GET" })
                    .then((res) => res.json())
            );

            Promise.all(promesas)
                .then((resultados) => {
                    peliculasDetalles.push(...resultados);

                    resultados.forEach((pelicula) => {
                        let div = document.createElement("div");
                        lista.appendChild(div);

                        let img = document.createElement("img");
                        img.id = pelicula.imdbID;
                        img.addEventListener("click", () => {
                            if (!detalleActivado) {
                                mostrarDescripcion(img.id);
                                detalleActivado = true;
                            }
                        });

                        img.src = pelicula.Poster;
                        img.addEventListener("error", (e) => {
                            e.target.src = "./posterNoEncontrado.jpg";
                        });

                        div.appendChild(img);
                    });

                    peticion = false;
                })
                .catch((err) => console.error("Error al cargar detalles:", err))
                .finally(() => {
                    spinner.style.display = "none"; 
                });
        })
        .catch((err) => console.error("Error en la búsqueda:", err))
        .finally(() => {
            spinner.style.display = "none"; 
        });
}


function scrollInfinito() {
    eliminarP = false;
    let ventana = window.innerHeight;
    let documento = document.body.offsetHeight;

    let endOfPage = ventana + window.pageYOffset >= documento * 0.60;

    if (endOfPage) {
        if (!peticion) {
            contadorPagina++;
            mostrarPelicula();
        }
    }
}

function mostrarDescripcion(imdbID) {
    fetch(`https://www.omdbapi.com/?apikey=308558b&i=${imdbID}`)
        .then((res) => res.json())
        .then((pelicula) => {
            document.body.style.overflow = "hidden";

            let overlay = document.createElement("div");
            overlay.id = "overlay";
            document.body.appendChild(overlay);

            let descripcion = document.createElement("div");
            descripcion.id = "descripcion";

            let cerrar = document.createElement("button");
            cerrar.textContent = "X";
            cerrar.addEventListener("click", () => {
                descripcion.remove();
                overlay.remove();
                detalleActivado = false;
                document.body.style.overflow = "";
            });
            descripcion.appendChild(cerrar);

            let contenido = document.createElement("div");
            contenido.className = "contenido";

            let poster = document.createElement("img");
            poster.src = pelicula.Poster;
            poster.addEventListener("error", (e) => {
                e.target.src = "./posterNoEncontrado.jpg";
            });
            poster.alt = `${pelicula.Title} Poster`;

            let detalles = [
                `Title: ${pelicula.Title}`,
                `Genre: ${pelicula.Genre}`,
                `Runtime: ${pelicula.Runtime}`,
                `Plot: ${pelicula.Plot}`,
                `Released: ${pelicula.Released}`,
                `Director: ${pelicula.Director}`,
                `Actors: ${pelicula.Actors}`,
                `Rating:`
            ];

            pelicula.Ratings.forEach((rating) => {
                detalles.push(`${rating.Source}: ${rating.Value}`);
            });

            let ul = document.createElement("ul");
            detalles.forEach((texto) => {
                let li = document.createElement("li");
                li.textContent = texto;
                ul.appendChild(li);
            });

            contenido.appendChild(poster);
            contenido.appendChild(ul);

            descripcion.appendChild(contenido);

            document.body.appendChild(descripcion);
        })
        .catch((err) => console.error("Error:", err));
}

function filtro(tipo) {
    switch (tipo) {
        case "series":
            document.getElementById("tipoSeleccionado").innerText = "Series";
            break;

        case "movie":
            document.getElementById("tipoSeleccionado").innerText = "Movies";
            break;

        case "":
            document.getElementById("tipoSeleccionado").innerText = "";
            break;
    }
}

function mostrarInforme() {
    document.body.style.overflow = "hidden";

    let overlay = document.createElement("div");
    overlay.id = "overlay";
    document.body.appendChild(overlay);

    let informeContenedor = document.createElement("div");
    informeContenedor.id = "informeContenedor";

    let cerrar = document.createElement("button");
    cerrar.textContent = "X";
    cerrar.addEventListener("click", () => {
        informeContenedor.remove();
        overlay.remove();
        detalleActivado = false;
        document.body.style.overflow = "";
    });

    informeContenedor.appendChild(cerrar);

    let contenido = document.createElement("div");
    contenido.className = "contenido";

    const peliculasValoradas = [...peliculasDetalles]
        .filter(p => p.imdbRating)
        .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating))
        .slice(0, 5);

    const peliculasRecaudacion = [...peliculasDetalles]
        .filter(p => p.BoxOffice && p.BoxOffice !== "N/A" && p.Type === "movie") 
        .sort((a, b) => parseFloat(b.BoxOffice.replace(/[$,]/g, '')) - parseFloat(a.BoxOffice.replace(/[$,]/g, '')))
        .slice(0, 5);

    const peliculasVotadas = [...peliculasDetalles]
        .filter(p => p.imdbVotes)
        .sort((a, b) => parseInt(b.imdbVotes.replace(/,/g, '')) - parseInt(a.imdbVotes.replace(/,/g, '')))
        .slice(0, 5);

    contenido.appendChild(crearSeccionInforme("Best Rated", peliculasValoradas, "imdbRating"));
    if (peliculasValoradas.length > 0) {
        contenido.appendChild(crearGrafico("Best Rated Movies/Series", peliculasValoradas, "imdbRating"));
    }

    if (peliculasRecaudacion.length > 0) {
        contenido.appendChild(crearSeccionInforme("Highest Grossing (Movies Only)", peliculasRecaudacion, "BoxOffice"));
        contenido.appendChild(crearGrafico("Highest Grossing Movies", peliculasRecaudacion, "BoxOffice"));
    }

    contenido.appendChild(crearSeccionInforme("Most Voted", peliculasVotadas, "imdbVotes"));
    if (peliculasVotadas.length > 0) {
        contenido.appendChild(crearGrafico("Most Voted Movies/Series", peliculasVotadas, "imdbVotes"));
    }

    informeContenedor.appendChild(contenido);
    document.body.appendChild(informeContenedor);
}


function crearGrafico(titulo, peliculas, clave) {
    let divGrafico = document.createElement("div");
    divGrafico.className = "grafico";

    google.charts.load('current', { packages: ['corechart', 'bar'] });
    google.charts.setOnLoadCallback(function () {
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Title');
        data.addColumn('number', 'Value');
        
        peliculas.forEach(pelicula => {
            let valor;
            if (clave === "imdbRating") {
                valor = parseFloat(pelicula.imdbRating); 
            } else if (clave === "BoxOffice") {
                valor = parseFloat(pelicula.BoxOffice.replace(/[$,]/g, '')); 
            } else if (clave === "imdbVotes") {
                valor = parseInt(pelicula.imdbVotes.replace(/,/g, '')); 
            }

            if (!isNaN(valor)) { 
                data.addRow([pelicula.Title, valor]);
            }
        });

        var options = {
            title: titulo,
            titleTextStyle: {
                color: '#ffffff', 
                fontSize: 18, 
            },
            chartArea: {
                width: '50%',
                backgroundColor: {
                    fill: '#121212' 
                }
            },
            hAxis: {
                minValue: 0,
                textStyle: { color: '#ffffff' }, 
                titleTextStyle: { color: '#ffffff' }, 
            },
            vAxis: {
                textStyle: { color: '#ffffff' }, 
                titleTextStyle: { color: '#ffffff' }, 
            },
            legend: { 
                position: 'none' 
            },
            backgroundColor: {
                fill: '#121212' 
            },
            colors: ['#00bcd4'], 
        };
        

        var chart = new google.visualization.BarChart(divGrafico);
        chart.draw(data, options);
    });

    return divGrafico;
}



function crearSeccionInforme(titulo, peliculas, clave) {
    let seccion = document.createElement("div");
    seccion.className = "seccionInforme";

    let encabezado = document.createElement("h3");
    encabezado.textContent = titulo;
    seccion.appendChild(encabezado);

    let lista = document.createElement("ul");

    peliculas.forEach(pelicula => {
        let item = document.createElement("li");

        switch (clave) {
            case "imdbRating":
                item.textContent = `${pelicula.Title} (${pelicula.Year}) - Rating: ${pelicula.imdbRating}`;
                break;
            case "BoxOffice":
                item.textContent = `${pelicula.Title} (${pelicula.Year}) - Collection: ${pelicula.BoxOffice}`;
                break;
            case "imdbVotes":
                item.textContent = `${pelicula.Title} (${pelicula.Year}) - Votes: ${pelicula.imdbVotes}`;
                break;
        }

        lista.appendChild(item);
    });

    seccion.appendChild(lista);
    return seccion;
}
