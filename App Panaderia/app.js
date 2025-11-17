// ============================================
// GESTIÓN DE ALMACENAMIENTO LOCAL
// ============================================

class StorageManager {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('panaderiaData')) {
            const defaultData = {
                registros: [],
                categorias: [
                    // Ingresos
                    { id: 'cat_1', nombre: 'Ventas al mostrador', tipo: 'ingreso' },
                    { id: 'cat_2', nombre: 'Ventas al por mayor', tipo: 'ingreso' },
                    { id: 'cat_3', nombre: 'Otros ingresos', tipo: 'ingreso' },
                    // Egresos
                    { id: 'cat_4', nombre: 'Materia prima', tipo: 'egreso' },
                    { id: 'cat_5', nombre: 'Servicios (luz, agua, gas)', tipo: 'egreso' },
                    { id: 'cat_6', nombre: 'Salarios', tipo: 'egreso' },
                    { id: 'cat_7', nombre: 'Mantenimiento', tipo: 'egreso' },
                    { id: 'cat_8', nombre: 'Otros egresos', tipo: 'egreso' }
                ]
            };
            localStorage.setItem('panaderiaData', JSON.stringify(defaultData));
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem('panaderiaData')) || { registros: [], categorias: [] };
    }

    saveData(data) {
        localStorage.setItem('panaderiaData', JSON.stringify(data));
    }

    agregarRegistro(registro) {
        const data = this.getData();
        registro.id = 'reg_' + Date.now();
        data.registros.push(registro);
        this.saveData(data);
        return registro;
    }

    eliminarRegistro(id) {
        const data = this.getData();
        data.registros = data.registros.filter(r => r.id !== id);
        this.saveData(data);
    }

    agregarCategoria(nombre, tipo) {
        const data = this.getData();
        const categoria = {
            id: 'cat_' + Date.now(),
            nombre: nombre,
            tipo: tipo
        };
        data.categorias.push(categoria);
        this.saveData(data);
        return categoria;
    }

    eliminarCategoria(id) {
        const data = this.getData();
        // Verificar si hay registros con esta categoría
        const tieneRegistros = data.registros.some(r => r.categoria === id);
        if (tieneRegistros) {
            return false;
        }
        data.categorias = data.categorias.filter(c => c.id !== id);
        this.saveData(data);
        return true;
    }

    getCategoriasConFiltro(tipo) {
        const data = this.getData();
        return data.categorias.filter(c => c.tipo === tipo);
    }

    getRegistrosFiltrados(filtro) {
        const data = this.getData();
        return data.registros.filter(r => {
            if (filtro.fecha && r.fecha !== filtro.fecha) return false;
            if (filtro.tipo && r.tipo !== filtro.tipo) return false;
            if (filtro.categoria && r.categoria !== filtro.categoria) return false;
            if (filtro.fechaInicio && new Date(r.fecha) < new Date(filtro.fechaInicio)) return false;
            if (filtro.fechaFin && new Date(r.fecha) > new Date(filtro.fechaFin)) return false;
            return true;
        });
    }
}

// ============================================
// APLICACIÓN PRINCIPAL
// ============================================

class AppPanaderia {
    constructor() {
        this.storage = new StorageManager();
        this.currentModule = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initTheme();
        this.setFechaActual();
        this.cargarRegistros();
        this.actualizarDashboard();
    }

    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const module = e.target.closest('.nav-link').dataset.module;
                this.cambiarModulo(module);
                // Cerrar menú en móvil al seleccionar
                if (window.innerWidth <= 900) {
                    document.getElementById('nav-menu').classList.remove('active');
                }
            });
        });

        // Menú hamburguesa para móvil
        document.getElementById('hamburger-menu').addEventListener('click', () => {
            document.getElementById('nav-menu').classList.toggle('active');
        });

        // Cerrar menú al hacer click fuera
        document.addEventListener('click', (e) => {
            const navMenu = document.getElementById('nav-menu');
            const hamburger = document.getElementById('hamburger-menu');
            if (window.innerWidth <= 900 && !navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });

        // Registros
        document.getElementById('formRegistro').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarRegistro();
        });

        document.getElementById('tipo').addEventListener('change', () => {
            this.actualizarCategoriasSelect();
        });

        document.getElementById('categoria').addEventListener('change', () => {
            // Llenar descripción con el nombre de la categoría seleccionada
            const categoriaId = document.getElementById('categoria').value;
            const nombreCategoria = this.getNombreCategoria(categoriaId);
            document.getElementById('descripcion').value = nombreCategoria;
        });

        document.getElementById('monto').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.guardarRegistro();
            }
        });

        // Filtros de registros
        document.getElementById('filtroFecha').addEventListener('change', () => this.cargarRegistros());
        document.getElementById('filtroTipo').addEventListener('change', () => {
            this.actualizarCategoriasFiltro();
            this.cargarRegistros();
        });
        document.getElementById('filtroCategoria').addEventListener('change', () => this.cargarRegistros());

        // Event listeners para filtros del dashboard
        document.getElementById('filtroDashboardMes').addEventListener('change', (e) => {
            const valor = e.target.value;
            const mesInput = document.getElementById('dashboardMesPersonalizado');
            const añoInput = document.getElementById('dashboardAñoPersonalizado');
            const btnAplicar = document.getElementById('btnAplicarFiltroDashboard');
            
            mesInput.style.display = 'none';
            añoInput.style.display = 'none';
            btnAplicar.style.display = 'none';
            
            if (valor === 'mes-personalizado') {
                mesInput.style.display = 'inline-block';
                btnAplicar.style.display = 'inline-block';
            } else if (valor === 'año-personalizado') {
                añoInput.style.display = 'inline-block';
                btnAplicar.style.display = 'inline-block';
            } else {
                this.actualizarDashboard();
            }
        });
        
        document.getElementById('btnAplicarFiltroDashboard').addEventListener('click', () => {
            this.actualizarDashboard();
        });

        // Parámetros
        document.getElementById('btnAgregarCategoria').addEventListener('click', () => {
            this.agregarNuevaCategoria();
        });

        document.getElementById('nuevaCategoria').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.agregarNuevaCategoria();
            }
        });

        // Análisis
        document.getElementById('btnActualizarAnalisis').addEventListener('click', () => {
            this.actualizarAnalisis();
        });

        // Cargar categorías iniciales
        this.actualizarCategoriasSelect();
        this.actualizarCategoriasFiltro();
        this.cargarParametros();

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Column toggle
        document.getElementById('btnToggleColumns').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('columnToggleDropdown');
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('columnToggleDropdown');
            const btn = document.getElementById('btnToggleColumns');
            if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Column checkboxes
        document.querySelectorAll('#columnToggleDropdown input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const columna = e.target.dataset.column;
                this.toggleColumna(columna);
            });
        });

        // Inicializar estados de checkboxes
        this.initColumnToggles();
    }

    cambiarModulo(modulo) {
        // Ocultar todos los módulos
        document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
        // Mostrar módulo seleccionado
        document.getElementById(modulo).classList.add('active');
        // Actualizar nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.module === modulo) {
                link.classList.add('active');
            }
        });
        this.currentModule = modulo;

        // Acciones específicas según módulo
        if (modulo === 'analisis') {
            this.actualizarAnalisis();
        } else if (modulo === 'dashboard') {
            this.actualizarDashboard();
        }
    }

    setFechaActual() {
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fecha').value = hoy;
        document.getElementById('filtroFecha').value = hoy;
        document.getElementById('fechaInicio').value = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        document.getElementById('fechaFin').value = hoy;
    }

    actualizarCategoriasSelect() {
        const tipo = document.getElementById('tipo').value;
        const categorias = this.storage.getCategoriasConFiltro(tipo);
        const select = document.getElementById('categoria');
        select.innerHTML = '<option value="">Seleccionar categoría...</option>';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
    }

    actualizarCategoriasFiltro() {
        const tipo = document.getElementById('filtroTipo').value;
        const select = document.getElementById('filtroCategoria');
        select.innerHTML = '<option value="">Todas las categorías</option>';

        const data = this.storage.getData();
        const categoriasUsadas = new Set();

        // Encontrar categorías usadas en registros del tipo seleccionado
        data.registros.forEach(r => {
            if (!tipo || r.tipo === tipo) {
                categoriasUsadas.add(r.categoria);
            }
        });

        data.categorias.forEach(cat => {
            if (!tipo || cat.tipo === tipo) {
                if (categoriasUsadas.has(cat.id)) {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.nombre;
                    select.appendChild(option);
                }
            }
        });
    }

    guardarRegistro() {
        const tipo = document.getElementById('tipo').value;
        const categoria = document.getElementById('categoria').value;
        const descripcion = document.getElementById('descripcion').value;
        const monto = parseFloat(document.getElementById('monto').value);
        const fecha = document.getElementById('fecha').value;

        if (!tipo || !categoria || !monto) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        const registro = {
            tipo,
            categoria,
            descripcion,
            monto,
            fecha
        };

        this.storage.agregarRegistro(registro);

        // Guardar valores antes de limpiar
        const fechaActual = document.getElementById('fecha').value;
        const tipoActual = document.getElementById('tipo').value;
        const categoriaActual = document.getElementById('categoria').value;

        // Limpiar formulario
        document.getElementById('formRegistro').reset();
        
        // Restaurar tipo y fecha
        document.getElementById('tipo').value = tipoActual;
        document.getElementById('fecha').value = fechaActual;
        
        // Actualizar categorías para el tipo seleccionado
        this.actualizarCategoriasSelect();
        
        // Verificar si el usuario cambió manualmente el orden (flag en localStorage)
        const ordenCambiadoManualmente = localStorage.getItem('ordenCambiadoManualmente') === 'true';
        
        // Obtener categorías usadas en el día anterior
        const data = this.storage.getData();
        const fechaAnterior = new Date(fechaActual);
        fechaAnterior.setDate(fechaAnterior.getDate() - 1);
        const fechaAnteriorStr = fechaAnterior.toISOString().split('T')[0];
        
        const registrosDiaAnterior = data.registros.filter(r => 
            r.fecha === fechaAnteriorStr && r.tipo === tipoActual
        );
        
        // Obtener lista ordenada de categorías del día anterior
        const categoriasUsadasAyer = [];
        const categoriasVistas = new Set();
        
        registrosDiaAnterior.forEach(r => {
            if (!categoriasVistas.has(r.categoria)) {
                categoriasUsadasAyer.push(r.categoria);
                categoriasVistas.add(r.categoria);
            }
        });
        
        // Seleccionar la siguiente categoría
        const selectCategoria = document.getElementById('categoria');
        let siguienteCategoriaId = null;
        
        // Si el orden fue cambiado manualmente, usar siempre el listado general
        if (ordenCambiadoManualmente) {
            const opciones = Array.from(selectCategoria.options).filter(opt => opt.value !== '');
            if (opciones.length > 0) {
                const indiceActual = opciones.findIndex(opt => opt.value === categoriaActual);
                const siguienteIndice = (indiceActual + 1) % opciones.length;
                siguienteCategoriaId = opciones[siguienteIndice].value;
            }
        } else if (categoriasUsadasAyer.length > 0) {
            // Usar el orden del día anterior solo si no se ha cambiado manualmente
            const indiceEnAyer = categoriasUsadasAyer.indexOf(categoriaActual);
            if (indiceEnAyer !== -1 && indiceEnAyer + 1 < categoriasUsadasAyer.length) {
                // Siguiente categoría del día anterior
                siguienteCategoriaId = categoriasUsadasAyer[indiceEnAyer + 1];
            } else {
                // Volver a la primera categoría del día anterior
                siguienteCategoriaId = categoriasUsadasAyer[0];
            }
        } else {
            // No hay registros del día anterior, usar lista general
            const opciones = Array.from(selectCategoria.options).filter(opt => opt.value !== '');
            if (opciones.length > 0) {
                const indiceActual = opciones.findIndex(opt => opt.value === categoriaActual);
                const siguienteIndice = (indiceActual + 1) % opciones.length;
                siguienteCategoriaId = opciones[siguienteIndice].value;
            }
        }
        
        if (siguienteCategoriaId) {
            selectCategoria.value = siguienteCategoriaId;
            const nombreCategoria = this.getNombreCategoria(siguienteCategoriaId);
            document.getElementById('descripcion').value = nombreCategoria;
        }

        // Recargar tabla
        this.cargarRegistros();
        this.actualizarDashboard();

        alert('Registro guardado exitosamente');
    }

    // Función auxiliar para parsear fechas en zona local
    parseFechaLocal(fechaStr) {
        const [year, month, day] = fechaStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    formatearFechaLocal(fecha) {
        if (typeof fecha === 'string') {
            fecha = this.parseFechaLocal(fecha);
        }
        return fecha.toLocaleDateString('es-MX');
    }

    cargarRegistros() {
        const filtro = {
            fecha: document.getElementById('filtroFecha').value || null,
            tipo: document.getElementById('filtroTipo').value || null,
            categoria: document.getElementById('filtroCategoria').value || null
        };

        const registros = this.storage.getRegistrosFiltrados(filtro);
        const tbody = document.getElementById('registrosTable');
        const thead = document.querySelector('#registrosTable').closest('table').querySelector('thead tr');
        
        tbody.innerHTML = '';

        if (registros.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Sin registros</td></tr>';
            return;
        }

        // Obtener columnas ocultas
        const columnasOcultas = JSON.parse(localStorage.getItem('columnasOcultas') || '{}');

        // Ordenar por fecha descendente
        registros.sort((a, b) => this.parseFechaLocal(b.fecha) - this.parseFechaLocal(a.fecha));

        registros.forEach(registro => {
            const nombreCategoria = this.getNombreCategoria(registro.categoria);
            const montoClass = registro.tipo === 'ingreso' ? 'monto-ingreso' : 'monto-egreso';
            const montoSymbol = registro.tipo === 'ingreso' ? '+' : '-';

            const row = document.createElement('tr');
            
            // Fecha
            const fechaTd = document.createElement('td');
            fechaTd.style.display = columnasOcultas.fecha ? 'none' : '';
            fechaTd.textContent = this.formatearFechaLocal(registro.fecha);
            fechaTd.style.cursor = 'pointer';
            fechaTd.title = 'Doble click para editar';
            fechaTd.addEventListener('dblclick', () => {
                this.editarCampoRegistro(registro.id, 'fecha', fechaTd);
            });
            row.appendChild(fechaTd);
            
            // Tipo
            const tipoTd = document.createElement('td');
            tipoTd.style.display = columnasOcultas.tipo ? 'none' : '';
            tipoTd.innerHTML = `<strong>${registro.tipo === 'ingreso' ? '📈 Ingreso' : '📉 Egreso'}</strong>`;
            row.appendChild(tipoTd);
            
            // Categoría
            const categoriaTd = document.createElement('td');
            categoriaTd.style.display = columnasOcultas.categoria ? 'none' : '';
            categoriaTd.textContent = nombreCategoria;
            row.appendChild(categoriaTd);
            
            // Descripción
            const descripcionTd = document.createElement('td');
            descripcionTd.style.display = columnasOcultas.descripcion ? 'none' : '';
            descripcionTd.textContent = registro.descripcion || '-';
            row.appendChild(descripcionTd);
            
            // Monto
            const montoTd = document.createElement('td');
            montoTd.style.display = columnasOcultas.monto ? 'none' : '';
            montoTd.className = montoClass;
            montoTd.textContent = `$${montoSymbol}${registro.monto.toFixed(2)}`;
            montoTd.style.cursor = 'pointer';
            montoTd.title = 'Doble click para editar';
            montoTd.addEventListener('dblclick', () => {
                this.editarCampoRegistro(registro.id, 'monto', montoTd);
            });
            row.appendChild(montoTd);

            const actionsTd = document.createElement('td');
            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-danger';
            delBtn.textContent = 'Eliminar';
            delBtn.addEventListener('click', () => {
                this.eliminarRegistro(registro.id);
            });
            actionsTd.appendChild(delBtn);
            row.appendChild(actionsTd);
            tbody.appendChild(row);
        });

        // Actualizar visibilidad de columnas en thead
        const thElements = thead.querySelectorAll('th');
        if (thElements[0]) thElements[0].style.display = columnasOcultas.fecha ? 'none' : '';
        if (thElements[1]) thElements[1].style.display = columnasOcultas.tipo ? 'none' : '';
        if (thElements[2]) thElements[2].style.display = columnasOcultas.categoria ? 'none' : '';
        if (thElements[3]) thElements[3].style.display = columnasOcultas.descripcion ? 'none' : '';
        if (thElements[4]) thElements[4].style.display = columnasOcultas.monto ? 'none' : '';
    }

    eliminarRegistro(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
            this.storage.eliminarRegistro(id);
            this.cargarRegistros();
            this.actualizarDashboard();
        }
    }

    editarCampoRegistro(id, campo, elemento) {
        const data = this.storage.getData();
        const registro = data.registros.find(r => r.id === id);
        if (!registro) return;

        const input = document.createElement('input');
        if (campo === 'fecha') {
            input.type = 'date';
            input.value = registro.fecha;
        } else if (campo === 'monto') {
            input.type = 'number';
            input.step = '0.01';
            input.value = registro.monto;
        }
        
        input.style.width = '100%';
        input.style.padding = '0.25rem';
        input.style.fontSize = 'inherit';
        input.style.border = '2px solid var(--color-primary)';
        input.style.borderRadius = '4px';

        const guardar = () => {
            const nuevoValor = campo === 'monto' ? parseFloat(input.value) : input.value;
            if (nuevoValor && nuevoValor !== registro[campo]) {
                registro[campo] = nuevoValor;
                this.storage.saveData(data);
                this.cargarRegistros();
                this.actualizarDashboard();
            } else {
                this.cargarRegistros();
            }
        };

        input.addEventListener('blur', guardar);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });

        elemento.textContent = '';
        elemento.appendChild(input);
        input.focus();
        if (campo === 'monto') input.select();
    }

    toggleColumna(columna) {
        const columnasOcultas = JSON.parse(localStorage.getItem('columnasOcultas') || '{}');
        columnasOcultas[columna] = !columnasOcultas[columna];
        localStorage.setItem('columnasOcultas', JSON.stringify(columnasOcultas));
        this.cargarRegistros();
    }

    getNombreCategoria(id) {
        const data = this.storage.getData();
        const categoria = data.categorias.find(c => c.id === id);
        return categoria ? categoria.nombre : 'Sin categoría';
    }

    cargarParametros() {
        this.actualizarCategoriasUI();
    }

    actualizarCategoriasUI() {
        const data = this.storage.getData();
        const ingreso = document.getElementById('categoriasIngreso');
        const egreso = document.getElementById('categoriasEgreso');

        ingreso.innerHTML = '';
        egreso.innerHTML = '';

        const categoriasIngreso = data.categorias.filter(c => c.tipo === 'ingreso');
        const categoriasEgreso = data.categorias.filter(c => c.tipo === 'egreso');

        this.renderCategoriasOrdenables(categoriasIngreso, ingreso, data);
        this.renderCategoriasOrdenables(categoriasEgreso, egreso, data);
    }

    renderCategoriasOrdenables(categorias, container, data) {
        categorias.forEach((cat, index) => {
            const div = document.createElement('div');
            div.className = 'categoria-item';
            div.draggable = true;
            div.dataset.categoriaId = cat.id;
            
            // Eventos de arrastrar
            div.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', div.innerHTML);
                div.style.opacity = '0.4';
                e.dataTransfer.setData('categoriaId', cat.id);
            });
            
            div.addEventListener('dragend', () => {
                div.style.opacity = '1';
            });
            
            div.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                div.style.borderTop = '3px solid var(--color-primary)';
            });
            
            div.addEventListener('dragleave', () => {
                div.style.borderTop = '';
            });
            
            div.addEventListener('drop', (e) => {
                e.preventDefault();
                div.style.borderTop = '';
                const draggedId = e.dataTransfer.getData('categoriaId');
                if (draggedId && draggedId !== cat.id) {
                    this.reordenarCategorias(draggedId, cat.id);
                }
            });
            
            // Botones de orden
            const orderDiv = document.createElement('div');
            orderDiv.style.display = 'flex';
            orderDiv.style.flexDirection = 'column';
            orderDiv.style.gap = '2px';
            orderDiv.style.opacity = '0.3';
            orderDiv.style.transition = 'opacity 0.2s';
            orderDiv.style.marginRight = '0.5rem';
            
            div.addEventListener('mouseenter', () => {
                orderDiv.style.opacity = '1';
            });
            div.addEventListener('mouseleave', () => {
                orderDiv.style.opacity = '0.3';
            });
            
            const upBtn = document.createElement('button');
            upBtn.innerHTML = '▲';
            upBtn.style.padding = '2px 6px';
            upBtn.style.fontSize = '0.65rem';
            upBtn.style.cursor = index === 0 ? 'not-allowed' : 'pointer';
            upBtn.style.border = 'none';
            upBtn.style.background = 'transparent';
            upBtn.style.color = index === 0 ? '#ccc' : 'var(--color-primary)';
            upBtn.style.transition = 'all 0.2s';
            upBtn.style.borderRadius = '3px';
            upBtn.disabled = index === 0;
            if (index !== 0) {
                upBtn.addEventListener('mouseenter', () => {
                    upBtn.style.background = 'rgba(0,0,0,0.05)';
                    upBtn.style.transform = 'scale(1.2)';
                });
                upBtn.addEventListener('mouseleave', () => {
                    upBtn.style.background = 'transparent';
                    upBtn.style.transform = 'scale(1)';
                });
            }
            upBtn.addEventListener('click', () => {
                this.moverCategoria(cat.id, -1);
            });
            
            const downBtn = document.createElement('button');
            downBtn.innerHTML = '▼';
            downBtn.style.padding = '2px 6px';
            downBtn.style.fontSize = '0.65rem';
            downBtn.style.cursor = index === categorias.length - 1 ? 'not-allowed' : 'pointer';
            downBtn.style.border = 'none';
            downBtn.style.background = 'transparent';
            downBtn.style.color = index === categorias.length - 1 ? '#ccc' : 'var(--color-primary)';
            downBtn.style.transition = 'all 0.2s';
            downBtn.style.borderRadius = '3px';
            downBtn.disabled = index === categorias.length - 1;
            if (index !== categorias.length - 1) {
                downBtn.addEventListener('mouseenter', () => {
                    downBtn.style.background = 'rgba(0,0,0,0.05)';
                    downBtn.style.transform = 'scale(1.2)';
                });
                downBtn.addEventListener('mouseleave', () => {
                    downBtn.style.background = 'transparent';
                    downBtn.style.transform = 'scale(1)';
                });
            }
            downBtn.addEventListener('click', () => {
                this.moverCategoria(cat.id, 1);
            });
            
            orderDiv.appendChild(upBtn);
            orderDiv.appendChild(downBtn);
            div.appendChild(orderDiv);
            
            const infoDiv = document.createElement('div');
            infoDiv.style.flex = '1';
            
            const nombreDiv = document.createElement('div');
            nombreDiv.className = 'categoria-nombre';
            nombreDiv.textContent = cat.nombre;
            nombreDiv.style.cursor = 'pointer';
            nombreDiv.title = 'Doble click para editar';
            nombreDiv.addEventListener('dblclick', () => {
                this.editarNombreCategoria(cat.id, nombreDiv);
            });
            
            const tipoDiv = document.createElement('div');
            tipoDiv.className = 'categoria-tipo';
            tipoDiv.textContent = cat.tipo;
            
            infoDiv.appendChild(nombreDiv);
            infoDiv.appendChild(tipoDiv);
            div.appendChild(infoDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '0.5rem';
            actionsDiv.style.alignItems = 'center';

            // Switch para cambiar tipo
            const switchLabel = document.createElement('label');
            switchLabel.style.display = 'flex';
            switchLabel.style.alignItems = 'center';
            switchLabel.style.gap = '0.5rem';
            switchLabel.style.cursor = 'pointer';
            
            const switchInput = document.createElement('input');
            switchInput.type = 'checkbox';
            switchInput.checked = cat.tipo === 'ingreso';
            switchInput.style.width = '40px';
            switchInput.style.height = '20px';
            switchInput.style.cursor = 'pointer';
            switchInput.addEventListener('change', () => {
                this.cambiarTipoCategoria(cat.id, switchInput.checked ? 'ingreso' : 'egreso');
            });
            
            const switchText = document.createElement('span');
            switchText.textContent = cat.tipo === 'ingreso' ? '📈' : '📉';
            switchText.style.fontSize = '1.2rem';
            
            switchLabel.appendChild(switchInput);
            switchLabel.appendChild(switchText);

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-danger';
            delBtn.textContent = 'Eliminar';
            delBtn.addEventListener('click', () => {
                this.eliminarCategoria(cat.id);
            });

            actionsDiv.appendChild(switchLabel);
            actionsDiv.appendChild(delBtn);
            div.appendChild(actionsDiv);
            container.appendChild(div);
        });
    }

    moverCategoria(categoriaId, direccion) {
        const data = this.storage.getData();
        const categoria = data.categorias.find(c => c.id === categoriaId);
        if (!categoria) return;

        const mismoTipo = data.categorias.filter(c => c.tipo === categoria.tipo);
        const indiceActual = mismoTipo.findIndex(c => c.id === categoriaId);
        const nuevoIndice = indiceActual + direccion;

        if (nuevoIndice < 0 || nuevoIndice >= mismoTipo.length) return;

        // Intercambiar posiciones en el array completo
        const indiceGlobal1 = data.categorias.indexOf(mismoTipo[indiceActual]);
        const indiceGlobal2 = data.categorias.indexOf(mismoTipo[nuevoIndice]);

        [data.categorias[indiceGlobal1], data.categorias[indiceGlobal2]] = 
        [data.categorias[indiceGlobal2], data.categorias[indiceGlobal1]];

        this.storage.saveData(data);
        
        // Marcar que el orden fue cambiado manualmente
        localStorage.setItem('ordenCambiadoManualmente', 'true');
        
        this.actualizarCategoriasUI();
        this.actualizarCategoriasSelect();
    }

    reordenarCategorias(draggedId, targetId) {
        const data = this.storage.getData();
        const draggedCat = data.categorias.find(c => c.id === draggedId);
        const targetCat = data.categorias.find(c => c.id === targetId);

        if (!draggedCat || !targetCat || draggedCat.tipo !== targetCat.tipo) return;

        const draggedIndex = data.categorias.indexOf(draggedCat);
        const targetIndex = data.categorias.indexOf(targetCat);

        data.categorias.splice(draggedIndex, 1);
        const newTargetIndex = data.categorias.indexOf(targetCat);
        data.categorias.splice(newTargetIndex, 0, draggedCat);

        this.storage.saveData(data);
        
        // Marcar que el orden fue cambiado manualmente
        localStorage.setItem('ordenCambiadoManualmente', 'true');
        
        this.actualizarCategoriasUI();
        this.actualizarCategoriasSelect();
    }

    editarNombreCategoria(id, nombreDiv) {
        const data = this.storage.getData();
        const categoria = data.categorias.find(c => c.id === id);

        if (!categoria) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = categoria.nombre;
        input.style.width = '100%';
        input.style.padding = '0.25rem';
        input.style.fontSize = 'inherit';
        input.style.border = '2px solid var(--color-primary)';
        input.style.borderRadius = '4px';

        const guardar = () => {
            const nuevoNombre = input.value.trim();
            if (nuevoNombre && nuevoNombre !== categoria.nombre) {
                if (data.categorias.some(c => c.id !== id && c.nombre.toLowerCase() === nuevoNombre.toLowerCase() && c.tipo === categoria.tipo)) {
                    alert('Ya existe una categoría con ese nombre');
                    nombreDiv.textContent = categoria.nombre;
                    return;
                }
                categoria.nombre = nuevoNombre;
                this.storage.saveData(data);
                this.actualizarCategoriasSelect();
                this.actualizarCategoriasFiltro();
            }
            nombreDiv.textContent = categoria.nombre;
        };

        input.addEventListener('blur', guardar);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });

        nombreDiv.textContent = '';
        nombreDiv.appendChild(input);
        input.focus();
        input.select();
    }

    cambiarTipoCategoria(id, nuevoTipo) {
        const data = this.storage.getData();
        const categoria = data.categorias.find(c => c.id === id);

        if (!categoria) return;

        categoria.tipo = nuevoTipo;
        this.storage.saveData(data);

        this.actualizarCategoriasUI();
        this.actualizarCategoriasSelect();
        this.actualizarCategoriasFiltro();
    }

    agregarNuevaCategoria() {
        const nombre = document.getElementById('nuevaCategoria').value.trim();
        const tipo = document.getElementById('tipoCategoria').value;

        if (!nombre) {
            alert('Por favor ingresa un nombre para la categoría');
            return;
        }

        // Verificar si ya existe
        const data = this.storage.getData();
        if (data.categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase() && c.tipo === tipo)) {
            alert('Esta categoría ya existe');
            return;
        }

        this.storage.agregarCategoria(nombre, tipo);
        document.getElementById('nuevaCategoria').value = '';
        this.actualizarCategoriasUI();
        this.actualizarCategoriasSelect();
        this.actualizarCategoriasFiltro();
    }

    eliminarCategoria(id) {
        const data = this.storage.getData();
        const categoria = data.categorias.find(c => c.id === id);

        if (!categoria) {
            alert('Categoría no encontrada');
            return;
        }

        const registros = data.registros.filter(r => r.categoria === id);
        if (registros.length > 0) {
            alert(`No puedes eliminar esta categoría porque tiene ${registros.length} registro(s) asociado(s)`);
            return;
        }

        if (confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
            const resultado = this.storage.eliminarCategoria(id);
            if (resultado) {
                this.actualizarCategoriasUI();
                this.actualizarCategoriasSelect();
                this.actualizarCategoriasFiltro();
                alert('Categoría eliminada exitosamente');
            } else {
                alert('No se pudo eliminar la categoría');
            }
        }
    }

    actualizarDashboard() {
        const hoy = new Date().toISOString().split('T')[0];
        const data = this.storage.getData();
        const filtroSeleccionado = document.getElementById('filtroDashboardMes').value;
        
        let registrosFiltrados = [];
        let tituloMetrica1 = 'Ingresos';
        let tituloMetrica2 = 'Egresos';
        let tituloMetrica3 = 'Ganancia Neta';
        let tituloMetrica4 = 'Total';
        
        // Filtrar según selección
        if (filtroSeleccionado === 'hoy') {
            registrosFiltrados = data.registros.filter(r => r.fecha === hoy);
            tituloMetrica1 += ' Hoy';
            tituloMetrica2 += ' Hoy';
            tituloMetrica3 += ' Hoy';
            tituloMetrica4 = 'Total Este Mes';
        } else if (filtroSeleccionado === 'mes-actual') {
            const mesActual = hoy.slice(0, 7);
            registrosFiltrados = data.registros.filter(r => r.fecha && r.fecha.startsWith(mesActual));
            tituloMetrica1 += ' Este Mes';
            tituloMetrica2 += ' Este Mes';
            tituloMetrica3 += ' Este Mes';
            tituloMetrica4 = 'Total Este Mes';
        } else if (filtroSeleccionado === 'mes-personalizado') {
            const mesPersonalizado = document.getElementById('dashboardMesPersonalizado').value;
            if (mesPersonalizado) {
                registrosFiltrados = data.registros.filter(r => r.fecha && r.fecha.startsWith(mesPersonalizado));
                const [año, mes] = mesPersonalizado.split('-');
                const nombreMes = new Date(año, mes - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
                tituloMetrica1 += ` ${nombreMes}`;
                tituloMetrica2 += ` ${nombreMes}`;
                tituloMetrica3 += ` ${nombreMes}`;
                tituloMetrica4 = `Total ${nombreMes}`;
            }
        } else if (filtroSeleccionado === 'año-actual') {
            const añoActual = new Date().getFullYear().toString();
            registrosFiltrados = data.registros.filter(r => r.fecha && r.fecha.startsWith(añoActual));
            tituloMetrica1 += ` ${añoActual}`;
            tituloMetrica2 += ` ${añoActual}`;
            tituloMetrica3 += ` ${añoActual}`;
            tituloMetrica4 = `Total ${añoActual}`;
        } else if (filtroSeleccionado === 'año-personalizado') {
            const añoPersonalizado = document.getElementById('dashboardAñoPersonalizado').value;
            if (añoPersonalizado) {
                registrosFiltrados = data.registros.filter(r => r.fecha && r.fecha.startsWith(añoPersonalizado));
                tituloMetrica1 += ` ${añoPersonalizado}`;
                tituloMetrica2 += ` ${añoPersonalizado}`;
                tituloMetrica3 += ` ${añoPersonalizado}`;
                tituloMetrica4 = `Total ${añoPersonalizado}`;
            }
        }
        
        // Calcular totales
        const ingresos = registrosFiltrados.filter(r => r.tipo === 'ingreso').reduce((sum, r) => sum + r.monto, 0);
        const egresos = registrosFiltrados.filter(r => r.tipo === 'egreso').reduce((sum, r) => sum + r.monto, 0);
        const ganancia = ingresos - egresos;
        
        // Calcular total del mes actual (para la 4ta métrica cuando está en vista "hoy")
        let totalMes = ganancia;
        if (filtroSeleccionado === 'hoy') {
            const mesActual = hoy.slice(0, 7);
            const registrosMes = data.registros.filter(r => r.fecha && r.fecha.startsWith(mesActual));
            const ingresosMes = registrosMes.filter(r => r.tipo === 'ingreso').reduce((sum, r) => sum + r.monto, 0);
            const egresosMes = registrosMes.filter(r => r.tipo === 'egreso').reduce((sum, r) => sum + r.monto, 0);
            totalMes = ingresosMes - egresosMes;
        }
        
        // Actualizar títulos y valores
        document.querySelector('#ingresos-hoy').closest('.metric').querySelector('h3').textContent = tituloMetrica1;
        document.querySelector('#egresos-hoy').closest('.metric').querySelector('h3').textContent = tituloMetrica2;
        document.querySelector('#ganancia-hoy').closest('.metric').querySelector('h3').textContent = tituloMetrica3;
        document.querySelector('#total-mes').closest('.metric').querySelector('h3').textContent = tituloMetrica4;
        
        document.getElementById('ingresos-hoy').textContent = `$${ingresos.toFixed(2)}`;
        document.getElementById('egresos-hoy').textContent = `$${egresos.toFixed(2)}`;
        document.getElementById('ganancia-hoy').textContent = `$${ganancia.toFixed(2)}`;
        document.getElementById('total-mes').textContent = `$${totalMes.toFixed(2)}`;

        // Gráfico
        this.crearGraficoHoy(ingresos, egresos);
    }

    crearGraficoHoy(ingresos, egresos) {
        const ctx = document.getElementById('chartHoy').getContext('2d');

        // Destruir gráfico anterior si existe
        if (window.chartHoy) {
            window.chartHoy.destroy();
        }

        window.chartHoy = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ingresos', 'Egresos'],
                datasets: [{
                    data: [ingresos, egresos],
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderColor: ['#45a049', '#e53935'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    actualizarAnalisis() {
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;

        const registros = this.storage.getRegistrosFiltrados({
            fechaInicio: fechaInicio,
            fechaFin: fechaFin
        });

        // Calcular totales
        const ingresos = registros.filter(r => r.tipo === 'ingreso').reduce((sum, r) => sum + r.monto, 0);
        const egresos = registros.filter(r => r.tipo === 'egreso').reduce((sum, r) => sum + r.monto, 0);
        const ganancia = ingresos - egresos;

        // Calcular días en rango
        const dias = Math.max(1, Math.floor((new Date(fechaFin) - new Date(fechaInicio)) / (1000 * 60 * 60 * 24)) + 1);
        const promedioDiario = ganancia / dias;

        document.getElementById('totalIngresos').textContent = `$${ingresos.toFixed(2)}`;
        document.getElementById('totalEgresos').textContent = `$${egresos.toFixed(2)}`;
        document.getElementById('gananciaTotal').textContent = `$${ganancia.toFixed(2)}`;
        document.getElementById('promedioDiario').textContent = `$${promedioDiario.toFixed(2)}`;

        // Gráficos
        this.crearGraficoComparacion(ingresos, egresos);
        this.crearGraficoCategorias(registros);
        this.crearGraficoTendencia(registros);
        this.llenarTablaDetalleAnalisis(registros);
    }

    crearGraficoComparacion(ingresos, egresos) {
        const ctx = document.getElementById('chartComparacion').getContext('2d');

        if (window.chartComparacion) {
            window.chartComparacion.destroy();
        }

        window.chartComparacion = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ingresos', 'Egresos'],
                datasets: [{
                    label: 'Monto',
                    data: [ingresos, egresos],
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderColor: ['#45a049', '#e53935'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    crearGraficoCategorias(registros) {
        const categoriasTotales = {};
        const data = this.storage.getData();

        registros.forEach(r => {
            if (!categoriasTotales[r.categoria]) {
                categoriasTotales[r.categoria] = 0;
            }
            categoriasTotales[r.categoria] += r.monto;
        });

        const labels = Object.keys(categoriasTotales).map(id => this.getNombreCategoria(id));
        const datosGrafico = Object.values(categoriasTotales);

        const ctx = document.getElementById('chartCategorias').getContext('2d');

        if (window.chartCategorias) {
            window.chartCategorias.destroy();
        }

        window.chartCategorias = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: datosGrafico,
                    backgroundColor: [
                        '#D4A574', '#8B6F47', '#4CAF50', '#F44336', '#FF9800', '#2196F3', '#9C27B0', '#00BCD4'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    crearGraficoTendencia(registros) {
        const tendencia = {};

        registros.forEach(r => {
            if (!tendencia[r.fecha]) {
                tendencia[r.fecha] = { ingresos: 0, egresos: 0 };
            }
            if (r.tipo === 'ingreso') {
                tendencia[r.fecha].ingresos += r.monto;
            } else {
                tendencia[r.fecha].egresos += r.monto;
            }
        });

        const fechas = Object.keys(tendencia).sort();
        const ingresos = fechas.map(f => tendencia[f].ingresos);
        const egresos = fechas.map(f => tendencia[f].egresos);
        const labels = fechas.map(f => new Date(f).toLocaleDateString('es-MX'));

        const ctx = document.getElementById('chartTendencia').getContext('2d');

        if (window.chartTendencia) {
            window.chartTendencia.destroy();
        }

        window.chartTendencia = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: ingresos,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Egresos',
                        data: egresos,
                        borderColor: '#F44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    llenarTablaDetalleAnalisis(registros) {
        const detalles = {};
        const data = this.storage.getData();

        registros.forEach(r => {
            const key = r.categoria;
            if (!detalles[key]) {
                detalles[key] = {
                    categoria: this.getNombreCategoria(key),
                    tipo: r.tipo,
                    cantidad: 0,
                    total: 0
                };
            }
            detalles[key].cantidad += 1;
            detalles[key].total += r.monto;
        });

        const tbody = document.getElementById('tablaDetalleAnalisis');
        tbody.innerHTML = '';

        Object.values(detalles).forEach(detalle => {
            const promedio = detalle.total / detalle.cantidad;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${detalle.categoria}</td>
                <td>${detalle.tipo === 'ingreso' ? '📈 Ingreso' : '📉 Egreso'}</td>
                <td>${detalle.cantidad}</td>
                <td>$${detalle.total.toFixed(2)}</td>
                <td>$${promedio.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });

        if (tbody.children.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Sin datos</td></tr>';
        }
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    initColumnToggles() {
        const columnasOcultas = JSON.parse(localStorage.getItem('columnasOcultas') || '{}');
        document.querySelectorAll('#columnToggleDropdown input[type="checkbox"]').forEach(checkbox => {
            const columna = checkbox.dataset.column;
            checkbox.checked = !columnasOcultas[columna];
        });
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Exponer la instancia en window para que los handlers inline (onclick="app.x") funcionen
    window.app = new AppPanaderia();
});
