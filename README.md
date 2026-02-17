# 🚲 CyclePark: Access Control & Ticket Inventory System

![Project Status](https://img.shields.io/badge/STATUS-COMPLETED-success)
![Node Version](https://img.shields.io/badge/Node.js-v18%2B-green)
![SQL Server](https://img.shields.io/badge/Database-SQL%20Server-red)

**CyclePark** es una solución integral de software diseñada para la gestión operativa, emisión de tickets y seguridad física de estacionamientos de vehículos menores. El sistema digitaliza el flujo de ingresos mediante impresión térmica dinámica, asegura la integridad de los datos del cliente y cumple con normativas legales de custodia.

---

## 🌟 Background & Inspiration (Caso de Uso Real)

Este proyecto nació de la experiencia operativa real en la gestión de estacionamientos de alto tránsito (Sede: *La Rambla Brasil*).

A diferencia de los sistemas de parking convencionales, **CyclePark** integra un motor de impresión personalizado para resolver la problemática de **Ingreso Rápido, Custodia y Auditoría**:

* **Ingreso Veloz (Fast-Track):** Emisión instantánea de tickets físicos con códigos correlativos únicos.
* **Seguridad Patrimonial:** Validación visual (Foto/Cámara) para evitar suplantación de identidad al momento del retiro.
* **Cumplimiento Legal:** Protocolos alineados a la **Ley N° 29733** para el manejo formal de tickets perdidos.

---

## 📸 Galería de la Interfaz (Screenshots)

### 🔐 Seguridad y Continuidad
| Acceso Seguro (Login) | Sesión Bloqueada (Lock) | Gestión de Usuarios (RBAC) |
|:---------------------:|:--------------------------:|:--------------------------:|
| ![Login](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/login.jpg) | ![Sesion_Bloqueada](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/60e5b791ed632d27ff02d654542eb218d705d05b/public/assets/sesion-bloqueada.jpg) | ![Usuarios](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/gesti%C3%B3n-usuarios.jpg) |
| *Inicio de sesión con validación de credenciales* | *Protección de contexto de turno y bloqueo de UI* | *Panel exclusivo para **Administradores*** |

### 📄 Emisión de Tickets y Control Operativo
| Panel de Control (Dashboard) | Ticket Térmico (POS) | Protocolo de Anulación |
|:----------------------------:|:--------------------:|:----------------------:|
| ![Dashboard](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/54d8917e8462e1994054852bf858de97fa5d93dc/public/assets/dashboard-principal.jpg) | ![Ticket_Ejemplo](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/7851b50d7a1706faa9c3185590798e7be592b676/public/assets/ticket-parking.jpg) | ![Protocolo_Anulacion](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/60e5b791ed632d27ff02d654542eb218d705d05b/public/assets/protocolo-de-anulacion.jpg) |
| *Registro de ingresos y aforo en tiempo real* | *Generación dinámica PDF (80mm) con normativa legal* | *Verificación administrativa híbrida* |

### 🚨 Auditoría y Legalidad
| Acta de Pérdida de Ticket | Reportes Corporativos (PDF) | Exportación de Datos (Excel) |
|:-------------------------:|:---------------------------:|:----------------------------:|
| ![Acta_Perdida](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/acta-de-perdida-de-ticket.jpg) | ![Corte_X](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/corte-x.jpg) | ![Excel](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/excel.png) |
| *Captura de evidencia fotográfica (Ley 29733)* | *Cortes X/Z generados con diseño empresarial* | *Tablas estilizadas para auditoría financiera* |

*(Nota: Las imágenes representan el flujo real de trabajo en la sede La Rambla Brasil)*
---

## 🚀 Key Features | Funcionalidades Clave

* **Smart Thermal Ticketing:** Motor de impresión personalizado que genera tickets PDF optimizados para impresoras térmicas (80mm), ajustando dinámicamente la longitud del papel según la normativa legal vigente.
* **Hybrid Security Verification:** Algoritmo de validación que permite la convivencia de credenciales legacy y encriptación **Bcrypt**, facilitando la transición de seguridad sin interrumpir la operación.
* **Shift Continuity:** Mecanismo de persistencia que protege la integridad de los datos del turno ante bloqueos de pantalla o recargas accidentales.
* **Legal Security Protocol:** Módulo de "Pérdida de Ticket" con integración de Webcam para captura de evidencia y generación de actas legales.
* **Automated Audit Reports:** Generación automática de reportes financieros (Corte X/Z) en PDF y Excel al finalizar el turno.
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
