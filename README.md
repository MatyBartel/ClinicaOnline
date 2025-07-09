![Bartel Clinica](https://github.com/user-attachments/assets/2a12bd0f-70ef-42e7-952a-a8a1414ba121)

Bienvenido al sistema de gestión de la **Clínica Bartel**. Esta aplicación web permite la administración integral de pacientes, especialistas y turnos médicos, facilitando la gestión tanto para usuarios como para administradores.

## 🏥 ¿Qué es la Clínica Bartel?
La Clínica Bartel es un centro de salud que ofrece atención médica en diversas especialidades. El sistema desarrollado permite:
- Registro y autenticación de usuarios (pacientes, especialistas y administradores)
- Gestión de turnos médicos
- Administración de usuarios y especialidades
- Carga y visualización de imágenes de perfil

---

## 🖥️ Pantallas y Secciones Principales

### 1. **Pantalla de Login**
- Acceso para pacientes, especialistas y administradores.
- Recuperación de contraseña.

### 2. **Registro de Usuario**
- Registro de pacientes y especialistas.
- Validación de datos y captcha de seguridad.
- Carga de imagen de perfil.
- Selección de especialidades (para especialistas).

### 3. **Home**
- Vista general con acceso rápido a las secciones principales según el tipo de usuario.

### 4. **Gestión de Turnos**
- Solicitud de turnos por parte de pacientes.
- Visualización y administración de turnos para especialistas.
- Confirmación, cancelación y finalización de turnos.

### 5. **Gestión de Usuarios (Solo Admin)**
- Alta, baja y modificación de usuarios.
- Visualización de todos los usuarios registrados.
- Asignación de roles y especialidades.

### 6. **Mi Perfil**
- Visualización y edición de datos personales.
- Cambio de imagen de perfil.
- Gestión de especialidades y horarios (para especialistas).

### 7. **Mis Turnos**
- Listado de turnos solicitados (paciente) o asignados (especialista).
- Estado de cada turno y acciones disponibles.

### 8. **Estadisticas**
- Podemos encontrar las estadisticas de los ingresos, turnos por dia, turnos por lapso de tiempo y mas.
- Se aplico grafico de tortas con NGX-CHARTS.

### 9. **Pacientes (para especialistas)**
- Podemos encontrar las historias clinicas de los atendidos con ese especialista.
- Se pueden ver los ultimos 3 turnos de cada uno con el.

### 10. **Página de Error / No Encontrado**
- Mensaje amigable cuando se accede a una ruta inexistente.

---

## 🚦 Navegación y Acceso a Secciones

- **Login:** Es la pantalla inicial. Desde aquí puedes acceder al registro si no tienes cuenta.
- **Registro:** Accesible desde el login. Elige si eres paciente o especialista.
- **Home:** Tras iniciar sesión, verás el menú principal adaptado a tu rol.
- **Gestión de Turnos:**
  - Paciente: Accede desde el menú "Sacar Turno" o "Mis Turnos".
  - Especialista: Accede desde "Mis Turnos" para ver y gestionar los turnos asignados.
- **Gestión de Usuarios:** Solo visible para administradores desde el menú principal.
- **Mi Perfil:** Accesible desde el menú superior para especialistas y pacientes.
- **Estadisticas:** Accesible desde el menú superior para los admins.

---

## 📋 ¿Qué contiene cada sección?

- **Login:** Formulario de acceso seguro.
- **Registro:** Formulario con validaciones, captcha y carga de imagen.
- **Home:** Accesos rápidos y resumen de actividad.
- **Gestión de Turnos:** Calendario, listado y acciones sobre turnos.
- **Gestión de Usuarios:** Tabla de usuarios, filtros y acciones de administración.
- **Mi Perfil:** Datos personales, imagen, especialidades y horarios.
- **Mis Turnos:** Listado de turnos con estado y acciones.
- **Página de Error:** Mensaje de ruta no encontrada.
- **Historia Clínica:** Se puede ver en Mi Perfil (para los pacientes) o Pacientes (para los especialistas)
- **Estadísticas:** Puede verlas el admin, ingresos, turnos de cada dia, especialidad mas elegida, etc.
---

## 👤 Tipos de Usuario

- **Paciente:** Puede registrarse, solicitar turnos, ver y cancelar sus turnos, descargar su historia clinica en pdf.
- **Especialista:** Puede registrarse, definir especialidades y horarios, ver y gestionar turnos asignados, ver historias clinicas de los pacientes atendidos en un lapso de tiempo.
- **Administrador:** Puede ver y gestionar todos los usuarios, asignar roles y especialidades, seccion estadisticas.

---

## 🛠️ Tecnologías Utilizadas
- **Angular**
- **Firebase** (Auth, Firestore, Storage)
- **ngx-captcha** (reCAPTCHA v2)
- **HTML5, CSS3**
- jsPDF (Exportar PDF)
- XLSX (Exportar Excel)
- NGX-CHARTS (Graficos)
---
