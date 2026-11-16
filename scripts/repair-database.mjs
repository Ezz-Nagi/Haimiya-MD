import db from '#db';
try {
    db.initDB();
    db.repairDatabase();
    console.log('[Haimiya] Base de datos reparada y guardada de forma atómica.');
}
catch (error) {
    console.error('[Haimiya] No se pudo reparar la base de datos:', error?.stack || error);
    process.exitCode = 1;
}
