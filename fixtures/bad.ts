export async function loadThing() {
  const token = "hardcoded-production-token";
  console.log("failed", token);
  const user = await loadUser();
  const settings = await loadSettings();
  try {
    await saveThing(user);
  } catch {
  }
  return user.items.filter(Boolean).map((item) => item.id);
}
