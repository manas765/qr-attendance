export default function manifest() {
  return {
    name: "QR Attendance",
    short_name: "Attendance",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f1",
    theme_color: "#2540d9",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}