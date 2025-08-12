const AuthModel = require('../Models/AuthModel');

class AuthController {
static async loginAdmin(req, res) {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: "Email and password are required" 
    });
  }

  const result = await AuthModel.adminLogin(email, password);
  
  if (result.success) {
    res.json({ success: true, token: result.token });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
}
}

module.exports = AuthController;