export function actionInput(name, fallback = "") {
  const exactKey = `INPUT_${name.toUpperCase().replaceAll(" ", "_")}`;
  const compatibilityKey = exactKey.replaceAll("-", "_");

  return process.env[exactKey] || process.env[compatibilityKey] || fallback;
}
