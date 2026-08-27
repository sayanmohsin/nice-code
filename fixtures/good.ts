export async function loadThing(logger, requestId) {
  const [user, settings] = await Promise.all([loadUser(), loadSettings()]);
  logger.info("thing.load.completed", { requestId, settingsLoaded: Boolean(settings) });
  return user.items.map((item) => item.id);
}
