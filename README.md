# 🚲 CyclePark: Access Control & Ticket Inventory System

![Project Status](https://img.shields.io/badge/STATUS-COMPLETED-success)
![Node Version](https://img.shields.io/badge/Node.js-v18%2B-green)
![SQL Server](https://img.shields.io/badge/Database-SQL%20Server-red)

**CyclePark** es una solución integral de software diseñada para la gestión operativa, auditoría y seguridad física de estacionamientos de vehículos menores (bicicletas y scooters). El sistema digitaliza el flujo de ingresos, asegura la integridad relacional de los datos del cliente y cumple con normativas legales de custodia.

---

## 🌟 Background & Inspiration (Caso de Uso Real)

Este proyecto nació de la experiencia operativa real en la gestión de estacionamientos de alto tránsito (Sede: *La Rambla Brasil*).

A diferencia de los sistemas de parking convencionales enfocados en el cobro y facturación, **CyclePark** fue diseñado específicamente para resolver la problemática de **Seguridad, Custodia y Auditoría en Zonas de Estacionamiento Gratuito**.

El flujo de trabajo replica fielmente la operación real de un centro comercial:
* **Ingreso Veloz (Fast-Track):** Registro optimizado para evitar cuellos de botella en horas punta.
* **Seguridad Patrimonial:** Validación visual (Foto/Cámara) para evitar suplantación de identidad al momento del retiro.
* **Cumplimiento Legal:** Protocolos alineados a la **Ley N° 29733** para el manejo formal de tickets perdidos, eliminando la informalidad operativa.

---

## 📸 Galería de la Interfaz (Screenshots)

### 🔐 Seguridad y Continuidad
| Acceso Seguro (Login) | Sesión Bloqueada (Lock) | Gestión de Usuarios (RBAC) |
|:---------------------:|:--------------------------:|:--------------------------:|
| ![Login](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/login.jpg) | ![Sesion_Bloqueada](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/60e5b791ed632d27ff02d654542eb218d705d05b/public/assets/sesion-bloqueada.jpg) | ![Usuarios](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/gesti%C3%B3n-usuarios.jpg) |
| *Inicio de sesión con validación de credenciales* | *Protección de contexto de turno y bloqueo de UI* | *Panel exclusivo para **Administradores*** |

### 🚲 Operación y Control de Bajas
| Panel de Control (Dashboard) | Protocolo de Anulación | Acta de Anulación (PDF) |
|:----------------------------:|:----------------------:|:-----------------------:|
| ![Dashboard](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/54d8917e8462e1994054852bf858de97fa5d93dc/public/assets/dashboard-principal.jpg) | ![Protocolo_Anulacion](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/60e5b791ed632d27ff02d654542eb218d705d05b/public/assets/protocolo-de-anulacion.jpg) | ![Acta_Anulacion](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/60e5b791ed632d27ff02d654542eb218d705d05b/public/assets/acta-de-entrega-por-perdida-de-ticket.jpg) |
| *Control de aforo y tickets activos en tiempo real* | *Verificación administrativa híbrida (Bcrypt/Plain)* | *Registro legal de baja de inventario* |

### 🚨 Protocolos Legales y Auditoría
| Acta de Pérdida de Ticket | Reportes Corporativos (PDF) | Exportación de Datos (Excel) |
|:-------------------------:|:---------------------------:|:----------------------------:|
| ![Acta_Perdida](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/acta-de-perdida-de-ticket.jpg) | ![Corte_X](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/corte-x.jpg) | ![Excel](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/excel.png) |
| *Captura de evidencia fotográfica (Ley 29733)* | *Cortes X/Z generados con diseño empresarial* | *Tablas estilizadas para auditoría financiera* |

*(Nota: Las imágenes representan el flujo real de trabajo en la sede La Rambla Brasil)*

---

## 🚀 Key Features | Funcionalidades Clave

* **Hybrid Security Verification:** Implementación de un algoritmo de validación inteligente que permite la convivencia de credenciales legacy (texto plano) con estándares modernos de encriptación (**Bcrypt**). Esto facilita una transición de seguridad transparente para el personal sin interrumpir la operatividad del sistema.
* **Shift Continuity & Context Persistence:** Mecanismo de persistencia de contexto diseñado para asegurar la integridad de los datos críticos del turno (como la hora de inicio). Este sistema evita la pérdida de información ante bloqueos accidentales de pantalla, cierres de navegador o cambios de usuario forzados.
* **Real-time Inventory & Monitoring:** Visualización instantánea de vehículos en custodia y capacidad de búsqueda dinámica (Live Search) sincronizada con la base de datos SQL Server.
* **Legal Security Protocol:** Módulo de "Pérdida de Ticket" con integración de hardware (Webcam) para captura de evidencia fotográfica y generación de actas legales en PDF bajo la Ley N° 29733.
* **Automated Audit Reports:** Generación automatizada de reportes de auditoría (Corte X y Corte Z) en formatos PDF y Excel estilizado, activados por eventos de cierre de sesión o cambio de guardia.

---

## 🛠️ Tech Stack | Tecnologías

* **Backend:** Node.js & Express.
* **Database:** Microsoft SQL Server (Transact-SQL).
* **Frontend:** HTML5, CSS3 (Modern Flexbox/Grid), Vanilla JavaScript (ES6+).
* **Architecture:** MVC (Model-View-Controller) / 3-Capas.
* **Librerías Clave:** * `jspdf` & `jspdf-autotable` (Generación de PDF).
    * `xlsx-js-style` (Reportes Excel con estilos).
    * `mssql` (Driver SQL Server).
    * `bcryptjs` (Seguridad y Hashing).

---

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura organizada para separar el **Frontend** (Interfaz) del **Backend** (Lógica de Negocio/API):

```text
├── public/                 # Capa de Presentación (Frontend)
│   ├── assets/             # Recursos gráficos (Logos, Capturas, Evidencias)
│   ├── css/                # Estilos visuales (Responsive Design)
│   ├── js/                 # Lógica del cliente (Fetch API, DOM)
│   └── views/              # Vistas HTML (Login y Dashboard)
│
├── src/                    # Lógica del Servidor (Backend)
│   ├── config/             # Conexión a Base de Datos (SQL Server)
│   ├── routes/             # API Endpoints (Rutas del Sistema)
│   │   ├── auth.routes.js    # Autenticación y Seguridad
│   │   ├── client.routes.js  # Gestión de Clientes
│   │   └── ticket.routes.js  # Operativa de Parqueo (Ingreso/Salida)
│   └── index.js            # Punto de entrada del servidor Express
│
├── .env                    # Variables de Entorno (Credenciales BD)
└── package.json            # Dependencias y Scripts de arranque
