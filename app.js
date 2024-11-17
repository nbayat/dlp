const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

// Set up EJS for rendering
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware for parsing form data
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Route: Home Page
app.get("/", (req, res) => {
  res.render("index");
});

// Route: Handle Video Download
app.post("/download", (req, res) => {
  const videoURL = req.body.link;

  // Validate the URL
  if (!videoURL) {
    return res.status(400).send("Please provide a valid YouTube URL.");
  }

  const outputFileName = `video-${Date.now()}`; // Unique identifier for file

  // Run youtube-dl command (file will be saved in downloads/)
  const command = `yt-dlp -o "./downloads/${outputFileName}.%(ext)s" ${videoURL}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      return res.status(500).send("Error downloading video. Please try again.");
    }

    // Search for the downloaded file in the downloads folder
    const downloadsDir = path.join(__dirname, "downloads");
    fs.readdir(downloadsDir, (err, files) => {
      if (err) {
        console.error("Error reading downloads directory:", err);
        return res.status(500).send("Error processing the download.");
      }

      // Find the file that matches the outputFileName substring
      const matchingFile = files.find((file) => file.includes(outputFileName));
      if (!matchingFile) {
        return res.status(404).send("File not found. Please try again.");
      }

      // Send the file back to the user
      const filePath = path.join(downloadsDir, matchingFile);
      res.download(filePath, matchingFile, (err) => {
        if (err) {
          console.error("Error sending file:", err);
        }
        // Optionally delete the file after serving
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          }
        });
      });
    });
  });
});

// Start Server
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
