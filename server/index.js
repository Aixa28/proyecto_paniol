import express from 'express';
import mysql from 'mysql2/promise'; 
import cors from 'cors';

const app = express();
const port = 3001; 

const dbConfig = {
    host: '127.0.0.1',
    user: 'root', 
    password: '', 
    database: 'bdpaniol',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig); 

(async () => {
    try {
        await pool.getConnection();
        console.log('✅ Conectado a la base de datos MySQL.');
    } catch (err) {
        console.error('❌ Error al conectar a la base de datos:', err);
    }
})();

app.use(cors()); 
app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Servidor Express funcionando.');
});

// ----------------------------------------------------
// RUTAS DE INVENTARIO Y ESTADO DINÁMICO
// ----------------------------------------------------
app.get('/api/inventario/estado/:idTaller/:idRotacion', async (req, res) => {
    const { idTaller, idRotacion } = req.params;

    const query = `
        SELECT 
            Id_Material,
            Nombre_Descripcion,
            StockActual,
            Requerimiento,
            Balance_Numerico,
            Estado 
        FROM v_dashboard_paniol 
        WHERE Id_Taller = ? AND Id_Rotacion = ?
    `;

    try {
        const [resultados] = await pool.query(query, [idTaller, idRotacion]);
        if (resultados.length === 0) {
            return res.json([]); 
        }
        res.json(resultados);
    } catch (error) {
        console.error('Error al obtener el estado del inventario:', error);
        res.status(500).json({ mensaje: "Error interno del servidor al obtener el inventario." });
    }
});

// ----------------------------------------------------
// RUTAS DE MATERIALES (CRUD)
// ----------------------------------------------------
app.get('/api/materiales', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM material');
    res.json(results);
  } catch (err) {
    console.error('Error al obtener materiales:', err);
    res.status(500).send('Error al obtener los materiales de la base de datos');
  }
});

app.post('/api/materiales', async (req, res) => {
  let { Nombre_Descripcion, StockActual } = req.body;
  Nombre_Descripcion = Nombre_Descripcion ? Nombre_Descripcion.trim() : '';

  const query = `
    INSERT INTO material (Nombre_Descripcion, StockActual) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE StockActual = StockActual + ?
  `;
  
  try {
    await pool.query(query, [Nombre_Descripcion, StockActual, StockActual]);
    const [rows] = await pool.query('SELECT * FROM material WHERE Nombre_Descripcion = ?', [Nombre_Descripcion]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear o actualizar material:', err);
    res.status(500).send('Error al guardar el material en la base de datos');
  }
});

app.delete('/api/materiales/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM materialxrotacionxtaller WHERE Id_Material = ?', [id]);
    await connection.query('DELETE FROM movimiento WHERE Id_Material = ?', [id]);
    
    const [result] = await connection.query('DELETE FROM material WHERE Id_Material = ?', [id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).send('No se encontró el material');
    }
    
    await connection.commit();
    res.status(200).send('Material eliminado exitosamente');
  } catch (err) {
    await connection.rollback();
    console.error('Error al eliminar material:', err);
    res.status(500).send('Error al eliminar el material');
  } finally {
    connection.release();
  }
});

app.put('/api/materiales/:id', async (req, res) => {
  const { id } = req.params;
  const { Nombre_Descripcion, StockActual } = req.body;
  const query = 'UPDATE material SET Nombre_Descripcion = ?, StockActual = ? WHERE Id_Material = ?';
  try {
    const [result] = await pool.query(query, [Nombre_Descripcion, StockActual, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('No se encontró el material con el ID proporcionado');
    }
    res.status(200).json({ Id_Material: id, Nombre_Descripcion, StockActual });
  } catch (err) {
    console.error('Error al actualizar material:', err);
    res.status(500).send('Error al actualizar el material en la base de datos');
  }
});

// ----------------------------------------------------
// RUTAS DE TALLERES Y DOCENTES (CRUD)
// ----------------------------------------------------
app.get('/api/talleres', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM taller');
    res.json(results);
  } catch (err) {
    console.error('Error al obtener talleres:', err);
    res.status(500).send('Error al obtener los talleres de la base de datos');
  }
});

app.post('/api/talleres', async (req, res) => {
    const { Denominacion, Turno, anio } = req.body;
    const query = 'INSERT INTO taller (Denominacion, Turno, Anio) VALUES (?, ?, ?)';
    
    try {
        const [result] = await pool.query(query, [
            Denominacion, 
            Turno, 
            anio ? parseInt(anio, 10) : null
        ]);
        
        res.status(201).json({
            Id_Taller: result.insertId,
            Denominacion,
            Turno,
            Anio: anio
        });
    } catch (err) {
        console.error('Error al crear taller:', err);
        res.status(500).json({ message: err.sqlMessage || 'Error al guardar el taller' });
    }
});

app.put('/api/talleres/:id', async (req, res) => {
    const { id } = req.params;
    const cleanId = String(id).split(':')[0];
    const { Denominacion, Turno, anio } = req.body;
    const query = 'UPDATE taller SET Denominacion = ?, Turno = ?, Anio = ? WHERE Id_Taller = ?';
    try {
        const [result] = await pool.query(query, [Denominacion, Turno, anio || null, cleanId]);
        if (result.affectedRows === 0) {
            return res.status(404).send('No se encontró el taller con el ID proporcionado');
        }
        res.status(200).send('Taller actualizado exitosamente');
    } catch (err) {
        console.error('Error al actualizar taller:', err);
        res.status(500).send('Error al actualizar el taller en la base de datos');
    }
});

app.delete('/api/talleres/:id', async (req, res) => {
    const { id } = req.params;
    const cleanId = String(id).split(':')[0];
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE movimiento SET Id_Taller = NULL WHERE Id_Taller = ?', [cleanId]);
        await connection.query('DELETE FROM materialxrotacionxtaller WHERE Id_Taller = ?', [cleanId]);
        await connection.query('UPDATE docente SET Id_Taller = NULL WHERE Id_Taller = ?', [cleanId]);

        const [result] = await connection.query('DELETE FROM taller WHERE Id_Taller = ?', [cleanId]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).send('No se encontró el taller');
        }

        await connection.commit();
        res.status(200).send('Taller eliminado exitosamente');
    } catch (err) {
        await connection.rollback();
        console.error('Error al eliminar taller:', err);
        res.status(500).send('Error al eliminar el taller');
    } finally {
        connection.release();
    }
});

app.get('/api/docentes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM docente');
    res.json(rows);
  } catch (err) {
    console.error('🔥 ERROR CRÍTICO EN /api/docentes:', err);
    res.status(500).json({ error: true, mensaje: err.message });
  }
});

app.post('/api/docentes', async (req, res) => {
  const { Nombre, Apellido, Email, Id_Taller } = req.body;
  const query = 'INSERT INTO docente (Nombre, Apellido, Email, Id_Taller) VALUES (?, ?, ?, ?)';
  try {
    const [result] = await pool.query(query, [Nombre, Apellido, Email, Id_Taller || null]);
    const newTeacher = { Id_Docente: result.insertId, Nombre, Apellido, Email, Id_Taller };
    res.status(201).json(newTeacher);
  } catch (err) {
    console.error('Error al crear docente:', err);
    res.status(500).send('Error al guardar el docente en la base de datos');
  }
});

app.put('/api/docentes/:id', async (req, res) => {
  const { id } = req.params;
  const cleanId = String(id).split(':')[0]; 
  let { Nombre, Apellido, Email, Id_Taller } = req.body;

  try {
    const query = `
      UPDATE docente 
      SET Nombre = ?, Apellido = ?, Email = ?, Id_Taller = ?
      WHERE Id_Docente = ?
    `;
    const [result] = await pool.query(query, [
      Nombre, 
      Apellido, 
      Email || '', 
      Id_Taller !== "" && Id_Taller !== null ? Number(Id_Taller) : null, 
      cleanId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Docente no encontrado" });
    }

    res.json({ message: "Docente actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar docente:", err);
    res.status(500).json({ message: "Error interno al actualizar docente" });
  }
});

app.delete('/api/docentes/:id', async (req, res) => {
  const { id } = req.params;
  const cleanId = String(id).split(':')[0];
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('UPDATE movimiento SET Id_Docente = NULL WHERE Id_Docente = ?', [cleanId]);

    const [result] = await connection.query('DELETE FROM docente WHERE Id_Docente = ?', [cleanId]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).send('No se encontró el docente');
    }

    await connection.commit();
    res.status(200).send('Docente eliminado exitosamente');
  } catch (err) {
    await connection.rollback();
    console.error('Error al eliminar docente:', err);
    res.status(500).send('Error al eliminar el docente');
  } finally {
    connection.release();
  }
});

// ----------------------------------------------------
// RUTAS DE ROTACIONES (CRUD)
// ----------------------------------------------------
app.get('/api/rotaciones', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM rotacion ORDER BY Inicio DESC');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener rotaciones:', err);
        res.status(500).send('Error al obtener las rotaciones de la base de datos');
    }
});

app.post('/api/rotaciones', async (req, res) => {
    const { Inicio, Final } = req.body;
    const query = 'INSERT INTO rotacion (Inicio, Final) VALUES (?, ?)';
    try {
        const [result] = await pool.query(query, [Inicio, Final]);
        res.status(201).json({ Id_Rotacion: result.insertId, Inicio, Final });
    } catch (err) {
        console.error('Error al crear rotación:', err);
        res.status(500).send('Error al guardar la rotación en la base de datos');
    }
});

app.put('/api/rotaciones/:id', async (req, res) => {
    const { id } = req.params;
    const cleanId = String(id).split(':')[0];
    const { Inicio, Final } = req.body;
    const query = 'UPDATE rotacion SET Inicio = ?, Final = ? WHERE Id_Rotacion = ?';
    try {
        const [result] = await pool.query(query, [Inicio, Final, cleanId]);
        if (result.affectedRows === 0) {
            return res.status(404).send('No se encontró la rotación con el ID proporcionado');
        }
        res.status(200).send('Rotación actualizada exitosamente');
    } catch (err) {
        console.error('Error al actualizar rotación:', err);
        res.status(500).send('Error al actualizar la rotación en la base de datos');
    }
});

app.delete('/api/rotaciones/:id', async (req, res) => {
    const { id } = req.params;
    const cleanId = String(id).split(':')[0];
    const query = 'DELETE FROM rotacion WHERE Id_Rotacion = ?';
    try {
        const [result] = await pool.query(query, [cleanId]);
        if (result.affectedRows === 0) {
            return res.status(404).send('No se encontró la rotación con el ID proporcionado');
        }
        res.status(200).send('Rotación eliminada exitosamente');
    } catch (err) {
        console.error('Error al eliminar rotación:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'No se puede eliminar la rotación porque tiene materiales asociados.' });
        }
        res.status(500).send('Error al eliminar la rotación de la base de datos');
    }
});

// ----------------------------------------------------
// RUTA DE REPORTES
// ----------------------------------------------------
app.get('/api/reportes', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.Id_Movimiento AS id,
        m.Id_Material AS materialId,
        mat.Nombre_Descripcion AS material,
        m.Tipo AS tipo,
        m.Cantidad AS cantidad,
        m.Id_Taller,
        t.Denominacion AS taller_nombre,
        t.Anio AS taller_anio,
        t.Turno AS taller_turno,
        m.Id_Docente,
        d.Nombre AS docente_nombre,
        d.Apellido AS docente_apellido,
        CONCAT(IFNULL(d.Nombre, ''), ' ', IFNULL(d.Apellido, '')) AS responsable,
        m.Observacion AS observacion,
        m.Fecha AS fecha
      FROM movimiento m
      LEFT JOIN material mat ON m.Id_Material = mat.Id_Material
      LEFT JOIN taller t ON m.Id_Taller = t.Id_Taller
      LEFT JOIN docente d ON m.Id_Docente = d.Id_Docente
      ORDER BY m.Fecha DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener reportes:', err);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
});

// ----------------------------------------------------
// RUTA DE MOVIMIENTOS
// ----------------------------------------------------
app.post('/api/movimientos', async (req, res) => {
    let { materialId, movementType, quantity, idTaller, idDocente, observations } = req.body;
    let valorIngresado = Number(quantity || 0);
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let idRotacion = 1;
        let cantidadFinal = valorIngresado;

        // Si es un Cambio de Requerimiento por taller, aplicamos la lógica acumulativa y validación
        if (movementType === 'Cambio de Requerimiento' && idTaller) {
            let [rotaciones] = await connection.query(
                'SELECT Id_Rotacion FROM materialxrotacionxtaller WHERE Id_Taller = ? LIMIT 1', 
                [idTaller]
            );
            if (rotaciones.length > 0) {
                idRotacion = rotaciones[0].Id_Rotacion;
            } else {
                let [rotActiva] = await connection.query(
                    'SELECT Id_Rotacion FROM rotacion ORDER BY Final DESC LIMIT 1'
                );
                if (rotActiva.length > 0) idRotacion = rotActiva[0].Id_Rotacion;
            }

            // Consultar el requerimiento actual de este taller específico
            let [existe] = await connection.query(
                'SELECT Requerimiento FROM materialxrotacionxtaller WHERE Id_Taller = ? AND Id_Material = ? AND Id_Rotacion = ?',
                [idTaller, materialId, idRotacion]
            );

            let valorActual = existe.length > 0 ? Number(existe[0].Requerimiento || 0) : 0;

            // 🛡️ VALIDACIÓN ESTRICTA: Si es resta, no permitir restar más de lo que tiene
            if (valorIngresado < 0) {
                const maximoARestar = -valorActual; 
                if (valorIngresado < maximoARestar) {
                    valorIngresado = maximoARestar; // Se ajusta al límite real disponible
                }
            }

            cantidadFinal = valorActual + valorIngresado;
            if (cantidadFinal < 0) cantidadFinal = 0;
        }

        // 1. Registrar el movimiento histórico con el valor validado/ajustado
        const queryMov = `
            INSERT INTO movimiento (Id_Material, Tipo, Cantidad, Id_Taller, Id_Docente, Observacion, Fecha)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        await connection.query(queryMov, [
            materialId, 
            movementType, 
            valorIngresado, 
            idTaller || null, 
            idDocente || null, 
            observations || ''
        ]);

        // 2. Actualizar o insertar en la tabla específica del requerimiento
        if (movementType === 'Cambio de Requerimiento' && idTaller) {
            let [existe] = await connection.query(
                'SELECT * FROM materialxrotacionxtaller WHERE Id_Taller = ? AND Id_Material = ? AND Id_Rotacion = ?',
                [idTaller, materialId, idRotacion]
            );

            if (existe.length > 0) {
                await connection.query(
                    'UPDATE materialxrotacionxtaller SET Requerimiento = ?, Fecha = CURDATE() WHERE Id_Taller = ? AND Id_Material = ? AND Id_Rotacion = ?',
                    [cantidadFinal, idTaller, materialId, idRotacion]
                );
            } else {
                await connection.query(
                    'INSERT INTO materialxrotacionxtaller (Id_Taller, Id_Rotacion, Id_Material, Fecha, Requerimiento) VALUES (?, ?, ?, CURDATE(), ?)',
                    [idTaller, idRotacion, materialId, cantidadFinal]
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Movimiento y requerimiento procesados con éxito' });
    } catch (err) {
        await connection.rollback();
        console.error('Error al procesar movimiento:', err);
        res.status(500).json({ mensaje: 'Error al procesar el movimiento' });
    } finally {
        connection.release();
    }
});

app.post('/api/movimientos/requerimiento', async (req, res) => {
    let { materialId, idTaller, newRequirement, observations, idDocente } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        if (!idDocente && idTaller) {
            const [docenteResult] = await connection.query(
                'SELECT Id_Docente FROM docente WHERE Id_Taller = ? LIMIT 1',
                [idTaller]
            );
            if (docenteResult.length > 0) {
                idDocente = docenteResult[0].Id_Docente;
            }
        }

        let [rotations] = await connection.query(
            'SELECT Id_Rotacion FROM rotacion WHERE CURDATE() BETWEEN Inicio AND Final LIMIT 1'
        );

        if (rotations.length === 0) {
            [rotations] = await connection.query(
                'SELECT Id_Rotacion FROM rotacion ORDER BY Final DESC LIMIT 1'
            );
        }

        if (rotations.length === 0) {
            throw new Error('No hay una rotación registrada en la base de datos.');
        }

        const idRotacion = rotations[0].Id_Rotacion;
        let valorIngresado = Number(newRequirement || 0);

        // 1. Consultar el requerimiento actual de este taller específico para este material
        const [existingReq] = await connection.query(
            `SELECT Requerimiento FROM materialxrotacionxtaller 
             WHERE Id_Taller = ? AND Id_Rotacion = ? AND Id_Material = ?`,
            [idTaller, idRotacion, materialId]
        );

        let valorActual = 0;
        if (existingReq.length > 0) {
            valorActual = Number(existingReq[0].Requerimiento || 0);
        }

        // 🛡️ VALIDACIÓN ESTRICTA: Impedir restar más de lo disponible
        if (valorIngresado < 0) {
            const maximoARestar = -valorActual; // Ej: si tiene 2, lo máximo a restar es -2
            if (valorIngresado < maximoARestar) {
                // Opción A: Ajustamos el valor al máximo posible para que no reste de más
                valorIngresado = maximoARestar; 
                
                // (Opcional) Si prefieres bloquear la operación por completo en lugar de ajustarla, 
                // puedes descomentar la siguiente línea:
                // throw new Error(`No se puede restar ${Math.abs(newRequirement)}. El taller solo tiene ${valorActual} unidades.`);
            }
        }

        let cantidadFinal = valorActual + valorIngresado;
        if (cantidadFinal < 0) cantidadFinal = 0;

        // 2. Registrar el movimiento histórico con el valor exacto y verificado
        const insertMovementQuery = `
            INSERT INTO movimiento (Id_Material, Tipo, Cantidad, Id_Taller, Id_Docente, Observacion, Fecha)
            VALUES (?, 'Cambio de Requerimiento', ?, ?, ?, ?, NOW())
        `;
        const [movementResult] = await connection.query(insertMovementQuery, [
            materialId, 
            valorIngresado, 
            idTaller, 
            idDocente || null, 
            observations || ''
        ]);

        // 3. Actualizar la tabla de requerimientos específicos
        const updateRequirementQuery = `
            INSERT INTO materialxrotacionxtaller (Id_Taller, Id_Rotacion, Id_Material, Fecha, Requerimiento)
            VALUES (?, ?, ?, CURDATE(), ?)
            ON DUPLICATE KEY UPDATE 
                Requerimiento = VALUES(Requerimiento), 
                Fecha = CURDATE()
        `;
        await connection.query(updateRequirementQuery, [idTaller, idRotacion, materialId, cantidadFinal]);
        
        await connection.commit();
        res.status(201).json({ id: movementResult.insertId, message: 'Requerimiento actualizado correctamente.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error al cambiar el requerimiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.', detalle: error.message });
    } finally {
        connection.release();
    }
});

app.get('/api/inventario/resumen', async (req, res) => {
    const query = `
        SELECT 
            m.Id_Material,
            m.Nombre_Descripcion,
            m.StockActual,
            COALESCE(SUM(mrt.Requerimiento), 0) AS Requerimiento,
            m.StockActual - COALESCE(SUM(mrt.Requerimiento), 0) AS Balance_Numerico,
            (
                SELECT DATE_FORMAT(Inicio, '%d/%m/%Y') 
                FROM rotacion 
                ORDER BY Inicio DESC 
                LIMIT 1
            ) AS Proxima_Rotacion_Fecha
        FROM material m
        LEFT JOIN materialxrotacionxtaller mrt ON m.Id_Material = mrt.Id_Material
        GROUP BY m.Id_Material, m.Nombre_Descripcion, m.StockActual
        ORDER BY m.Nombre_Descripcion
    `;

    try {
        const [results] = await pool.query(query);
        const map = new Map();
        for (const item of results) {
            const nombreLimpio = item.Nombre_Descripcion.trim().toLowerCase();
            if (!map.has(nombreLimpio)) {
                map.set(nombreLimpio, { ...item });
            } else {
                const existing = map.get(nombreLimpio);
                existing.StockActual += Number(item.StockActual);
                existing.Requerimiento += Number(item.Requerimiento);
                existing.Balance_Numerico = existing.StockActual - existing.Requerimiento;
            }
        }

        const resultadosFinales = Array.from(map.values()).map(item => {
            const stock = Number(item.StockActual || 0);
            const req = Number(item.Requerimiento || 0);
            
            let estado = 'DISPONIBLE';
            if (stock < req) {
                estado = 'FALTANTE';
            } else if (stock === req) {
                estado = 'LIMITADO';
            }

            return {
                Id_Material: item.Id_Material,
                Nombre_Descripcion: item.Nombre_Descripcion,
                StockActual: stock,
                Requerimiento: req,
                Balance_Numerico: item.Balance_Numerico,
                Estado: estado,
                Proxima_Rotacion: estado === 'FALTANTE' ? (item.Proxima_Rotacion_Fecha || '-') : '-'
            };
        });

        res.json(resultadosFinales);
    } catch (err) {
        console.error('Error al obtener resumen de inventario:', err);
        res.status(500).send('Error al obtener el resumen del inventario');
    }
});

// -------------------------
// RUTAS DE REQUERIMIENTOS 
// -------------------------
app.get('/api/requerimientos/detalle', async (req, res) => {
    try {
        const query = `
            SELECT 
                mrt.Id_Taller,
                mrt.Id_Rotacion,
                mrt.Id_Material,
                mrt.Requerimiento AS cantidad,
                mrt.Fecha,
                m.Nombre_Descripcion AS materialNombre,
                t.Denominacion AS tallerNombre,
                t.Anio AS tallerAnio,
                t.Turno AS tallerTurno,
                CONCAT(IFNULL(d.Nombre, ''), ' ', IFNULL(d.Apellido, '')) AS profesorNombre,
                d.Id_Docente
            FROM materialxrotacionxtaller mrt
            INNER JOIN material m ON mrt.Id_Material = m.Id_Material
            INNER JOIN taller t ON mrt.Id_Taller = t.Id_Taller
            LEFT JOIN docente d ON d.Id_Taller = t.Id_Taller
            WHERE mrt.Requerimiento > 0
            ORDER BY m.Nombre_Descripcion ASC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener detalle de requerimientos:', err);
        res.status(500).json({ message: 'Error al obtener detalle de requerimientos' });
    }
});

// Editar la cantidad de un requerimiento específico y registrar en movimientos
app.put('/api/requerimientos/detalle', async (req, res) => {
    const { idTaller, idRotacion, idMaterial, nuevaCantidad } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Buscar si el taller tiene un profesor asignado para la trazabilidad
        const [docenteRes] = await connection.query(
            'SELECT Id_Docente FROM docente WHERE Id_Taller = ? LIMIT 1',
            [idTaller]
        );
        const idDocente = docenteRes.length > 0 ? docenteRes[0].Id_Docente : null;

        if (Number(nuevaCantidad) <= 0) {
            // Si la cantidad es 0 o menor, eliminamos el requerimiento
            await connection.query(
                'DELETE FROM materialxrotacionxtaller WHERE Id_Taller = ? AND Id_Rotacion = ? AND Id_Material = ?',
                [idTaller, idRotacion, idMaterial]
            );

            // Registrar movimiento de eliminación/cambio a 0
            await connection.query(
                `INSERT INTO movimiento (Id_Material, Tipo, Cantidad, Id_Taller, Id_Docente, Observacion, Fecha)
                 VALUES (?, 'Cambio de Requerimiento', 0, ?, ?, 'Requerimiento eliminado (cantidad 0)', NOW())`,
                [idMaterial, idTaller, idDocente]
            );

            await connection.commit();
            connection.release();
            return res.json({ message: 'Requerimiento eliminado por cantidad 0' });
        }

        // 2. Actualizar la cantidad en la tabla intermedia
        const query = `
            UPDATE materialxrotacionxtaller 
            SET Requerimiento = ? 
            WHERE Id_Taller = ? AND Id_Rotacion = ? AND Id_Material = ?
        `;
        await connection.query(query, [nuevaCantidad, idTaller, idRotacion, idMaterial]);

        // 3. Registrar el movimiento histórico para que aparezca en Reportes
        await connection.query(
            `INSERT INTO movimiento (Id_Material, Tipo, Cantidad, Id_Taller, Id_Docente, Observacion, Fecha)
             VALUES (?, 'Cambio de Requerimiento', ?, ?, ?, 'Actualización de requerimiento', NOW())`,
            [idMaterial, nuevaCantidad, idTaller, idDocente]
        );

        await connection.commit();
        connection.release();
        res.json({ message: 'Requerimiento actualizado correctamente' });
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error al actualizar requerimiento:', err);
        res.status(500).json({ message: 'Error al actualizar el requerimiento' });
    }
});

// Eliminar un requerimiento específico y registrar en movimientos
app.delete('/api/requerimientos/detalle/:idTaller/:idRotacion/:idMaterial', async (req, res) => {
    const { idTaller, idRotacion, idMaterial } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Buscar docente asociado
        const [docenteRes] = await connection.query(
            'SELECT Id_Docente FROM docente WHERE Id_Taller = ? LIMIT 1',
            [idTaller]
        );
        const idDocente = docenteRes.length > 0 ? docenteRes[0].Id_Docente : null;

        // 2. Eliminar de la tabla de requerimientos
        const query = `
            DELETE FROM materialxrotacionxtaller 
            WHERE Id_Taller = ? AND Id_Rotacion = ? AND Id_Material = ?
        `;
        await connection.query(query, [idTaller, idRotacion, idMaterial]);

        // 3. Registrar el movimiento histórico de eliminación (cantidad 0 o aviso de baja)
        await connection.query(
            `INSERT INTO movimiento (Id_Material, Tipo, Cantidad, Id_Taller, Id_Docente, Observacion, Fecha)
             VALUES (?, 'Cambio de Requerimiento', 0, ?, ?, 'Eliminación completa de requerimiento', NOW())`,
            [idMaterial, idTaller, idDocente]
        );

        await connection.commit();
        connection.release();
        res.json({ message: 'Requerimiento eliminado correctamente' });
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error al eliminar requerimiento:', err);
        res.status(500).json({ message: 'Error al eliminar el requerimiento' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});

