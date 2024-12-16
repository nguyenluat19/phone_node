import express from "express";
import axios from "axios";

const router = express.Router();

// Giỏ hàng lưu trữ trong bộ nhớ tạm
let cart = [];

// Route: Danh sách sản phẩm
router.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://flutter-appp.onrender.com/");
    const phones = response.data;

    // Đếm số lượng sản phẩm trong giỏ hàng
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    res.render("index", { phones, cartCount });
  } catch (error) {
    console.error(error);
    res.status(500).send("Không thể lấy danh sách sản phẩm.");
  }
});

// Route: Thêm sản phẩm vào giỏ hàng
router.post("/add-to-cart", (req, res) => {
  const productId = req.body.id;

  // Kiểm tra xem sản phẩm đã có trong giỏ chưa
  const existingProduct = cart.find((item) => item._id === productId);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    // Chỉ lưu id và quantity, các thông tin còn lại sẽ lấy từ API
    cart.push({
      _id: productId,
      quantity: 1, // Mặc định là 1, có thể thay đổi sau
    });
  }

  res.redirect("/cart");
});

// Route: Xóa sản phẩm khỏi giỏ hàng
router.post("/remove-from-cart", (req, res) => {
  const { id } = req.body;
  cart = cart.filter((item) => item._id !== id);
  res.redirect("/cart");
});

// Route: Cập nhật giỏ hàng
router.post("/update-cart", (req, res) => {
  const { id, quantity } = req.body;
  const cartItem = cart.find((item) => item._id === id);
  if (cartItem) {
    cartItem.quantity = parseInt(quantity, 10);
  }
  res.redirect("/cart");
});

// Route: Hiển thị giỏ hàng
router.get("/cart", async (req, res) => {
  try {
    // Lấy danh sách sản phẩm từ API hoặc từ bộ nhớ
    const response = await axios.get("https://flutter-appp.onrender.com/");
    const phones = response.data;

    // Lấy chi tiết của các sản phẩm trong giỏ hàng
    const cartDetails = cart.map((item) => {
      const product = phones.find((phone) => phone._id === item._id);
      return {
        ...item,
        ...product, // Gộp thông tin chi tiết của sản phẩm vào giỏ hàng
      };
    });

    const totalPrice = cartDetails.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    res.render("cart", { cartDetails, totalPrice });
  } catch (error) {
    console.error(error);
    res.status(500).send("Không thể lấy thông tin giỏ hàng.");
  }
});

// Route xử lý thanh toán
router.post("/checkout", (req, res) => {
  const { name, address, paymentMethod } = req.body;

  // Kiểm tra thông tin hợp lệ
  if (!name || !address || !paymentMethod) {
    return res.redirect("/checkout"); // Nếu thiếu thông tin, quay lại trang checkout
  }

  // Tính tổng tiền
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Giả sử thanh toán thành công (thực tế cần tích hợp với dịch vụ thanh toán)
  const order = {
    name,
    address,
    paymentMethod,
    totalPrice,
    items: cart,
    status: "Đã thanh toán",
  };

  // Lưu thông tin đơn hàng vào cơ sở dữ liệu (giả sử bạn có model Order)
  Order.create(order, (err, newOrder) => {
    if (err) {
      console.log(err);
      return res.redirect("/checkout");
    }

    // Xóa giỏ hàng sau khi thanh toán thành công
    cart = [];

    res.redirect("/order-success");
  });
});

// Route để hiển thị trang thanh toán
router.get("/checkout", async (req, res) => {
  if (cart.length === 0) {
    return res.redirect("/cart"); // Nếu giỏ hàng trống, quay lại giỏ hàng
  }

  try {
    // Lấy thông tin chi tiết của sản phẩm từ API
    const response = await axios.get("https://flutter-appp.onrender.com/");
    const phones = response.data;

    // Gộp thông tin chi tiết vào giỏ hàng
    const cartDetails = cart.map((item) => {
      const product = phones.find((phone) => phone._id === item._id);
      return {
        ...item,
        ...product, // Gộp chi tiết sản phẩm
      };
    });

    // Tính tổng tiền
    const totalPrice = cartDetails.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Render trang checkout với dữ liệu giỏ hàng và tổng tiền
    res.render("checkout", { cart: cartDetails, totalPrice });
  } catch (error) {
    console.error(error);
    res.status(500).send("Không thể lấy thông tin giỏ hàng.");
  }
});

router.get("/search", async (req, res) => {
  const { q } = req.query; // Lấy từ khóa tìm kiếm từ URL

  try {
    // Gửi yêu cầu lấy danh sách sản phẩm
    const response = await axios.get("https://flutter-appp.onrender.com/");
    const phones = response.data;

    // Lọc sản phẩm dựa trên từ khóa tìm kiếm
    const filteredPhones = phones.filter((phone) =>
      phone.name.toLowerCase().includes(q.toLowerCase())
    );

    // Đếm số lượng sản phẩm trong giỏ hàng
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    // Render lại giao diện với danh sách sản phẩm đã lọc
    res.render("index", { phones: filteredPhones, cartCount });
  } catch (error) {
    console.error(error);
    res.status(500).send("Không thể thực hiện tìm kiếm.");
  }
});

export default router;
