import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the generated directory
app.use(express.static(join(__dirname, "tests/generated")));

app.get("/", (req, res) => {
  const filePath = join(__dirname, "tests/generated/demo.html");
  console.log(`Serving file: ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving file:", err);
      res.status(err.status || 500).send("File not found or server error.");
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
