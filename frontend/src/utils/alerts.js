
import Swal from "sweetalert2";

const COLORS = {
  navy: "#172b4d",
  lime: "#c6f36b",
  red: "#b42318",
};

const baseConfig = {
  confirmButtonColor: COLORS.navy,
  cancelButtonColor: "#667085",
  background: "#ffffff",
  color: "#182230",
  buttonsStyling: true,
  customClass: {
    popup: "app-swal-popup",
    title: "app-swal-title",
    confirmButton: "app-swal-confirm",
    cancelButton: "app-swal-cancel",
  },
};

export function showSuccess(title, text = "") {
  return Swal.fire({
    ...baseConfig,
    icon: "success",
    title,
    text,
    confirmButtonText: "Continue",
  });
}

export function showError(title, text = "") {
  return Swal.fire({
    ...baseConfig,
    icon: "error",
    title,
    text,
    confirmButtonText: "Got it",
    confirmButtonColor: COLORS.red,
  });
}

export function showInfo(title, text = "") {
  return Swal.fire({
    ...baseConfig,
    icon: "info",
    title,
    text,
    confirmButtonText: "OK",
  });
}

export function confirmDelete({
  title = "Are you sure?",
  text = "This action cannot be undone.",
  confirmText = "Yes, delete it",
} = {}) {
  return Swal.fire({
    ...baseConfig,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    confirmButtonColor: COLORS.red,
    reverseButtons: true,
    focusCancel: true,
  });
}

export function showLoading(title = "Please wait...") {
  return Swal.fire({
    ...baseConfig,
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeAlert() {
  Swal.close();
}
