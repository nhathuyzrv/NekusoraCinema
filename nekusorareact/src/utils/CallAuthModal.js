export function callAuthModal() {
    const modal = document.getElementById("auth_modal");
    if (modal) { modal.dataset.tab = "login"; modal.showModal(); }
}