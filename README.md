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

### 🔐 Seguridad y Administración
| Acceso Seguro (Login) | Gestión de Usuarios (RBAC) |
|:---------------------:|:--------------------------:|
| ![Image_Alt](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/login.jpg) | ![Image_Alt](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/gesti%C3%B3n-usuarios.jpg) |
| *Inicio de sesión con validación de credenciales* | *Panel exclusivo para **Administradores** (Crear/Borrar empleados)* |

### 🚲 Operación Diaria y Legal
| Panel de Control (Dashboard) | Protocolo Legal de Pérdida |
|:----------------------------:|:--------------------------:|
| ![Image_Alt](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/dashboard.jpg) | ![Image_Alt](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/acta-de-perdida-de-ticket.jpg) |
| *Control de aforo y tickets activos en tiempo real* | *Evidencia fotográfica y datos de contacto (Ley 29733)* |

### 📊 Reportes y Auditoría (Financial Exports)
| Reportes Corporativos (PDF) | Exportación de Datos (Excel) |
|:---------------------------:|:----------------------------:|
| ![Image_Alt](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/corte-x.jpg) | ![Image_Alt](https://github.com/wilberbecerra/cycle-parking-inventory-system/blob/73f48f55968cbe803cac92b064eaefad985d28ed/public/assets/excel.png) |
| *Cortes X/Z generados con diseño empresarial* | *Tablas estilizadas para contabilidad y auditoría* |

*(Nota: Las imágenes representan el flujo real de trabajo en la sede La Rambla Brasil)*

---

## 🚀 Key Features | Funcionalidades Clave

* **Free-Tier Logic Optimization:** Arquitectura optimizada para flujos de alta velocidad sin pasarelas de pago, ideal para Centros Comerciales, Universidades o Edificios Corporativos donde el estacionamiento es un beneficio gratuito.
* **Real-time Inventory & Monitoring:** Visualización instantánea de vehículos en custodia (Activos) y capacidad de búsqueda dinámica (Live Search) por cliente, vehículo o código.
* **Relational Data Integrity:** Edición avanzada de registros que sincroniza automáticamente la información entre entidades (`Clientes` y `Tickets`) asegurando la consistencia de la base de datos SQL.
* **Legal Security Protocol:** Módulo especializado para "Pérdida de Ticket" que captura evidencia fotográfica (Webcam Integration), datos de contacto y genera un Acta Legal en PDF lista para firmar.
* **Audit & Financial Reports:** Generación de cortes de turno (**Corte X**) y cierre fiscal (**Corte Z**) exportables en **PDF** y **Excel** estilizado, incluyendo cálculo automático de tiempos y responsables.
* **Timezone Synchronization:** Manejo preciso de tiempos (UTC/Local) para evitar desfases en los registros de ingreso/salida.

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
