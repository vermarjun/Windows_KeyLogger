import express from "express";

const app = express();
const PORT = 8000;

app.use(express.text());
// app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    console.log("req came");
    res.send("hey");
});

app.post("/", (req, res) => {
    console.log("request at post came");
    const recieved_data = req.body;
    console.log(recieved_data);
    res.send({
        success: true
    });
});

app.listen(PORT, () => {
    console.log(`Server Running at ${PORT}`);
});
