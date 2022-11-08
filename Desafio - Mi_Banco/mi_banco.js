const { Pool } = require("pg");
const Cursor = require("pg-cursor");

const pool_conexion = new Pool ({
user: "postgres",
host: "localhost",
password: "megaman",
database: "banco",
port: 5432,
max: 20,
idleTimeoutMillis: 5000,
connectionTimeoutMillis: 2000,
});

const parametros = process.argv;
const tipo_transaccion = parametros[2];
const cuenta = parametros[3];
const descripcion = parametros[4];
const fecha = parametros[5];
const monto = parametros[6];


pool_conexion.connect(async (error_conexion, cliente_conexion, release) => {
    if(error_conexion){
        return console.error('Error de conexion: ', error_conexion.stack);
    }
    tipo_transaccion == 'consulta_saldo'
    ? await consulta_saldo(cliente_conexion)
    : false;

    tipo_transaccion == 'consulta_transaccion'
    ? await consulta_tran(cliente_conexion)
    : false;

    tipo_transaccion == "registro"
    ? await nuevo(cliente_conexion, cuenta, fecha, descripcion, monto)
    : false;

    pool_conexion.end();
});

async function consulta_saldo(cliente_conexion){
    const cursor = await cliente_conexion.query(
        new Cursor(`SELECT * FROM cuentas WHERE id = ${cuenta}`)
    );
    cursor.read(5, (err, rows) => {
        if (err){
            console.error(err);
        }else{
            console.info(rows);
        }
    });
}

async function consulta_tran(cliente_conexion){
    const cursor = await cliente_conexion.query(
        new Cursor(`SELECT * FROM transacciones WHERE id = ${cuenta}`)
    );
    cursor.read(10, (err, rows) => {
        if (err){
            console.error(err);
        }else{
            console.info(rows);
        }
    });
}

async function nuevo(cliente_conexion, cuenta, fecha, descripcion, monto){
    const actualizar = {
        text: `UPDATE cuentas SET saldo = saldo - $1 RETURNING *`,
        values: [monto],
    };
    const inserta = {
        text: `INSERT INTO transacciones (descripcion, fecha, monto, cuenta) VALUES ($1, $2, $3, $4) RETURNING *`,
        values: [descripcion, fecha, monto, cuenta],
    };

    try{
        await cliente_conexion.query("BEGIN");
        const resultado = await cliente_conexion.query(inserta);
        await cliente_conexion.query(actualizar);
        await cliente_conexion.query("COMMIT");
        console.info('La transaccion fue exitosa: ', resultado.rows[0]);
    } catch(ex){
        await cliente_conexion.query("ROLLBACK");
        console.error(ex);
    }
}

