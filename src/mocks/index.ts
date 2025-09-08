export async function initMocks() {
  if (import.meta.env.VITE_API_MODE === "mock") {
    const { worker } = await import("./browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
}
