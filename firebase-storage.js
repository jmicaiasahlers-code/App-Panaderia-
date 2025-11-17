// ============================================
// GESTIÓN DE ALMACENAMIENTO EN FIREBASE
// ============================================

import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from './firebase-config.js';

class FirebaseStorageManager {
    constructor() {
        this.registrosCollection = 'registros';
        this.categoriasCollection = 'categorias';
        this.cache = { registros: [], categorias: [], lastUpdate: null };
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Cargar datos de Firebase
            await this.loadFromFirebase();
            
            // Si no hay categorías, crear las predeterminadas
            if (this.cache.categorias.length === 0) {
                await this.initDefaultCategories();
            }
            
            this.initialized = true;
            console.log('✅ Firebase Storage Manager inicializado correctamente');
            console.log(`📦 ${this.cache.registros.length} registros y ${this.cache.categorias.length} categorías cargadas`);
        } catch (error) {
            console.error('❌ Error al inicializar Firebase:', error);
            console.error('Código de error:', error.code);
            console.error('Mensaje:', error.message);
            
            if (error.code === 'failed-precondition') {
                console.error('⚠️ Firestore no está habilitado. Ve a Firebase Console y crea la base de datos.');
                console.error('👉 https://console.firebase.google.com/project/app-panaderia--gestion/firestore');
            }
            
            // Fallback a localStorage si Firebase falla
            this.usarLocalStorageFallback();
        }
    }

    async initDefaultCategories() {
        const defaultCategories = [
            // Ingresos
            { nombre: 'Ventas al mostrador', tipo: 'ingreso' },
            { nombre: 'Ventas al por mayor', tipo: 'ingreso' },
            { nombre: 'Otros ingresos', tipo: 'ingreso' },
            // Egresos
            { nombre: 'Materia prima', tipo: 'egreso' },
            { nombre: 'Servicios (luz, agua, gas)', tipo: 'egreso' },
            { nombre: 'Salarios', tipo: 'egreso' },
            { nombre: 'Mantenimiento', tipo: 'egreso' },
            { nombre: 'Otros egresos', tipo: 'egreso' }
        ];

        for (const cat of defaultCategories) {
            await this.agregarCategoria(cat.nombre, cat.tipo);
        }
    }

    async loadFromFirebase() {
        try {
            // Cargar registros
            const registrosSnapshot = await getDocs(collection(db, this.registrosCollection));
            this.cache.registros = registrosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Cargar categorías
            const categoriasSnapshot = await getDocs(collection(db, this.categoriasCollection));
            this.cache.categorias = categoriasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.cache.lastUpdate = Date.now();
            
            // Sincronizar con localStorage como backup
            this.syncToLocalStorage();
        } catch (error) {
            console.error('Error al cargar datos de Firebase:', error);
            throw error;
        }
    }

    syncToLocalStorage() {
        try {
            localStorage.setItem('panaderiaData', JSON.stringify({
                registros: this.cache.registros,
                categorias: this.cache.categorias
            }));
        } catch (error) {
            console.warn('No se pudo sincronizar con localStorage:', error);
        }
    }

    usarLocalStorageFallback() {
        console.warn('⚠️ Usando localStorage como fallback - Modo sin conexión');
        console.info('Los datos se guardarán localmente en este navegador');
        const data = JSON.parse(localStorage.getItem('panaderiaData')) || { registros: [], categorias: [] };
        this.cache.registros = data.registros || [];
        this.cache.categorias = data.categorias || [];
        
        // Si no hay categorías, crear las predeterminadas
        if (this.cache.categorias.length === 0) {
            const defaultCategories = [
                { id: 'cat_1', nombre: 'Ventas al mostrador', tipo: 'ingreso' },
                { id: 'cat_2', nombre: 'Ventas al por mayor', tipo: 'ingreso' },
                { id: 'cat_3', nombre: 'Otros ingresos', tipo: 'ingreso' },
                { id: 'cat_4', nombre: 'Materia prima', tipo: 'egreso' },
                { id: 'cat_5', nombre: 'Servicios (luz, agua, gas)', tipo: 'egreso' },
                { id: 'cat_6', nombre: 'Salarios', tipo: 'egreso' },
                { id: 'cat_7', nombre: 'Mantenimiento', tipo: 'egreso' },
                { id: 'cat_8', nombre: 'Otros egresos', tipo: 'egreso' }
            ];
            this.cache.categorias = defaultCategories;
            localStorage.setItem('panaderiaData', JSON.stringify({
                registros: [],
                categorias: defaultCategories
            }));
        }
        
        this.initialized = true;
    }

    getData() {
        return {
            registros: this.cache.registros,
            categorias: this.cache.categorias
        };
    }

    async agregarRegistro(registro) {
        try {
            // Agregar a Firebase
            const docRef = await addDoc(collection(db, this.registrosCollection), {
                tipo: registro.tipo,
                categoria: registro.categoria,
                descripcion: registro.descripcion || '',
                monto: registro.monto,
                fecha: registro.fecha,
                timestamp: Date.now()
            });

            // Agregar al cache
            const nuevoRegistro = {
                id: docRef.id,
                ...registro
            };
            this.cache.registros.push(nuevoRegistro);
            this.syncToLocalStorage();
            
            return nuevoRegistro;
        } catch (error) {
            console.error('Error al agregar registro:', error);
            throw error;
        }
    }

    async actualizarRegistro(id, campo, valor) {
        try {
            const docRef = doc(db, this.registrosCollection, id);
            await updateDoc(docRef, { [campo]: valor });

            // Actualizar cache
            const index = this.cache.registros.findIndex(r => r.id === id);
            if (index !== -1) {
                this.cache.registros[index][campo] = valor;
                this.syncToLocalStorage();
            }
        } catch (error) {
            console.error('Error al actualizar registro:', error);
            throw error;
        }
    }

    async eliminarRegistro(id) {
        try {
            // Eliminar de Firebase
            await deleteDoc(doc(db, this.registrosCollection, id));

            // Eliminar del cache
            this.cache.registros = this.cache.registros.filter(r => r.id !== id);
            this.syncToLocalStorage();
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            throw error;
        }
    }

    async agregarCategoria(nombre, tipo) {
        try {
            // Agregar a Firebase
            const docRef = await addDoc(collection(db, this.categoriasCollection), {
                nombre: nombre,
                tipo: tipo
            });

            // Agregar al cache
            const nuevaCategoria = {
                id: docRef.id,
                nombre: nombre,
                tipo: tipo
            };
            this.cache.categorias.push(nuevaCategoria);
            this.syncToLocalStorage();
            
            return nuevaCategoria;
        } catch (error) {
            console.error('Error al agregar categoría:', error);
            throw error;
        }
    }

    async actualizarCategoria(id, campo, valor) {
        try {
            const docRef = doc(db, this.categoriasCollection, id);
            await updateDoc(docRef, { [campo]: valor });

            // Actualizar cache
            const index = this.cache.categorias.findIndex(c => c.id === id);
            if (index !== -1) {
                this.cache.categorias[index][campo] = valor;
                this.syncToLocalStorage();
            }
        } catch (error) {
            console.error('Error al actualizar categoría:', error);
            throw error;
        }
    }

    async eliminarCategoria(id) {
        try {
            // Verificar si hay registros con esta categoría
            const tieneRegistros = this.cache.registros.some(r => r.categoria === id);
            if (tieneRegistros) {
                return false;
            }

            // Eliminar de Firebase
            await deleteDoc(doc(db, this.categoriasCollection, id));

            // Eliminar del cache
            this.cache.categorias = this.cache.categorias.filter(c => c.id !== id);
            this.syncToLocalStorage();
            
            return true;
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            throw error;
        }
    }

    getCategoriasConFiltro(tipo) {
        return this.cache.categorias.filter(c => c.tipo === tipo);
    }

    getRegistrosFiltrados(filtro) {
        let registros = [...this.cache.registros];

        if (filtro.fecha) {
            registros = registros.filter(r => r.fecha === filtro.fecha);
        }

        if (filtro.tipo) {
            registros = registros.filter(r => r.tipo === filtro.tipo);
        }

        if (filtro.categoria) {
            registros = registros.filter(r => r.categoria === filtro.categoria);
        }

        if (filtro.fechaInicio && filtro.fechaFin) {
            registros = registros.filter(r => r.fecha >= filtro.fechaInicio && r.fecha <= filtro.fechaFin);
        }

        return registros;
    }

    async reordenarCategorias(categorias) {
        try {
            // Actualizar el cache
            this.cache.categorias = categorias;
            this.syncToLocalStorage();
            
            // Nota: Si necesitas persistir el orden en Firebase,
            // podrías agregar un campo 'orden' a cada categoría
            // y actualizarlo aquí con updateDoc
        } catch (error) {
            console.error('Error al reordenar categorías:', error);
            throw error;
        }
    }
}

export default FirebaseStorageManager;
