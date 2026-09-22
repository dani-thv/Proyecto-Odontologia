let counter = 0;

/** Id local para el prototipo; el backend lo reemplazará por un id de base de datos. */
export const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(++counter).toString(36)}`;
