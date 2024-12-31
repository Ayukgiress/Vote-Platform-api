import jwt from "jsonwebtoken";
import User from "../models/user.js";

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  console.log("Received Token:", token);

  try {
    // Decode the token to verify it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user based on the decoded token
    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Remove password from user object
    const { password, ...restUser } = user.toObject();
    req.user = { ...restUser, id: restUser._id };

    next();
  } catch (err) {
    console.error("Authentication error:", err); 
    return res.status(401).json({ error: "Invalid token", details: err.message });
  }
};

export default auth;
