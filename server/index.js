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
    const { materialId, movementType, quantity, idTaller, idDocente, observations } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const insertMovementQuery = `
            INSERT INTO movimiento (Id_Material, Tipo, Cantidad, Id_Taller, Id_Docente, Observacion, Fecha)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const [movementResult] = await connection.query(insertMovementQuery, [
            materialId,
            movementType,
            quantity,
            idTaller,
            idDocente,
            observations
        ]);
        const newMovementId = movementResult.insertId;

        const updateStockQuery = `
            UPDATE material
            SET StockActual = StockActual ${movementType === 'Ingreso' ? '+' : '-'} ?
            WHERE Id_Material = ?
        `;
        await connection.query(updateStockQuery, [quantity, materialId]);

        if (movementType === 'Egreso' && idTaller) {
            const [rotations] = await connection.query(
                'SELECT Id_Rotacion FROM rotacion WHERE CURDATE() BETWEEN Inicio AND Final LIMIT 1'
            );

            if (rotations.length > 0) {
                const idRotacion = rotations[0].Id_Rotacion;
                const updateRequirementQuery = `
                    INSERT INTO materialxrotacionxtaller (Id_Taller, Id_Rotacion, Id_Material, Fecha, Requerimiento)
                    VALUES (?, ?, ?, CURDATE(), ?)
                    ON DUPLICATE KEY UPDATE Requerimiento = Requerimiento + VALUES(Requerimiento), Fecha = CURDATE()
                `;
                await connection.query(updateRequirementQuery, [idTaller, idRotacion, materialId, quantity]);
            }
        }
        
        await connection.commit();
        res.status(201).json({ id: newMovementId, message: 'Movimiento registrado correctamente.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar movimiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al registrar el movimiento.' });
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

        const updateRequirementQuery = `
            INSERT INTO materialxrotacionxtaller (Id_Taller, Id_Rotacion, Id_Material, Fecha, Requerimiento)
            VALUES (?, ?, ?, CURDATE(), ?)
            ON DUPLICATE KEY UPDATE 
                Requerimiento = VALUES(Requerimiento), 
                Fecha = CURDATE()
        `;
        await connection.query(updateRequirementQuery, [idTaller, idRotacion, materialId, newRequirement]);
        
        await connection.commit();
        res.status(201).json({ id: movementResult.insertId, message: 'Requerimiento actualizado.' });
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

app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});