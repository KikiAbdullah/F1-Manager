export function showToast(message = "Notification") {
  const old = document.querySelector(".f1-toast");

  if (old) {
    old.remove();
  }

  const toast = document.createElement("div");

  toast.className = "f1-toast";

  toast.innerHTML = `
      <div class="f1-toast-content">
        ${message}
      </div>
    `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}
