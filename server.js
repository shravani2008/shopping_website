import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Session setup
app.use(
  session({
    secret: "secretkey123",
    resave: false,
    saveUninitialized: false,
  })
);

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/shopDB");

// Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  image: String,
});
const Product = mongoose.model("Product", productSchema);

// Admin middleware
function checkAdmin(req, res, next) {
  if (req.session.admin) return next();
  res.redirect("/admin/login");
}

// -------------------- ROUTES --------------------

// Home page
app.get("/", async (req, res) => {
  const products = await Product.find();
  res.render("index", { products });
});

// Admin login/logout
app.get("/admin/login", (req, res) => res.render("admin_login"));
app.post("/admin/login", (req, res) => {
  const { user, pass } = req.body;
  if (user === "admin" && pass === "1234") {
    req.session.admin = true;
    res.redirect("/admin/manage");
  } else {
    res.send("<h3>Invalid credentials. <a href='/admin/login'>Try again</a></h3>");
  }
});
app.get("/admin/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

// Admin add/manage products
app.get("/admin", checkAdmin, (req, res) => res.render("admin_add"));
app.post("/admin/add", checkAdmin, async (req, res) => {
  const { name, price, description, image } = req.body;
  await new Product({ name, price, description, image }).save();
  res.redirect("/admin/manage");
});
app.get("/admin/manage", checkAdmin, async (req, res) => {
  const products = await Product.find();
  res.render("admin_manage", { products });
});
app.post("/admin/delete/:id", checkAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect("/admin/manage");
});

// Product details
app.get("/product/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.send("Product not found");
  res.render("order", { product }); // order.ejs will show product + order form
});

// Cart page
app.get("/cart", (req, res) => res.render("cart")); // cart.ejs

// Checkout page
app.get("/checkout", (req, res) => res.render("checkout")); // checkout.ejs

// Handle order submission from cart
app.post("/order/submit", async (req, res) => {
  try {
    const { name, mobile, address, cartData } = req.body;

    const cart = JSON.parse(cartData || "[]");
    if (!cart.length) return res.send("<h3>Your cart is empty. <a href='/'>Go back</a></h3>");

    let total = 0;
    cart.forEach(item => total += item.price);

    console.log("🛒 New Order:");
    console.log({ customer: name, mobile, address, cart, total });

    res.send(`
      <div style="font-family:Poppins;text-align:center;margin-top:100px">
        <h2>✅ Order Placed Successfully!</h2>
        <p>Thank you, <strong>${name}</strong>! Your order for <b>${cart.length} items</b> totaling <b>₹${total}</b> has been received.</p>
        <a href="/" style="color:#0d6efd;text-decoration:none;font-weight:bold;">← Back to Store</a>
        <script>localStorage.removeItem('cart');</script>
      </div>
    `);
  } catch (err) {
    console.error(err);
    res.send("<h3>Error processing order. <a href='/'>Go back</a></h3>");
  }
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
