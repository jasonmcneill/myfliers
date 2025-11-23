import { app } from "./interfaces/http/app";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Core API listening on port ${PORT}`);
  console.log(`- Environment: ${process.env.NODE_ENV || "development"}`);
});

// When Docker stops the container, it sends SIGTERM.
// We catch it to close the server cleanly instead of just killing the process.
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
