require("dotenv").config();

//Bring in the App
const app = require("./app");

//Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running: http://localhost:" + PORT);
});
