
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/user.js");
const PasswordReset = require("../models/PasswordReset.js");
const sendEmail = require("../Utils/sendEmail.js");

const generateToken = (userId) => {
  return jwt.sign(
    { id: String(userId) },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  profilePicture: user.profilePicture || "",
});

// Register with email and password
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password required.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedName = String(name).trim();

    if (normalizedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: phone || "",
      password,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Register user error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
};

// Login with email and password
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login user error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

// Login or register with Google
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is missing from server environment.");

      return res.status(500).json({
        success: false,
        message: "Google login is not configured on the server.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from server environment.");

      return res.status(500).json({
        success: false,
        message: "Authentication is not configured on the server.",
      });
    }

    const googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID
    );

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: "Google account email could not be verified.",
      });
    }

    const email = payload.email.toLowerCase().trim();
    const name = String(payload.name || "").trim();
    const profilePicture = String(payload.picture || "");

    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Your Google profile must have a valid name.",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");

      user = await User.create({
        name,
        email,
        phone: "",
        password: randomPassword,
        profilePicture,
      });
    } else if (!user.profilePicture && profilePicture) {
      // Preserve existing pictures; fill only a missing picture.
      user.profilePicture = profilePicture;
      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Google login error:", error);

    if (error.code === 11000 && req.body.credential) {
      try {
        const googleClient = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID
        );

        const ticket = await googleClient.verifyIdToken({
          idToken: req.body.credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload?.email || payload.email_verified !== true) {
          throw new Error("Google email is not verified.");
        }

        const user = await User.findOne({
          email: payload.email.toLowerCase().trim(),
        });

        if (!user) {
          throw new Error("User not found after duplicate-email conflict.");
        }

        if (!user.profilePicture && payload.picture) {
          user.profilePicture = String(payload.picture);
          await user.save();
        }

        return res.status(200).json({
          success: true,
          message: "Google login successful.",
          token: generateToken(user._id),
          user: formatUser(user),
        });
      } catch (retryError) {
        console.error("Google login retry error:", retryError);
      }
    }

    return res.status(401).json({
      success: false,
      message: "Google login failed. Please try again.",
    });
  }
};

// Get logged-in user's profile
const getMyProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    return res.status(200).json({
      success: true,
      user: formatUser(req.user),
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile.",
    });
  }
};

// Update logged-in user's profile
const updateMyProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName || trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must be at least 2 characters.",
        });
      }

      user.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address.",
        });
      }

      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });

        if (existing) {
          return res.status(400).json({
            success: false,
            message: "Email is already in use by another account.",
          });
        }

        user.email = normalizedEmail;
      }
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: formatUser(updatedUser),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use by another account.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update your profile.",
    });
  }
};

// Change logged-in user's password
const changePassword = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change your password.",
    });
  }
};

// Request password-reset OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    await PasswordReset.deleteMany({ email: normalizedEmail });

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordReset.create({
      email: normalizedEmail,
      otpHash,
      expiresAt,
      verified: false,
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "Password Reset OTP — Midhun Frames",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#080808;color:#ffffff">
          <h2 style="color:#c8aa72;">Midhun Frames</h2>
          <p>You requested to reset your account password.</p>
          <p>Your OTP is:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#c8aa72;margin:25px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p style="color:#999999;font-size:13px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent successfully.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send password reset OTP.",
    });
  }
};

// Verify password-reset OTP
const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedOtp = String(otp).trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be a 6-digit number.",
      });
    }

    const passwordReset = await PasswordReset.findOne({
      email: normalizedEmail,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    const otpHash = crypto
      .createHash("sha256")
      .update(normalizedOtp)
      .digest("hex");

    if (otpHash !== passwordReset.otpHash) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    passwordReset.verified = true;
    await passwordReset.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP.",
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || newPassword === undefined) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPassword = String(newPassword).trim();

    if (normalizedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const passwordReset = await PasswordReset.findOne({
      email: normalizedEmail,
      verified: true,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: "Password reset session is invalid or expired.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.password = normalizedPassword;
    await user.save();

    await PasswordReset.deleteMany({ email: normalizedEmail });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getMyProfile,
  updateMyProfile,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};
