// Constantes de configuración
const CONFIG = {
    META_AHORRO: 100,
    MAX_HISTORIAL: 10,
    FORMATO_FECHA: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }
};

// Clase principal para gestionar el estado de la aplicación
class SavingsManager {
    constructor() {
        this.state = {
            ahorro: 0,
            estadisticas: []
        };
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadFromLocalStorage();
            this.updateUI();
        });

        // Delegación de eventos para los botones
        document.querySelector('.menu-container').addEventListener('click', (e) => {
            const action = e.target.closest('button')?.dataset.action;
            if (action && this[action]) {
                this[action]();
            }
        });
    }

    // Métodos de gestión de estado
    updateSavings(amount, isAddition) {
        const currentSavings = parseFloat(this.state.ahorro) || 0;
        const newAmount = parseFloat(amount);

        if (isNaN(newAmount) || newAmount <= 0) {
            this.showError('Por favor ingresa una cantidad válida.');
            return;
        }

        this.state.ahorro = isAddition ? 
            parseFloat((currentSavings + newAmount).toFixed(2)) :
            parseFloat(Math.max(currentSavings - newAmount, 0).toFixed(2));

        this.addToStatistics(this.state.ahorro);
        this.updateUI();
        this.saveToLocalStorage();
    }

    // Métodos de UI
    updateUI() {
        this.updateInputFields();
        this.updateProgressBar();
        this.updateStatisticsList();
        this.updateResultMessage();
    }

    updateProgressBar() {
        const percentage = Math.min((this.state.ahorro / CONFIG.META_AHORRO) * 100, 100);
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('data-progress', Math.round(percentage));
    }

    updateStatisticsList() {
        const lista = document.getElementById('estadisticasList');
        lista.innerHTML = this.state.estadisticas
            .slice(-CONFIG.MAX_HISTORIAL)
            .reverse()
            .map(item => this.createStatisticsListItem(item))
            .join('');
    }

    // Métodos de persistencia
    saveToLocalStorage() {
        const dataToSave = {
            ahorro: this.state.ahorro,
            estadisticas: this.state.estadisticas,
            ultimaActualizacion: new Date().toISOString()
        };
        localStorage.setItem('ahorro', JSON.stringify(dataToSave));
        this.showSuccess('Progreso guardado correctamente');
    }

    loadFromLocalStorage() {
        try {
            const saved = JSON.parse(localStorage.getItem('ahorro'));
            if (saved) {
                this.state = {
                    ahorro: parseFloat(saved.ahorro) || 0,
                    estadisticas: saved.estadisticas || []
                };
                this.showSuccess(`Datos cargados: ${new Date(saved.ultimaActualizacion).toLocaleDateString('es-ES')}`);
            }
        } catch (error) {
            this.showError('Error al cargar los datos guardados');
        }
    }

    // Métodos de exportación/importación
    async exportData() {
        const exportData = {
            ahorro: this.state.ahorro,
            estadisticas: this.state.estadisticas,
            fecha_exportacion: new Date().toISOString()
        };

        try {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mis_ahorros_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            this.showError('Error al exportar los datos');
        }
    }

    async importData(file) {
        try {
            const content = await this.readFileAsync(file);
            const data = JSON.parse(content);
            
            if (!this.validateImportData(data)) {
                throw new Error('Formato de datos inválido');
            }

            this.state = {
                ahorro: parseFloat(data.ahorro) || 0,
                estadisticas: data.estadisticas || []
            };

            this.saveToLocalStorage();
            this.updateUI();
            this.showSuccess('Datos importados correctamente');
        } catch (error) {
            this.showError(`Error al importar: ${error.message}`);
        }
    }

    // Métodos auxiliares
    readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    validateImportData(data) {
        return data && 
               typeof data.ahorro !== 'undefined' && 
               Array.isArray(data.estadisticas);
    }

    showError(message) {
        this.updateResultMessage(message, 'error');
    }

    showSuccess(message) {
        this.updateResultMessage(message, 'success');
    }

    updateResultMessage(message, type = 'info') {
        const resultado = document.getElementById('resultado');
        const icon = this.getIconForMessageType(type);
        resultado.innerHTML = `${icon} ${message}`;
        resultado.className = `result ${type}`;
    }

    getIconForMessageType(type) {
        const icons = {
            error: 'exclamation-triangle',
            success: 'check',
            info: 'info-circle'
        };
        return `<i class="fas fa-${icons[type] || icons.info}"></i>`;
    }
}

// Inicialización
const savingsManager = new SavingsManager();
