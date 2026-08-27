export async function loadInOrder() {
  const account = await loadAccount();
  const audit = await loadAuditFor(account.id);
  return { account, audit };
}
