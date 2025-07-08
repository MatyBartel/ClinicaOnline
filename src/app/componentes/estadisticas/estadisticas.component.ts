import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Pipes
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';
import { EstadoTurnoPipe } from '../../pipes/estado-turno.pipe';
import { FiltroBusquedaPipe } from '../../pipes/filtro-busqueda.pipe';

// Directivas
import { LoadingDirective } from '../../directivas/loading.directive';
import { TooltipDirective } from '../../directivas/tooltip.directive';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    FormatoFechaPipe,
    EstadoTurnoPipe,
    TooltipDirective
  ],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css'
})
export class EstadisticasComponent implements OnInit {
  usuarioActual: any = null;
  
  logIngresos: any[] = [];
  turnosPorEspecialidad: any[] = [];
  turnosPorDia: any[] = [];
  turnosPorMedico: any[] = [];
  turnosFinalizadosPorMedico: any[] = [];
  
  fechaInicio: string = '';
  fechaFin: string = '';
  especialidadSeleccionada: string = '';
  medicoSeleccionado: string = '';
  
  especialidades: string[] = [];
  medicos: any[] = [];
  
  cargando: boolean = false;
  
  chartEspecialidad: any = null;
  
  constructor(private router: Router) {}

  async ngOnInit() {
    const auth = getAuth();
    
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      const db = getFirestore();
      const adminDoc = await getDocs(query(collection(db, 'administradores'), where('__name__', '==', user.uid)));
      
      if (adminDoc.empty) {
        this.router.navigate(['/home']);
        return;
      }

      this.usuarioActual = { tipo: 'administrador', uid: user.uid };
      await this.cargarDatosIniciales();
      this.renderizarGraficoTortaEspecialidad();
    });
  }

  async cargarDatosIniciales() {
    this.cargando = true;
    
    try {
      await Promise.all([
        this.cargarLogIngresos(),
        this.cargarTurnosPorEspecialidad(),
        this.cargarTurnosPorDia(),
        this.cargarMedicos(),
        this.cargarEspecialidades()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarLogIngresos() {
    const db = getFirestore();
    const logSnap = await getDocs(collection(db, 'logIngresos'));
    this.logIngresos = logSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async cargarTurnosPorEspecialidad() {
    const db = getFirestore();
    const turnosSnap = await getDocs(collection(db, 'Turnos'));
    const turnos = turnosSnap.docs.map(doc => doc.data());
    
    const especialidadesCount: { [key: string]: number } = {};
    turnos.forEach((turno: any) => {
      if (turno['especialidad']) {
        especialidadesCount[turno['especialidad']] = (especialidadesCount[turno['especialidad']] || 0) + 1;
      }
    });
    
    this.turnosPorEspecialidad = Object.entries(especialidadesCount).map(([especialidad, cantidad]) => ({
      ['especialidad']: especialidad,
      cantidad
    }));
    this.renderizarGraficoTortaEspecialidad();
  }

  async cargarTurnosPorDia() {
    const db = getFirestore();
    const turnosSnap = await getDocs(collection(db, 'Turnos'));
    const turnos = turnosSnap.docs.map(doc => doc.data());
    
    const diasCount: { [key: string]: number } = {};
    turnos.forEach((turno: any) => {
      if (turno['FechaTurno']) {
        diasCount[turno['FechaTurno']] = (diasCount[turno['FechaTurno']] || 0) + 1;
      }
    });
    
    this.turnosPorDia = Object.entries(diasCount).map(([dia, cantidad]) => ({
      dia,
      cantidad
    }));
  }

  async cargarMedicos() {
    const db = getFirestore();
    const especialistasSnap = await getDocs(collection(db, 'especialistas'));
    this.medicos = especialistasSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data['nombre'],
        apellido: data['apellido']
      };
    });
  }

  async cargarEspecialidades() {
    const db = getFirestore();
    const especialistasSnap = await getDocs(collection(db, 'especialistas'));
    const especialidadesSet = new Set<string>();
    
    especialistasSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data['especialidad']) {
        especialidadesSet.add(data['especialidad']);
      }
    });
    
    this.especialidades = Array.from(especialidadesSet);
  }

  parseFechaTurno(fecha: string): Date {
    if (!fecha) return new Date('');
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return new Date(fecha);
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
      const [dia, mes, anio] = fecha.split('-');
      return new Date(`${anio}-${mes}-${dia}`);
    }
    return new Date(fecha);
  }

  async cargarTurnosPorMedico() {
    if (!this.medicoSeleccionado || !this.fechaInicio || !this.fechaFin) return;
    
    const db = getFirestore();
    const turnosSnap = await getDocs(collection(db, 'Turnos'));
    const turnos = turnosSnap.docs.map(doc => doc.data());
    
    const fechaInicioDate = this.parseFechaTurno(this.fechaInicio);
    const fechaFinDate = this.parseFechaTurno(this.fechaFin);
    
    const turnosFiltrados = turnos.filter((turno: any) => {
      if (!turno['FechaTurno'] || turno['especialistaId'] !== this.medicoSeleccionado) return false;
      const fechaTurnoDate = this.parseFechaTurno(turno['FechaTurno']);
      return (
        fechaTurnoDate >= fechaInicioDate &&
        fechaTurnoDate <= fechaFinDate &&
        ['pendiente', 'rechazado', 'cancelado'].includes((turno['estado'] || '').toLowerCase())
      );
    });
    
    this.turnosPorMedico = turnosFiltrados;
  }

  async cargarTurnosFinalizadosPorMedico() {
    if (!this.medicoSeleccionado || !this.fechaInicio || !this.fechaFin) return;
    
    const db = getFirestore();
    const turnosSnap = await getDocs(collection(db, 'Turnos'));
    const turnos = turnosSnap.docs.map(doc => doc.data());
    
    const fechaInicioDate = this.parseFechaTurno(this.fechaInicio);
    const fechaFinDate = this.parseFechaTurno(this.fechaFin);
    
    const turnosFiltrados = turnos.filter((turno: any) => {
      if (!turno['FechaTurno'] || turno['especialistaId'] !== this.medicoSeleccionado) return false;
      const fechaTurnoDate = this.parseFechaTurno(turno['FechaTurno']);
      return (
        fechaTurnoDate >= fechaInicioDate &&
        fechaTurnoDate <= fechaFinDate &&
        (turno['estado'] || '').toLowerCase() === 'realizado'
      );
    });
    
    this.turnosFinalizadosPorMedico = turnosFiltrados;
  }

  exportarLogIngresosExcel() {
    const data = this.logIngresos.map(log => ({
      Usuario: log.usuario || 'N/A',
      Fecha: log.fecha ? new Date(log.fecha.seconds * 1000).toLocaleString() : 'N/A',
      Hora: log.hora || 'N/A'
    }));
    
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Log Ingresos');
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'log_ingresos.xlsx');
  }

  exportarTurnosPorEspecialidadExcel() {
    const data = this.turnosPorEspecialidad.map(item => ({
      Especialidad: item['especialidad'],
      Cantidad: item.cantidad
    }));
    
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos por Especialidad');
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'turnos_por_especialidad.xlsx');
  }

  exportarTurnosPorDiaExcel() {
    const data = this.turnosPorDia.map(item => ({
      Día: item.dia,
      Cantidad: item.cantidad
    }));
    
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos por Día');
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'turnos_por_dia.xlsx');
  }

  exportarLogIngresosPDF() {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Log de Ingresos al Sistema', 20, 20);
    
    const data = this.logIngresos.map(log => [
      log.usuario || 'N/A',
      log.fecha ? new Date(log.fecha.seconds * 1000).toLocaleDateString() : 'N/A',
      log.hora || 'N/A'
    ]);
    
    (doc as any).autoTable({
      head: [['Usuario', 'Fecha', 'Hora']],
      body: data,
      startY: 30
    });
    
    doc.save('log_ingresos.pdf');
  }

  exportarTurnosPorEspecialidadPDF() {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Turnos por Especialidad', 20, 20);
    
    const data = this.turnosPorEspecialidad.map(item => [
      item['especialidad'],
      item.cantidad.toString()
    ]);
    
    (doc as any).autoTable({
      head: [['Especialidad', 'Cantidad']],
      body: data,
      startY: 30
    });
    
    doc.save('turnos_por_especialidad.pdf');
  }

  exportarTurnosPorDiaPDF() {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Turnos por Día', 20, 20);
    
    const data = this.turnosPorDia.map(item => [
      item.dia,
      item.cantidad.toString()
    ]);
    
    (doc as any).autoTable({
      head: [['Día', 'Cantidad']],
      body: data,
      startY: 30
    });
    
    doc.save('turnos_por_dia.pdf');
  }

  onMedicoChange() {
    this.cargarTurnosPorMedico();
    this.cargarTurnosFinalizadosPorMedico();
  }

  onFechaChange() {
    this.cargarTurnosPorMedico();
    this.cargarTurnosFinalizadosPorMedico();
  }

  async borrarTodosLosLogs() {
    const db = getFirestore();
    const logSnap = await getDocs(collection(db, 'logIngresos'));
    const batch = [];
    for (const logDoc of logSnap.docs) {
      batch.push(deleteDoc(doc(db, 'logIngresos', logDoc.id)));
    }
    await Promise.all(batch);
    await this.cargarLogIngresos();
  }

  renderizarGraficoTortaEspecialidad() {
    setTimeout(() => {
      const ctx = document.getElementById('graficoTortaEspecialidad') as HTMLDivElement;
      if (!ctx) return;
      if (this.chartEspecialidad) {
        this.chartEspecialidad.destroy();
        this.chartEspecialidad = null;
      }
      let canvas = ctx.querySelector('canvas');
      if (canvas) {
        ctx.removeChild(canvas);
      }
      canvas = document.createElement('canvas');
      ctx.appendChild(canvas);
      const labels = this.turnosPorEspecialidad.map(e => e['especialidad']);
      const data = this.turnosPorEspecialidad.map(e => e.cantidad);
      const colores = [
        '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b', '#ffa000', '#388e3c', '#455a64'
      ];
      const backgroundColor = labels.map((_, i) => colores[i % colores.length]);
      this.chartEspecialidad = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor
          }]
        },
        options: {
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                color: '#111',
                font: { size: 16 },
                padding: 24,
                boxWidth: 28,
                boxHeight: 18,
                usePointStyle: false,
                textAlign: 'left'
              },
              fullSize: true
            }
          },
          layout: {
            padding: {
              bottom: 32
            }
          }
        }
      });
    }, 0);
  }
} 