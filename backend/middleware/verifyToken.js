import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.cookies.tokenJWT;
  try {
    if(!token) return res.status(401).json({success: false, message: "Unauthorized or not logged in"});

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if(!decoded) return res.status(401).json({success: false, message: "Unauthorized or invalid token"})

    req.userId = decoded.id;
    next()
  } catch (error) {
    console.log("Error verifying token", error)
    return res.status(500).json({success:false, message:`Internal server error: ${error}`})
  }
}