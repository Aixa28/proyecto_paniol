// server.js (Reemplaza tu archivo api.txt)

import express from 'express';
// Usamos mysql2/promise para la sintaxis async/await y Pools de conexión.
import mysql from 'mysql2/promise'; 
import cors from 'cors';

const app = express();
const port = 3001; 

// ====================================================
// 1. CONFIGURACIÓN DE CONEXIÓN (Pool)
// ====================================================
// ¡IMPORTANTE! Reemplaza con tus credenciales de base de datos
const dbConfig = {
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'gestion_paniol',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crea un Pool de conexiones. Esto es más eficiente que db.createConnection()
const pool = mysql.createPool(dbConfig); 

// Comprueba la conexión al iniciar el servidor
(async () => {
    try {
        await pool.getConnection();
        console.log('✅ Conectado a la base de datos MySQL.');
    } catch (err) {
        console.error('❌ Error al conectar a la base de datos:', err);
    }
})();

// ====================================================
// 2. MIDDLEWARES
// ====================================================
app.use(cors()); 
app.use(express.json()); 


// ====================================================
// 3. RUTAS API (Actualizadas con async/await y Pool)
// ====================================================

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando.');
});

// ----------------------------------------------------
// RUTAS DE INVENTARIO Y ESTADO DINÁMICO
// ----------------------------------------------------

/**
 * RUTA CLAVE: Obtiene el estado dinámico de los materiales para un Taller y Rotación específicos.
 * Consulta la VISTA v_dashboard_paniol creada en el SQL.
 * EJEMPLO: GET http://localhost:3001/api/inventario/estado/1/1
 */
app.get('/api/inventario/estado/:idTaller/:idRotacion', async (req, res) => {
    const { idTaller, idRotacion } = req.params;

    const query = `
        SELECT 
            Id_Material,
            Nombre_Descripcion,
            StockActual,
            Requerimiento,
            Balance_Numerico,
            Estado  /* ESTE CAMPO ES DINÁMICO */
        FROM v_dashboard_paniol 
        WHERE Id_Taller = ? AND Id_Rotacion = ?
    `;

    try {
        // pool.query usa el método promisificado
        const [resultados] = await pool.query(query, [idTaller, idRotacion]);

        if (resultados.length === 0) {
            // Se puede devolver un 200 con array vacío, o un 404 si es estricto
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

// Ruta para obtener todos los materiales
app.get('/api/materiales', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM material');
    res.json(results);
  } catch (err) {
    console.error('Error al obtener materiales:', err);
    res.status(500).send('Error al obtener los materiales de la base de datos');
  }
});

// Ruta para crear un nuevo material
app.post('/api/materiales', async (req, res) => {
  const { Nombre_Descripcion, StockActual } = req.body;
  const query = 'INSERT INTO material (Nombre_Descripcion, StockActual) VALUES (?, ?)';
  try {
    const [result] = await pool.query(query, [Nombre_Descripcion, StockActual]);
    const newMaterial = { Id_Material: result.insertId, Nombre_Descripcion, StockActual };
    res.status(201).json(newMaterial);
  } catch (err) {
    console.error('Error al crear material:', err);
    res.status(500).send('Error al guardar el material en la base de datos');
  }
});

// Ruta para eliminar un material
app.delete('/api/materiales/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Primero eliminar registros relacionados
    await connection.query('DELETE FROM materialxrotacionxtaller WHERE Id_Material = ?', [id]);
    await connection.query('DELETE FROM movimiento WHERE Id_Material = ?', [id]);
    
    // Luego eliminar el material
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


// Ruta para actualizar un material
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

// Ruta para obtener todos los talleres
app.get('/api/talleres', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM taller');
    res.json(results);
  } catch (err) {
    console.error('Error al obtener talleres:', err);
    res.status(500).send('Error al obtener los talleres de la base de datos');
  }
});

// Ruta para crear un nuevo taller
app.post('/api/talleres', async (req, res) => {
    const { Denominacion, Turno, anio } = req.body;
    const query = 'INSERT INTO taller (Denominacion, Turno, anio) VALUES (?, ?, ?)';
    try {
        const [result] = await pool.query(query, [Denominacion, Turno, anio || null]);
        const newTaller = { Id_Taller: result.insertId, Denominacion, Turno, anio };
        res.status(201).json(newTaller);
    } catch (err) {
        console.error('Error al crear taller:', err);
        res.status(500).send('Error al guardar el taller en la base de datos');
    }
});

// Ruta para actualizar un taller
app.put('/api/talleres/:id', async (req, res) => {
    const { id } = req.params;
    const { Denominacion, Turno, anio } = req.body;
    const query = 'UPDATE taller SET Denominacion = ?, Turno = ?, anio = ? WHERE Id_Taller = ?';
    try {
        const [result] = await pool.query(query, [Denominacion, Turno, anio || null, id]);
        if (result.affectedRows === 0) {
            return res.status(404).send('No se encontró el taller con el ID proporcionado');
        }
        res.status(200).send('Taller actualizado exitosamente');
    } catch (err) {
        console.error('Error al actualizar taller:', err);
        res.status(500).send('Error al actualizar el taller en la base de datos');
    }
});

// Ruta para eliminar un taller
app.delete('/api/talleres/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Desvincular movimientos (preservar historial)
        await connection.query('UPDATE movimiento SET Id_Taller = NULL WHERE Id_Taller = ?', [id]);

        // Eliminar requerimientos asociados
        await connection.query('DELETE FROM materialxrotacionxtaller WHERE Id_Taller = ?', [id]);

        // Desvincular docentes
        await connection.query('UPDATE docente SET Id_Taller = NULL WHERE Id_Taller = ?', [id]);

        // Eliminar el taller
        const [result] = await connection.query('DELETE FROM taller WHERE Id_Taller = ?', [id]);
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

// Ruta para obtener todos los docentes
app.get('/api/docentes', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM docente');
    res.json(results);
  } catch (err) {
    console.error('Error al obtener docentes:', err);
    res.status(500).send('Error al obtener los docentes de la base de datos');
  }
});

// Ruta para crear un nuevo docente
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

// Ruta para actualizar un docente
app.delete('/api/docentes/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Primero desvincular los movimientos (poner Id_Docente en null)
    await connection.query('UPDATE movimiento SET Id_Docente = NULL WHERE Id_Docente = ?', [id]);

    // Luego eliminar el docente
    const [result] = await connection.query('DELETE FROM docente WHERE Id_Docente = ?', [id]);
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

// Ruta para eliminar un docente
app.delete('/api/docentes/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM docente WHERE Id_Docente = ?';
  try {
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows === 0) {
      res.status(404).send('No se encontró el docente con el ID proporcionado');
      return;
    }
    res.status(200).send('Docente eliminado exitosamente');
  } catch (err) {
    console.error('Error al eliminar docente:', err);
    res.status(500).send('Error al eliminar el docente de la base de datos');
  }
});

// ----------------------------------------------------
// RUTAS DE ROTACIONES (CRUD)
// ----------------------------------------------------

// Ruta para obtener todas las rotaciones
app.get('/api/rotaciones', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM rotacion ORDER BY Inicio DESC');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener rotaciones:', err);
        res.status(500).send('Error al obtener las rotaciones de la base de datos');
    }
});

// Ruta para crear una nueva rotación
app.post('/api/rotaciones', async (req, res) => {
    const { Inicio, Final } = req.body;
    const query = 'INSERT INTO rotacion (Inicio, Final) VALUES (?, ?)';
    try {
        const [result] = await pool.query(query, [Inicio, Final]);
        const newRotation = { Id_Rotacion: result.insertId, Inicio, Final };
        res.status(201).json(newRotation);
    } catch (err) {
        console.error('Error al crear rotación:', err);
        res.status(500).send('Error al guardar la rotación en la base de datos');
    }
});

// Ruta para actualizar una rotación
app.put('/api/rotaciones/:id', async (req, res) => {
    const { id } = req.params;
    const { Inicio, Final } = req.body;
    const query = 'UPDATE rotacion SET Inicio = ?, Final = ? WHERE Id_Rotacion = ?';
    try {
        const [result] = await pool.query(query, [Inicio, Final, id]);
        if (result.affectedRows === 0) {
            return res.status(404).send('No se encontró la rotación con el ID proporcionado');
        }
        res.status(200).send('Rotación actualizada exitosamente');
    } catch (err) {
        console.error('Error al actualizar rotación:', err);
        res.status(500).send('Error al actualizar la rotación en la base de datos');
    }
});

// Ruta para eliminar una rotación
app.delete('/api/rotaciones/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM rotacion WHERE Id_Rotacion = ?';
    try {
        const [result] = await pool.query(query, [id]);
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
// cambiamos que se muestre la denominación junto con el turno para diferenciarlos claramente
app.get('/api/reportes', async (req, res) => {
    const query = `
        SELECT 
            mov.Id_Movimiento AS id,
            mov.Id_Material AS materialId,
            m.Nombre_Descripcion AS material,
            mov.Tipo AS tipo,
            mov.Cantidad AS cantidad,
            CONCAT(t.Denominacion, ' (', t.Turno, ')') AS departamento,
            COALESCE(CONCAT(d.Nombre, ' ', d.Apellido), '') AS responsable,
            mov.Observacion AS observacion,
            mov.Fecha AS fecha
        FROM movimiento mov
        LEFT JOIN material m ON mov.Id_Material = m.Id_Material
        LEFT JOIN taller t ON mov.Id_Taller = t.Id_Taller
        LEFT JOIN docente d ON mov.Id_Docente = d.Id_Docente
        ORDER BY mov.Fecha DESC
    `;

    try {
        const [results] = await pool.query(query);
        res.json(results);
    } catch (err) {
        console.error('Error al obtener reportes:', err);
        res.status(500).send('Error al obtener los reportes de la base de datos');
    }
});

// ----------------------------------------------------
// RUTA DE MOVIMIENTOS
// ----------------------------------------------------
app.post('/api/movimientos', async (req, res) => {
    const { materialId, movementType, quantity, idTaller, idDocente, observations } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insertar en la tabla de movimientos
        const insertMovementQuery = `
            INSERT INTO movimiento (Id_Material, Tipo, Cantidad, Id_Taller, Id_Docente, Observacion, Fecha)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const [movementResult] = await connection.query(insertMovementQuery, [
            materialId,
            movementType,
            quantity,
            idTaller, // Puede ser null para ingresos
            idDocente, // Puede ser null para ingresos
            observations
        ]);
        const newMovementId = movementResult.insertId;

        // 2. Actualizar el stock en la tabla de materiales
        const updateStockQuery = `
            UPDATE material
            SET StockActual = StockActual ${movementType === 'Ingreso' ? '+' : '-'} ?
            WHERE Id_Material = ?
        `;
        await connection.query(updateStockQuery, [quantity, materialId]);

        // 3. Si es un Egreso, actualizar el requerimiento en la tabla de planificación
        if (movementType === 'Egreso' && idTaller) {
            // Buscar la rotación activa
            const [rotations] = await connection.query(
                'SELECT Id_Rotacion FROM rotacion WHERE CURDATE() BETWEEN Inicio AND Final LIMIT 1'
            );

            if (rotations.length > 0) {
                const idRotacion = rotations[0].Id_Rotacion;

                // Insertar o actualizar el requerimiento.
                // Si la combinación de taller, rotación y material ya existe, suma la cantidad al requerimiento.
                // Si no existe, inserta un nuevo registro.
                const updateRequirementQuery = `
                    INSERT INTO materialxrotacionxtaller (Id_Taller, Id_Rotacion, Id_Material, Fecha, Requerimiento)
                    VALUES (?, ?, ?, CURDATE(), ?)
                    ON DUPLICATE KEY UPDATE Requerimiento = Requerimiento + VALUES(Requerimiento), Fecha = CURDATE()
                `;
                await connection.query(updateRequirementQuery, [idTaller, idRotacion, materialId, quantity]);
            }
        }
        
        // 4. Confirmar la transacción
        await connection.commit();

        res.status(201).json({
            id: newMovementId,
            message: 'Movimiento registrado y stock actualizado correctamente.'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar movimiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al registrar el movimiento.' });
    } finally {
        connection.release();
    }
});

// ----------------------------------------------------
// RUTA PARA CAMBIO DE REQUERIMIENTO
// ----------------------------------------------------
// En tu backend (Node.js)
app.post('/api/movimientos/requerimiento', async (req, res) => {
    // Usamos 'let' para idDocente para permitir su reasignación si viene nulo
    let { materialId, idTaller, newRequirement, observations, idDocente } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // si el id del Docente viene nulo7falso pero tenemos el id de Taller, lo buscamos en la base de datos
        if (!idDocente && idTaller) {
            // buscamos en la tabla docente por el id del taller asignado
            const [docenteResult] = await connection.query(
                'SELECT Id_Docente FROM docente WHERE Id_Taller = ? LIMIT 1',
                [idTaller]
            );

            if (docenteResult.length > 0) {
                idDocente = docenteResult[0].Id_Docente;
            } else {
                // si la relación está en la tabla taller
                const [tallerResult] = await connection.query(
                    'SELECT Id_Docente FROM taller WHERE Id_Taller = ? LIMIT 1',
                    [idTaller]
                );
                if (tallerResult.length > 0 && tallerResult[0].Id_Docente) {
                    idDocente = tallerResult[0].Id_Docente;
                }
            }
        }

        console.log("Datos recibidos en backend:", { materialId, idTaller, newRequirement, idDocente });

        // bscar la rotación activa (o la más reciente como fallback)
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

        // obtener el requerimiento actual para calcular la diferencia
        const [currentRequirementResult] = await connection.query(
            `SELECT Requerimiento FROM materialxrotacionxtaller 
             WHERE Id_Material = ? AND Id_Taller = ? AND Id_Rotacion = ?`,
            [materialId, idTaller, idRotacion]
        );
        
        const currentRequirement = currentRequirementResult.length > 0 ? currentRequirementResult[0].Requerimiento : 0;
        const quantityChange = newRequirement - currentRequirement;

        // insertar en movimientos para auditoría (ya con idDocente resuelto)
        const insertMovementQuery = `
            INSERT INTO movimiento (Id_Material, Tipo, Cantidad, Id_Taller, Id_Docente, Observacion, Fecha)
            VALUES (?, 'Cambio de Requerimiento', ?, ?, ?, ?, NOW())
        `;
        const [movementResult] = await connection.query(insertMovementQuery, [
            materialId, 
            newRequirement, 
            idTaller, 
            idDocente || null, 
            observations
        ]);
        const newMovementId = movementResult.insertId;

        // actualizar el requerimiento en la tabla intermedia
        const updateRequirementQuery = `
            INSERT INTO materialxrotacionxtaller (Id_Taller, Id_Rotacion, Id_Material, Fecha, Requerimiento)
            VALUES (?, ?, ?, CURDATE(), ?)
            ON DUPLICATE KEY UPDATE 
                Requerimiento = Requerimiento + VALUES(Requerimiento), 
                Fecha = CURDATE()
        `;
        await connection.query(updateRequirementQuery, [idTaller, idRotacion, materialId, newRequirement]);
        
        // confirmar la transacción
        await connection.commit();

        res.status(201).json({
            id: newMovementId,
            message: 'Requerimiento actualizado y movimiento registrado correctamente.'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al cambiar el requerimiento:', error);
        res.status(500).json({ 
            mensaje: 'Error interno del servidor al cambiar el requerimiento.', 
            detalle: error.message 
        });
    } finally {
        connection.release();
    }
});

// Requerimiento total de todos los talleres por material (rotación activa)
app.get('/api/inventario/resumen', async (req, res) => {
    const query = `
        SELECT 
            m.Id_Material,
            m.Nombre_Descripcion,
            m.StockActual,
            COALESCE(SUM(mrt.Requerimiento), 0) AS Requerimiento,
            m.StockActual - COALESCE(SUM(mrt.Requerimiento), 0) AS Balance_Numerico,
            CASE
                WHEN COALESCE(SUM(mrt.Requerimiento), 0) = 0 THEN 'DISPONIBLE'
                WHEN m.StockActual <= 0 THEN 'FALTANTE'
                WHEN m.StockActual < SUM(mrt.Requerimiento) THEN 'FALTANTE'
                WHEN (m.StockActual - SUM(mrt.Requerimiento)) <= 2 THEN 'LIMITADO'
                ELSE 'DISPONIBLE'
            END AS Estado
        FROM material m
        LEFT JOIN materialxrotacionxtaller mrt ON m.Id_Material = mrt.Id_Material
        LEFT JOIN rotacion r ON mrt.Id_Rotacion = r.Id_Rotacion
            AND CURDATE() BETWEEN r.Inicio AND r.Final
        GROUP BY m.Id_Material, m.Nombre_Descripcion, m.StockActual
        ORDER BY m.Nombre_Descripcion
    `;

    try {
        const [results] = await pool.query(query);
        res.json(results);
    } catch (err) {
        console.error('Error al obtener resumen de inventario:', err);
        res.status(500).send('Error al obtener el resumen del inventario');
    }
});

// ====================================================
// 4. INICIAR EL SERVIDOR
// ====================================================
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});