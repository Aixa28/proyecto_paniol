-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 26-10-2026 a las 19:45:37
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `bdpaniol`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `docente`
--

CREATE TABLE `docente` (
  `Id_Docente` int(255) NOT NULL,
  `Nombre` varchar(255) NOT NULL,
  `Apellido` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Id_Taller` int(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `docente`
--

INSERT INTO `docente` (`Id_Docente`, `Nombre`, `Apellido`, `Email`, `Id_Taller`) VALUES
(2, 'María', 'Gómez', 'b@b.com', 2),
(6, 'María', 'Martinez', 'mm@gmail.com', 16),
(7, 'Belén ', 'Morales', 'belen@gmail.com', 21),
(8, 'Juan', 'Perez', 'JuanPerez@gmail.com', 15);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `material`
--

CREATE TABLE `material` (
  `Id_Material` int(11) NOT NULL,
  `Nombre_Descripcion` varchar(255) NOT NULL,
  `StockActual` int(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `material`
--

INSERT INTO `material` (`Id_Material`, `Nombre_Descripcion`, `StockActual`) VALUES
(1, 'Destornillador', 30),
(2, 'Lima', 30),
(3, 'Cable de cobre', 90),
(4, 'Madera de pino', 34),
(13, 'Lima', 198),
(14, 'Lima', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materialxrotacionxtaller`
--

CREATE TABLE `materialxrotacionxtaller` (
  `Id_Taller` int(255) NOT NULL,
  `Id_Rotacion` int(255) NOT NULL,
  `Id_Material` int(255) NOT NULL,
  `Fecha` date NOT NULL,
  `Requerimiento` int(255) NOT NULL COMMENT 'Requerimiento específico de este material para esta rotación.',
  `Observacion` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `materialxrotacionxtaller`
--

INSERT INTO `materialxrotacionxtaller` (`Id_Taller`, `Id_Rotacion`, `Id_Material`, `Fecha`, `Requerimiento`, `Observacion`) VALUES
(15, 1, 1, '2026-10-16', 32, NULL),
(15, 2, 1, '2026-10-26', 26, NULL),
(21, 2, 3, '2026-10-26', 95, NULL),
(21, 2, 4, '2026-10-26', 0, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimiento`
--

CREATE TABLE `movimiento` (
  `Id_Movimiento` int(11) NOT NULL,
  `Id_Material` int(11) NOT NULL,
  `Tipo` enum('Ingreso','Egreso','Cambio de Requerimiento') NOT NULL,
  `Cantidad` int(11) NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `Id_Taller` int(11) DEFAULT NULL,
  `Id_Docente` int(11) DEFAULT NULL,
  `Observacion` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimiento`
--

INSERT INTO `movimiento` (`Id_Movimiento`, `Id_Material`, `Tipo`, `Cantidad`, `Fecha`, `Id_Taller`, `Id_Docente`, `Observacion`) VALUES
(1, 3, 'Ingreso', 100, '2026-10-06 14:01:48', NULL, NULL, 'ñññ'),
(2, 3, 'Cambio de Requerimiento', 1, '2026-10-06 14:02:33', NULL, NULL, 'kk'),
(3, 1, 'Egreso', 15, '2026-10-07 14:43:05', 2, NULL, 'ññññ'),
(4, 1, 'Egreso', 2, '2026-10-07 14:43:41', NULL, NULL, 'ññ'),
(5, 13, 'Egreso', 1, '2026-10-07 14:54:42', 2, NULL, 'ppp'),
(6, 1, 'Egreso', 1, '2026-10-07 14:55:17', NULL, NULL, 'll'),
(7, 3, 'Egreso', 100, '2026-10-14 14:31:40', NULL, NULL, 'lll'),
(8, 3, 'Egreso', 10, '2026-10-14 16:10:13', NULL, NULL, 'naoooo'),
(9, 3, 'Egreso', 1, '2026-10-14 16:16:44', 2, NULL, ''),
(10, 13, 'Egreso', 1, '2026-10-16 14:37:38', NULL, NULL, ''),
(11, 1, 'Egreso', 2, '2026-10-16 14:46:16', 15, 8, ''),
(12, 1, 'Cambio de Requerimiento', 32, '2026-10-16 14:46:50', 15, 8, ''),
(13, 4, 'Cambio de Requerimiento', 34, '2026-10-16 14:47:12', 15, 6, ''),
(14, 3, 'Cambio de Requerimiento', 5, '2026-10-19 14:41:54', 2, 2, ''),
(15, 3, 'Cambio de Requerimiento', 5, '2026-10-19 14:59:16', 15, 8, 'kkkkkkk'),
(16, 4, 'Cambio de Requerimiento', 8, '2026-10-19 15:50:19', 15, 6, ''),
(17, 4, 'Cambio de Requerimiento', 10, '2026-10-19 15:50:32', 15, 8, 'Actualización de requerimiento'),
(18, 4, 'Cambio de Requerimiento', 0, '2026-10-19 15:50:52', 15, 8, 'Eliminación completa de requerimiento'),
(19, 3, 'Cambio de Requerimiento', 5, '2026-10-19 15:59:50', 2, 2, 'Actualización de requerimiento'),
(20, 3, 'Cambio de Requerimiento', 5, '2026-10-19 15:59:54', 2, 2, 'Actualización de requerimiento'),
(21, 3, 'Cambio de Requerimiento', 6, '2026-10-19 16:00:00', 2, 2, 'Actualización de requerimiento'),
(22, 3, 'Cambio de Requerimiento', 5, '2026-10-19 16:00:05', 2, 2, 'Actualización de requerimiento'),
(23, 3, 'Cambio de Requerimiento', 7, '2026-10-19 16:01:22', 2, 2, 'Actualización de requerimiento'),
(24, 3, 'Cambio de Requerimiento', 8, '2026-10-19 16:09:54', 2, 2, 'Actualización de requerimiento'),
(25, 3, 'Cambio de Requerimiento', 0, '2026-10-19 16:10:12', 21, 7, ''),
(26, 3, 'Cambio de Requerimiento', -2, '2026-10-19 16:11:09', 21, 7, ''),
(27, 3, 'Cambio de Requerimiento', 6, '2026-10-19 16:11:44', 21, 7, ''),
(28, 3, 'Cambio de Requerimiento', 0, '2026-10-19 16:11:52', 21, 7, 'Eliminación completa de requerimiento'),
(29, 3, 'Egreso', 1, '2026-10-19 16:12:25', 22, NULL, ''),
(30, 3, 'Cambio de Requerimiento', 1, '2026-10-19 16:12:41', 21, 7, ''),
(31, 3, 'Cambio de Requerimiento', 7, '2026-10-21 16:45:05', 2, 2, 'Actualización de requerimiento'),
(32, 1, 'Cambio de Requerimiento', -2, '2026-10-21 19:34:48', 15, 8, ''),
(33, 1, 'Cambio de Requerimiento', 2, '2026-10-21 19:42:22', 2, 2, ''),
(34, 3, 'Cambio de Requerimiento', -8, '2026-10-26 08:24:20', 15, 8, ''),
(35, 3, 'Cambio de Requerimiento', -3, '2026-10-26 08:35:09', 2, 2, 'Ya no necesito esta cantidad'),
(36, 3, 'Cambio de Requerimiento', -5, '2026-10-26 08:49:20', 21, 7, ''),
(37, 1, 'Cambio de Requerimiento', -3, '2026-10-26 08:55:24', 2, 2, ''),
(38, 1, 'Cambio de Requerimiento', 2, '2026-10-26 09:30:26', 21, 7, ''),
(39, 1, 'Cambio de Requerimiento', -3, '2026-10-26 09:30:51', 21, 7, ''),
(40, 1, 'Cambio de Requerimiento', -33, '2026-10-26 09:36:21', 2, 2, ''),
(41, 1, 'Cambio de Requerimiento', 33, '2026-10-26 09:41:30', 21, 7, ''),
(42, 1, 'Cambio de Requerimiento', -65, '2026-10-26 09:41:53', 21, 7, ''),
(43, 1, 'Cambio de Requerimiento', 0, '2026-10-26 09:42:35', 21, 7, ''),
(44, 1, 'Cambio de Requerimiento', 0, '2026-10-26 09:42:51', 21, 7, ''),
(45, 3, 'Cambio de Requerimiento', 95, '2026-10-26 10:14:42', 21, 7, ''),
(46, 3, 'Cambio de Requerimiento', 95, '2026-10-26 14:03:09', 21, 7, 'Actualización de requerimiento'),
(47, 4, 'Cambio de Requerimiento', 0, '2026-10-26 14:19:30', 15, 8, 'Requerimiento eliminado (cantidad 0)'),
(48, 4, 'Cambio de Requerimiento', 4, '2026-10-26 14:20:08', 21, 7, ''),
(49, 4, 'Cambio de Requerimiento', 10, '2026-10-26 14:20:37', 15, 8, ''),
(50, 4, 'Cambio de Requerimiento', 0, '2026-10-26 14:21:07', 15, 8, 'Eliminación completa de requerimiento'),
(51, 4, 'Cambio de Requerimiento', -4, '2026-10-26 14:21:40', 21, 7, ''),
(52, 1, 'Cambio de Requerimiento', -6, '2026-10-26 14:30:12', 15, 6, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rotacion`
--

CREATE TABLE `rotacion` (
  `Id_Rotacion` int(255) NOT NULL,
  `Inicio` date NOT NULL,
  `Final` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `rotacion`
--

INSERT INTO `rotacion` (`Id_Rotacion`, `Inicio`, `Final`) VALUES
(1, '2025-11-01', '2025-12-15'),
(2, '2026-01-16', '2026-12-16');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `taller`
--

CREATE TABLE `taller` (
  `Id_Taller` int(255) NOT NULL,
  `Denominacion` varchar(255) NOT NULL,
  `Turno` enum('Mañana','Tarde') NOT NULL,
  `Anio` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `taller`
--

INSERT INTO `taller` (`Id_Taller`, `Denominacion`, `Turno`, `Anio`) VALUES
(2, 'Electricidad', 'Tarde', 2),
(15, 'Mecánica', 'Mañana', 2),
(16, 'Mecánica', 'Tarde', 2),
(21, 'Carpintería', 'Mañana', 5),
(22, 'Carpintería', 'Mañana', 4);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_dashboard_paniol`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_dashboard_paniol` (
`Id_Material` int(11)
,`Nombre_Descripcion` varchar(255)
,`StockActual` int(255)
,`Requerimiento` int(255)
,`Balance_Numerico` bigint(67)
,`Estado` varchar(10)
,`Id_Taller` int(255)
,`Nombre_Taller` varchar(255)
,`Id_Rotacion` int(255)
,`Fecha_Inicio_Rotacion` date
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_dashboard_paniol`
--
DROP TABLE IF EXISTS `v_dashboard_paniol`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_dashboard_paniol`  AS SELECT `m`.`Id_Material` AS `Id_Material`, `m`.`Nombre_Descripcion` AS `Nombre_Descripcion`, `m`.`StockActual` AS `StockActual`, `mrt`.`Requerimiento` AS `Requerimiento`, `m`.`StockActual`- `mrt`.`Requerimiento` AS `Balance_Numerico`, CASE WHEN `m`.`StockActual` - `mrt`.`Requerimiento` < 0 THEN 'FALTANTE' WHEN `m`.`StockActual` - `mrt`.`Requerimiento` = 0 THEN 'LIMITADO' WHEN `m`.`StockActual` - `mrt`.`Requerimiento` > 0 THEN 'DISPONIBLE' END AS `Estado`, `t`.`Id_Taller` AS `Id_Taller`, `t`.`Denominacion` AS `Nombre_Taller`, `mrt`.`Id_Rotacion` AS `Id_Rotacion`, `r`.`Inicio` AS `Fecha_Inicio_Rotacion` FROM (((`materialxrotacionxtaller` `mrt` join `material` `m` on(`mrt`.`Id_Material` = `m`.`Id_Material`)) join `rotacion` `r` on(`mrt`.`Id_Rotacion` = `r`.`Id_Rotacion`)) join `taller` `t` on(`mrt`.`Id_Taller` = `t`.`Id_Taller`)) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `docente`
--
ALTER TABLE `docente`
  ADD PRIMARY KEY (`Id_Docente`),
  ADD KEY `Taller` (`Id_Taller`);

--
-- Indices de la tabla `material`
--
ALTER TABLE `material`
  ADD PRIMARY KEY (`Id_Material`);

--
-- Indices de la tabla `materialxrotacionxtaller`
--
ALTER TABLE `materialxrotacionxtaller`
  ADD UNIQUE KEY `Id_Taller` (`Id_Taller`,`Id_Rotacion`,`Id_Material`),
  ADD KEY `Id_Material` (`Id_Material`),
  ADD KEY `Id_Rotacion` (`Id_Rotacion`);

--
-- Indices de la tabla `movimiento`
--
ALTER TABLE `movimiento`
  ADD PRIMARY KEY (`Id_Movimiento`),
  ADD KEY `Id_Material` (`Id_Material`),
  ADD KEY `Id_Taller` (`Id_Taller`),
  ADD KEY `Id_Docente` (`Id_Docente`);

--
-- Indices de la tabla `rotacion`
--
ALTER TABLE `rotacion`
  ADD PRIMARY KEY (`Id_Rotacion`);

--
-- Indices de la tabla `taller`
--
ALTER TABLE `taller`
  ADD PRIMARY KEY (`Id_Taller`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `docente`
--
ALTER TABLE `docente`
  MODIFY `Id_Docente` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `material`
--
ALTER TABLE `material`
  MODIFY `Id_Material` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `movimiento`
--
ALTER TABLE `movimiento`
  MODIFY `Id_Movimiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT de la tabla `rotacion`
--
ALTER TABLE `rotacion`
  MODIFY `Id_Rotacion` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `taller`
--
ALTER TABLE `taller`
  MODIFY `Id_Taller` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `docente`
--
ALTER TABLE `docente`
  ADD CONSTRAINT `docente_ibfk_1` FOREIGN KEY (`Id_Taller`) REFERENCES `taller` (`Id_Taller`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `materialxrotacionxtaller`
--
ALTER TABLE `materialxrotacionxtaller`
  ADD CONSTRAINT `materialxrotacionxtaller_ibfk_1` FOREIGN KEY (`Id_Taller`) REFERENCES `taller` (`Id_Taller`) ON DELETE CASCADE,
  ADD CONSTRAINT `materialxrotacionxtaller_ibfk_2` FOREIGN KEY (`Id_Material`) REFERENCES `material` (`Id_Material`) ON DELETE CASCADE,
  ADD CONSTRAINT `materialxrotacionxtaller_ibfk_3` FOREIGN KEY (`Id_Rotacion`) REFERENCES `rotacion` (`Id_Rotacion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `movimiento`
--
ALTER TABLE `movimiento`
  ADD CONSTRAINT `movimiento_ibfk_1` FOREIGN KEY (`Id_Material`) REFERENCES `material` (`Id_Material`),
  ADD CONSTRAINT `movimiento_ibfk_2` FOREIGN KEY (`Id_Taller`) REFERENCES `taller` (`Id_Taller`),
  ADD CONSTRAINT `movimiento_ibfk_3` FOREIGN KEY (`Id_Docente`) REFERENCES `docente` (`Id_Docente`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
