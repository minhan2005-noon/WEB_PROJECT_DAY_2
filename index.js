const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Cấu hình Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Phục vụ giao diện tĩnh từ thư mục 'public'

// 2. Kết nối Cơ sở dữ liệu MongoDB (Thay thế URI nếu sử dụng MongoDB Atlas)
// Thay đoạn cũ bằng đoạn này:
const dbURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ten_database_cua_ban';
mongoose.connect(dbURI)
  .then(() => console.log("Kết nối thành công!"))
  .catch(err => console.log("Lỗi kết nối:", err));

// 3. Định nghĩa Schemas & Models (Mongoose)
// Schema cho người dùng
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Schema cho phản hồi (Feedback)
const feedbackSchema = new mongoose.Schema({
    email: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);


// 4. Định nghĩa các tuyến đường API (Routes)

// API Đăng ký tài khoản hoặc Cấp lại mật khẩu
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // Kiểm tra tài khoản đã tồn tại chưa
        const userExists = await User.findOne({ email });
        if (userExists) {
            // Logic cấp lại/đổi mật khẩu nếu tài khoản đã tồn tại (theo tính năng Đăng Ký / Cấp Lại trong HTML)
            userExists.fullname = fullname;
            userExists.password = password;
            await userExists.save();
            return res.status(200).json({ success: true, message: 'Cập nhật lại mật khẩu thành công!' });
        }

        // Tạo tài khoản mới nếu chưa tồn tại
        const newUser = new User({ fullname, email, password });
        await newUser.save();
        res.status(201).json({ success: true, message: 'Đăng ký tài khoản mới thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống.', error: error.message });
    }
});

// API Đăng nhập
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm người dùng theo email và mật khẩu
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
        }

        res.status(200).json({ success: true, message: 'Đăng nhập thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống.', error: error.message });
    }
});

// API Gửi phản hồi (Feedback)
app.post('/api/feedback', async (req, res) => {
    try {
        const { email, message } = req.body;
        const newFeedback = new Feedback({ email, message });
        await newFeedback.save();
        res.status(201).json({ success: true, message: 'Gửi đóng góp phản hồi thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể gửi phản hồi lúc này.', error: error.message });
    }
});


// 5. Điều hướng mặc định về trang đăng nhập
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dang-nhap.html'));
});

// 6. Khởi chạy Server
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống MINH ÂN đang chạy tại: http://localhost:${PORT}`);
});